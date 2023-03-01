/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include "config.h"

#include "Module.hpp"

#include <Poco/Net/HTTPRequest.h>

#include <OxOOL/HttpHelper.h>
#include <OxOOL/net/Socket.hpp>

/// @brief Module constructor.
Module::Module()
{
    // Put your code here.
}

/// Module deconstructor.
Module::~Module()
{
    // Put your code here.
}

/// @brief 模組載入完畢後，初始化工作，只會在載入完畢後呼叫一次
/// After the module is loaded, the initialization work will only be called once after
/// the module is loaded.
void Module::initialize()
{
    // Here is the code for initialization, if any.
}

/// @brief 處理前端 Client 的請求
/// Handle requests from the front-end Client.
void Module::handleRequest(const Poco::Net::HTTPRequest& request,
                           const std::shared_ptr<StreamSocket>& socket)
{
    OxOOL::HttpHelper::sendResponseAndShutdown(socket, "<H1>This is an example module.</H1>",
         Poco::Net::HTTPResponse::HTTP_OK, "text/html; charset=utf-8");
}

#if ENABLE_ADMIN
    /// @brief 處理控制臺 Client 的請求(沒有後臺管理，或不想自己管理，請直接移除)
    /// If there is no admin management, or if you don't want to manage it yourself,
/// you can remove this code.
void Module::handleAdminRequest(const Poco::Net::HTTPRequest& request,
                                const std::shared_ptr<StreamSocket>& socket)
{
    OxOOL::Module::Base::handleAdminRequest(request, socket);
}

/// @brief 處理控制臺 Websocket 的訊息(沒有後臺管理請直接移除)
/// Without admin management, this code can be removed.
std::string Module::handleAdminMessage(const StringVector& tokens)
{
    if (tokens.equals(0, "sayHello"))
    {
        return "respond HELLO";
    }

    return "";
}
#endif

OXOOL_MODULE_EXPORT(Module);

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
