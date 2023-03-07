/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include "config.h"

#include <Poco/Net/HTTPRequest.h>

#include <OxOOL/HttpHelper.h>
#include <OxOOL/Module/Base.h>
#include <OxOOL/net/Socket.hpp>

class %MODULE_NAME% : public OxOOL::Module::Base
{
public:
    /// @brief Module constructor.
    %MODULE_NAME%()
    {
        // Put your code here.
    }

    /// Module deconstructor.
    virtual ~%MODULE_NAME%()
    {
        // Put your code here.
    }

    /// @brief 模組載入完畢後，初始化工作，只會在載入完畢後呼叫一次
    /// After the module is loaded, the initialization work will only be called once after
    /// the module is loaded.
    void initialize() override
    {
        // Here is the code for initialization, if any.
    }

    /// @brief 處理前端 Client 的請求
    /// Handle requests from the front-end Client.
    void handleRequest(const Poco::Net::HTTPRequest& request,
                       const std::shared_ptr<StreamSocket>& socket) override
    {
        OxOOL::HttpHelper::sendResponseAndShutdown(socket, "<H1>This is an example module.</H1>",
            Poco::Net::HTTPResponse::HTTP_OK, "text/html; charset=utf-8");
    }

#if ENABLE_ADMIN
    /// @brief 處理控制臺 Client 的請求
    /// Handle requests from the Console Client.
    void handleAdminRequest(const Poco::Net::HTTPRequest& request,
                            const std::shared_ptr<StreamSocket>& socket) override
    {
        // 交給 base class 處理
        OxOOL::Module::Base::handleAdminRequest(request, socket);
    }

    /// @brief 處理控制臺 Websocket 的訊息
    /// Handle console Websocket messages.
    std::string handleAdminMessage(const StringVector& tokens) override
    {
        if (tokens.equals(0, "sayHello"))
        {
            return "respond HELLO";
        }

        return "";
    }
#endif
};

OXOOL_MODULE_EXPORT(%MODULE_NAME%);

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
