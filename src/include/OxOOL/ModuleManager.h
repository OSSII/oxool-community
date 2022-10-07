/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>
#include <OxOOL/Module/Base.h>

#include <string>
#include <memory>

namespace Poco
{
class MemoryInputStream;
namespace Net
{
class HTTPReques;
}
} // namespace Poco

class RequestDetails;
class StreamSocket;

namespace OxOOL
{

class ModuleManager : public SocketPoll
{
    ModuleManager(const ModuleManager &) = delete;
    ModuleManager& operator = (const ModuleManager &) = delete;
    ModuleManager();

public:
    virtual ~ModuleManager() {}

    static ModuleManager& instance()
    {
        static ModuleManager mModuleManager;
        return mModuleManager;
    }

    void start() { SocketPoll::startThread(); }

    void pollingThread() override;

    /// @brief 遞迴載入指定目錄下所有副檔名爲 .xml 的模組
    /// @param modulePath
    void loadModulesFromDirectory(const std::string& modulePath, const std::string& type = "xml");

    /// @brief 載入模組組態檔
    /// @param moduleFile 模組檔案(.xml)完整路徑
    /// @return true: 成功
    bool loadModuleConfig(const std::string& configFile);

    /// @brief 以模組名稱查詢模組是否已經存在
    /// @param moduleName - 模組名稱
    /// @return true: 已存在, false: 不存在
    bool hasModule(const std::string& moduleName);

    /// @brief 模組檔案是否已載入過
    /// @param moduleFile - 檔案完整路徑
    /// @return true: 載入過
    bool alreadyLoaded(const std::string& moduleFile);

    /// @brief 傳遞 request 給相應的模組處理
    /// @param requestDetails
    /// @param request
    /// @param message
    /// @param socket
    /// @return true: request 已被某個模組處理
    bool handleRequest(const RequestDetails& requestDetails,
                       const Poco::Net::HTTPRequest& request,
                       SocketDisposition& disposition);

    std::string handleAdminMessage(const std::string& moduleName, const std::string& message);

    /// @brief 取得所有模組詳細資訊
    /// @return
    const std::vector<OxOOL::Module::Detail> getAllModuleDetails() const;

    bool empty() const { return mpModules.empty(); }

    std::size_t size() const { return mpModules.size(); }

    void dump();

private:
    std::string findModule(const std::string& path, const std::string& name);

    /// @brief 載入模組
    /// @param moduleFile 模組檔案(.so)完整路徑
    /// @return nullptr - fail
    OxOOL::Module::Ptr loadModule(const std::string& moduleFile);

    OxOOL::Module::Ptr handleByModule(const RequestDetails& requestDetails);

private:
    /// @brief key: module file, value: module class
    std::map<std::string, OxOOL::Module::Ptr> mpModules;
};

} // namespace OxOOL
