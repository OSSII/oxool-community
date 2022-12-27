/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <config.h>
#include <Common.hpp>

namespace Common
{


/// The HTTP request User-Agent. Used only in Requests.
const std::string& getHttpAgentString()
{
    static std::string agentString = "LOOLWSD HTTP Agent " LOOLWSD_VERSION;
    return agentString;
}

/// The WOPI User-Agent. Depricated: use getHttpAgentString()
const std::string& getWopiAgentString()
{
    static std::string wopiString = "LOOLWSD WOPI Agent " LOOLWSD_VERSION;
    return wopiString;
}

/// The HTTP response Server. Used only in Responses.
const std::string& getHttpServerString()
{
    static std::string serverString = "LOOLWSD HTTP Server " LOOLWSD_VERSION;
    return serverString;
}

} // namespace Common

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
