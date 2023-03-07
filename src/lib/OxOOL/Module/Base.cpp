/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <config.h>
#include <memory>

#include <Poco/Net/NetException.h>
#include <Poco/URI.h>
#include <Poco/Path.h>
#include <Poco/File.h>

#include <OxOOL/Module/Base.h>
#include <OxOOL/HttpHelper.h>
#include <OxOOL/L10NTranslator.h>
#include <OxOOL/ModuleManager.h>
#include <OxOOL/Util.h>

#include <wsd/FileServer.hpp>

namespace OxOOL
{
namespace Module
{

Poco::JSON::Object::Ptr Base::getAdminDetailJson(const std::string& langTag)
{

    OxOOL::Module::Detail detail = mDetail;

    // 若有指定語系，嘗試翻譯
    if (!langTag.empty())
    {
        std::unique_ptr<OxOOL::L10NTranslator> translator =
            std::make_unique<OxOOL::L10NTranslator>(langTag, mDetail.name, true);

        detail.version = translator->getTranslation(mDetail.version);
        detail.summary = translator->getTranslation(mDetail.summary);
        detail.author = translator->getTranslation(mDetail.author);
        detail.license = translator->getTranslation(mDetail.license);
        detail.description = translator->getTranslation(mDetail.description);
        detail.adminItem = translator->getTranslation(mDetail.adminItem);
    }

    Poco::JSON::Object::Ptr json = new Poco::JSON::Object();
    json->set("name", detail.name);
    json->set("serviceURI", detail.serviceURI);
    json->set("version", detail.version);
    json->set("summary", detail.summary);
    json->set("author", detail.author);
    json->set("license", detail.license);
    json->set("description", detail.description);
    json->set("adminPrivilege", detail.adminPrivilege);
    json->set("adminServiceURI", detail.adminServiceURI);
    json->set("adminIcon", detail.adminIcon);
    json->set("adminItem", detail.adminItem);

    return json;
}

bool Base::isService(const Poco::Net::HTTPRequest& request) const
{
    // 不含查詢字串的實際請求位址
    std::string requestURI = Poco::URI(request.getURI()).getPath();


    /* serviceURI 有兩種格式：
        一、 end point 格式：
            例如 /lool/endpoint 最後非 '/' 結尾)
            此種格式用途單一，只有一個位址，適合簡單功能的 restful api

        二、 目錄格式，最後爲 '/' 結尾：
            例如 /lool/drawio/
            此種格式，模組可自由管理 /lool/drawio/ 之後所有位址，適合複雜的 restful api
        */
    // 取得該模組指定的 service uri, uri 長度至少 2 個字元
    if (std::string serviceURI = mDetail.serviceURI; serviceURI.length() > 1)
    {
        bool correctModule = false; // 預設該模組非正確模組

        // service uri 是否為 End point?(最後字元不是 '/')
        bool isEndPoint = serviceURI.at(serviceURI.length() - 1) != '/';

        // service uri 爲 end pointer，表示 request uri 和 service uri 需相符
        if (isEndPoint)
        {
            correctModule = (serviceURI == requestURI);
        }
        else
        {
            // 該位址可以為 "/endpoint" or "/endpoint/"
            std::string endpoint(serviceURI);
            endpoint.pop_back(); // 移除最後的 '/' 字元，轉成 /endpoint

            // 位址列開始爲 "/endpoint/" 或等於 "/endpoint"，視為正確位址
            correctModule = (requestURI.find(serviceURI, 0) == 0 || requestURI == endpoint);
        }

        return correctModule;
    }

    return false;
}

bool Base::isAdminService(const Poco::Net::HTTPRequest& request) const
{
    // 有管理界面 URI
    if (!mDetail.adminServiceURI.empty())
        return request.getURI().find(mDetail.adminServiceURI, 0) == 0;

    return false;
}

bool Base::needAdminAuthenticate(const Poco::Net::HTTPRequest& request,
                                 const std::shared_ptr<StreamSocket>& socket,
                                 const bool callByAdmin)
{
    bool needAuthenticate = false;
    // 該 Service URI 需要有管理者權限，或是被 admin Service URI 需要
    if (mDetail.adminPrivilege || callByAdmin)
    {
        std::shared_ptr<Poco::Net::HTTPResponse> response
            = std::make_shared<Poco::Net::HTTPResponse>();

        try
        {
            if (!FileServerRequestHandler::isAdminLoggedIn(request, *response))
                throw Poco::Net::NotAuthenticatedException("Invalid admin login");
        }
        catch (const Poco::Net::NotAuthenticatedException& exc)
        {
            needAuthenticate = true;
            OxOOL::HttpHelper::KeyValueMap extraHeader
                = { { "WWW-authenticate", "Basic realm=\"OxOffice Online\"" } };
            OxOOL::HttpHelper::sendErrorAndShutdown(
                Poco::Net::HTTPResponse::HTTP_UNAUTHORIZED, socket, "", "",
                extraHeader);
        }
    }
    return needAuthenticate;
}

void Base::handleRequest(const Poco::Net::HTTPRequest& request,
                         const std::shared_ptr<StreamSocket>& socket)
{
    const std::string realURI = parseRealURI(request);

    Poco::Path requestFile(maRootPath + "/html" + realURI);
    if (requestFile.isDirectory())
        requestFile.append("index.html");

    sendFile(requestFile.toString(), request, socket);
}

void Base::handleAdminRequest(const Poco::Net::HTTPRequest& request,
                              const std::shared_ptr<StreamSocket>& socket)
{

    std::string requestURI = Poco::URI(request.getURI()).getPath();
    std::size_t stripLength = mDetail.adminServiceURI.length();
    // 去掉 request 前導的 adminServiceURI
    std::string realURI = stripLength >= requestURI.length() ? "/" : requestURI.substr(stripLength - 1);
    Poco::Path requestFile(maRootPath + "/admin" + realURI);
    // 如果要求的是目錄(不帶檔名)
    if (requestFile.isDirectory())
    {
        // 模組根目錄，預設檔名是 admin.html
        if (realURI == "/")
            requestFile.append("admin.html");
        else // 其他目錄，預設檔名是 index.html
            requestFile.append("index.html");
    }

    // GET html 格式的檔案，需要內嵌到 admintemplate.html 中
    if (OxOOL::HttpHelper::isGET(request) && requestFile.getExtension() == "html")
    {
        preprocessAdminFile(requestFile.toString(), request, socket);
    }
    else
    {
        sendFile(requestFile.toString(), request, socket, true);
    }

}

std::string Base::handleAdminMessage(const StringVector& tokens)
{
    (void)tokens; // avoid -Werror=unused-parameter
    return MODULE_METHOD_IS_ABSTRACT;
}

// PROTECTED METHODS
std::string Base::parseRealURI(const Poco::Net::HTTPRequest& request) const
{
    // 完整請求位址
    std::string requestURI = request.getURI();
    // 若帶有 '?key1=asd&key2=xxx' 參數字串，去除參數字串，只保留完整位址
    if (size_t queryPos = requestURI.find_first_of('?'); queryPos != std::string::npos)
        requestURI.resize(queryPos);

    // service uri 是否為 End point?(最後字元不是 '/')
    bool isEndPoint = mDetail.serviceURI.at(mDetail.serviceURI.length() - 1) != '/';

    std::string realURI = mDetail.serviceURI;
    // 該位址是 end point，表示要取得最右邊 '/' 之後的字串
    if (isEndPoint)
    {
        if (size_t lastPathSlash = requestURI.rfind('/'); lastPathSlash != std::string::npos)
            realURI = requestURI.substr(lastPathSlash);
    }
    else
    {
        size_t stripLength = mDetail.serviceURI.length();
        // 去掉前導的 serviceURI
        realURI = stripLength >= requestURI.length() ? "/" : requestURI.substr(stripLength - 1);
    }
    return realURI;
}

void Base::sendFile(const std::string& requestFile,
                    const Poco::Net::HTTPRequest& request,
                    const std::shared_ptr<StreamSocket>& socket,
                    const bool callByAdmin)
{
    if (Poco::File(requestFile).exists())
    {
        std::string mimeType = OxOOL::HttpHelper::getMimeType(requestFile);
        if (mimeType.empty())
            mimeType = "text/plane";

        bool isHead = request.getMethod() == Poco::Net::HTTPRequest::HTTP_HEAD;
        // 是否令 client chche 該檔案，如果是 admin 或 URI 帶有 ? 查詢字元的位址，就不 cache
        bool noCache = callByAdmin || request.getURI().find('?') != std::string::npos;

        OxOOL::HttpHelper::sendFileAndShutdown(socket, requestFile, mimeType, nullptr,
                                               noCache, false, isHead);
    }
    else
    {
        OxOOL::HttpHelper::sendErrorAndShutdown(Poco::Net::HTTPResponse::HTTP_NOT_FOUND, socket);
    }
}

void Base::preprocessAdminFile(const std::string& adminFile,
                               const Poco::Net::HTTPRequest& request,
                               const std::shared_ptr<StreamSocket>& socket)
{
    // 取得 admintemplate.html
    const std::string templatePath = "/loleaflet/dist/admin/admintemplate.html";
    std::string templateFile = *FileServerRequestHandler::getUncompressedFile(templatePath);

    // 讀取檔案內容
    std::ifstream file(adminFile, std::ios::binary);
    std::stringstream mainContent;
    mainContent << file.rdbuf();
    file.close();

    // 製作完整 HTML 頁面
    Poco::replaceInPlace(templateFile, std::string("<!--%MAIN_CONTENT%-->"), mainContent.str()); // Now template has the main content..
    std::string responseRoot = OxOOL::Util::getServiceRoot();

    // 帶入模組的多國語系設定檔
    static const std::string l10nJSON("<link rel=\"localizations\" href=\"%s/loleaflet/dist/admin/module/%s/localizations.json\" type=\"application/vnd.oftn.l10n+json\"/>");
    std::string moduleL10NJSON(Poco::format(l10nJSON, responseRoot, mDetail.name));
    Poco::replaceInPlace(templateFile, std::string("<!--%MODULE_L10N%-->"), moduleL10NJSON);

    // 帶入模組的 admin.js
    const std::string moduleAdminJS("<script src=\"%s" + mDetail.adminServiceURI + "admin.js\"></script>");
    std::string moduleScriptJS(Poco::format(moduleAdminJS, responseRoot));
    Poco::replaceInPlace(templateFile, std::string("<!--%MODULE_ADMIN_JS%-->"), moduleScriptJS);

    Poco::replaceInPlace(templateFile, std::string("%VERSION%"), OxOOL::ENV::VersionHash);
    Poco::replaceInPlace(templateFile, std::string("%SERVICE_ROOT%"), responseRoot);
    Poco::replaceInPlace(templateFile, std::string("%MODULE_NAME%"), mDetail.name);

    // 傳入有管理界面的模組列表
    std::string langTag = OxOOL::HttpHelper::getAcceptLanguage(request);
    Poco::replaceInPlace(templateFile, std::string("%ADMIN_MODULES%"),
        OxOOL::ModuleManager::instance().getAdminModuleDetailsJsonString(langTag));

    Poco::Net::HTTPResponse response;
    // Ask UAs to block if they detect any XSS attempt
    response.add("X-XSS-Protection", "1; mode=block");
    // No referrer-policy
    response.add("Referrer-Policy", "no-referrer");
    response.add("X-Content-Type-Options", "nosniff");
    response.set("Server", OxOOL::ENV::HttpServerString);
    response.set("Date", OxOOL::Util::getHttpTimeNow());

    response.setContentType("text/html");
    response.setChunkedTransferEncoding(false);

    std::ostringstream oss;
    response.write(oss);
    oss << templateFile;
    socket->send(oss.str());
    socket->shutdown();
}

} // namespace Module
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
