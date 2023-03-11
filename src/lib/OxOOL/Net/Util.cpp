/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <string>

#include <Poco/StringTokenizer.h>
#include <Poco/Net/DNS.h>
#include <Poco/Net/HTTPRequest.h>

#include <OxOOL/Util.h>
#include <OxOOL/Net/Util.h>

namespace OxOOL::Net::Util
{

bool allowedHost(const std::string& ipAddress,
                 const Poco::Net::HTTPRequest& request,
                 const OxOOL::Util::RegexListMatcher& hostList)
{
    // 1.是否該 IP 在列表中
    bool allow = hostList.match(ipAddress);
    // 2.IP 不在允許的列表中，再檢查主機名稱是否在列表中
    if (!allow)
    {
        try
        {
            // 反查該 IP 的主機名稱
            const std::string hostToCheck = Poco::Net::DNS::resolve(ipAddress).name();
            // 是否該主機名稱在列表中
            allow = hostList.match(hostToCheck);
        }
        catch(const Poco::Exception& exc)
        {
            // 無法解析主機名稱
        }

        // 3. 仍然沒有的話，從 X-Forwarded-For 取得來源 IP
        if (!allow && request.has("X-Forwarded-For"))
        {
            const std::string fowardedData = request.get("X-Forwarded-For");
            Poco::StringTokenizer tokens(fowardedData, ",",
                 Poco::StringTokenizer::TOK_IGNORE_EMPTY|Poco::StringTokenizer::TOK_TRIM);

            if (tokens.count() > 0)
            {
                // 第一個是 client 的 IP，其後的都是 proxy ip
                const std::string addressToCheck = tokens[0];

                allow = hostList.match(addressToCheck);
                if (!allow)
                {
                    try
                    {
                        const std::string hostToCheck = Poco::Net::DNS::resolve(addressToCheck).name();
                        allow = hostList.match(hostToCheck);
                    }
                    catch (const Poco::Exception& exc)
                    {
                        // 無法解析主機名稱
                    }
                }
            }
        }
    }

    return allow;
}

} // namespace OxOOL::Net::Util

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
