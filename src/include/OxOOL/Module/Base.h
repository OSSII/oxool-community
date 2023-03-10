/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once
#include <OxOOL/OxOOL.h>
#include <OxOOL/XMLConfig.h>

#include <memory>

#include <Poco/Net/HTTPRequest.h>
#include <Poco/MemoryStream.h>
#include <Poco/JSON/Object.h>

#define MODULE_METHOD_IS_ABSTRACT "@OxOOL::Module::Base"

class StringVector;
class StreamSocket;

namespace OxOOL
{

class ModuleManager;

namespace Module
{

struct Detail
{
    std::string name;
    std::string serviceURI;
    std::string version;
    std::string summary;
    std::string author;
    std::string license;
    std::string description;
    bool adminPrivilege = false;
    std::string adminServiceURI; // 後臺管理位址
    std::string adminIcon; // 顯示在後臺的選項 icon(名稱請參閱 https://icons.getbootstrap.com/)
    std::string adminItem; // 顯示在後臺的選項名稱
};

class Base
{
public:
    Base() {}
    virtual ~Base() {}

    friend class OxOOL::ModuleManager;

    const Detail& getDetail() const { return mDetail; }

    /// @brief 以 JSON 格式傳回模組詳細資訊
    /// @return Poco::JSON::Object::Ptr
    Poco::JSON::Object::Ptr getAdminDetailJson(const std::string& langTag = std::string());

    /// @brief 傳回模組配置檔(XML)的位置
    /// @return
    const std::string& getConfigFile() const { return maConfigFile; }

    /// @brief 傳回操作配置檔的物件
    /// @return
    OxOOL::XMLConfig::Ptr getConfig();

    /// @brief 傳回模組在本機所在的絕對路徑
    /// @return
    const std::string& getDocumentRoot() const { return maRootPath; }

    /// @brief 請求是否是本模組處理
    /// @param request
    /// @return true 該要求屬於這個模組處理
    bool isService(const Poco::Net::HTTPRequest& request) const;

    /// @brief 請求是否是本模組的管理介面處理
    /// @param request
    /// @return true 該要求屬於這個模組的管理介面處理
    bool isAdminService(const Poco::Net::HTTPRequest& request) const;

    /// @brief 需要管理員身份驗證
    /// @param request
    /// @param socket
    /// @param callByAdmin true 一定要檢查，預設 false，
    /// @return true: 是， false:不需要或已驗證通過
    bool needAdminAuthenticate(const Poco::Net::HTTPRequest& request,
                               const std::shared_ptr<StreamSocket>& socket,
                               const bool callByAdmin = false);
public:

    /// @brief 模組載入完畢後，初始化工作，只會在載入完畢後呼叫一次
    virtual void initialize() {}

    /// @brief 處理前端 Client 的請求
    ///        Handle requests from the front-end Client.
    /// @param request
    /// @param socket
    virtual void handleRequest(const Poco::Net::HTTPRequest& request,
                               const std::shared_ptr<StreamSocket>& socket);

    /// @brief 處理控制臺 Client 的請求
    /// @param request
    /// @param socket
    virtual void handleAdminRequest(const Poco::Net::HTTPRequest& request,
                                    const std::shared_ptr<StreamSocket>& socket);

    /// @brief 處理控制臺 Websocket 的訊息
    /// @param tokens
    /// @return
    virtual std::string handleAdminMessage(const StringVector& tokens);

protected:
    /// @brief 回傳 "[module name]" 字串，方便給模組 LOG 用
    /// @return "[XXXXXXX]"
    std::string logTitle() const { return "[" + mDetail.name + "] "; }

    /// @brief 解析模組實際請求位址
    /// @param request
    /// @return 實際的請求位址
    std::string parseRealURI(const Poco::Net::HTTPRequest& request) const;

    /// @brief 傳送檔案
    /// @param requestFile
    /// @param request
    /// @param socket
    void sendFile(const std::string& requestFile,
                  const Poco::Net::HTTPRequest& request,
                  const std::shared_ptr<StreamSocket>& socket,
                  const bool callByAdmin = false);

    void preprocessAdminFile(const std::string& adminFile,
                             const Poco::Net::HTTPRequest& request,
                             const std::shared_ptr<StreamSocket>& socket);

private:
    Detail mDetail;
    std::string maConfigFile; // 模組的配置檔
    std::string maRootPath; // 模組文件絕對路徑
};

typedef std::shared_ptr<Base> Ptr;

} // namespace Module
} // namespace OxOOL

// Define a pointer type to the entry point.
typedef OxOOL::Module::Ptr (*OxOOLModuleEntry)();

#define OXOOL_MODULE_ENTRY_SYMBOL "oxoolModuleInfo"
#define OXOOL_MODULE_ENTRY_FUNC oxoolModuleInfo()

#define OXOOL_MODULE_EXPORT(ClassName) \
    extern "C" OxOOL::Module::Ptr OXOOL_MODULE_ENTRY_FUNC { return std::make_shared<ClassName>(); }

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */