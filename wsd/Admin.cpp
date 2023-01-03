/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This file is part of the LibreOffice project.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <config.h>

#include <fontconfig/fontconfig.h>
#include <fontconfig/fcfreetype.h>

#include <cassert>
#include <mutex>
#include <sys/poll.h>
#include <unistd.h>
#include <openssl/ssl.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <openssl/x509.h>

#include <Poco/Net/HTTPCookie.h>
#include <Poco/Net/HTTPRequest.h>
#include <Poco/Net/HTTPResponse.h>
#include <Poco/Util/XMLConfiguration.h>
#include <Poco/TemporaryFile.h>

#include "Admin.hpp"
#include "AdminModel.hpp"
#include "Auth.hpp"
#include <Common.hpp>
#include "FileServer.hpp"
#include <Log.hpp>
#include <Protocol.hpp>
#include "Storage.hpp"
#include "TileCache.hpp"
#include <Unit.hpp>
#include <Util.hpp>
#include <JsonUtil.hpp>

#include <net/Socket.hpp>
#include <net/SslSocket.hpp>
#include <net/WebSocketHandler.hpp>

#include <common/SigUtil.hpp>

#include <OxOOL/Util.h>

using namespace LOOLProtocol;

using Poco::Net::HTTPResponse;
using Poco::Util::Application;
using Poco::Util::XMLConfiguration;
using Poco::Path;
using Poco::File;
using Poco::TemporaryFile;
using Poco::JSON::Object;
using Poco::JSON::Array;
using Poco::Dynamic::Var;

#define pwdSaltLength 128
#define pwdIterations 10000
#define pwdHashLength 128

const std::string fontsDir =
#if ENABLE_DEBUG
    DEBUG_ABSSRCDIR "/fonts";
#else
    "/usr/share/fonts/" PACKAGE_NAME;
#endif

const int Admin::MinStatsIntervalMs = 50;
const int Admin::DefStatsIntervalMs = 1000;
const std::string levelList[] = {"none", "fatal", "critical", "error", "warning", "notice", "information", "debug", "trace"};


class OxoolConfig final: public XMLConfiguration
{
public:
    OxoolConfig()
        {}
};

namespace
{
// 掃描 OxOOL 管理的字型目錄
const std::string scanFontDir()
{
    const std::string format = "{\"%{file|basename}\":{\"index\":%{index}, \"family\":\"%{family}\", \"familylang\":\"%{familylang}\", \"style\":\"%{style}\", \"stylelang\":\"%{stylelang}\", \"weight\":\"%{weight}\", \"slant\":\"%{slant}\", \"color\":\"%{color|downcase}\", \"symbol\":\"%{symbol|downcase}\", \"variable\":\"%{variable|downcase}\", \"lang\":\"%{lang}\"}}";
    FcFontSet *fs = FcFontSetCreate();
    FcStrSet *dirs = FcStrSetCreate();
    FcStrList *strlist = FcStrListCreate(dirs);
    FcChar8 *file = (FcChar8*)fontsDir.c_str();
    do
    {
        FcDirScan(fs, dirs, NULL, NULL, file, FcTrue);
    }
    while ((file = FcStrListNext(strlist)));
    FcStrListDone(strlist);
    FcStrSetDestroy(dirs);

    std::string jsonStr("[");
    for (int i = 0; i < fs->nfont; i++)
    {
        FcPattern *pat = fs->fonts[i];
        FcChar8 *s = FcPatternFormat(pat, (FcChar8 *)format.c_str());

        if (i > 0) jsonStr.append(",");

        jsonStr.append((char *)s);
        FcStrFree(s);
    }
    jsonStr.append("]");
    FcFontSetDestroy(fs);
    FcFini();
    return jsonStr;
}

// 利用 fc-cache 重建 oxool 管理的字型目錄
void makeFontCache()
{
    std::string fontCacheCmd = "fc-cache -f \"" + fontsDir + "\"";
    if (system(fontCacheCmd.c_str()))
    {
        /* do nothing */
    }
}

bool convertToJson(OxoolConfig &config, const std::string &key, Object &json)
{
    bool success = true;
    const size_t bracketPos = key.find("[");
    // 不含 "[" 的 Key
    const std::string nudeKey = (bracketPos == std::string::npos ? key : key.substr(0, bracketPos));
    const std::string typeKey(key + "[@type]"); // type="型態"
    const std::string defaultKey(key + "[@default]"); // default=""

    try
    {
        if (config.has(key))
        {
            std::string pValue = config.getString(key, "");
            // 如果值是空的，而且有預設值的話，讀取預設值
            if (pValue.length() == 0 && config.has(defaultKey))
            {
                pValue = config.getString(defaultKey, "");
            }

            std::string pType = "string"; // 預設的類型
            if (config.has(typeKey))
            {
                // 有指定型態的話，讀取該型態
                pType = config.getString(typeKey, "string");
            }

            Var any(pValue);

            // 依據指定型態轉換
            if (pType == "bool" || pValue == "true" || pValue == "false")
            {
                json.set(key, any.convert<bool>());
            }
            else if (pType == "double")
            {
                json.set(key, any.convert<double>());
            }
            else if (pType == "int" || pType == "int64")
            {
                json.set(key, any.convert<long>());
            }
            else if (pType == "uint" || pType == "uint64")
            {
                json.set(key, any.convert<unsigned long>());
            }
            else
            {
                json.set(key, any);
            }
        }
        else
        {
            success = false;
        }
    }
    catch(const std::exception& e)
    {
        std::cerr << "convertToJson() error : " << key << "(" << e.what() << ")\n";
        success = false;
    }

    return success;
}

/**
 * 依據應用名稱傳揮對應的文件類型名稱
*/
const std::string getDocType(const std::string &appName)
{
    std::string docType;
    if (appName == "writer")
        docType = "text";
    else if (appName == "calc")
        docType = "spreadsheet";
    else if (appName == "impress")
        docType = "presentation";

    return docType;
}

bool havePasswordProtect = false;
std::string defaultPassword;

// 會執行這裡，表示憑證檔案有密碼
int passwordCB(char *buf, int size, int /*rwflag*/, void* /*userdata*/)
{
    havePasswordProtect = true; // 設定 havePasswordProtect 為 true
    strncpy(buf, defaultPassword.c_str(), size);
    buf[size - 1] = '\0';
    return(strlen(buf));
}

#define SSL_FILE_VALID 0    // SSL 檔案有效
#define SSL_FILE_INVALID 1  // 無效的 SSL 檔案
#define SSL_FILE_REQUEST_PASSWORD 2 // SSL 檔案需要密碼

// 檢查 cert 檔案是否有效
int certFileValid(const std::string& certfilePath)
{
    // 測試 cert file
    FILE *fp = fopen(certfilePath.c_str(), "r");
    X509 *cert = PEM_read_X509(fp, NULL, NULL, NULL);
    fclose(fp);

    if (cert != NULL)
    {
        X509_free(cert);
        return SSL_FILE_VALID; // 回覆
    }
    return SSL_FILE_INVALID;
}

// 檢查 private key 是否有效
int privateKeyValid(const std::string& filePath, const std::string& password="")
{
    havePasswordProtect = false;
    defaultPassword = password;

    // 測試 private key
    FILE *fp = fopen(filePath.c_str(), "r");
    RSA *privateRsa = PEM_read_RSAPrivateKey(fp, NULL, passwordCB, NULL);
    fclose(fp);

    // 沒錯
    if (privateRsa != NULL)
    {
        RSA_free(privateRsa);
        return SSL_FILE_VALID; // 回覆
    }

    // 無密碼保護就回覆無效，否則回覆需要密碼
    return (!havePasswordProtect ? SSL_FILE_INVALID : SSL_FILE_REQUEST_PASSWORD);
}
}


ReceiveFile::ReceiveFile()
{
    _name = "";
    _size = 0;
    _working = false;
    _workID = 0;
    _tempPath = Path::forDirectory(Poco::TemporaryFile::tempName());
}

bool ReceiveFile::begin(const std::string& fileName, const size_t fileSize)
{
    if (fileName.empty() || fileSize == 0)
    {
        return false;
    }

    _name = fileName;
    _size = fileSize;
    _workID ++;

    _receivedSize = 0;

    // 暫存目錄不存在
    if (!File(_tempPath).exists())
    {
        // 就建立目錄
        File(_tempPath).createDirectories();
        // Process 結束就刪除整個暫存目錄
        Poco::TemporaryFile::registerForDeletion(_tempPath.toString());
    }

    std::string workPath = getWorkPath();
    File(workPath).createDirectories();
    _receivedFile.open(workPath + "/" + _name, std::ofstream::out|std::ofstream::trunc);

    _working = true;
    return _working;
}

void ReceiveFile::writeData(const std::vector<char> &payload)
{
    _receivedFile.write(payload.data(), payload.size());
    _receivedSize += payload.size();
}

bool ReceiveFile::isComplete()
{
    if (_working && _receivedSize >= _size)
    {
        _receivedFile.close();
        _working = false;
        return true;
    }
    return false;
}

void ReceiveFile::deleteWorkDir()
{
    if (File(getWorkPath()).exists())
    {
        File(getWorkPath()).remove(true);
    }
}

/// Process incoming websocket messages
void AdminSocketHandler::handleMessage(const std::vector<char> &payload)
{
    // FIXME: check fin, code etc.
    const std::string firstLine = getFirstLine(payload.data(), payload.size());

    const std::string uiconfigDir = LOOLWSD::FileServerRoot + "/loleaflet/dist/uiconfig";

    // 處於接收檔案狀態
    if (_receiveFile.isWorking())
    {
        _receiveFile.writeData(payload); // 資料寫入檔案
        // 通知 client 總共收到的 bytes
        sendTextFrame("receivedSize:" + std::to_string(_receiveFile.size()), true);

        if (_receiveFile.isComplete())
        {
            sendTextFrame("uploadFileReciveOK"); // 通知 client，檔案接收完畢
        }
        return;
    }

    StringVector tokens(StringVector::tokenize(firstLine, ' '));
    LOG_TRC("Recv: " << firstLine << " tokens " << tokens.size());

    if (tokens.empty())
    {
        LOG_TRC("too few tokens");
        return;
    }

    AdminModel& model = _admin->getModel();

    if (tokens.equals(0, "auth"))
    {
        if (tokens.size() < 2)
        {
            LOG_DBG("Auth command without any token");
            sendMessage("InvalidAuthToken");
            shutdown();
            ignoreInput();
            return;
        }
        std::string jwtToken;
        LOOLProtocol::getTokenString(tokens[1], "jwt", jwtToken);

        LOG_INF("Verifying JWT token: " << jwtToken);
        JWTAuth authAgent("admin", "admin", "admin");
        if (authAgent.verify(jwtToken))
        {
            LOG_TRC("JWT token is valid");
            _isAuthenticated = true;
            return;
        }
        else
        {
            LOG_DBG("Invalid auth token");
            sendMessage("InvalidAuthToken");
            shutdown();
            ignoreInput();
            return;
        }
    }

    if (!_isAuthenticated)
    {
        LOG_DBG("Not authenticated - message is '" << firstLine << "' " <<
                tokens.size() << " first: '" << tokens[0] << '\'');
        sendMessage("NotAuthenticated");
        shutdown();
        ignoreInput();
        return;
    }
    else if (tokens.equals(0, "documents") ||
             tokens.equals(0, "active_users_count") ||
             tokens.equals(0, "active_docs_count") ||
             tokens.equals(0, "mem_stats") ||
             tokens.equals(0, "cpu_stats") ||
             tokens.equals(0, "sent_activity") ||
             tokens.equals(0, "recv_activity"))
    {
        const std::string result = model.query(tokens[0]);
        if (!result.empty())
            sendTextFrame(tokens[0] + ' ' + result);
    }
    else if (tokens.equals(0, "history"))
    {
        sendTextFrame("{ \"History\": " + model.getAllHistory() + '}');
    }
    else if (tokens.equals(0, "version"))
    {
        // Send LOOL version information
        sendTextFrame("loolserver " + Util::getVersionJSON());
        // Send LOKit version information
        sendTextFrame("lokitversion " + LOOLWSD::LOKitVersion);
    }
    else if (tokens.equals(0, "subscribe") && tokens.size() > 1)
    {
        for (std::size_t i = 0; i < tokens.size() - 1; i++)
        {
            model.subscribe(_sessionId, tokens[i + 1]);
        }
    }
    else if (tokens.equals(0, "unsubscribe") && tokens.size() > 1)
    {
        for (std::size_t i = 0; i < tokens.size() - 1; i++)
        {
            model.unsubscribe(_sessionId, tokens[i + 1]);
        }
    }
    else if (tokens.equals(0, "mem_consumed"))
        sendTextFrame("mem_consumed " + std::to_string(_admin->getTotalMemoryUsage()));

    else if (tokens.equals(0, "total_avail_mem"))
        sendTextFrame("total_avail_mem " + std::to_string(_admin->getTotalAvailableMemory()));

    else if (tokens.equals(0, "sent_bytes"))
        sendTextFrame("sent_bytes " + std::to_string(model.getSentBytesTotal() / 1024));

    else if (tokens.equals(0, "recv_bytes"))
        sendTextFrame("recv_bytes " + std::to_string(model.getRecvBytesTotal() / 1024));

    else if (tokens.equals(0, "uptime"))
        sendTextFrame("uptime " + std::to_string(model.getServerUptimeSecs()));

    else if (tokens.equals(0, "log_lines"))
        sendTextFrame("log_lines " + _admin->getLogLines());

    else if (tokens.equals(0, "kill") && tokens.size() == 2)
    {
        try
        {
            const int pid = std::stoi(tokens[1]);
            LOG_INF("Admin request to kill PID: " << pid);

            std::set<pid_t> pids = model.getDocumentPids();
            if (pids.find(pid) != pids.end())
            {
                SigUtil::killChild(pid);
            }
            else
            {
                LOG_ERR("Invalid PID to kill (not a document pid)");
            }
        }
        catch (std::invalid_argument& exc)
        {
            LOG_ERR("Invalid PID to kill (invalid argument): " << tokens[1]);
        }
        catch (std::out_of_range& exc)
        {
            LOG_ERR("Invalid PID to kill (out of range): " << tokens[1]);
        }
    }
    else if (tokens.equals(0, "settings"))
    {
        // for now, we have only these settings
        std::ostringstream oss;
        oss << "settings "
            << "mem_stats_size=" << model.query("mem_stats_size") << ' '
            << "mem_stats_interval=" << std::to_string(_admin->getMemStatsInterval()) << ' '
            << "cpu_stats_size="  << model.query("cpu_stats_size") << ' '
            << "cpu_stats_interval=" << std::to_string(_admin->getCpuStatsInterval()) << ' '
            << "net_stats_size=" << model.query("net_stats_size") << ' '
            << "net_stats_interval=" << std::to_string(_admin->getNetStatsInterval()) << ' ';

        const DocProcSettings& docProcSettings = _admin->getDefDocProcSettings();
        oss << "limit_virt_mem_mb=" << docProcSettings.getLimitVirtMemMb() << ' '
            << "limit_stack_mem_kb=" << docProcSettings.getLimitStackMemKb() << ' '
            << "limit_file_size_mb=" << docProcSettings.getLimitFileSizeMb() << ' '
            << "limit_num_open_files=" << docProcSettings.getLimitNumberOpenFiles() << ' ';

        sendTextFrame(oss.str());
    }
    else if (tokens.equals(0, "channel_list"))
    {
        sendTextFrame("channel_list " + _admin->getChannelLogLevels());
    }
    else if (tokens.equals(0, "shutdown"))
    {
        LOG_INF("Setting ShutdownRequestFlag: Shutdown requested by admin.");
        SigUtil::requestShutdown();
        return;
    }
    else if (tokens.equals(0, "set") && tokens.size() > 1)
    {
        for (size_t i = 1; i < tokens.size(); i++)
        {
            StringVector setting(StringVector::tokenize(tokens[i], '='));
            int settingVal = 0;
            try
            {
                settingVal = std::stoi(setting[1]);
            }
            catch (const std::exception& exc)
            {
                LOG_ERR("Invalid setting value: " << setting[1] <<
                        " for " << setting[0]);
                return;
            }

            const std::string settingName = setting[0];
            if (settingName == "mem_stats_size")
            {
                if (settingVal != std::stol(model.query(settingName)))
                {
                    model.setMemStatsSize(settingVal);
                }
            }
            else if (settingName == "mem_stats_interval")
            {
                if (settingVal != static_cast<int>(_admin->getMemStatsInterval()))
                {
                    _admin->rescheduleMemTimer(settingVal);
                    model.clearMemStats();
                    model.notify("settings mem_stats_interval=" + std::to_string(_admin->getMemStatsInterval()));
                }
            }
            else if (settingName == "cpu_stats_size")
            {
                if (settingVal != std::stol(model.query(settingName)))
                {
                    model.setCpuStatsSize(settingVal);
                }
            }
            else if (settingName == "cpu_stats_interval")
            {
                if (settingVal != static_cast<int>(_admin->getCpuStatsInterval()))
                {
                    _admin->rescheduleCpuTimer(settingVal);
                    model.clearCpuStats();
                    model.notify("settings cpu_stats_interval=" + std::to_string(_admin->getCpuStatsInterval()));
                }
            }
            else if (LOOLProtocol::matchPrefix("limit_", settingName))
            {
                DocProcSettings docProcSettings = _admin->getDefDocProcSettings();
                if (settingName == "limit_virt_mem_mb")
                    docProcSettings.setLimitVirtMemMb(settingVal);
                else if (settingName == "limit_stack_mem_kb")
                    docProcSettings.setLimitStackMemKb(settingVal);
                else if (settingName == "limit_file_size_mb")
                    docProcSettings.setLimitFileSizeMb(settingVal);
                else if (settingName == "limit_num_open_files")
                    docProcSettings.setLimitNumberOpenFiles(settingVal);
                else
                    LOG_ERR("Unknown limit: " << settingName);

                model.notify("settings " + settingName + '=' + std::to_string(settingVal));
                _admin->setDefDocProcSettings(docProcSettings, true);
            }
        }
    }
    else if (tokens.equals(0, "update-log-levels") && tokens.size() > 1)
    {
        for (size_t i = 1; i < tokens.size(); i++)
        {
            StringVector _channel(StringVector::tokenize(tokens[i], '='));
            if (_channel.size() == 2)
            {
                _admin->setChannelLogLevel((_channel[0] != "?" ? _channel[0]: ""), _channel[1]);
            }
        }
        // Let's send back the current log levels in return. So the user can be sure of the values.
        sendTextFrame("channel_list " + _admin->getChannelLogLevels());
    }
    // Added by Firefly <firefly@ossii.com.tw>
    // 檢查管理帳號密碼是否與 oxoolwsd.xml 中的一致
    // 格式: isConfigAuthOk <帳號> <密碼>
    else if (tokens.equals(0, "isConfigAuthOk") && tokens.size() == 3)
    {
        if (FileServerRequestHandler::isConfigAuthMatch(tokens[1], tokens[2]))
        {
            sendTextFrame("ConfigAuthOk");
        }
        else
        {
            sendTextFrame("ConfigAuthWrong");
        }
    }
    // 變更管理帳號及密碼
    else if (tokens.equals(0, "setAdminPassword") && tokens.size() == 3)
    {
        OxoolConfig config;
        config.load(LOOLWSD::ConfigFile);
        std::string adminUser = tokens[1];
        std::string adminPwd  = tokens[2];
        config.setString("admin_console.username", adminUser); // 帳號用明碼儲存
#if HAVE_PKCS5_PBKDF2_HMAC
        unsigned char pwdhash[pwdHashLength];
        unsigned char salt[pwdSaltLength];
        RAND_bytes(salt, pwdSaltLength);
        // Do the magic !
        PKCS5_PBKDF2_HMAC(adminPwd.c_str(), -1,
                          salt, pwdSaltLength,
                          pwdIterations,
                          EVP_sha512(),
                          pwdHashLength, pwdhash);

        std::stringstream stream;
        // Make salt randomness readable
        for (unsigned j = 0; j < pwdSaltLength; ++j)
            stream << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(salt[j]);
        const std::string saltHash = stream.str();

        // Clear our used hex stream to make space for password hash
        stream.str("");
        stream.clear();
        // Make the hashed password readable
        for (unsigned j = 0; j < pwdHashLength; ++j)
            stream << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(pwdhash[j]);
        const std::string passwordHash = stream.str();

        std::stringstream pwdConfigValue("pbkdf2.sha512.", std::ios_base::in | std::ios_base::out | std::ios_base::ate);
        pwdConfigValue << std::to_string(pwdIterations) << ".";
        pwdConfigValue << saltHash << "." << passwordHash;
        config.remove("admin_console.password");
        config.setString("admin_console.secure_password[@desc]",
                              "Salt and password hash combination generated using PBKDF2 with SHA512 digest.");
        config.setString("admin_console.secure_password", pwdConfigValue.str());
#else
        config.remove("admin_console.secure_password");
        config.setString("admin_console.password[@desc]", "The password is stored in plain code.");
        config.setString("admin_console.password", adminPwd);
#endif
        config.save(LOOLWSD::ConfigFile);
        sendTextFrame("setAdminPasswordOk");
    }
    // 上傳檔案
    // 命令是: uploadFile <檔名> <檔案大小>
    else if (tokens.equals(0, "uploadFile") && tokens.size() == 3)
    {
        std::string fileName;
        Poco::URI::decode(tokens[1], fileName);
        if (_receiveFile.begin(fileName, std::strtol(tokens[2].c_str(), nullptr, 0)))
        {
            sendTextFrame("readyToReceiveFile"); // 告訴 Client 可以開始上傳了
        }
        else
        {
            sendTextFrame("uploadFileInfoError"); // 告訴 Client 檔案資訊有誤
        }
    }
    // 安裝升級檔
    else if (tokens.equals(0, "upgradePackage") && tokens.size() == 1)
    {
        // TODO: 這裡應該要檢測 Linux 主機環境是 rpm base 或 deb base
        std::string packageBase = "rpm"; // FIXME: getPackageBase()

        // 開始安裝套件
        std::string installTestCmd, installCmd;
        if (packageBase == "rpm")
        {
            installTestCmd = "sudo rpm -Uvh --force --test `find -name \"*.rpm\"` 2>&1 ; echo $? > retcode";
            installCmd = "sudo rpm -Uvh --force `find -name \"*.rpm\"` 2>&1 ; echo $? > retcode";
        }
        else if (packageBase == "deb")
        {
            // FIXME! please.
            // installTestCmd = "sudo dpkg -i "
            // installCmd = "sudo dpkg -i ";
        }
        else
        {
            sendTextFrame("upgradeMsg:Unsupported package installation system!");
            sendTextFrame("upgradeFail");
            return;
        }

        // 紀錄目前工作目錄
        std::string currentPath = Path::current();
        // 上傳檔案所在路徑
        Path workPath = _receiveFile.getWorkPath();
        // 進入暫存目錄
        if (chdir(workPath.toString().c_str()) != 0)
        {
            sendTextFrame("upgradeMsg:Unable to enter the temporary directory!");
            sendTextFrame("upgradeFail");
            return;
        }

        // 上傳的檔名
        Path workFile = _receiveFile.getWorkFileName();
        // 取延伸檔名
        std::string extName = workFile.getExtension();
        // 延伸檔名轉小寫
        std::transform(extName.begin(), extName.end(), extName.begin(), ::tolower);

        std::string uncompressCmd;
        // 檔案是否為 .deb/.rpm/.zip/.tgz or tar.gz
        if (extName == "rpm" || extName == "deb")
        {
            // Do nothing.
        }
        // zip 型態要先解壓縮
        else if (extName == "zip")
        {
            uncompressCmd = "unzip \"" + workFile.getFileName() + "\" 2>&1 ; echo $? > retcode";
        }
        // gz / tgz 要先解壓縮
        else if (extName == "gz" || extName == "tgz")
        {
            uncompressCmd = "tar zxvf \"" + workFile.getFileName() + "\" 2>&1 ; echo $? > retcode";
        }
        // 未知的檔案型態
        else
        {
            sendTextFrame("upgradeMsg:Unknown file type!");
            sendTextFrame("upgradeFail");
            return;
        }

        FILE *fp;
        char buffer[128];
        std::ifstream in;
        int retcode; // 指令結束狀態碼

        // 一、是否需要先解壓縮
        if (!uncompressCmd.empty())
        {
            sendTextFrame("upgradeMsg:File uncompressing...", true);
            sendTextFrame("upgradeInfo:Command: " + uncompressCmd + "\n\n", true);
            fp = popen(uncompressCmd.c_str(), "r");
            while (fgets(buffer, sizeof(buffer), fp))
            {
                // 傳回輸出內容
                sendTextFrame("upgradeInfo:" + std::string(buffer), true);
            }
            pclose(fp);
            // 讀取指令結束碼
            in.open("./retcode", std::ifstream::in);
            in.getline(buffer, sizeof(buffer));
            in.close();
            retcode = std::atoi(buffer);
            // 指令執行有錯
            if (retcode != 0)
            {
                _receiveFile.deleteWorkDir(); // 砍掉該檔案整個目錄
                sendTextFrame("uncompressPackageFail");
                return;
            }
        }

        // 二、測試是否能升級
        sendTextFrame("upgradeMsg:Test whether it can be upgraded.", true);
        sendTextFrame("upgradeInfo:Command: " + installTestCmd + "\n\n", true);
        fp = popen(installTestCmd.c_str(), "r");
        while (fgets(buffer, sizeof(buffer), fp))
        {
            // 傳回輸出內容
            sendTextFrame("upgradeInfo:" + std::string(buffer), true);
        }
        pclose(fp);
        // 讀取指令結束碼
        in.open("./retcode", std::ifstream::in);
        in.getline(buffer, sizeof(buffer));
        in.close();
        retcode = std::atoi(buffer);
        // 指令執行有錯
        if (retcode != 0)
        {
            _receiveFile.deleteWorkDir(); // 砍掉該檔案整個目錄
            sendTextFrame("upgradePackageTestFail");
            return;
        }

        // 三、正式升級
        sendTextFrame("upgradeMsg:Start the real upgrade.", true);
        sendTextFrame("upgradeInfo:Command: " + installCmd + "\n\n", true);
        fp = popen(installCmd.c_str(), "r");
        while (fgets(buffer, sizeof(buffer), fp))
        {
            // 傳回輸出內容
            sendTextFrame("upgradeInfo:" + std::string(buffer), true);
        }
        pclose(fp);
        // 讀取指令結束碼
        in.open("./retcode", std::ifstream::in);
        in.getline(buffer, sizeof(buffer));
        in.close();
        retcode = std::atoi(buffer);
        // 指令執行有錯
        if (retcode != 0)
        {
            _receiveFile.deleteWorkDir(); // 砍掉該檔案整個目錄
            sendTextFrame("upgradeFail");
            return;
        }

        // 回到之前的工作目錄
        if (chdir(currentPath.c_str())) {/* do nothing */};
        _receiveFile.deleteWorkDir(); // 砍掉工作暫存目錄
        sendTextFrame("upgradeSuccess");
    }
    // 傳回管理字型檔案列表
    else if (tokens.equals(0, "getFontlist") && tokens.size() == 1)
    {
        sendTextFrame("fontList: " + scanFontDir());
    }
    // 安裝上傳的字型檔案到 oxool 管理的字型目錄及 systemplate/
    // oxool 管理的字型目錄是 /usr/share/fonts/oxool
    // ndcodfweb 管理的字型目錄是 /usr/share/fonts/ndcodfweb
    else if (tokens.equals(0, "installFont") && tokens.size() == 1)
    {
        const std::string sysTemplateFontsDir = LOOLWSD::SysTemplate + "/usr/share/fonts/" PACKAGE_NAME;
        std::string fontFile = _receiveFile.getWorkPath() + "/" + _receiveFile.getWorkFileName();
        File font(fontFile);
        font.copyTo(fontsDir);
        font.copyTo(sysTemplateFontsDir);
        _receiveFile.deleteWorkDir(); // 砍掉工作暫存目錄
        sendTextFrame("installFontSuccess");
    }
    // 刪除字型
    // 語法：deleteFont <檔名>
    // 檔名要用 encodeURI()
    else if (tokens.equals(0, "deleteFont") && tokens.size() == 2)
    {
        const std::string sysTemplateFontsDir = LOOLWSD::SysTemplate + "/usr/share/fonts/" PACKAGE_NAME;
        std::string fileName;
        Poco::URI::decode(tokens[1], fileName);
        File masterFont(fontsDir + "/" + fileName);
        File tempFont(sysTemplateFontsDir + "/" + fileName);

        if (masterFont.exists())
        {
            masterFont.remove();
        }

        if (tempFont.exists())
        {
            tempFont.remove();
        }
        sendTextFrame("deleteFontSuccess");
    }
    // 重建 font cache
    else if (tokens.equals(0, "makeFontCache") && tokens.size() == 1)
    {
        makeFontCache(); // 重建 font cache
    }
    // 從 oxoolwsd.xml 讀取指定的內容
    else if (tokens.equals(0, "getConfig") && tokens.size() > 1)
    {
        OxoolConfig config;
        config.load(LOOLWSD::ConfigFile); // 載入 config 檔案
        Object json;

        // 依序讀取各 key 的設定值
        for (size_t i = 1 ; i < tokens.size() ; i++)
        {
            const std::string key(tokens[i]); // 在 xml 中的 tag
            // 如果結尾是否是 "[]"，表示要讀取的是陣列形式
            const bool isArray = (key.substr(key.length() - 2, 2) == "[]");

            // 一般形式
            if (!isArray)
            {
                // 轉換失敗就給 null
                if (!convertToJson(config, key, json))
                {
                    json.set(key, Var());
                }
            }
            else // 處理陣列形式
            {
                const std::string realKey = key.substr(0, key.length() - 2);
                Array array;

                for (size_t index = 0 ; ; index++)
                {
                    Object property;
                    std::string arrayKey = realKey + "[" + std::to_string(index) + "]";
                    if (convertToJson(config, arrayKey, property))
                    {
                        Object realElement;
                        realElement.set("value", property.get(arrayKey));

                        std::string descKey = arrayKey + "[@desc]";
                        if (convertToJson(config, descKey, property))
                            realElement.set("desc", property.get(descKey));

                        std::string allowKey = arrayKey + "[@allow]";
                        if (convertToJson(config, allowKey, property))
                            realElement.set("allow", property.get(allowKey));

                        array.add(realElement);
                    }
                    else
                    {
                        break;
                    }
                }
                json.set(key, array);
            }
        }

        std::ostringstream oss;
        json.stringify(oss);
        sendTextFrame("settings " + oss.str());
    }
    // 把資料存入 oxoolwsd.xml
    // 指令格式為 setConfig <encodeURI 過的 Json 字串>
    else if (tokens.equals(0, "setConfig") && tokens.size() == 2)
    {
        std::string jsonString;
        Poco::URI::decode(tokens[1], jsonString);

        // 轉成 Json 物件
        Object::Ptr object;
        if (JsonUtil::parseJSON(jsonString, object))
        {
            OxoolConfig config;
            config.load(LOOLWSD::ConfigFile); // 載入 config 檔案

            for (Object::ConstIterator it = object->begin(); it != object->end(); ++it)
            {
                const std::string key(it->first);
                // value 是陣列
                if (it->second.isArray())
                {
                    // 去掉 Key 最後面的 "[]"
                    const std::string realKey = key.substr(0, key.length() - 2);
                    // 先把 XML 中的 realKey 陣列清空
                    const std::string firstItem =realKey + "[0]";
                    while (config.has(firstItem))
                    {
                        config.remove(firstItem);
                    }

                    // 轉成 Array
                    Array::Ptr array = it->second.extract<Array::Ptr>();
                    // 處理陣列
                    for (size_t i = 0; i < array->size() ; i++)
                    {
                        // realKey 加上索引 [0....N]
                        const std::string arrayKey = realKey + "[" + std::to_string(i) + "]";
                        // 取出物件
                        Object::Ptr subObj = array->getObject(i);
                        // 處理物件每組 key: value
                        for (Object::ConstIterator subIt = subObj->begin() ; subIt != subObj->end() ; ++subIt)
                        {
                            std::string fullKey = arrayKey;
                            if (subIt->first != "value")
                            {
                                fullKey += "[@" + subIt->first + "]";
                            }
                            // 變更 fullKey 的值
                            config.setString(fullKey, Poco::XML::fromXMLString(subIt->second.toString()));
                        }
                    }
                }
                // 直接填入字串
                else
                {
                    config.setString(key, Poco::XML::fromXMLString(it->second.toString()));
                }
            }
            config.save(LOOLWSD::ConfigFile); // 存回檔案
            sendTextFrame("setConfigOk");
        }
        else
        {
            sendTextFrame("setConfigNothing");
        }
    }
    // 讀取選單 menubar.json 檔或 perm.json
    else if ((tokens.equals(0, "getMenu") || tokens.equals(0, "getMenuPerm"))
              && tokens.size() == 2)
    {
        std::string docType = getDocType(tokens[1]);
        std::string filename;
        // 決定讀取哪個檔案
        if (tokens.equals(0, "getMenu"))
            filename = "menubar.json";
        else
            filename = "perm.json";

        if (!docType.empty())
        {
            std::stringstream jsonStr;
            std::string menuPath(uiconfigDir + "/" + docType + "/" + filename);
            std::ifstream jsonFile(menuPath);
            if (jsonFile.is_open())
            {
                jsonStr << jsonFile.rdbuf();
                jsonFile.close();
            }
            else
            {
                jsonStr << "{}";
            }
            sendTextFrame(tokens[0] + " " + tokens[1] + " " + jsonStr.str());
        }
        else
        {
            sendTextFrame(tokens[0] + "Error '" +  tokens[1] + "' is invalid.");
        }
    }
    // 更新 menubar 權限檔案 perm.json
    // 指令: updateMenuPerm xxxx <uri encoded json string>
    else if (tokens.equals(0, "updateMenuPerm") && tokens.size() == 3)
    {
        std::string docType = getDocType(tokens[1]);
        if (!docType.empty())
        {
            std::string jsonString;
            Poco::URI::decode(tokens[2], jsonString);
            std::ofstream permFile(uiconfigDir + "/" + docType + "/perm.json");
            if (permFile.is_open())
            {
                permFile << jsonString;
                permFile.close();
                sendTextFrame(tokens[0] + "OK " +  tokens[1]);
            }
            else
            {
                sendTextFrame(tokens[0] + "Error '" +  tokens[1] + "' perm.json.");
            }
        }
        else
        {
            sendTextFrame(tokens[0] + "Error '" +  tokens[1] + "' is invalid.");
        }
    }
    // 更新 SSL 相關檔案
    else if (tokens.equals(0, "checkSSLFile") && tokens.size() == 2)
    {
        int checkType = SSL_FILE_VALID;

        // 上傳檔案的完整路徑及檔名
        std::string uploadFile(_receiveFile.getWorkPath() + "/" + _receiveFile.getWorkFileName());

        std::string targetFile;
        if (tokens.equals(1, "cert"))
        {
            targetFile = LOOLWSD::getPathFromConfig("ssl.cert_file_path");
            checkType = certFileValid(uploadFile);
        }
        else if (tokens.equals(1, "key")) // 私鑰
        {
            targetFile = LOOLWSD::getPathFromConfig("ssl.key_file_path");
            // 測試私鑰是否有效
            checkType = privateKeyValid(uploadFile);
        }
        else if (tokens.equals(1, "ca"))
        {
            targetFile = LOOLWSD::getPathFromConfig("ssl.ca_file_path");
            checkType = certFileValid(uploadFile);
        }

        // 依據狀態回報
        switch (checkType)
        {
            case SSL_FILE_VALID: // SSL 檔案有效
                {
                    // 移動上傳檔案，加上 ".new" 的副檔名
                    File sslFile(uploadFile);
                    sslFile.moveTo(targetFile + ".new");
                    sendTextFrame("checkSSLFileValid"); // 通知有效
                    // 如果是私鑰，另外通知不需密碼
                    if (tokens.equals(1, "key"))
                    {
                        sendTextFrame("checkSSLFileNoPassword");
                    }
                }
                break;
            case SSL_FILE_INVALID: // SSL 檔案無效
                sendTextFrame("checkSSLFileInvalid");
                break;
            case SSL_FILE_REQUEST_PASSWORD: // SSL 檔案需要密碼
                {
                    File sslFile(uploadFile);
                    sslFile.moveTo(targetFile + ".password");
                    sendTextFrame("checkSSLFileRequestPassword");
                }
                break;
            default:
                sendTextFrame("checkSSLFileUnknownError"); // 未知錯誤
                break;
        }
        _receiveFile.deleteWorkDir(); // 砍掉工作暫存目錄
    }
    // 強制移除殘留的 SSL 檔案
    else if (tokens.equals(0, "removeResidualSSLFiles") && tokens.size() == 1)
    {
        File certFile_New(LOOLWSD::getPathFromConfig("ssl.cert_file_path") + ".new");
        if (certFile_New.exists())
            certFile_New.remove();

        File keyFile_New(LOOLWSD::getPathFromConfig("ssl.key_file_path") + ".new");
        if (keyFile_New.exists())
            keyFile_New.remove();

        File keyFile_Password(LOOLWSD::getPathFromConfig("ssl.key_file_path") + ".password");
        if (keyFile_Password.exists())
            keyFile_Password.remove();

        File caFile_New(LOOLWSD::getPathFromConfig("ssl.ca_file_path") + ".new");
        if (caFile_New.exists())
            caFile_New.remove();
    }
    // 確認私鑰密碼
    // 指令: ensureSSLPasswordConfirm <uri encoded password sring>
    else if (tokens.equals(0, "ensureSSLPasswordConfirm") && tokens.size() == 2)
    {
        std::string password;
        Poco::URI::decode(tokens[1], password);

        std::string keyFile_Password(LOOLWSD::getPathFromConfig("ssl.key_file_path") + ".password");
        if (Poco::File(keyFile_Password).exists())
        {
            // 認證密碼是否正確
            int checkType = privateKeyValid(keyFile_Password, password);
            // 不正確的話就再次要求 client 密碼
            if (checkType != SSL_FILE_VALID)
            {
                // 通知密碼不正確
                sendTextFrame("checkSSLFilePasswordIncorrect");
            }
            else
            {
                // 1. 把 .password 改名為 .new
                std::string newName(LOOLWSD::getPathFromConfig("ssl.key_file_path") + ".new");
                Poco::File(keyFile_Password).renameTo(newName);
                // 2. 通知 client 端，私鑰有效
                sendTextFrame("checkSSLFileValid");
                // 3. 通知 client 加密過的私鑰密碼
                sendTextFrame("PrivateKeyPassword:" + OxOOL::Util::encryptAES256(password));
            }
        }
    }
    // 取消確認私鑰密碼
    else if (tokens.equals(0, "cancelSSLPasswordConfirm") && tokens.size() == 1)
    {
        // 移除原先暫存的私鑰檔案
        File keyFile_Password(LOOLWSD::getPathFromConfig("ssl.key_file_path") + ".password");
        if (keyFile_Password.exists())
            keyFile_Password.remove();

    }
    // 設定 SSL 密碼
    else if (tokens.equals(0, "setSSLSecurePassword") && tokens.size() == 2)
    {
        OxoolConfig config;
        config.load(LOOLWSD::ConfigFile);

        config.remove("ssl.password");
        config.setString("ssl.secure_password", tokens[1]);
        config.save(LOOLWSD::ConfigFile); // 存回檔案
    }
    // 替換新的 SSL 檔案
    else if (tokens.equals(0, "replaceNewSSLFiles") && tokens.size() == 1)
    {
        std::string certFile(LOOLWSD::getPathFromConfig("ssl.cert_file_path"));
        // 有新的數位憑證檔
        if (Poco::File(certFile + ".new").exists())
        {
            Poco::File(certFile).moveTo(certFile + ".bak"); // 原檔改為副檔名 .bak
            Poco::File(certFile + ".new").moveTo(certFile); // 新檔改為原檔名
        }

        std::string keyFile(LOOLWSD::getPathFromConfig("ssl.key_file_path"));
        // 有新的私鑰
        if (Poco::File(keyFile + ".new").exists())
        {
            Poco::File(keyFile).moveTo(keyFile + ".bak"); // 原檔改為副檔名 .bak
            Poco::File(keyFile + ".new").moveTo(keyFile); // 新檔改為原檔名
        }

        std::string caFile(LOOLWSD::getPathFromConfig("ssl.ca_file_path"));
        // 有新的 CA 憑證
        if (Poco::File(caFile + ".new").exists())
        {
            Poco::File(caFile).moveTo(caFile + ".bak"); // 原檔改為副檔名 .bak
            Poco::File(caFile + ".new").moveTo(caFile); // 新檔改為原檔名
        }
    }
    else
    {
        std::cerr << "未知指令:\"" << firstLine << "\"\n";
    }
}

