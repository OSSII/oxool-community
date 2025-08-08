/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * Copyright the OxOffice Online contributors.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include "Watermark.hpp"

#include <time.h>
#include <mutex>

#include <OxOOL/OxOOL.h>
#include <OxOOL/ENV.h>
#include <OxOOL/Util.h>

#include <Poco/String.h>
#include <Poco/DateTimeFormatter.h>
#include <Poco/DateTime.h>
#include <Poco/Util/Application.h>
#include <Poco/JSON/Object.h>
#include <Poco/JSON/Parser.h>

#include <wsd/ClientSession.hpp>

namespace OxOOL
{

void Watermark::initialize()
{
    loadSysWatermark();
}

void Watermark::enhanceWatermark(const std::shared_ptr<ClientSession>& clientSession)
{
    // if Lokit is not enabled enhance watermark, return
    if (!ENV::LOKitVersionInfo.has("enhanceWatermark"))
    {
        LOG_WRN("Lokit does not support enhanceWatermark");
        return;
    }

    // Parse UserExtraInfo to JSON object
    Poco::JSON::Parser parser;
    Poco::JSON::Object userExtraInfo;
    try
    {
        userExtraInfo = parser.parse(clientSession->getUserExtraInfo()).extract<Poco::JSON::Object>();
    }
    catch (const Poco::Exception& exc)
    {
        LOG_ERR("Error parsing userExtraInfo: " << exc.displayText());
    }

    // User watermark object
    Poco::JSON::Object userWatermark;
    if (userExtraInfo.has("watermark") && userExtraInfo.isObject("watermark"))
    {
        userWatermark = *userExtraInfo.getObject("watermark");
    }
    else
    {
        LOG_WRN("UserExtraInfo does not contain 'watermark' object, using empty watermark.");
    }

    // Check if userExtraInfo has ip property
    const std::string ip = userExtraInfo.optValue<std::string>("ip", "");

    // Merge system watermark with user watermark
    for (const auto& key : maSysWatermark)
    {
        if (!userWatermark.has(key.first))
            userWatermark.set(key.first, key.second);
    }

    // WOPI host specific watermark text and user watermar text is empty,
    // Use WOPI host specific watermark text.
    if (!clientSession->getWatermarkText().empty() && userWatermark.get("text").toString().empty())
    {
        userWatermark.set("text", clientSession->getWatermarkText());
        userWatermark.set("editing", true);
        userWatermark.set("printing", true);
    }

    // if text is empty, or editing/printing are false, disable watermark
    if (userWatermark.get("text").toString().empty() ||
        (!userWatermark.getValue<bool>("editing") && !userWatermark.getValue<bool>("printing")))
    {
        clientSession->setWatermarkText("");
        return;
    }

    // convert water text tags
    const std::string text = convertTags(clientSession, userWatermark.getValue<std::string>("text"), ip);
    // replace text
    userWatermark.set("text", text);
    // stringify
    const std::string watermarkJsonText = convertJsonString(userWatermark);
    // set watermark text
    clientSession->setWatermarkText(watermarkJsonText);
    // send watermark to client
    clientSession->sendTextFrame("watermark: " + watermarkJsonText);
}

// Private meythods -----------------------------------------------------------
void Watermark::loadSysWatermark()
{
    const std::vector<std::array<std::string, 3>> keyMap =
    {
        {"editing", "bool", "false"},
        {"printing", "bool", "false"},
        {"text", "string", ""},
        {"opacity", "double", "0.2"},
        {"angle", "int", "45"},
        {"familyname", "string", "Liberation Sans"},
        {"color", "string", "#000000"},
        {"bold", "bool", "false"},
        {"italic", "bool", "false"},
        {"relief", "string", ""},
        {"outline", "bool", "false"},
        {"shadow", "bool", "false"}
    };

    const auto& config = Poco::Util::Application::instance().config();

    maSysWatermark.clear(); // Clear the object

    for (const auto& key : keyMap)
    {
        // key[0] - key name
        // key[1] - type
        // key[2] - default value
        const std::string nodeName = "watermark." + key[0];
        try
        {
            if (key[1] == "bool")
                maSysWatermark.set(key[0], config.getBool(nodeName, Util::stringToBool(key[2])));
            else if (key[1] == "double")
                maSysWatermark.set(key[0], config.getDouble(nodeName, std::stod(key[2])));
            else if (key[1] == "int")
                maSysWatermark.set(key[0], config.getInt(nodeName, std::stoi(key[2])));
            else if (key[1] == "string" || key[1].empty())
                maSysWatermark.set(key[0], config.getString(nodeName, key[2]));
            else
                throw std::runtime_error("Unknown type: " + key[1]);
        }
        catch(const std::exception& e)
        {
            LOG_WRN("Error reading '" << nodeName << "': " << e.what()
                    << ". Using default value: " << key[2]);

            if (key[1] == "bool")
                maSysWatermark.set(key[0], Util::stringToBool(key[2]));
            else if (key[1] == "double")
                maSysWatermark.set(key[0], std::stod(key[2]));
            else if (key[1] == "uint")
                maSysWatermark.set(key[0], std::stoul(key[2]));
            else
                maSysWatermark.set(key[0], key[2]);
        }
    }

    // Check if watermark text is empty
    if (maSysWatermark.get("text").toString().empty())
    {
        maSysWatermark.set("editing", false);
        maSysWatermark.set("printing", false);
    }

    LOG_INF("System watermark: " << convertJsonString(maSysWatermark));
}

std::string Watermark::convertJsonString(const Poco::JSON::Object& obj)
{
    std::ostringstream oss;
    obj.stringify(oss);
    return oss.str();
}

long int Watermark::getTimezoneOffset(const std::string& timezone)
{
    // Check if timezone is empty
    if (timezone.empty())
        return 0;

    // Check if in cache
    if (maTimezoneOffset.find(timezone) == maTimezoneOffset.end())
    {
        std::lock_guard<std::mutex> lock(maTimezoneMutex);
        const char* savedTimezone = std::getenv("TZ");
        setenv("TZ", timezone.c_str(), 1);

        tzset();
        time_t now = time(NULL);
        struct tm local_tm = *localtime(&now);

        maTimezoneOffset[timezone] = local_tm.tm_gmtoff;

        // restore TZ
        if (savedTimezone)
            setenv("TZ", savedTimezone, 1);
        else
            unsetenv("TZ");
    }

    return maTimezoneOffset[timezone];
}

std::string Watermark::convertTags(const std::shared_ptr<ClientSession>& clientSession,
                                   const std::string& text, const std::string& userIP)
{
    std::string retString = text;

    const std::string& timezone = clientSession->getTimezone();
    long int timezoneOffset = getTimezoneOffset(timezone);

    // System time plus timezone offset to get client time
    Poco::DateTime clientDateTime(Poco::Timestamp() + Poco::Timespan(timezoneOffset, 0));

    // Convert ${id} to user id
    Poco::replaceInPlace(retString, std::string("${id}"), clientSession->getUserId());
    // Convert ${name} to user name
    Poco::replaceInPlace(retString, std::string("${name}"), clientSession->getUserName());
    // Convert ${timezone} to user timezone
    Poco::replaceInPlace(retString, std::string("${timezone}"), timezone);

    // if userIP is empty, use client address
    std::string ip = userIP.empty() ? clientSession->getClientAddress() : userIP;
    // strip ipv6 prefix
    if (ip.find("::ffff:") == 0)
        ip = ip.substr(7);
    else if (ip == "::1")
        ip = "127.0.0.1";

    // Convert ${ip} to user ip
    Poco::replaceInPlace(retString, std::string("${ip}"), ip);

    // Convert to client date with dash separator
    Poco::replaceInPlace(retString, std::string("${yyyy-mm-dd}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%Y-%n-%e"));
    Poco::replaceInPlace(retString, std::string("${mm-dd-yyyy}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%n-%e-%Y"));
    Poco::replaceInPlace(retString, std::string("${dd-mm-yyyy}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%e-%n-%Y"));

    // Convert to client date with slash separator
    Poco::replaceInPlace(retString, std::string("${yyyy/mm/dd}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%Y/%n/%e"));
    Poco::replaceInPlace(retString, std::string("${mm/dd/yyyy}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%n/%e/%Y"));
    Poco::replaceInPlace(retString, std::string("${dd/mm/yyyy}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%e/%n/%Y"));

    // Convert to client date with dot separator
    Poco::replaceInPlace(retString, std::string("${yyyy.mm.dd}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%Y.%n.%e"));
    Poco::replaceInPlace(retString, std::string("${mm.dd.yyyy}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%n.%e.%Y"));
    Poco::replaceInPlace(retString, std::string("${dd.mm.yyyy}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%e.%n.%Y"));

    // Convert ${time} to client time with 24-hour format
    Poco::replaceInPlace(retString, std::string("${time}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%H:%M"));
    // Convert ${ampm} to client time with am/pm
    Poco::replaceInPlace(retString, std::string("${ampm}"),
                         Poco::DateTimeFormatter::format(clientDateTime, "%h:%M %a"));

    return retString;
}

} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
