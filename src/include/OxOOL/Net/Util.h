/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <string>

namespace Poco::Net { class HTTPRequest; }
namespace OxOOL::Util { class RegexListMatcher; }

namespace OxOOL::Net::Util
{
/// @brief 檢查 IP address 是否在允許的主機列表中
/// @param ipAddress
/// @param request
/// @param hostList
/// @return Returns true if allowed.
bool allowedHost(const std::string& ipAddress,
                 const Poco::Net::HTTPRequest& request,
                 const OxOOL::Util::RegexListMatcher& hostList);

} // OxOOL::Net::Util

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