AdminSocketHandler::AdminSocketHandler(Admin* adminManager,
                                       const std::weak_ptr<StreamSocket>& socket,
                                       const Poco::Net::HTTPRequest& request)
    : WebSocketHandler(socket.lock(), request)
    , _admin(adminManager)
    , _isAuthenticated(false)
{
    // Different session id pool for admin sessions (?)
    _sessionId = Util::decodeId(LOOLWSD::GetConnectionId());
}

AdminSocketHandler::AdminSocketHandler(Admin* adminManager)
    : WebSocketHandler(/* isClient = */ true, /* isMasking = */ true),
      _admin(adminManager),
      _isAuthenticated(true)
{
    _sessionId = Util::decodeId(LOOLWSD::GetConnectionId());
}

void AdminSocketHandler::sendTextFrame(const std::string& message, bool flush)
{
    if (!Util::isFuzzing())
    {
        UnitWSD::get().onAdminQueryMessage(message);
    }

    if (_isAuthenticated)
    {
        LOG_TRC("send admin text frame '" << message << '\'');
        sendMessage(message.c_str(), message.size(), WSOpCode::Text, flush);
    }
    else
        LOG_TRC("Skip sending message to non-authenticated client: '" << message << '\'');
}

void AdminSocketHandler::subscribeAsync(const std::shared_ptr<AdminSocketHandler>& handler)
{
    Admin &admin = Admin::instance();

    admin.addCallback([handler]
        {
            Admin &adminIn = Admin::instance();
            adminIn.getModel().subscribe(handler->_sessionId, handler);
        });
}

