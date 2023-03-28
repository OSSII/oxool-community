/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <string>
#include <iomanip>
#include <iostream>
#include <sstream>

#include <OxOOL/Logger.h>
#include <OxOOL/Util.h>

#include <Poco/ConsoleChannel.h>
#include <Poco/FileChannel.h>
#include <Poco/SyslogChannel.h>
#include <Poco/LogStream.h>
#include <Poco/Logger.h>
#include <Poco/AutoPtr.h>
#include <Poco/Message.h>

#include <Poco/LocalDateTime.h>

namespace OxOOL
{

Logger::~Logger()
{
    // 停止日誌紀錄
    if (!maName.empty())
    {
        INF("Stop logging.", OXLOG_PROG);
        Poco::Logger::destroy(maName);
    }
}

Logger::Logger(OxOOL::XMLConfig::Ptr config)
    : mnChannelType(None)
{
    // 未啟用日誌就結束
    if (config->getString("logging[@enable]", "false") != "true")
        return;

    // 讀取日誌名稱
    maName = config->getString("logging.name", "");
    // 沒有指定就結束
    if (maName.empty())
    {
        std::cerr << "Error! No log name specified, please view 'logging.name'" << std::endl;
        return;
    }

    // 讀取 log level
    const std::string level = config->getString("logging.level", "trace");

    Poco::Channel::Ptr channel;

    // 記錄到檔案
    if (config->getString("logging.file[@enable]", "false") == "true")
    {
        // 參考 /usr/include/Poco/FileChannel.h
        channel = static_cast<Poco::Channel*>(new Poco::FileChannel());
        for (std::size_t i = 0; ; ++i)
        {
            const std::string propKey = "logging.file.property[" + std::to_string(i) + ']';
            if (!config->has(propKey))
                break;

            const std::string name  = config->getString(propKey + "[@name]", "");
            const std::string value = config->getString(propKey, "");

            if (!name.empty())
            {
                channel->setProperty(name, value);

                // 紀錄日誌所在路徑
                if (name == "path")
                    maLogFile = value;
            }
        }

        // 沒有指定日誌檔存放路徑
        if (maLogFile.empty())
        {
            std::cerr << "Error! No log file storage path specified. "
                      << "Please see 'logging.file.property[name=path]'" << std::endl;
            return;
        }

        mnChannelType = FileChannel;
    }
    // 記錄到 syslog
    else if (config->getString("logging.syslog[@enable]", "false") == "true")
    {
        // TODO: 未完成
        // 參考 /usr/include/Poco/SyslogChannel.h
        channel = static_cast<Poco::Channel*>(new Poco::SyslogChannel(maName));

        mnChannelType = SyslogChannel;
    }
    // 否則輸出到螢幕(若是彩色輸出，請參考 /usr/include/Poco/ConsoleChannel.h)
    else
    {
        if (config->getString("logging.color", "true") == "true")
            channel = static_cast<Poco::Channel*>(new Poco::ColorConsoleChannel());
        else
            channel = static_cast<Poco::Channel*>(new Poco::ConsoleChannel());

        mnChannelType = ConsoleChannel;
    }

    channel->open();

    try
    {
        Poco::Logger& logger = Poco::Logger::create(maName, channel);
        logger.setLevel(level);
    }
    catch(Poco::ExistsException&)
    {
        Poco::Logger& logger = Poco::Logger::get(maName);
        logger.setChannel(channel);
        logger.setLevel(level);
    }
}

void Logger::FTL(const std::string& msg, const std::string& prog)
{
    log(msg + prog, Poco::Message::Priority::PRIO_FATAL);
}

void Logger::ERR(const std::string& msg, const std::string& prog)
{
    log(msg + prog, Poco::Message::Priority::PRIO_ERROR);
}

void Logger::WRN(const std::string& msg, const std::string& prog)
{
    log(msg + prog, Poco::Message::Priority::PRIO_WARNING);
}

void Logger::INF(const std::string& msg, const std::string& prog)
{
    log(msg + prog, Poco::Message::Priority::PRIO_INFORMATION);
}

void Logger::DBG(const std::string& msg, const std::string& prog)
{
    log(msg + prog, Poco::Message::Priority::PRIO_DEBUG);
}

void Logger::TRC(const std::string& msg, const std::string& prog)
{
    log(msg + prog, Poco::Message::Priority::PRIO_TRACE);
}

void Logger::log(const std::string& msg, Poco::Message::Priority priority)
{
    if (maName.empty())
        return;

    static std::map<Poco::Message::Priority, std::string> prioMap =
        {
            {Poco::Message::Priority::PRIO_FATAL, " FTL "},
            {Poco::Message::Priority::PRIO_CRITICAL, " CIL "},
            {Poco::Message::Priority::PRIO_ERROR, " ERR "},
            {Poco::Message::Priority::PRIO_WARNING, " WRN "},
            {Poco::Message::Priority::PRIO_NOTICE, " NTC "},
            {Poco::Message::Priority::PRIO_INFORMATION, " INF "},
            {Poco::Message::Priority::PRIO_DEBUG, " DBG "},
            {Poco::Message::Priority::PRIO_TRACE, " TRC "},
        };

    const auto it = prioMap.find(priority);
    const std::string prioName = it != prioMap.end() ? it->second : " UNKNOW ";

    Poco::LogStream stream(maName, priority);
    Poco::LocalDateTime time;
    int tzd = time.tzd();
    stream << time.year() << '-'
           << std::setw(2) << std::setfill('0') << time.month() << '-'
           << std::setw(2) << std::setfill('0') << time.day() << ' '
           << std::setw(2) << std::setfill('0') << time.hour() << ':'
           << std::setw(2) << std::setfill('0') << time.minute() << ':'
           << std::setw(2) << std::setfill('0') << time.second() << '.'
           << std::setw(6) << std::setfill('0') << (time.millisecond() * 1000 + time.microsecond())
           << ' ' << (tzd < 0 ? '-' : '+') << ((tzd / 36) - (tzd / 36) % 100 + ((tzd / 36) % 100) * 60 / 100)
           << prioName << msg << std::endl;

}

} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
