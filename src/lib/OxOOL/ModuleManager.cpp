/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <map>
#include <chrono>
#include <memory>
#include <mutex>
#include <thread>

#include <OxOOL/OxOOL.h>
#include <OxOOL/ModuleManager.h>
#include <OxOOL/ConvertBroker.h>
#include <OxOOL/XMLConfig.h>
#include <OxOOL/HttpHelper.h>

#include <Poco/Version.h>
#include <Poco/File.h>
#include <Poco/Path.h>
#include <Poco/Exception.h>
#include <Poco/SharedLibrary.h>
#include <Poco/SortedDirectoryIterator.h>
#include <Poco/JSON/Object.h>
#include <Poco/Net/HTTPRequest.h>
#include <Poco/Net/HTTPResponse.h>

#include <common/Protocol.hpp>
#include <common/StringVector.hpp>
#include <common/SigUtil.hpp>
#include <common/Log.hpp>
#include <net/Socket.hpp>
#include <net/WebSocketHandler.hpp>
#include <wsd/Auth.hpp>

/// @brief 模組 Library 管理
class ModuleLibrary
{
public:
    ModuleLibrary() : mpClass(nullptr)
    {
    }

    ~ModuleLibrary()
    {
        // 先讓模組物件解構
        mpClass = nullptr;
        // 再卸載 Library，否則會 crash
        if (mLibrary.isLoaded())
            mLibrary.unload();
        }

    /// @brief 載入 Library
    /// @param path Library 絕對路徑
    /// @return
    bool load(const std::string& path)
    {
        try
        {
            mLibrary.load(path);
            if (mLibrary.hasSymbol(OXOOL_MODULE_ENTRY_SYMBOL))
            {
                auto moduleEntry = reinterpret_cast<OxOOLModuleEntry>(mLibrary.getSymbol(OXOOL_MODULE_ENTRY_SYMBOL));
                mpClass = moduleEntry(); // 取得模組
                LOG_DBG("Successfully loaded '" << path << "'.");
                return true;
            }
            else // 不是 OxOOL 模組物件就卸載
            {
                LOG_DBG("'" << path << "' is not a valid OxOOL module.");
                mLibrary.unload();
            }
        }
        // 已經載入過了
        catch(const Poco::LibraryAlreadyLoadedException& e)
        {
            LOG_ERR(path << "' has already been loaded.");
        }
        // 無法載入
        catch(const Poco::LibraryLoadException& e)
        {
            LOG_ERR(path << "' cannot be loaded.");
        }

        return false;
    }

    OxOOL::Module::Ptr getModule() const { return mpClass; }

    void useBaseModule()
    {
        mpClass = std::make_shared<OxOOL::Module::Base>();
    }

private:
    Poco::SharedLibrary mLibrary;
    OxOOL::Module::Ptr mpClass;
};

std::mutex mModulesMutex;
std::map<std::string, std::shared_ptr<ModuleLibrary>> moduleMap;

namespace OxOOL
{

/// @brief 處理模組 client 的 admin Websocket 請求和回覆
class ModuleAdminSocketHandler : public WebSocketHandler
{
public:
    ModuleAdminSocketHandler(const OxOOL::Module::Ptr& module,
                             const std::weak_ptr<StreamSocket>& socket,
                             const Poco::Net::HTTPRequest& request)
        : WebSocketHandler(socket.lock(), request)
        , mpModule(module)
        , mbIsAuthenticated(false)
    {
    }

    /// @brief 處理收到的 web socket 訊息，並傳送給模組處理
    /// @param payload
    void handleMessage(const std::vector<char> &payload) override
    {
        // FIXME: check fin, code etc.
        const std::string firstLine = LOOLProtocol::getFirstLine(payload.data(), payload.size());

        const StringVector tokens(StringVector::tokenize(firstLine, ' '));
        LOG_DBG("Module:[" << mpModule->getDetail().name << "] Recv: " << firstLine << " tokens " << tokens.size());

        // 一定要有資料
        if (tokens.empty())
        {
            LOG_TRC("too few tokens");
            return;
        }

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
                mbIsAuthenticated = true;
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

        // 未認證過就擋掉
        if (!mbIsAuthenticated)
        {
            LOG_DBG("Not authenticated - message is '" << firstLine << "' " <<
                    tokens.size() << " first: '" << tokens[0] << '\'');
            sendMessage("NotAuthenticated");
            shutdown();
            ignoreInput();
            return;
        }

        // 取得模組詳細資訊
        if (tokens.equals(0, "getModuleInfo"))
        {
            sendTextFrame("moduleInfo " + getModuleInfoJson());
        }
        else // 交給模組處理
        {
            std::string result = mpModule->handleAdminMessage(tokens);
            // 傳回結果
            if (!result.empty())
                sendTextFrame(result);
            else // 紀錄收到未知指令
                LOG_WRN("Admin Module [" << mpModule->getDetail().name
                                        << "] received an unknown command: '"
                                        << firstLine);
        }
    }

private:
    /// @brief 送出文字給已認證過的 client.
    /// @param message 文字訊息
    /// @param flush The data will be sent out immediately, the default is false.
    void sendTextFrame(const std::string& message, bool flush = false)
    {
        if (mbIsAuthenticated)
        {
            LOG_DBG("Send admin module text frame '" << message << '\'');
            sendMessage(message.c_str(), message.size(), WSOpCode::Text, flush);
        }
        else
            LOG_WRN("Skip sending message to non-authenticated admin module client: '" << message << '\'');
    }

    /// @brief  取得模組詳細資訊
    /// @return JSON 字串
    std::string getModuleInfoJson()
    {
        std::ostringstream oss;
        mpModule->getAdminDetailJson()->stringify(oss);
        return oss.str();
    }

private:
    /// @brief 模組 Class
    OxOOL::Module::Ptr mpModule;
    /// @brief 是否已認證過
    bool mbIsAuthenticated;
};

class ModuleAgent : public SocketPoll
{

public:
    ModuleAgent(const std::string& threadName) : SocketPoll(threadName)
    {
        purge();
        startThread();
    }

    ~ModuleAgent() {}

    static constexpr std::chrono::microseconds AgentTimeoutMicroS = std::chrono::seconds(60);

    void handleRequest(OxOOL::Module::Ptr module,
                       const Poco::Net::HTTPRequest& request,
                       SocketDisposition& disposition)
    {
        setBusy(true); // 設定忙碌狀態

        mpSavedModule = module;
        mpSavedSocket = std::static_pointer_cast<StreamSocket>(disposition.getSocket());
// Poco 版本小於 1.10，mRequest 必須 parse 才能產生
#if POCO_VERSION < 0x010A0000
        {
            (void)request;
            StreamSocket::MessageMap map;
            Poco::MemoryInputStream message(&mpSavedSocket->getInBuffer()[0],
                                            mpSavedSocket->getInBuffer().size());
            if (!mpSavedSocket->parseHeader("Client", message, mRequest, &map))
            {
                LOG_ERR("Create HTTPRequest fail! stop running");
                stopRunning();
                return;
            }
            mRequest.setURI(request.getURI());
        }
#else // 否則直接複製
        mRequest = request;
#endif

        disposition.setMove([=](const std::shared_ptr<Socket>& moveSocket)
        {
            insertNewSocket(moveSocket);
            startRunning();
        });
    }

    void pollingThread() override
    {
        while (SocketPoll::continuePolling() && !SigUtil::getTerminationFlag())
        {
            // 正在處理請求
            if (isBusy())
            {
                if ((mpSavedSocket != nullptr && mpSavedSocket->isClosed()) && !isModuleRunning())
                {
                    purge(); // 清理資料，恢復閒置狀態，可以再利用
                }
            }
            int64_t rc = poll(AgentTimeoutMicroS);
            if (rc == 0) // polling timeout.
            {
                // 現在時間
                std::chrono::steady_clock::time_point now = std::chrono::steady_clock::now();
                auto durationTime = std::chrono::duration_cast<std::chrono::microseconds>(now - mpLastIdleTime);
                // 閒置超過預設時間，就脫離迴圈
                if (durationTime >= AgentTimeoutMicroS)
                {
                    break;
                }
            }
            else if (rc > 0) // Number of Events signalled.
            {
                // 被 wakeup，紀錄目前時間
                mpLastIdleTime = std::chrono::steady_clock::now();
            }
            else // error
            {
                // do nothing.
            }
        }

        // 執行緒已經結束，觸發清理程序
        OxOOL::ModuleManager &manager = OxOOL::ModuleManager::instance();
        manager.cleanupDeadAgents();

        // 觸發 ConvertBroker 清理程序
        OxOOL::ConvertBroker::cleanup();
    }
    bool isIdle() const { return isAlive() && !isBusy(); }

private:
    /// @brief 從執行緒代理請求
    void startRunning()
    {
        // 讓 thread 執行，流程交還給 Main thread.
        // 凡是加進 Callback 執行的 function 都是在 agent thread 排隊執行
        addCallback([this]()
        {
            setModuleRunning(true);

            // 是否為 admin service
            const bool isAdminService = mpSavedModule->isAdminService(mRequest);

            // 不需要認證或已認證通過
            if (!mpSavedModule->needAdminAuthenticate(mRequest, mpSavedSocket, isAdminService))
            {
                // 依據 service uri 決定要給哪個 reauest 處理
                if (isAdminService)
                    mpSavedModule->handleAdminRequest(mRequest, mpSavedSocket); // 管理介面
                else
                    mpSavedModule->handleRequest(mRequest, mpSavedSocket); // Restful API
            }
            stopRunning();
        });
    }

    /// @brief 代理請求結束
    void stopRunning()
    {
        setModuleRunning(false); // 模組已經結束
        wakeup();  // 喚醒 thread.(就是 ModuleAgent::pollingThread() loop)
    }

    /// @brief 設定是否忙碌旗標
    /// @param onOff
    void setBusy(bool onOff) { mbBusy = onOff; }

    /// @brief 是否忙碌
    /// @return true: 是
    bool isBusy() const { return mbBusy; }

    /// @brief 設定模組是否執行中
    /// @param onOff
    void setModuleRunning(bool onOff)
    {
        mbModuleRunning = onOff;
    }

    /// @brief 模組是否正在執行
    /// @return true: 是
    bool isModuleRunning() const
    {
        return mbModuleRunning;
    }

    /// @brief 清除最近代理的資料，並恢復閒置狀態
    void purge()
    {
        // 觸發 ConvertBroker 清理程序
        OxOOL::ConvertBroker::cleanup();

        mpSavedModule = nullptr;
        mpSavedSocket = nullptr;
        setModuleRunning(false);
        setBusy(false);
        mpLastIdleTime = std::chrono::steady_clock::now(); // 紀錄最近閒置時間
    }

    /// @brief 最近閒置時間
    std::chrono::steady_clock::time_point mpLastIdleTime;

    /// @brief 與 Client 的 socket
    std::shared_ptr<StreamSocket> mpSavedSocket;

    /// @brief 要代理的模組
    OxOOL::Module::Ptr mpSavedModule;
    /// @brief HTTP Request
    Poco::Net::HTTPRequest mRequest;

    /// @brief 是否正在代理請求
    std::atomic<bool> mbBusy;
    /// @brief 模組正在處理代理送去的請求
    std::atomic<bool> mbModuleRunning;
};

constexpr std::chrono::microseconds ModuleAgent::AgentTimeoutMicroS;

std::mutex mAgentsMutex;
std::vector<std::shared_ptr<ModuleAgent>> mpAgentsPool;


ModuleManager::ModuleManager() :
    SocketPoll("ModuleManager")
{
    loadModulesFromDirectory(OxOOL::ENV::ModuleConfigDir);
}

ModuleManager::~ModuleManager()
{
    moduleMap.clear();
}

void ModuleManager::pollingThread()
{
    LOG_DBG("Starting Module manager polling.");
    while (!SocketPoll::isStop() && !SigUtil::getTerminationFlag() && !SigUtil::getShutdownRequestFlag())
    {
        poll(SocketPoll::DefaultPollTimeoutMicroS);

    }
    moduleMap.clear(); // Deconstruct all modules.
}

void ModuleManager::loadModulesFromDirectory(const std::string& configPath)
{
    // 載入所有模組
    const Poco::File dir(configPath);
    if (dir.exists() && dir.isDirectory())
    {
        LOG_DBG("Load modules from Directory: " << configPath);
        // 掃描目錄下所有的檔案
        for (auto it = Poco::SortedDirectoryIterator(dir); it != Poco::SortedDirectoryIterator(); ++it)
        {
            // 如果是子目錄的話，遞迴載入子目錄下的模組
            if (it->isDirectory())
            {
                loadModulesFromDirectory(it->path());
            }
            // 否則載入該檔案
            else
            {
                loadModuleConfig(it->path()); // 載入模組組態檔
            }
        }
    }
}

bool ModuleManager::loadModuleConfig(const std::string& configFile,
                                     const std::string& userLibraryPath)
{
    // 副檔名不是 xml 不處理
    if (Poco::Path(configFile).getExtension() != "xml")
        return false;

    // 不是 OxOOL module config 不處理
    OxOOL::XMLConfig config(configFile);
    if (!config.has("module"))
        return false;

    bool isModuleEnable = true;
    try
    {
        isModuleEnable = config.getBool("module[@enable]", true);
    }
    catch(const std::exception& e)
    {
        LOG_ERR(configFile << ": Parse error. [" << e.what() << "]");
        return false;
    }

    OxOOL::Module::Detail detail;
    // 模組啟用
    if (isModuleEnable)
    {
        std::shared_ptr<ModuleLibrary> module = std::make_shared<ModuleLibrary>();

        // 讀取模組詳細資訊
        detail.name = config.getString("module.detail.name", "");
        detail.serviceURI = config.getString("module.detail.serviceURI", "");
        detail.version = config.getString("module.detail.version", "");
        detail.summary = config.getString("module.detail.summary", "");
        detail.author = config.getString("module.detail.author", "");
        detail.license = config.getString("module.detail.license", "");
        detail.description = config.getString("module.detail.description", "");
        detail.adminPrivilege = config.getBool("module.detail.adminPrivilege", false);
        detail.adminIcon = config.getString("module.detail.adminIcon", "");
        detail.adminItem = config.getString("module.detail.adminItem", "");

        // .so 檔案的絕對路徑
        std::string soFilePath;
        // 模組相關檔案存放的絕對路徑
        // 該路徑下的 html 目錄存放呈現給外部閱覽的檔案，admin 目錄下，存放後臺管理相關檔案
        std::string documentRoot;
#if ENABLE_DEBUG
        // config file 所在路徑
        documentRoot = Poco::Path(configFile).makeParent().toString();
        if (*documentRoot.rbegin() == '/')
            documentRoot.pop_back(); // 去掉最後 '/' 字元
        soFilePath = documentRoot + "/.libs";
#else
        soFilePath = OxOOL::ENV::ModuleDir;
        documentRoot = OxOOL::ENV::ModuleDataDir + "/" + detail.name;
#endif

        // 指定自訂的模組路徑，有最終覆寫權
        if (!userLibraryPath.empty())
        {
            soFilePath = userLibraryPath;
            documentRoot = Poco::Path(userLibraryPath).makeParent().toString();
            if (*documentRoot.rbegin() == '/')
                documentRoot.pop_back(); // 去掉最後 '/' 字元
        }

        // 有指定載入模組檔案
        if (const std::string loadFile = config.getString("module.load", ""); !loadFile.empty())
        {
            const std::string soFile = soFilePath + "/" + loadFile;
            const Poco::File sharedLibrary(soFile);
            // 模組檔案存在
            if (sharedLibrary.exists() && sharedLibrary.isFile())
            {
                // 模組開發階段可能需要重複載入相同 Class Librery
                // 所以需要檢查是否重複載入
                std::unique_lock<std::mutex> modulesLock(mModulesMutex);
                if (auto it = moduleMap.find(configFile); it != moduleMap.end())
                {
                    // 移除已存在的模組資料，該 Class Librery 會自動卸載
                    // 否則再次加載還是舊的 Class Library
                    moduleMap.erase(it);
                }
                modulesLock.unlock();

                // 模組載入失敗
                if (!module->load(sharedLibrary.path()))
                {
                    LOG_ERR("Can not load module:" << soFile);
                    return false;
                }
            }
            else // 模組檔案不合法
            {
                LOG_ERR(soFile << " is not found.");
                return false;
            }
        }
        else // 沒有指定載入模組，就用基本模組
        {
            module->useBaseModule();
        }

        // 檢查是否有後臺管理(需在模組目錄下有 admin 目錄，且 admin 目錄下還有 admin.html 及 admin.js)
        if (!detail.adminItem.empty() &&
            Poco::File(documentRoot + "/admin/admin.html").exists() &&
            Poco::File(documentRoot + "/admin/admin.js").exists())
        {
            detail.adminServiceURI = "/loleaflet/dist/admin/module/" + detail.name + "/";
        }

        // 設定模組詳細資訊
        module->getModule()->mDetail = detail;
        // 設定模組文件絕對路徑
        module->getModule()->maRootPath = documentRoot;

        std::unique_lock<std::mutex> modulesLock(mModulesMutex);
        moduleMap[configFile] = module;
        modulesLock.unlock();

        module->getModule()->initialize(); // 執行模組的 initialize()
    }

    return true;
}

bool ModuleManager::hasModule(const std::string& moduleName)
{
    // 逐筆過濾
    for (auto& it : moduleMap)
    {
        if (it.second->getModule()->getDetail().name == moduleName)
        {
            return true;
        }
    }
    return false;
}

OxOOL::Module::Ptr ModuleManager::getModuleByConfigFile(const std::string& configFile)
{
    if (moduleMap.find(configFile) != moduleMap.end())
    {
        return moduleMap[configFile]->getModule();
    }
    return nullptr;
}

OxOOL::Module::Ptr ModuleManager::getModuleByName(const std::string& moduleName)
{
    // 逐筆過濾
    for (auto& it : moduleMap)
    {
        if (it.second->getModule()->getDetail().name == moduleName)
        {
            return it.second->getModule();
        }
    }
    return nullptr;
}

bool ModuleManager::handleRequest(const Poco::Net::HTTPRequest& request,
                                  SocketDisposition& disposition)
{
    // 進到這裡的 Poco::Net::HTTPRequest 的 URI 已經被改寫，
    // 去掉 service root 了(如果 oxoolwsd.xml 有指定的話)

    // 1. 優先處理一般 request
    // 取得處理該 request 的模組，可能是 serverURI 或 adminServerURI(如果有的話)
    if (OxOOL::Module::Ptr module = handleByModule(request); module != nullptr)
    {
        std::unique_lock<std::mutex> agentsLock(mAgentsMutex);
        // 尋找可用的模組代理
        std::shared_ptr<ModuleAgent> moduleAgent = nullptr;
        for (auto &it : mpAgentsPool)
            {
            if (it->isIdle())
            {
                moduleAgent = it;
                break;
            }
        }
        // 沒有找到空閒的代理
        if (moduleAgent == nullptr)
        {
            moduleAgent = std::make_shared<ModuleAgent>("Module Agent");
            mpAgentsPool.push_back(moduleAgent);
        }
        agentsLock.unlock();
        moduleAgent->handleRequest(module, request, disposition);

        return true;
    }

    // 2. 再看看是否爲後臺模組管理要求升級 Websocket
    // URL: /lool/adminws/<模組名稱>
    std::vector<std::string> segments;
    Poco::URI(request.getURI()).getPathSegments(segments);
    if (segments.size() == 3 &&
        segments[0] == "lool" &&
        segments[1] == "adminws")
    {
        LOG_INF("Admin module request: " << request.getURI());
        const std::string& moduleName = segments[2];

        // 轉成 std::weak_ptr
        const std::weak_ptr<StreamSocket> socketWeak =
              std::static_pointer_cast<StreamSocket>(disposition.getSocket());
        if (handleAdminWebsocketRequest(moduleName, socketWeak, request))
        {
            disposition.setMove([this](const std::shared_ptr<Socket> &moveSocket)
            {
                // Hand the socket over to self poll.
                insertNewSocket(moveSocket);
            });
            return true;
        }
    }

    return false;
}

bool ModuleManager::handleAdminWebsocketRequest(const std::string& moduleName,
                                                const std::weak_ptr<StreamSocket> &socketWeak,
                                                const Poco::Net::HTTPRequest& request)
{
    // 禁用後臺管理
    if (!LOOLWSD::AdminEnabled)
    {
        LOG_ERR("Request for disabled admin console");
        return false;
    }

    // Socket 不存在
    std::shared_ptr<StreamSocket> socket = socketWeak.lock();
    if (!socket)
    {
        LOG_ERR("Invalid socket while reading initial request.");
        return false;
    }

    // 沒有指定名稱的模組
    OxOOL::Module::Ptr module = getModuleByName(moduleName);
    if (module == nullptr)
    {
        LOG_ERR("No module named '" << moduleName << "'");
        return false;
    }

    const std::string& requestURI = request.getURI();
    StringVector pathTokens(StringVector::tokenize(requestURI, '/'));
    // 要升級連線爲 Web socket
    if (request.find("Upgrade") != request.end() && Poco::icompare(request["Upgrade"], "websocket") == 0)
    {
        auto handler = std::make_shared<ModuleAdminSocketHandler>(module, socketWeak, request);
        socket->setHandler(handler);
        return true;
    }

    // 回應錯誤 http status code.
    OxOOL::HttpHelper::sendErrorAndShutdown(Poco::Net::HTTPResponse::HTTP_BAD_REQUEST, socket);
    return false;
}

void ModuleManager::cleanupDeadAgents()
{
    // 交給 module manager thread 執行清理工作，避免搶走 main thread
    addCallback([this]()
    {
        std::unique_lock<std::mutex> agentsLock(mAgentsMutex);
        // 有 agents 才進行清理工作
        if (const int beforeClean = mpAgentsPool.size(); beforeClean > 0)
        {
            for (auto it = mpAgentsPool.begin(); it != mpAgentsPool.end();)
            {
                if (!it->get()->isAlive())
                {
                    mpAgentsPool.erase(it);
                    continue;
                }
                else
                {
                    ++it;
                }
            }
            const int afterClean = mpAgentsPool.size();
            LOG_DBG("Clean " << beforeClean - afterClean << " dead agents, leaving " << afterClean << ".");
        }
    });
}

const std::vector<OxOOL::Module::Detail> ModuleManager::getAllModuleDetails() const
{
    std::vector<OxOOL::Module::Detail> detials;
    for (auto it : moduleMap)
    {
        detials.push_back(it.second->getModule()->getDetail());
    }
    return detials;
}

std::string ModuleManager::getAdminModuleDetailsJsonString(const std::string& langTag) const
{
    std::string jsonString("[");
    std::size_t count = 0;
    for (auto it : moduleMap)
    {
        OxOOL::Module::Ptr module = it.second->getModule();
        // 只取有後臺管理的模組
        if (!module->getDetail().adminServiceURI.empty())
        {
            auto detialJson = module->getAdminDetailJson(langTag);
            std::ostringstream oss;
            detialJson->stringify(oss);
            jsonString.append(oss.str() + ",");
            count ++;
        }
    }
    // 有找到任何管理模組，去掉最後一個 ',' 字元
    if (count > 0)
        jsonString.pop_back();

    jsonString.append("]");
    return jsonString;
}

void ModuleManager::dump()
{
    // TODO: Do we need to implement this?
}

//------------------ Private mtehods ----------------------------------

OxOOL::Module::Ptr ModuleManager::handleByModule(const Poco::Net::HTTPRequest& request)
{
    // 找出是哪個 module 要處理這個請求
    for (auto& it : moduleMap)
    {
        OxOOL::Module::Ptr module = it.second->getModule();
        if (module->isService(request) || module->isAdminService(request))
            return module;
    }
    return nullptr;
}

}; // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