bool AdminSocketHandler::handleInitialRequest(
    const std::weak_ptr<StreamSocket> &socketWeak,
    const Poco::Net::HTTPRequest& request)
{
    if (!LOOLWSD::AdminEnabled)
    {
        LOG_ERR("Request for disabled admin console");
        return false;
    }

    std::shared_ptr<StreamSocket> socket = socketWeak.lock();
    if (!socket)
    {
        LOG_ERR("Invalid socket while reading initial request.");
        return false;
    }

    const std::string& requestURI = request.getURI();
    StringVector pathTokens(StringVector::tokenize(requestURI, '/'));

    if (request.has("Upgrade") && Util::iequal(request["Upgrade"], "websocket"))
    {
        Admin &admin = Admin::instance();
        auto handler = std::make_shared<AdminSocketHandler>(&admin, socketWeak, request);
        socket->setHandler(handler);

        AdminSocketHandler::subscribeAsync(handler);

        return true;
    }

    HTTPResponse response;
    response.setStatusAndReason(HTTPResponse::HTTP_BAD_REQUEST);
    response.setContentLength(0);
    LOG_INF("Admin::handleInitialRequest bad request");
    socket->send(response);

    return false;
}

/// An admin command processor.
Admin::Admin() :
    SocketPoll("admin"),
    _forKitPid(-1),
    _lastTotalMemory(0),
    _lastJiffies(0),
    _lastSentCount(0),
    _lastRecvCount(0),
    _cpuStatsTaskIntervalMs(DefStatsIntervalMs),
    _memStatsTaskIntervalMs(DefStatsIntervalMs * 2),
    _netStatsTaskIntervalMs(DefStatsIntervalMs * 2),
    _cleanupIntervalMs(DefStatsIntervalMs * 10)
{
    LOG_INF("Admin ctor.");

    _totalSysMemKb = Util::getTotalSystemMemoryKb();
    LOG_TRC("Total system memory:  " << _totalSysMemKb << " KB.");

    const auto memLimit = LOOLWSD::getConfigValue<double>("memproportion", 0.0);
    _totalAvailMemKb = _totalSysMemKb;
    if (memLimit != 0.0)
        _totalAvailMemKb = _totalSysMemKb * memLimit / 100.;

    LOG_TRC("Total available memory: " << _totalAvailMemKb << " KB (memproportion: " << memLimit << "%).");

    const size_t totalMem = getTotalMemoryUsage();
    LOG_TRC("Total memory used: " << totalMem << " KB.");
    _model.addMemStats(totalMem);
}

