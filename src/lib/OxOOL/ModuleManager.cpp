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
#if POCO_VERSION < 0x01100000
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
                purge(); // 清理資料，恢復閒置狀態
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
    OxOOL::ModuleManager::instance().cleanupDeadAgents();
}

void ModuleAgent::startRunning()
{
    // 讓 thread 執行，流程交還給 Main thread.
    // 凡是加進 Callback 執行的 function 都是在 thread 排隊執行
    addCallback([this]()
    {
        setModuleRunning(true);
        // 指派給模組處理
        if (!mpSavedModule->needAdminAuthenticate(mRequest, mpSavedSocket))
        {
            mpSavedModule->handleRequest(mRequest, mpSavedSocket);
        }
        stopRunning();
    });
}

void ModuleAgent::stopRunning()
{
    // 防止模組沒有執行 socket->shutdown()
    // TODO: 應該要在 net/Socket.hpp 增加 isShutdown() 比較合理
    if (!mpSavedSocket->isClosed())
    {
        mpSavedSocket->shutdown();
    }
    setModuleRunning(false); // 模組已經結束
    wakeup();  // 喚醒 thread.(就是 ModuleAgent::pollingThread() loop)
}

void ModuleAgent::purge()
{
    mpSavedModule = nullptr;
    mpSavedSocket = nullptr;
    setModuleRunning(false);
    setBusy(false);
    mpLastIdleTime = std::chrono::steady_clock::now(); // 紀錄最近閒置時間
}

ModuleManager::ModuleManager() :
    SocketPoll("ModuleManager")
{
    loadModulesFromDirectory(LOOLWSD_MODULE_CONFIG_DIR);
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

        // 模組其他檔案存放路徑
        // 該路徑下的 html 目錄存放呈現給外部閱覽的檔案，admin 目錄下，存放後臺管理相關檔案
        std::string documentRoot = config.getString("module.documentRoot", "");
        // 有指定模組文件路徑
        if (!documentRoot.empty())
        {
            // 若模組路徑不是絕對路徑，而且有指定相對路徑的話
            if (!Poco::Path(documentRoot).isAbsolute()
                && config.has("module.documentRoot[@relative]")
                && config.getBool("module.documentRoot[@relative]"))
            {
                // 轉換爲絕對路徑，位於 LOOLWSD_MODULE_DATA_DIR 之下，再加上指定路徑
                documentRoot = std::string(LOOLWSD_MODULE_DATA_DIR) + "/" + documentRoot;
            }
            LOG_DBG("The absolute path to the file of the module '"
                    << detail.name << "' is located in " << documentRoot);
        }

        // 有指定載入模組檔案
        if (const std::string loadFile = config.getString("module.load", ""); !loadFile.empty())
        {
            std::string foundPath = findModule(LOOLWSD_MODULE_DIR, loadFile);
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

                    module->setDetail(origDetail); // 重新複寫設定

                    module->setDocumentRoot(documentRoot); // 設定模組文件絕對路徑
                }
                else
                {
                    LOG_ERR("Can not load module:" << foundPath);
                }
            }
            else
            {
                LOG_ERR("In the " << LOOLWSD_MODULE_DIR << " directory, " << loadFile
                                  << " is not found.");
            }
        }
        else
        {
            // 沒有載入模組，就用基本模組
            OxOOL::Module::Ptr module = std::make_shared<OxOOL::Module::Base>();
            module->setDetail(detail); // 重新複寫設定
            module->setDocumentRoot(documentRoot); // 設定模組文件絕對路徑
            mpModules[configFile] = module;
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

bool ModuleManager::alreadyLoaded(const std::string& moduleFile)
{
    return mpModules.find(moduleFile) != mpModules.end() ? true : false;
}

bool ModuleManager::handleRequest(const Poco::Net::HTTPRequest& request,
                                  SocketDisposition& disposition)
{
    // 取得處理該 request 的模組
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
        moduleAgent->handleRequest(module, request, disposition);
        agentsLock.unlock();

        return true;
    }
    return false;
}

void ModuleManager::cleanupDeadAgents()
{
    // 交給 thread 執行清理工作，避免搶走 main thread
    addCallback([this]()
    {
        int beforeClean = mpAgentsPool.size();
        // 有 agents 才進行清理工作
        if (beforeClean > 0)
        {
            std::unique_lock<std::mutex> agentsLock(mAgentsMutex);

            for (auto it = mpAgentsPool.begin(); it != mpAgentsPool.end(); )
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
            int afterClean = mpAgentsPool.size();
            LOG_DBG("Clean " << beforeClean - afterClean << " dead agents, leaving " << afterClean << ".");
            agentsLock.unlock();
                }
            });
}

std::string ModuleManager::handleAdminMessage(const std::string& moduleName,
                                              const std::string& message)
{
    // 要送給那個模組
    for (auto& it : mpModules)
    {
        if (it.second->getDetail().name == moduleName)
        {
            return it.second->handleAdminMessage(message);
        }
    }
    return "";
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

/// @brief 列出所有的模組
void ModuleManager::dump() {}

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

OxOOL::Module::Ptr ModuleManager::handleByModule(const Poco::Net::HTTPRequest& request)
{
    // 實際請求位址
    std::string requestURI = request.getURI();
    // 若帶有 '?key1=asd&key2=xxx' 參數字串，去除參數字串，只保留完整位址
    if (size_t queryPos = requestURI.find_first_of('?'); queryPos != std::string::npos)
        requestURI.resize(queryPos);

    // 找出是哪個 module 要處理這個請求
    for (auto& it : mpModules)
    {
        OxOOL::Module::Ptr module = it.second;
        // 取得該模組指定的 service uri, uri 長度至少 2 個字元
        if (std::string serviceURI = it.second->getDetail().serviceURI; serviceURI.length() > 1)
        {
            bool correct = false;

            // service uri 是否為 End point?(最後字元不是 '/')
            bool isEndPoint = serviceURI.at(serviceURI.length() - 1) != '/';

            // service uri 爲 end pointer，表示 request uri 和 service uri 需相符
            if (isEndPoint)
            {
                correct = (serviceURI == requestURI);
            }
            else
            {
                // 該位址可以為 "/endpoint" or "/endpoint/"
                std::string endpoint(serviceURI);
                endpoint.pop_back(); // 移除最後的 '/' 字元，轉成 /endpoint

                // 位址列開始爲 "/endpoint/" 或等於 "/endpoint"，視為正確位址
                correct = (requestURI.find(serviceURI) == 0 || requestURI == endpoint);
            }

            if (correct)
                return module;
        }
    }
    return nullptr;
}

}; // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */