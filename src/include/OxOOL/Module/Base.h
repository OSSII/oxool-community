
// Base.h
//
// Library: OxOOL
//
// Definition of the Module class interface.
//
// Copyright (c) 2022, OSS Integeral Institute Co Ltd.
// and Contributors.
//

#pragma once
#include <OxOOL/OxOOL.h>

#include <memory>

#include <Poco/Net/HTTPRequest.h>
#include <Poco/MemoryStream.h>
#include <Poco/JSON/Object.h>

#include <wsd/RequestDetails.hpp>
#include <net/Socket.hpp>
#include <common/StringVector.hpp>

#define MODULE_METHOD_IS_ABSTRACT "@OxOOL::Module::Base"

namespace OxOOL
{
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

    void setDetail(const Detail& newDetial) { mDetail = newDetial; }
    const Detail& getDetail() const { return mDetail; }

    /// @brief 以 JSON 格式傳回模組詳細資訊
    /// @return Poco::JSON::Object::Ptr
    Poco::JSON::Object::Ptr getAdminDetailJson(const std::string& langTag = std::string());

    void setDocumentRoot(const std::string& documentRoot) { maRootPath = documentRoot; }
    const std::string& getDocumentRoot() const { return maRootPath; }

    /// @brief 請求是否是本模組處理
    /// @param requestDetails
    /// @return true 該要求屬於這個模組處理
    bool isService(const RequestDetails& requestDetails) const;

    /// @brief 請求是否是本模組的管理介面處理
    /// @param requestDetails
    /// @return true 該要求屬於這個模組的管理介面處理
    bool isAdminService(const RequestDetails& requestDetails) const;

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
    /// @param requestDetails
    /// @param socket
    virtual void handleRequest(const Poco::Net::HTTPRequest& request,
                               const RequestDetails& requestDetails,
                               const std::shared_ptr<StreamSocket>& socket);

    /// @brief 處理控制臺 Client 的請求
    /// @param request
    /// @param requestDetails
    /// @param socket
    virtual void handleAdminRequest(const Poco::Net::HTTPRequest& request,
                                    const RequestDetails& requestDetails,
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
    /// @param requestDetails
    /// @return 實際的請求位址
    std::string parseRealURI(const RequestDetails& requestDetails) const;

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
                             const RequestDetails &requestDetails,
                             const std::shared_ptr<StreamSocket>& socket);

private:
    Detail mDetail;
    std::string maRootPath; // 模組文件位置
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