Admin::~Admin()
{
    LOG_INF("~Admin dtor.");
}

void Admin::pollingThread()
{
    _model.setThreadOwner(std::this_thread::get_id());

    std::chrono::steady_clock::time_point lastCPU = std::chrono::steady_clock::now();
    std::chrono::steady_clock::time_point lastMem = lastCPU;
    std::chrono::steady_clock::time_point lastNet = lastCPU;
    std::chrono::steady_clock::time_point lastCleanup = lastCPU;

    while (!isStop() && !SigUtil::getTerminationFlag() && !SigUtil::getShutdownRequestFlag())
    {
        const std::chrono::steady_clock::time_point now = std::chrono::steady_clock::now();

        int cpuWait = _cpuStatsTaskIntervalMs -
            std::chrono::duration_cast<std::chrono::milliseconds>(now - lastCPU).count();
        if (cpuWait <= MinStatsIntervalMs / 2) // Close enough
        {
            const size_t currentJiffies = getTotalCpuUsage();
            const size_t cpuPercent = 100 * 1000 * currentJiffies / (sysconf (_SC_CLK_TCK) * _cpuStatsTaskIntervalMs);
            _model.addCpuStats(cpuPercent);

            cpuWait += _cpuStatsTaskIntervalMs;
            lastCPU = now;
        }

        int memWait = _memStatsTaskIntervalMs -
            std::chrono::duration_cast<std::chrono::milliseconds>(now - lastMem).count();
        if (memWait <= MinStatsIntervalMs / 2) // Close enough
        {
            _model.UpdateMemoryDirty();

            const size_t totalMem = getTotalMemoryUsage();
            _model.addMemStats(totalMem);

            if (totalMem != _lastTotalMemory)
            {
                // If our total memory consumption is above limit, cleanup
                triggerMemoryCleanup(totalMem);

                _lastTotalMemory = totalMem;
            }

            notifyDocsMemDirtyChanged();

            memWait += _memStatsTaskIntervalMs;
            lastMem = now;
        }

        int netWait = _netStatsTaskIntervalMs -
            std::chrono::duration_cast<std::chrono::milliseconds>(now - lastNet).count();
        if (netWait <= MinStatsIntervalMs / 2) // Close enough
        {
            const uint64_t sentCount = _model.getSentBytesTotal();
            const uint64_t recvCount = _model.getRecvBytesTotal();

            _model.addSentStats(sentCount - _lastSentCount);
            _model.addRecvStats(recvCount - _lastRecvCount);

            if (_lastRecvCount != recvCount || _lastSentCount != sentCount)
            {
                LOG_TRC("Total Data sent: " << sentCount << ", recv: " << recvCount);
                _lastRecvCount = recvCount;
                _lastSentCount = sentCount;
            }

            netWait += _netStatsTaskIntervalMs;
            lastNet = now;
        }

        int cleanupWait = _cleanupIntervalMs;
        if (_defDocProcSettings.getCleanupSettings().getEnable())
        {
            cleanupWait
                -= std::chrono::duration_cast<std::chrono::milliseconds>(now - lastCleanup).count();
            if (cleanupWait <= MinStatsIntervalMs / 2) // Close enough
            {
                cleanupResourceConsumingDocs();
                if (_defDocProcSettings.getCleanupSettings().getLostKitGracePeriod())
                    cleanupLostKits();

                cleanupWait += _cleanupIntervalMs;
                lastCleanup = now;
            }
        }

        // (re)-connect (with sync. DNS - urk) to one monitor at a time
        if (_pendingConnects.size())
        {
            MonitorConnectRecord rec = _pendingConnects[0];
            if (rec.getWhen() < now)
            {
                _pendingConnects.erase(_pendingConnects.begin());
                connectToMonitorSync(rec.getUri());
            }
        }

        // Handle websockets & other work.
        const auto timeout = std::chrono::milliseconds(capAndRoundInterval(
            std::min(std::min(std::min(cpuWait, memWait), netWait), cleanupWait)));
        LOG_TRC("Admin poll for " << timeout);
        poll(timeout); // continue with ms for admin, settings etc.
    }
}

void Admin::modificationAlert(const std::string& dockey, pid_t pid, bool value){
    addCallback([=] { _model.modificationAlert(dockey, pid, value); });
}

void Admin::addDoc(const std::string& docKey, pid_t pid, const std::string& filename,
                   const std::string& sessionId, const std::string& userName, const std::string& userId,
                   const int smapsFD, const std::string& wopiHost)
{
    addCallback([=] { _model.addDocument(docKey, pid, filename, sessionId, userName, userId, smapsFD, wopiHost); });
}

void Admin::rmDoc(const std::string& docKey, const std::string& sessionId)
{
    addCallback([=] { _model.removeDocument(docKey, sessionId); });
}

void Admin::rmDoc(const std::string& docKey)
{
    LOG_INF("Removing complete doc [" << docKey << "] from Admin.");
    addCallback([=]{ _model.removeDocument(docKey); });
}

void Admin::rescheduleMemTimer(unsigned interval)
{
    _memStatsTaskIntervalMs = capAndRoundInterval(interval);
    LOG_INF("Memory stats interval changed - New interval: " << _memStatsTaskIntervalMs);
    _netStatsTaskIntervalMs = capAndRoundInterval(interval); // Until we support modifying this.
    LOG_INF("Network stats interval changed - New interval: " << _netStatsTaskIntervalMs);
    wakeup();
}

