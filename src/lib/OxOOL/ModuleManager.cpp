/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


#include <OxOOL/ModuleManager.h>
#include <OxOOL/XMLConfig.h>
#include <OxOOL/HttpHelper.h>

#include <chrono>

#include <dlfcn.h> // for dlopen()

#include <Poco/DirectoryIterator.h>
#include <Poco/File.h>
#include <Poco/Path.h>
#include <Poco/Net/HTTPRequest.h>
#include <Poco/Net/NetException.h>
#include <Poco/MemoryStream.h>

#include <common/SigUtil.hpp>
#include <common/Log.hpp>
#include <net/Socket.hpp>
#include <wsd/FileServer.hpp>

namespace OxOOL
{

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
    SocketPoll::joinThread();
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

bool ModuleManager::handleRequest(const RequestDetails& requestDetails,
                                  const Poco::Net::HTTPRequest& request,
                                  SocketDisposition& disposition)
{
    if (OxOOL::Module::Ptr module = handleByModule(requestDetails); module != nullptr)
    {
        disposition.setMove(
            [&](const std::shared_ptr<Socket>& moveSocket)
            {
                insertNewSocket(moveSocket);

                std::shared_ptr<StreamSocket> socket
                    = std::static_pointer_cast<StreamSocket>(moveSocket);

                OxOOL::Module::Detail detail = module->getDetail();
                LOG_DBG("[ModuleManager] HTTP request: " << requestDetails.getURI());
                LOG_DBG("Leave it to module '" << detail.name << "' for processing.");

                bool needAuthenticate = false; // 預設不需認證
                // 該 Service URI 需要有管理者權限
                if (detail.adminPrivilege)
                {
                    std::shared_ptr<Poco::Net::HTTPResponse> response
                        = std::make_shared<Poco::Net::HTTPResponse>();

                    try
                    {
                        if (!FileServerRequestHandler::isAdminLoggedIn(request, *response))
                            throw Poco::Net::NotAuthenticatedException("Invalid admin login");
                    }
                    catch (const Poco::Net::NotAuthenticatedException& exc)
                    {
                        needAuthenticate = true;
                        OxOOL::HttpHelper::KeyValueMap extraHeader
                            = { { "WWW-authenticate", "Basic realm=\"OxOffice Online\"" } };
                        OxOOL::HttpHelper::sendErrorAndShutdown(
                            Poco::Net::HTTPResponse::HTTP_UNAUTHORIZED, socket, "", "",
                            extraHeader);
                    }
                }

                if (!needAuthenticate)
                {
                    addCallback([&]
                    {
                        // 指派給模組處理
                        module->handleRequest(requestDetails, request, socket);
                    });
                }
            });
        return true;
    }
    return false;
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

OxOOL::Module::Ptr ModuleManager::handleByModule(const RequestDetails& requestDetails)
{
    // 不處理 Web socket
    if (!requestDetails.isWebSocket())
    {
        // 實際請求位址
        std::string requestURI = requestDetails.getURI();
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
    }
    return nullptr;
}

}; // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */