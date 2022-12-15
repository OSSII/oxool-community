/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


#include <OxOOL/ModuleManager.h>
#include <OxOOL/XMLConfig.h>
#include <OxOOL/HttpHelper.h>

#include <dlfcn.h> // for dlopen()

#include <Poco/Version.h>
#include <Poco/DirectoryIterator.h>
#include <Poco/File.h>
#include <Poco/Path.h>

#include <common/SigUtil.hpp>
#include <common/Log.hpp>

namespace OxOOL
{

void ModuleAdminSocketHandler::handleMessage(const std::vector<char> &payload)
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

ModuleAdminSocketHandler::ModuleAdminSocketHandler(const OxOOL::Module::Ptr& module,
                                                   const std::weak_ptr<StreamSocket>& socket,
                                                   const Poco::Net::HTTPRequest& request)
    : WebSocketHandler(socket, request),
      mpModule(module),
      mbIsAuthenticated(false)
{
}

void ModuleAdminSocketHandler::sendTextFrame(const std::string& message, bool flush)
{
    if (mbIsAuthenticated)
    {
        LOG_DBG("Send admin module text frame '" << message << '\'');
        sendMessage(message.c_str(), message.size(), WSOpCode::Text, flush);
    }
    else
        LOG_WRN("Skip sending message to non-authenticated admin module client: '" << message << '\'');
}

std::string ModuleAdminSocketHandler::getModuleInfoJson()
{
    std::ostringstream oss;
    mpModule->getAdminDetailJson()->stringify(oss);
    return oss.str();
}

int ModuleAgent::AgentTimeoutMicroS = 60 * 1000 * 1000; // 1 分鐘

ModuleAgent::ModuleAgent(const std::string& threadName) :
    SocketPoll(threadName)
{
    purge();
    startThread();
}

void ModuleAgent::handleRequest(OxOOL::Module::Ptr module,
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

void ModuleAgent::pollingThread()
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
        int rc = poll(AgentTimeoutMicroS);
        if (rc == 0) // polling timeout.
        {
            // 現在時間
            std::chrono::steady_clock::time_point now = std::chrono::steady_clock::now();
            int durationTime = std::chrono::duration_cast<std::chrono::microseconds>(now - mpLastIdleTime).count();
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
    // 觸發 ModuleManager 清理用完的 DocumentBroker
    manager.cleanupDocBrokers();
}

void ModuleAgent::startRunning()
{
    // 讓 thread 執行，流程交還給 Main thread.
    // 凡是加進 Callback 執行的 function 都是在 agent thread 排隊執行
    addCallback([this]()
    {
        setModuleRunning(true);

        // 製作 requestDetails，這裡不用 ModuleManager 的 requestDetails 的原因，是因為進入 thread 後，
        // ModuleManager 的 requestDetails 會被 destroy，在 thread 之後的結果就不正確
        RequestDetails requestDetails(mRequest, LOOLWSD::ServiceRoot);
        // 是否為 admin service
        const bool isAdminService = mpSavedModule->isAdminService(requestDetails);

        // 不需要認證或已認證通過
        if (!mpSavedModule->needAdminAuthenticate(mRequest, mpSavedSocket, isAdminService))
        {
            // 依據 service uri 決定要給哪個 reauest 處理
            if (isAdminService)
                mpSavedModule->handleAdminRequest(mRequest, requestDetails, mpSavedSocket); // 管理介面
            else
                mpSavedModule->handleRequest(mRequest, requestDetails, mpSavedSocket); // Restful API
        }
        stopRunning();
    });
}

void ModuleAgent::stopRunning()
{
    setModuleRunning(false); // 模組已經結束
    wakeup();  // 喚醒 thread.(就是 ModuleAgent::pollingThread() loop)
}

void ModuleAgent::purge()
{
    // 觸發 ModuleManager 清理用完的 DocumentBroker
    OxOOL::ModuleManager::instance().cleanupDocBrokers();

    mpSavedModule = nullptr;
    mpSavedSocket = nullptr;
    setModuleRunning(false);
    setBusy(false);
    mpLastIdleTime = std::chrono::steady_clock::now(); // 紀錄最近閒置時間
}

ModuleManager::ModuleManager() :
    SocketPoll("ModuleManager")
{
    loadModulesFromDirectory(OxOOL::ENV::ModuleConfigDir);
}

void ModuleManager::pollingThread()
{
    LOG_DBG("Starting Module manager polling.");
    while (!SocketPoll::isStop() && !SigUtil::getTerminationFlag() && !SigUtil::getShutdownRequestFlag())
    {
        poll(SocketPoll::DefaultPollTimeoutMicroS);
    }
}

void ModuleManager::loadModulesFromDirectory(const std::string& modulePath, const std::string& type)
{
    // 載入所有模組
    const Poco::File dir(modulePath);
    if (dir.exists() && dir.isDirectory())
    {
        LOG_DBG("Load modules from Directory: " << modulePath);
        // 掃描目錄下所有的檔案
        for (auto it = Poco::DirectoryIterator(dir); it != Poco::DirectoryIterator(); ++it)
        {
            // 如果是子目錄的話，遞迴載入子目錄下的模組
            if (it->isDirectory())
            {
                loadModulesFromDirectory(it->path(), type);
            }
            // 否則載入該檔案
            else
            {
                if (type == "xml")
                {
                    loadModuleConfig(it->path()); // 載入模組組態檔
                }
                else
                {
                    loadModule(it->path()); // 載入模組
                }
            }
        }
    }
}

bool ModuleManager::loadModuleConfig(const std::string& configFile)
{
    const Poco::Path oxoolModuleConfig(configFile);
    // 不是檔案或副檔名不是 .xml，不處理
    if (!oxoolModuleConfig.isFile() || oxoolModuleConfig.getExtension() != "xml")
        return false;

    OxOOL::XMLConfig config(configFile);
    // 不是 OxOOL module config 不處理
    if (!config.has("module[@enable]"))
        return false;

    OxOOL::Module::Detail detail;
    // 模組啟用
    if (config.getBool("module[@enable]"))
    {
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

        // 模組相關檔案存放的絕對路徑
        // 該路徑下的 html 目錄存放呈現給外部閱覽的檔案，admin 目錄下，存放後臺管理相關檔案
        const std::string documentRoot = OxOOL::ENV::ModuleDataDir + "/" + detail.name;

        // 有指定載入模組檔案
        if (const std::string loadFile = config.getString("module.load", ""); !loadFile.empty())
        {
            std::string foundPath = findModule(OxOOL::ENV::ModuleDir, loadFile);
            if (!foundPath.empty())
            {
                // 載入模組
                OxOOL::Module::Ptr module = loadModule(foundPath);
                // 模組載入成功，覆寫模組設定
                if (module != nullptr)
                {
                    OxOOL::Module::Detail origDetail = module->getDetail();
                    if (!detail.name.empty())
                        origDetail.name = detail.name;

                    if (!detail.serviceURI.empty())
                        origDetail.serviceURI = detail.serviceURI;

                    if (!detail.version.empty())
                        origDetail.version = detail.version;

                    if (!detail.summary.empty())
                        origDetail.summary = detail.summary;

                    if (!detail.author.empty())
                        origDetail.author = detail.author;

                    if (!detail.license.empty())
                        origDetail.license = detail.license;

                    if (!detail.description.empty())
                        origDetail.description = detail.description;

                    if (origDetail.adminPrivilege != detail.adminPrivilege)
                        origDetail.adminPrivilege = detail.adminPrivilege;

                    if (!detail.adminIcon.empty())
                        origDetail.adminIcon = detail.adminIcon;

                    if (!detail.adminItem.empty())
                        origDetail.adminItem = detail.adminItem;

                    module->maRootPath = documentRoot; // 設定模組文件絕對路徑

                    // 檢查是否有後臺管理(需在模組目錄下有 admin 目錄，且 admin 目錄下還有 admin.html 及 admin.js)
                    if (Poco::File(documentRoot + "/admin/admin.html").exists() &&
                        Poco::File(documentRoot + "/admin/admin.js").exists())
                    {
                        origDetail.adminServiceURI = "/loleaflet/dist/admin/module/" + origDetail.name + "/";
                    }

                    module->mDetail = origDetail; // 重新複寫設定

                    module->initialize();
                }
                else
                {
                    LOG_ERR("Can not load module:" << foundPath);
                }
            }
            else
            {
                LOG_ERR("In the " << OxOOL::ENV::ModuleDir << " directory, " << loadFile
                                  << " is not found.");
            }
        }
        else
        {
            // 沒有載入模組，就用基本模組
            OxOOL::Module::Ptr module = std::make_shared<OxOOL::Module::Base>();
            module->mDetail = detail; // 重新複寫設定
            module->maRootPath = documentRoot; // 設定模組文件絕對路徑
            mpModules[configFile] = module;
            module->initialize();
        }
    }

    return true;
}

bool ModuleManager::hasModule(const std::string& moduleName)
{
    // 逐筆過濾
    for (auto& it : mpModules)
    {
        if (it.second->getDetail().name == moduleName)
        {
            return true;
        }
    }
    return false;
}

OxOOL::Module::Ptr ModuleManager::getModuleByName(const std::string& moduleName)
{
    // 逐筆過濾
    for (auto& it : mpModules)
    {
        if (it.second->getDetail().name == moduleName)
        {
            return it.second;
        }
    }
    return nullptr;
}

bool ModuleManager::alreadyLoaded(const std::string& moduleFile)
{
    return mpModules.find(moduleFile) != mpModules.end() ? true : false;
}

bool ModuleManager::handleRequest(const Poco::Net::HTTPRequest& request,
                                  const RequestDetails& requestDetails,
                                  SocketDisposition& disposition)
{
    // 是否爲後臺模組管理要求升級 Websocket
    if (requestDetails.size() == 3 &&
        requestDetails.equals(RequestDetails::Field::Type, "lool") &&
        requestDetails.equals(1, "adminws"))
    {
        LOG_INF("Admin module request: " << request.getURI());

        // 轉成 std::weak_ptr
        const std::weak_ptr<StreamSocket> socketWeak =
              std::static_pointer_cast<StreamSocket>(disposition.getSocket());
        // URL: /lool/adminws/<模組名稱>
        const std::string& moduleName = requestDetails[2];
        if (handleAdminWebsocketRequest(moduleName, socketWeak, request))
        {
            disposition.setMove([this](const std::shared_ptr<Socket> &moveSocket)
            {
                // Hand the socket over to self poll.
                insertNewSocket(moveSocket);
            });
            return true;
        }
        return false;
    }

    // 取得處理該 request 的模組，可能是 serverURI 或 adminServerURI(如果有的話)
    if (OxOOL::Module::Ptr module = handleByModule(requestDetails); module != nullptr)
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
        moduleAgent->handleRequest(module, request, disposition);
        agentsLock.unlock();

        return true;
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

std::shared_ptr<ConvertBroker>
ModuleManager::createConvertBroker(const std::string& fromFile,
                                   const std::string& toFormat,
                                   const std::string& saveAsOptions)
{
    std::unique_lock<std::mutex> brokersLock(mBrokersMutex);
    Poco::URI uriPublic = DocumentBroker::sanitizeURI(fromFile);
    const std::string docKey = DocumentBroker::getDocKey(uriPublic);
    auto docBroker = std::make_shared<ConvertBroker>(fromFile, uriPublic, docKey,
                                                     toFormat, saveAsOptions);
    mpDocBrokers[docKey] = docBroker;

    return docBroker;
}

void ModuleManager::cleanupDocBrokers()
{
    // 交給 module manager thread 執行清理工作，避免搶走 main thread
    addCallback([this]()
    {
        std::unique_lock<std::mutex> brokersLock(mBrokersMutex);
        // 有 agents 才進行清理工作
        if (const int beforeClean = mpDocBrokers.size(); beforeClean > 0)
        {
            for (auto it = mpDocBrokers.begin(); it != mpDocBrokers.end();)
            {
                std::shared_ptr<DocumentBroker> docBroker = it->second;
                if (!docBroker->isAlive())
                {
                    docBroker->dispose();
                    it = mpDocBrokers.erase(it);
                    continue;
                }
                else
                {
                    ++it;
                }
            }
            const int afterClean = mpDocBrokers.size();
            LOG_DBG("Clean " << beforeClean - afterClean << " Document Broker, leaving " << afterClean << ".");
        }
    });
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
    for (auto it : mpModules)
    {
        detials.push_back(it.second->getDetail());
    }
    return detials;
}

std::string ModuleManager::getAdminModuleDetailsJsonString(const std::string& langTag) const
{
    std::string jsonString("[");
    std::size_t count = 0;
    for (auto it : mpModules)
    {
        OxOOL::Module::Ptr module = it.second;
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

std::string ModuleManager::findModule(const std::string& path, const std::string& name)
{
    std::string returnPath;

    const Poco::File dir(path);

    if (dir.exists() && dir.isDirectory())
    {
        LOG_DBG("Scan Directory: " << path);
        // 掃描目錄下所有的檔案
        for (auto it = Poco::DirectoryIterator(dir); it != Poco::DirectoryIterator(); ++it)
        {
            // 如果是子目錄的話，遞迴掃描
            if (it->isDirectory())
            {
                returnPath = findModule(it->path(), name);
            }
            else
            {
                // 否則檢查檔案是否存在
                const Poco::File file(path + "/" + name);
                if (file.exists())
                {
                    returnPath = file.path();
                }
            }

            if (!returnPath.empty())
                break;
        }
    }

    return returnPath;
}

OxOOL::Module::Ptr ModuleManager::loadModule(const std::string& moduleFile)
{
    const Poco::Path oxoolModule(moduleFile);
    // 不是檔案或副檔名不是 .so，不處理
    if (!oxoolModule.isFile() || oxoolModule.getExtension() != "so")
        return nullptr;

    // 檔案已經載入過了
    if (alreadyLoaded(moduleFile))
    {
        LOG_DBG("Warning! '" << moduleFile << "' already loaded.");
        return nullptr;
    }

    // 開啟 share library file.
    void* handle = dlopen(moduleFile.c_str(), RTLD_LAZY);
    if (handle)
    {
        // 載入模組進入點
        auto moduleEntry
            = reinterpret_cast<OxOOLModuleEntry>(dlsym(handle, OXOOL_MODULE_ENTRY_SYMBOL));
        if (char* dlsym_error = dlerror(); !dlsym_error)
        {
            mpModules[moduleFile] = moduleEntry(); // 取得模組
            return mpModules[moduleFile];
        }
        else
        {
            LOG_DBG("Symbol error: " << dlsym_error);
        }
    }
    else
    {
        LOG_DBG("Module load fail!(" << dlerror() << ")");
    }

    if (handle)
        dlclose(handle);

    return nullptr;
}

OxOOL::Module::Ptr ModuleManager::handleByModule(const RequestDetails& requestDetails)
{
    // 找出是哪個 module 要處理這個請求
    for (auto& it : mpModules)
    {
        OxOOL::Module::Ptr module = it.second;
        if (module->isService(requestDetails) || module->isAdminService(requestDetails))
            return module;
    }
    return nullptr;
}

}; // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */