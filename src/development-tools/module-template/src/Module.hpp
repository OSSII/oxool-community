/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <memory>
#include <string>

#include <OxOOL/Module/Base.h>

namespace Poco { namespace Net{ class HTTPRequest; }}
class RequestDetails;
class Socket;

class Module : public OxOOL::Module::Base
{
public:
    /// @brief Module constructor.
    Module();

    /// Module deconstructor.
    virtual ~Module();

    /// @brief 模組載入完畢後，初始化工作，只會在載入完畢後呼叫一次
    /// After the module is loaded, the initialization work will only be called once after
    /// the module is loaded.
    void initialize() override;

    /// @brief 處理前端 Client 的請求
    /// Handle requests from the front-end Client.
    void handleRequest(const Poco::Net::HTTPRequest& request,
                       const RequestDetails& requestDetails,
                       const std::shared_ptr<StreamSocket>& socket) override;

#if ENABLE_ADMIN
    /// @brief 處理控制臺 Client 的請求(沒有後臺管理，或不想自己管理，請直接移除)
    /// If there is no admin management, or if you don't want to manage it yourself,
    /// you can remove this code.
    void handleAdminRequest(const Poco::Net::HTTPRequest& request,
                            const RequestDetails& requestDetails,
                            const std::shared_ptr<StreamSocket>& socket) override;

    /// @brief 處理控制臺 Websocket 的訊息(沒有後臺管理請直接移除)
    /// Without admin management, this code can be removed.
    std::string handleAdminMessage(const StringVector& tokens) override;
#endif
};

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
