/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>
#include <OxOOL/ConvertBroker.h>
#include <OxOOL/Module/Base.h>

#include <string>
#include <map>
#include <vector>
#include <chrono>
#include <memory>
#include <thread>
#include <mutex>

#include <Poco/Net/HTTPRequest.h>
#include <Poco/Net/HTTPResponse.h>
#include <Poco/JSON/Object.h>

#include <net/Socket.hpp>
#include <net/WebSocketHandler.hpp>
#include <wsd/RequestDetails.hpp>
#include <wsd/Admin.hpp>

namespace OxOOL
{

/// @brief 處理模組 client 的 Websocket 請求和回覆
class ModuleAdminSocketHandler : public WebSocketHandler
{
public:
    ModuleAdminSocketHandler(const OxOOL::Module::Ptr& module,
                             const std::weak_ptr<StreamSocket>& socket,
                             const Poco::Net::HTTPRequest& request);

    /// @brief 處理模組後臺管理 Web socket 請求
    /// @param moduleName 模組名稱
    /// @param socket
    /// @param request
    /// @return true if we should give this socket to the Module manager poll.
    static bool handleInitialRequest(const std::string& moduleName,
                                     const std::weak_ptr<StreamSocket> &socket,
                                     const Poco::Net::HTTPRequest& request);

    /// @brief 處理收到的 web socket 訊息，並傳送給模組處理
    /// @param data
    void handleMessage(const std::vector<char> &data) override;

private:
    /// @brief 送出文字給已認證過的 client.
    /// @param message 文字訊息
    /// @param flush The data will be sent out immediately, the default is false.
    void sendTextFrame(const std::string& message, bool flush = false);

    /// @brief  取得模組詳細資訊
    /// @return JSON 字串
    std::string getModuleInfoJson();

private:
    /// @brief 模組 Class
    OxOOL::Module::Ptr mpModule;
    /// @brief 是否已認證過
    bool mbIsAuthenticated;
};

class ModuleAgent : public SocketPoll
{

public:
    ModuleAgent(const std::string& threadName);

    ~ModuleAgent() {}

    static int AgentTimeoutMicroS;

    void handleRequest(OxOOL::Module::Ptr module,
                       const Poco::Net::HTTPRequest& request,
                       SocketDisposition& disposition);

    void pollingThread() override;

    bool isIdle() const { return isAlive() && !isBusy(); }

private:
    /// @brief 從執行緒代理請求
    void startRunning();

    /// @brief 代理請求結束
    void stopRunning();

    /// @brief 設定是否忙碌旗標
    /// @param onOff
    void setBusy(bool onOff) { mbBusy = onOff; }

    /// @brief 是否忙碌
    /// @return true: 是
    bool isBusy() const { return mbBusy; }

    /// @brief 設定模組是否執行中
    /// @param onOff
    void setModuleRunning(bool onOff) { mbModuleRunning = onOff; }

    /// @brief 模組是否正在執行
    /// @return true: 是
    bool isModuleRunning() const { return mbModuleRunning; }

    /// @brief 清除最近代理的資料，並恢復閒置狀態
    void purge();

    /// @brief 最近閒置時間
    std::chrono::steady_clock::time_point mpLastIdleTime;

    /// @brief 與 Client 的 socket
    std::shared_ptr<StreamSocket> mpSavedSocket;

    /// @brief 要代理的模組
    OxOOL::Module::Ptr mpSavedModule;
    /// @brief HTTP Request
    Poco::Net::HTTPRequest mRequest;

    /// @brief 是否正在代理請求
    std::atomic<bool> mbBusy;
    /// @brief 模組正在處理代理送去的請求
    std::atomic<bool> mbModuleRunning;
};

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

    void start() { startThread(); }

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

    /// @brief 取得指定名稱的模組
    /// @param moduleName - 模組名稱
    /// @return nullptr: 不存在，否則爲模組 class
    OxOOL::Module::Ptr getModuleByName(const std::string& moduleName);

    /// @brief 模組檔案是否已載入過
    /// @param moduleFile - 檔案完整路徑
    /// @return true: 載入過
    bool alreadyLoaded(const std::string& moduleFile);

    /// @brief 傳遞 request 給相應的模組處理
    /// @param request
    /// @param RequestDetails
    /// @param disposition
    /// @return true: request 已被某個模組處理
    bool handleRequest(const Poco::Net::HTTPRequest& request,
                       const RequestDetails& requestDetails,
                       SocketDisposition& disposition);

    // 建立 Convert broker
    std::shared_ptr<ConvertBroker>
    createConvertBroker(const std::string& fromFile,
                        const std::string& toFormat,
                        const std::string& saveAsOptions = std::string());

    /// @brief 清理用完的 Document Brokers
    void cleanupDocBrokers();

    /// @brief 清理已經不工作的 agents (代理執行緒一旦超時，就會結束執行緒，並觸發這個函式)
    void cleanupDeadAgents();

    /// @brief 取得所有模組詳細資訊列表
    /// @return
    const std::vector<OxOOL::Module::Detail> getAllModuleDetails() const;

    /// @brief 取得有後臺管理的模組資訊列表
    /// @return
    const std::vector<Poco::JSON::Object> getAdminModuleDetailsJson() const;

    /// @brief 是否有載入任何模組
    /// @return
    bool empty() const { return mpModules.empty(); }

    /// @brief 載入模組的數量
    /// @return
    std::size_t size() const { return mpModules.size(); }

    /// @brief 列出所有的模組
    void dump();

private:
    /// @brief 遞迴尋找指定檔名的模組
    /// @param path 指定的目錄
    /// @param name 模組名稱
    /// @return 該檔案所在的完整路徑含檔名
    std::string findModule(const std::string& path, const std::string& name);

    /// @brief 載入模組
    /// @param moduleFile 模組檔案(.so)完整路徑
    /// @return nullptr - fail
    OxOOL::Module::Ptr loadModule(const std::string& moduleFile);

    OxOOL::Module::Ptr handleByModule(const RequestDetails& requestDetails);

private:
    /// @brief key: module file, value: module class
    std::map<std::string, OxOOL::Module::Ptr> mpModules;

    std::mutex mAgentsMutex;
    std::vector<std::shared_ptr<ModuleAgent>> mpAgentsPool;

    std::mutex mBrokersMutex;
    std::map<std::string, std::shared_ptr<DocumentBroker>> mpDocBrokers;
};

} // namespace OxOOL