void Admin::rescheduleCpuTimer(unsigned interval)
{
    _cpuStatsTaskIntervalMs = capAndRoundInterval(interval);
    LOG_INF("CPU stats interval changed - New interval: " << _cpuStatsTaskIntervalMs);
    wakeup();
}

size_t Admin::getTotalMemoryUsage()
{
    // To simplify and clarify this; since load, link and pre-init all
    // inside the forkit - we should account all of our fixed cost of
    // memory to the forkit; and then count only dirty pages in the clients
    // since we know that they share everything else with the forkit.
    const size_t forkitRssKb = Util::getMemoryUsageRSS(_forKitPid);
    const size_t wsdPssKb = Util::getMemoryUsagePSS(getpid());
    const size_t kitsDirtyKb = _model.getKitsMemoryUsage();
    const size_t totalMem = wsdPssKb + forkitRssKb + kitsDirtyKb;

    return totalMem;
}

size_t Admin::getTotalCpuUsage()
{
    const size_t forkitJ = Util::getCpuUsage(_forKitPid);
    const size_t wsdJ = Util::getCpuUsage(getpid());
    const size_t kitsJ = _model.getKitsJiffies();

    if (_lastJiffies == 0)
    {
        _lastJiffies = forkitJ + wsdJ;
        return 0;
    }

    const size_t totalJ = ((forkitJ + wsdJ) - _lastJiffies) + kitsJ;
    _lastJiffies = forkitJ + wsdJ;

    return totalJ;
}

unsigned Admin::getMemStatsInterval()
{
    assertCorrectThread();
    return _memStatsTaskIntervalMs;
}

unsigned Admin::getCpuStatsInterval()
{
    assertCorrectThread();
    return _cpuStatsTaskIntervalMs;
}

unsigned Admin::getNetStatsInterval()
{
    assertCorrectThread();
    return _netStatsTaskIntervalMs;
}

std::string Admin::getChannelLogLevels()
{
    unsigned int wsdLogLevel = Log::logger().get("wsd").getLevel();
    std::string result = "wsd=" + levelList[wsdLogLevel];

    result += " kit=" + (_forkitLogLevel.empty() != true ? _forkitLogLevel: levelList[wsdLogLevel]);

    return result;
}

void Admin::setChannelLogLevel(const std::string& channelName, std::string level)
{
    assertCorrectThread();

    // Get the list of channels..
    std::vector<std::string> nameList;
    Log::logger().names(nameList);

    if (std::find(std::begin(levelList), std::end(levelList), level) == std::end(levelList))
        level = "debug";

    if (channelName == "wsd")
        Log::logger().get("wsd").setLevel(level);
    else if (channelName == "kit")
    {
        LOOLWSD::setLogLevelsOfKits(level); // For current kits.
        LOOLWSD::sendMessageToForKit("setloglevel " + level); // For forkit and future kits.
        _forkitLogLevel = level; // We will remember this setting rather than asking forkit its loglevel.
    }
}

std::string Admin::getLogLines()
{
    assertCorrectThread();

    try {
        int lineCount = 500;
        std::string fName = LOOLWSD::getPathFromConfig("logging.file.property[0]");
        std::ifstream infile(fName);

        std::string line;
        std::deque<std::string> lines;

        while (std::getline(infile, line))
        {
            std::istringstream iss(line);
            lines.push_back(line);
            if (lines.size() > (size_t)lineCount)
            {
                lines.pop_front();
            }
        }

        infile.close();

        if (lines.size() < (size_t)lineCount)
        {
            lineCount = (int)lines.size();
        }

        line = ""; // Use the same variable to include result.
        // Newest will be on top.
        for (int i = lineCount - 1; i >= 0; i--)
        {
            line += "\n" + lines[i];
        }

        return line;
    }
    catch (const std::exception& e) {
        return "Could not read the log file.";
    }
}

AdminModel& Admin::getModel()
{
    return _model;
}

void Admin::updateLastActivityTime(const std::string& docKey)
{
    addCallback([=]{ _model.updateLastActivityTime(docKey); });
}


void Admin::addBytes(const std::string& docKey, uint64_t sent, uint64_t recv)
{
    addCallback([=] { _model.addBytes(docKey, sent, recv); });
}

void Admin::setViewLoadDuration(const std::string& docKey, const std::string& sessionId, std::chrono::milliseconds viewLoadDuration)
{
    addCallback([=]{ _model.setViewLoadDuration(docKey, sessionId, viewLoadDuration); });
}

void Admin::setDocWopiDownloadDuration(const std::string& docKey, std::chrono::milliseconds wopiDownloadDuration)
{
    addCallback([=]{ _model.setDocWopiDownloadDuration(docKey, wopiDownloadDuration); });
}

void Admin::setDocWopiUploadDuration(const std::string& docKey, const std::chrono::milliseconds uploadDuration)
{
    addCallback([=]{ _model.setDocWopiUploadDuration(docKey, uploadDuration); });
}

void Admin::addSegFaultCount(unsigned segFaultCount)
{
    addCallback([=]{ _model.addSegFaultCount(segFaultCount); });
}

void Admin::addLostKitsTerminated(unsigned lostKitsTerminated)
{
    addCallback([=]{ _model.addLostKitsTerminated(lostKitsTerminated); });
}

void Admin::notifyForkit()
{
    std::ostringstream oss;
    oss << "setconfig limit_virt_mem_mb " << _defDocProcSettings.getLimitVirtMemMb() << '\n'
        << "setconfig limit_stack_mem_kb " << _defDocProcSettings.getLimitStackMemKb() << '\n'
        << "setconfig limit_file_size_mb " << _defDocProcSettings.getLimitFileSizeMb() << '\n'
        << "setconfig limit_num_open_files " << _defDocProcSettings.getLimitNumberOpenFiles() << '\n';

    LOOLWSD::sendMessageToForKit(oss.str());
}

