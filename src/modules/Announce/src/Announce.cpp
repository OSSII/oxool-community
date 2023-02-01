/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
  * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <OxOOL/HttpHelper.h>
#include <OxOOL/Module/Base.h>

#include <common/Util.hpp>
#include <net/NetUtil.hpp>
#include <wsd/HostUtil.hpp>

class Announce : public OxOOL::Module::Base
{
public:
    void handleRequest(const Poco::Net::HTTPRequest& request,
                       const RequestDetails& /* requestDetails */,
                       const std::shared_ptr<StreamSocket>& socket) override
    {
        Poco::Net::HTTPResponse::HTTPStatus statusCode = Poco::Net::HTTPResponse::HTTP_OK;

        // 檢查是否來自 WOPI host
        std::string clentAddress = socket->clientAddress();
        if (Util::startsWith(clentAddress, "::ffff:"))
            clentAddress = clentAddress.substr(7);
        else if (clentAddress == "::1")
            clentAddress = "127.0.0.1";

        // 非允許的 WOPI 主機，送出 403
        if (!HostUtil::allowedWopiHost(clentAddress) && !net::isLocalhost(clentAddress))
            statusCode = Poco::Net::HTTPResponse::HTTP_FORBIDDEN;
        // 只接受 POST
        else if (!OxOOL::HttpHelper::isPOST(request))
            statusCode = Poco::Net::HTTPResponse::HTTP_METHOD_NOT_ALLOWED;
        // 必須指定內容形態為 "application/json"
        else if (request.getContentType() != "application/json")
            statusCode = Poco::Net::HTTPResponse::HTTP_BAD_REQUEST;
        else
        {
            Poco::MemoryInputStream message(&socket->getInBuffer()[0], socket->getInBuffer().size());
            std::istream &iss(message);
            std::string announce("announce: ");
            std::string line;
            while (!iss.eof())
            {
                std::getline(iss, line);
                announce += line;
            }
            Util::alertAllUsers(announce);
            OxOOL::HttpHelper::sendResponseAndShutdown(socket);
            return;
        }

        OxOOL::HttpHelper::sendErrorAndShutdown(statusCode, socket);
    }
};

OXOOL_MODULE_EXPORT(Announce);

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
