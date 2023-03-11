/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <map>
#include <memory>
#include <string>
#include <functional>

namespace Poco::Net
{
    class HTTPRequest;
} // namespace Poco::Net

class StreamSocket;

/**
 * @brief 模組用的 URI Map，用於簡化模組設計
 * 可爲 uri 指定執行 class method，並在執行前，檢查 HTTP method 是否適用
 */

// 簡化 callback 定義
#define CALLBACK(FUNCTION) std::bind(FUNCTION, this, std::placeholders::_1, std::placeholders::_2)

namespace OxOOL::Module
{

class Map
{
public:
    using Callback = std::function<void(const Poco::Net::HTTPRequest& request,
                                        const std::shared_ptr<StreamSocket>& socket)>;

    enum RequestMethod
    {
        ANY     =  0,
        GET     =  1,
        POST    =  2,
        PUT     =  4,
        DELETE  =  8,
        PATCH   = 16,
        OPTIONS = 32
    };

    Map();

    Map(const std::string& serviceURI);

    virtual ~Map();

    /// @brief 設定 service URI
    /// @param serviceURI
    void setServiceURI(const std::string& serviceURI);

    /// @brief 設定 URI 接受 request 的方法，以及執行的 method
    /// @param uri - 去掉 serviceURI 後剩餘的 URI，需以 '/' 開頭
    /// @param allowedMethods - RequestMethod 所列舉項目，可多項，例如 GET | POST
    /// @param callback - 指定的 class method，可用簡化定義描述，例如 CALLBACK(&ClassName::MethodName)
    void set(const std::string& uri, std::size_t allowedMethods, Callback callback);

    /// @brief 分析請求的 URI，交給對應的程序處理
    /// @param request
    /// @param socket
    /// @return true - 已被某個 uri 指定的 method 處理了
    bool handled(const Poco::Net::HTTPRequest& request,
                 const std::shared_ptr<StreamSocket>& socket);

    /// @brief Dump map information
    void dump();

private:
    /// @brief
    std::string maServiceURI;
    std::map<std::string, std::pair<std::size_t, Callback>> mpUriMap;
};

} // namespace OxOOL::Module

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */

