/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
  * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <fstream>

#include <OxOOL/Util.h>
#include <OxOOL/HttpHelper.h>
#include <OxOOL/ModuleManager.h>
#include <OxOOL/Module/Base.h>

#include <Poco/File.h>
#include <Poco/Net/HTTPRequest.h>
#include <Poco/Net/HTMLForm.h>

#include <net/Socket.hpp>
#include <net/NetUtil.hpp>
#include <common/Log.hpp>

/**
 * @brief 用於模組開發階段使用
 *
 * 用法：curl http(s)://localhost:9980/moduletest?config={xml 絕對路徑}
 *
 */
class ModuleTesting : public OxOOL::Module::Base
{
public:

    ModuleTesting()
        : maTestingFile("/tmp/.oxoolmoduletesting")
    {
    }

    ~ModuleTesting()
    {
        removeTestingFile();
    }

    void initialize() override
    {
        createTestingFile();
    }

    void handleRequest(const Poco::Net::HTTPRequest& request,
                       const std::shared_ptr<StreamSocket>& socket) override
    {
        // 檢查是否來自 localhost
        std::string clentAddress = socket->clientAddress();
        if (!net::isLocalhost(clentAddress))
        {
            LOG_ERR(logTitle() << "Deny module testing requests from non-localhost.");
            OxOOL::HttpHelper::sendErrorAndShutdown(Poco::Net::HTTPResponse::HTTP_FORBIDDEN, socket);
            return;
        }

        // 回應訊息內容
        std::string responseMsg;

        Poco::Net::HTMLForm form(request);
        const std::string configFile = form.get("config", "");
        // 不是 GET 或沒有指定 xml config
        if (!OxOOL::HttpHelper::isGET(request) || configFile.empty())
        {
            responseMsg = "Usage:\n"
                        + OxOOL::HttpHelper::getProtocol()
                        + request.getHost() + OxOOL::HttpHelper::getServiceRoot()
                        + getDetail().serviceURI + "?config={The module's xml config absolute path.}";
        }
        else
        {
            // 檔案存在，就令 Module Manager 載入
            if (Poco::File(configFile).exists())
            {
                // 模組管理物件
                OxOOL::ModuleManager& moduleManager = OxOOL::ModuleManager::instance();
                const std::string modulePath = Poco::Path(configFile).makeParent().toString() + ".libs";
                // 載入 config 及 shared library
                if (!moduleManager.loadModuleConfig(configFile, modulePath))
                {
                    responseMsg = "Failed to load '" + configFile + "', please check the xml configuration for errors.";
                }
                else
                {
                    OxOOL::Module::Ptr module = moduleManager.getModuleByConfigFile(configFile);
                    OxOOL::Module::Detail detial = module->getDetail();

                    std::ostringstream oss;
                    oss << "Module detials:"
                        << "\n\tName: " << detial.name
                        << "\n\tService URI: " << detial.serviceURI
                        << "\n\tVerson: " << detial.version
                        << "\n\tSummary: " << detial.summary
                        << "\n\tLicense: " << detial.license
                        << "\n\tAuthor: " << detial.author
                        << "\n\tDescrtption: " << detial.description
                        << "\n\tAdmin privilege: " << (detial.adminPrivilege ? "Yes" : "No")
                        << "\n\tAdmin icon: " << detial.adminIcon
                        << "\n\tAdmin item: " << detial.adminItem;

                    responseMsg = oss.str();
                }
            }
            else
            {
                responseMsg = "Cannot find '" + configFile + "'.";
            }
        }
        OxOOL::HttpHelper::sendResponseAndShutdown(socket, (responseMsg.empty() ? "" : responseMsg + "\n"));
    }

private:
    /// @brief 移除測試 URL 檔
    void removeTestingFile()
    {
        if (Poco::File(maTestingFile).exists())
            Poco::File(maTestingFile).remove();
    }

    /// @brief 建立測試 URL 檔
    void createTestingFile()
    {
        std::ofstream out(maTestingFile, std::ios::trunc|std::ios::out|std::ios::binary);
        if (out.is_open())
        {
            out << OxOOL::HttpHelper::getProtocol()
                << "localhost:" << OxOOL::HttpHelper::getPortNumber()
                << getDetail().serviceURI
                << "?config=";
            out.close();
            LOG_DBG(logTitle() << maTestingFile << " create successfully.");
        }
        else
        {
            LOG_ERR(logTitle() << "Unable to create" << maTestingFile);
        }
    }

private:
    const std::string maTestingFile;
};

OXOOL_MODULE_EXPORT(ModuleTesting);

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
