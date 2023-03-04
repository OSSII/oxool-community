/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <OxOOL/HttpHelper.h>
#include <OxOOL/Module/Base.h>

#include <net/Socket.hpp>

class Alive : public OxOOL::Module::Base
{
public:
    void handleRequest(const Poco::Net::HTTPRequest& request,
                       const std::shared_ptr<StreamSocket>& socket) override
    {
        OxOOL::HttpHelper::sendResponseAndShutdown(
            socket, request.getMethod() == "HEAD" ? "" : "OK");
    }
};

OXOOL_MODULE_EXPORT(Alive);

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */