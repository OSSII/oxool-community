/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <string>
#include <memory>

#include <OxOOL/XMLConfig.h>

#include <Poco/Logger.h>

#define OXLOG_PROG (std::string("| ") + std::string(__FILE__) + ":" + std::to_string(__LINE__))

namespace OxOOL
{

class Logger
{
public:

    using Ptr = std::shared_ptr<OxOOL::Logger>;

    Logger() {};

    /// @brief 依據 XML config 的 <logging> 所設定的值設定 log
    /// @param config
    Logger(OxOOL::XMLConfig::Ptr config);

    virtual ~Logger();

    /// @brief 致命層級的訊息
    /// @param msg
    void FTL(const std::string& msg, const std::string& prog = "");
    /// @brief 錯誤層級的訊息
    /// @param msg
    void ERR(const std::string& msg, const std::string& prog = "");
    /// @brief 警告層級的訊息
    /// @param msg
    void WRN(const std::string& msg, const std::string& prog = "");
    /// @brief 一般訊息
    /// @param msg
    void INF(const std::string& msg, const std::string& prog = "");
    /// @brief 除錯訊息
    /// @param msg
    void DBG(const std::string& msg, const std::string& prog = "");
    /// @brief 追蹤用訊息
    /// @param msg
    void TRC(const std::string& msg, const std::string& prog = "");

private:
    /// @brief 依據訊息層級，寫入日誌
    /// @param msg
    /// @param priority
    void log(const std::string& msg, Poco::Message::Priority priority = Poco::Message::Priority::PRIO_TRACE);

    std::string maName; // Logger name
};

} // namespace OxOOL::Logger