void Admin::triggerMemoryCleanup(const size_t totalMem)
{
    // Trigger mem cleanup when we are consuming too much memory (as configured by sysadmin)
    static const double memLimit = LOOLWSD::getConfigValue<double>("memproportion", 0.0);
    if (memLimit == 0.0 || _totalSysMemKb == 0)
    {
        LOG_TRC("Total memory consumed: " << totalMem <<
                " KB. Not configured to do memory cleanup. Skipping memory cleanup.");
        return;
    }

    LOG_TRC("Total memory consumed: " << totalMem << " KB. Configured LOOL memory proportion: " <<
            memLimit << "% (" << static_cast<size_t>(_totalSysMemKb * memLimit / 100.) << " KB).");

    const double memToFreePercentage = (totalMem / static_cast<double>(_totalSysMemKb)) - memLimit / 100.;
    int memToFreeKb = static_cast<int>(memToFreePercentage > 0.0 ? memToFreePercentage * _totalSysMemKb : 0);
    // Don't kill documents to save a KB or two.
    if (memToFreeKb > 1024)
    {
        // prepare document list sorted by most idle times
        const std::vector<DocBasicInfo> docList = _model.getDocumentsSortedByIdle();

        LOG_TRC("OOM: Memory to free: " << memToFreePercentage << "% (" <<
                memToFreeKb << " KB) from " << docList.size() << " docs.");

        for (const auto& doc : docList)
        {
            LOG_TRC("OOM Document: DocKey: [" << doc.getDocKey() << "], Idletime: [" << doc.getIdleTime() << "]," <<
                    " Saved: [" << doc.getSaved() << "], Mem: [" << doc.getMem() << "].");
            if (doc.getSaved())
            {
                // Kill the saved documents first.
                LOG_DBG("OOM: Killing saved document with DocKey [" << doc.getDocKey() << "] with " << doc.getMem() << " KB.");
                LOOLWSD::closeDocument(doc.getDocKey(), "oom");
                memToFreeKb -= doc.getMem();
                if (memToFreeKb <= 1024)
                    break;
            }
            else
            {
                // Save unsaved documents.
                LOG_TRC("Saving document: DocKey [" << doc.getDocKey() << "].");
                LOOLWSD::autoSave(doc.getDocKey());
            }
        }
    }
}

void Admin::notifyDocsMemDirtyChanged()
{
    _model.notifyDocsMemDirtyChanged();
}

void Admin::cleanupResourceConsumingDocs()
{
    _model.cleanupResourceConsumingDocs();
}

void Admin::cleanupLostKits()
{
    static std::map<pid_t, std::time_t> mapKitsLost;
    std::set<pid_t> internalKitPids;
    std::vector<int> kitPids;
    int pid;
    unsigned lostKitsTerminated = 0;
    size_t gracePeriod = _defDocProcSettings.getCleanupSettings().getLostKitGracePeriod();

    internalKitPids = LOOLWSD::getKitPids();
    AdminModel::getKitPidsFromSystem(&kitPids);

    for (auto itProc = kitPids.begin(); itProc != kitPids.end(); itProc ++)
    {
        pid = *itProc;
        if (internalKitPids.find(pid) == internalKitPids.end())
        {
            // Check if this is our kit process (forked from our ForKit process)
            if (Util::getStatFromPid(pid, 3) == (size_t)_forKitPid)
                mapKitsLost.insert(std::pair<pid_t, std::time_t>(pid, std::time(nullptr)));
        }
        else
            mapKitsLost.erase(pid);
    }

    for (auto itLost = mapKitsLost.begin(); itLost != mapKitsLost.end();)
    {
        if (std::time(nullptr) - itLost->second > (time_t)gracePeriod)
        {
            pid = itLost->first;
            if (::kill(pid, 0) == 0)
            {
                if (::kill(pid, SIGKILL) == -1)
                    LOG_ERR("Detected lost kit [" << pid << "]. Failed to send SIGKILL.");
                else
                {
                    lostKitsTerminated ++;
                    LOG_ERR("Detected lost kit [" << pid << "]. Sent SIGKILL for termination.");
                }
            }

            itLost = mapKitsLost.erase(itLost);
        }
        else
            itLost ++;
    }

    if (lostKitsTerminated)
        Admin::instance().addLostKitsTerminated(lostKitsTerminated);
}

void Admin::dumpState(std::ostream& os)
{
    // FIXME: be more helpful ...
    SocketPoll::dumpState(os);
}

class MonitorSocketHandler : public AdminSocketHandler
{
    bool _connecting;
    std::string _uri;
public:

    MonitorSocketHandler(Admin *admin, const std::string &uri) :
        AdminSocketHandler(admin),
        _connecting(true),
        _uri(uri)
    {
    }
    int getPollEvents(std::chrono::steady_clock::time_point now,
                      int64_t &timeoutMaxMicroS) override
    {
        if (_connecting)
        {
            LOG_TRC("Waiting for outbound connection to complete");
            return POLLOUT;
        }
        else
            return AdminSocketHandler::getPollEvents(now, timeoutMaxMicroS);
    }

    void performWrites(std::size_t capacity) override
    {
        LOG_TRC("Outbound monitor - connected");
        _connecting = false;
        return AdminSocketHandler::performWrites(capacity);
    }

    void onDisconnect() override
    {
        LOG_ERR("Monitor " << _uri << " dis-connected, re-trying in 20 seconds");
        Admin::instance().scheduleMonitorConnect(_uri, std::chrono::steady_clock::now() + std::chrono::seconds(20));
    }
};

void Admin::connectToMonitorSync(const std::string &uri)
{
    LOG_TRC("Add monitor " << uri);
    auto handler = std::make_shared<MonitorSocketHandler>(this, uri);
    insertNewWebSocketSync(Poco::URI(uri), handler);
    AdminSocketHandler::subscribeAsync(handler);
}

void Admin::scheduleMonitorConnect(const std::string &uri, std::chrono::steady_clock::time_point when)
{
    assertCorrectThread();

    MonitorConnectRecord todo;
    todo.setWhen(when);
    todo.setUri(uri);
    _pendingConnects.push_back(todo);
}

void Admin::getMetrics(std::ostringstream &metrics)
{
    size_t memAvail =  getTotalAvailableMemory();
    size_t memUsed = getTotalMemoryUsage();

    metrics << "global_host_system_memory_bytes " << _totalSysMemKb * 1024 << std::endl;
    metrics << "global_memory_available_bytes " << memAvail * 1024 << std::endl;
    metrics << "global_memory_used_bytes " << memUsed * 1024 << std::endl;
    metrics << "global_memory_free_bytes " << (memAvail - memUsed) * 1024 << std::endl;
    metrics << std::endl;

    _model.getMetrics(metrics);
}

void Admin::sendMetrics(const std::shared_ptr<StreamSocket>& socket, const std::shared_ptr<Poco::Net::HTTPResponse>& response)
{
    std::ostringstream oss;
    response->write(oss);
    getMetrics(oss);
    socket->send(oss.str());
    socket->shutdown();
}

void Admin::start()
{
    bool haveMonitors = false;
    const auto& config = Application::instance().config();

    for (size_t i = 0; ; ++i)
    {
        const std::string path = "monitors.monitor[" + std::to_string(i) + ']';
        const std::string uri = config.getString(path, "");
        if (!config.has(path))
            break;
        if (!uri.empty())
        {
            Poco::URI monitor(uri);
            if (monitor.getScheme() == "wss" || monitor.getScheme() == "ws")
            {
                addCallback([=] { scheduleMonitorConnect(uri, std::chrono::steady_clock::now()); });
                haveMonitors = true;
            }
            else
                LOG_ERR("Unhandled monitor URI: '" << uri << "' should be \"wss://foo:1234/baa\"");
        }
    }

    if (!haveMonitors)
        LOG_TRC("No monitors configured.");

    startThread();
}

void Admin::stop()
{
    joinThread();
}

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
