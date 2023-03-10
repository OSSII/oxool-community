/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <config.h>

#include <string>
#include <iostream>

#include <OxOOL/Module/Map.h>
#include <OxOOL/HttpHelper.h>

#include <Poco/URI.h>

namespace OxOOL::Module
{

Map::Map()
{
}

Map::~Map()
{
}

Map::Map(const std::string& serviceURI)
    : maServiceURI(serviceURI)
{
}

void Map::setServiceURI(const std::string& serviceURI)
{
    maServiceURI = serviceURI;
}

void Map::set(const std::string& uri, RequestMethod allowedMethods, Callback callback)
{
    // 第一的字元不是 '/' 就補上
    const std::string subURI = *uri.begin() == '/' ? uri : ('/' + uri);
    mpUriMap[subURI] = std::make_pair(allowedMethods, callback);
}

bool Map::handled(const Poco::Net::HTTPRequest& request,
                  const std::shared_ptr<StreamSocket>& socket)
{
    // 不含查詢字串的實際請求位址
    const std::string requestURI = Poco::URI(request.getURI()).getPath();

    // 去掉前導 maServiceURI 的請求位址
    // NOTE: 這裡的 maServiceURI 就是模組的 serviceURI，且最後一定是 '/' 結尾
    const std::string realRequestURI = maServiceURI.length() >= requestURI.length()
                               ? "/" : requestURI.substr(maServiceURI.length() - 1);

    // 依序找出是哪個程序要處理
    std::string hitURI;
    for (auto it : mpUriMap)
    {
        // 取得欲比對的 URI
        const std::string subURI = it.first;

        // 兩種情況下，subURI 與 realRequestURI 需完全相等
        // 1. 登記的 URI 是 '/' 根目錄
        // 2. 登記的 URI 是 endpoint 格式
        if (subURI == "/" || *subURI.rbegin() != '/')
        {
            // subURI 與 realRequestURI 需完全相等
            if (subURI == realRequestURI)
            {
                hitURI = subURI;
                break;
            }
        }
        else // 登記的 URI 可以為 "/endpoint" or "/endpoint/"
        {
            std::string endpoint(subURI);
            endpoint.pop_back(); // 移除最後的 '/' 字元，轉成 /endpoint

            // 位址列開始爲 "/endpoint/" 或等於 "/endpoint"，視為正確位址
            if ((realRequestURI == endpoint || realRequestURI.find(subURI, 0) == 0) && subURI.length() > hitURI.length())
                hitURI = subURI;
        }
    }

    // 找到符合的 URI
    if (!hitURI.empty())
    {
        auto hitMap = mpUriMap.find(hitURI);
        std::size_t allowedMethods = hitMap->second.first;
        // 只是 HEAD 就不需實際執行 callback，簡單回應 200 OK
        if (OxOOL::HttpHelper::isHEAD(request))
        {
            OxOOL::HttpHelper::sendResponseAndShutdown(socket);
            return true;
        }

        Callback callback = hitMap->second.second;

        // 檢查 request method
        std::size_t checkMethod = 0;
        if (OxOOL::HttpHelper::isGET(request))
            checkMethod = GET;
        else if (OxOOL::HttpHelper::isPOST(request))
            checkMethod = POST;
        else if (OxOOL::HttpHelper::isPUT(request))
            checkMethod = PUT;
        else if (OxOOL::HttpHelper::isDELETE(request))
            checkMethod = DELETE;
        else if (OxOOL::HttpHelper::isPATCH(request))
            checkMethod = PATCH;
        else if (OxOOL::HttpHelper::isOPTIONS(request))
            checkMethod = OPTIONS;

        // 方法允許，執行 callback
        if (allowedMethods & checkMethod)
            callback(request, socket);
        else // 傳回 405 Method Not Allowed
            OxOOL::HttpHelper::sendErrorAndShutdown(
                Poco::Net::HTTPResponse::HTTP_METHOD_NOT_ALLOWED, socket);

        return true;
    }

    return false;
}

void Map::dump()
{
    std::cout << "Map size: " << mpUriMap.size() << std::endl;
    for (auto it : mpUriMap)
    {
        std::cout << "\tSub uri : " << it.first << std::endl;
    }
}

}
/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
