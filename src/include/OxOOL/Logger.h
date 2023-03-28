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

    /// @brief 日誌類型
    enum Type
    {
        None = 0,       // 無(可能有問題)
        FileChannel,    // 檔案型日誌
        SyslogChannel,  // 利用 syslog 紀錄
        ConsoleChannel  // 日誌內容輸出到螢幕
    };

    Logger() : mnChannelType(None) {};

    /// @brief 依據 XML config 的 <logging> 所設定的值設定 log
    /// @param config
    Logger(OxOOL::XMLConfig::Ptr config);

    virtual ~Logger();

    /// @brief 是否使用日誌檔案
    /// Whether to use log files.
    /// @return true - yes
    bool isFileChannel() const { return mnChannelType == FileChannel; }

    /// @brief 日誌檔案所在絕對路徑
    /// The absolute path where the log file is located.
    /// @return path
    const std::string& logFilePath() const { return maLogFile; }

    /// @brief 是否使用 syslog 日誌
    /// Whether to use syslog logging.
    /// @return true - yes
    bool isSyslogChannel() const { return mnChannelType == SyslogChannel; }

    /// @brief 是否使用螢幕輸出日誌
    /// Whether to use screen output log.
    /// @return true - yes
    bool isConsoleChannel() const { return mnChannelType == ConsoleChannel; }

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

    /// @brief 日誌類型
    int mnChannelType;

    /// @brief Logger name
    std::string maName;

    /// @brief 檔案型日誌的絕對路徑檔名
    std::string maLogFile;
};

} // namespace OxOOL