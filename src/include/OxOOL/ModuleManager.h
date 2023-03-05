/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <string>
#include <vector>

#include <OxOOL/Module/Base.h>

#include <net/Socket.hpp>

namespace Poco
{
namespace Net
{
    class HTTPRequest;
} // namespace Net
} // namespace Poco

namespace OxOOL
{

class ModuleManager : public SocketPoll
{
    ModuleManager(const ModuleManager &) = delete;
    ModuleManager& operator = (const ModuleManager &) = delete;
    ModuleManager();

public:
    virtual ~ModuleManager();

    static ModuleManager& instance()
    {
        static ModuleManager mModuleManager;
        return mModuleManager;
    }

    void start() { startThread(); }
    void stop() { joinThread(); }

    void pollingThread() override;

    /// @brief 遞迴載入指定目錄下所有副檔名爲 .xml 的模組
    /// @param modulePath
    void loadModulesFromDirectory(const std::string& configPath);

    /// @brief 載入模組組態檔
    /// @param configFile 模組設定檔(.xml)絕對路徑
    /// @param userModuleFile 強制搭配的模組當檔案絕對路徑
    /// @return true: 成功
    bool loadModuleConfig(const std::string& configFile,
                          const std::string& userLibraryPath = std::string());

    /// @brief 以模組名稱查詢模組是否已經存在
    /// @param moduleName - 模組名稱
    /// @return true: 已存在, false: 不存在
    bool hasModule(const std::string& moduleName);

    /// @brief 以 xml config 絕對路徑，取得模組物件
    /// @param configFile
    /// @return nullptr: 不存在，否則爲模組 class
    OxOOL::Module::Ptr getModuleByConfigFile(const std::string& configFile);

    /// @brief 取得指定名稱的模組
    /// @param moduleName - 模組名稱
    /// @return nullptr: 不存在，否則爲模組 class
    OxOOL::Module::Ptr getModuleByName(const std::string& moduleName);

    /// @brief 傳遞 request 給相應的模組處理
    /// @param request
    /// @param disposition
    /// @return true: request 已被某個模組處理
    bool handleRequest(const Poco::Net::HTTPRequest& request,
                       SocketDisposition& disposition);

    /// @brief 處理模組後臺管理 Web socket 請求
    /// @param moduleName 模組名稱
    /// @param socket
    /// @param request
    /// @return true if we should give this socket to the Module manager poll.
    bool handleAdminWebsocketRequest(const std::string& moduleName,
                                     const std::weak_ptr<StreamSocket> &socket,
                                     const Poco::Net::HTTPRequest& request);

    /// @brief 清理已經不工作的 agents (代理執行緒一旦超時，就會結束執行緒，並觸發這個函式)
    void cleanupDeadAgents();

    /// @brief 取得所有模組詳細資訊列表
    /// @return
    const std::vector<OxOOL::Module::Detail> getAllModuleDetails() const;

    /// @brief 取得有後臺管理的模組資訊列表
    std::string getAdminModuleDetailsJsonString(const std::string& langTag) const;

    /// @brief 列出所有的模組
    void dump();

private:
    OxOOL::Module::Ptr handleByModule(const Poco::Net::HTTPRequest& request);
};

} // namespace OxOOL
