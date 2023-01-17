/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>

#include <memory>
#include <string>
#include <map>

#include <Poco/Net/HTTPRequest.h>
#include <Poco/Net/HTTPResponse.h>
#include <Poco/Net/PartHandler.h>

class StreamSocket;

namespace OxOOL
{

namespace HttpHelper
{

typedef std::map<std::string, std::string> KeyValueMap;

/// @brief 檢查 request 方法是否爲 HEAD
/// @param request
/// @return true - 是
bool isHEAD(const Poco::Net::HTTPRequest& request);

/// @brief 檢查 request 方法是否爲 GET
/// @param request
/// @return true - 是
bool isGET(const Poco::Net::HTTPRequest& request);

/// @brief 檢查 request 方法是否爲 POST
/// @param request
/// @return true - 是
bool isPOST(const Poco::Net::HTTPRequest& request);

/// @brief 檢查 request 方法是否爲 PUT
/// @param request
/// @return true - 是
bool isPUT(const Poco::Net::HTTPRequest& request);

/// @brief 檢查 request 方法是否爲 DELETE
/// @param request
/// @return true - 是
bool isDELETE(const Poco::Net::HTTPRequest& request);

/// @brief 檢查 request 方法是否爲 OPTIONS
/// @param request
/// @return true - 是
bool isOPTIONS(const Poco::Net::HTTPRequest& request);

/// @brief 檢查 request 方法是否爲 PATCH
/// @param request
/// @return true - 是
bool isPATCH(const Poco::Net::HTTPRequest& request);

/// Write headers and body for a response.
void sendResponse(const std::shared_ptr<StreamSocket>& socket,
                  const std::string& body = std::string(),
                  Poco::Net::HTTPResponse::HTTPStatus statusCode
                  = Poco::Net::HTTPResponse::HTTPStatus::HTTP_OK,
                  const std::string& mimeType = std::string(),
                  const KeyValueMap& extraHeader = KeyValueMap());

/// Write headers and body for a response. Afterwards, shutdown the socket.
void sendResponseAndShutdown(const std::shared_ptr<StreamSocket>& socket,
                             const std::string& body = std::string(),
                             Poco::Net::HTTPResponse::HTTPStatus statusCode
                             = Poco::Net::HTTPResponse::HTTPStatus::HTTP_OK,
                             const std::string& mimeType = std::string(),
                             const KeyValueMap& extraHeader = KeyValueMap());

/// Write headers and body for an error response.
void sendError(Poco::Net::HTTPResponse::HTTPStatus errorCode,
               const std::shared_ptr<StreamSocket>& socket,
               const std::string& body = std::string(),
               const std::string& mimeType = std::string(),
               const KeyValueMap& extraHeader = KeyValueMap());

/// Write headers and body for an error response. Afterwards, shutdown the socket.
void sendErrorAndShutdown(Poco::Net::HTTPResponse::HTTPStatus errorCode,
                          const std::shared_ptr<StreamSocket>& socket,
                          const std::string& body = std::string(),
                          const std::string& mimeType = std::string(),
                          const KeyValueMap& extraHeader = KeyValueMap());

/// Sends file as HTTP response and shutdown the socket.
void sendFileAndShutdown(const std::shared_ptr<StreamSocket>& socket, const std::string& path,
                         const std::string& mediaType,
                         Poco::Net::HTTPResponse* optResponse = nullptr, bool noCache = false,
                         bool deflate = false, const bool headerOnly = false);

/// @brief 取得 Client 端的語系
/// @param request
/// @return std::string 語系，如 zh-TW, en 等，空字串表示未知
std::string getAcceptLanguage(const Poco::Net::HTTPRequest& request);

/// @brief 取得檔案的 Mime type
/// @param fileName
/// @return
std::string getMimeType(const std::string& fileName);

class PartHandler : public Poco::Net::PartHandler
{
public:
    PartHandler(const std::string& pathPrefix = std::string());
    virtual ~PartHandler();

    void handlePart(const Poco::Net::MessageHeader& header,std::istream& inputStream) override;

    /// @brief 從列表中取得指定名稱的檔案
    /// @param name 檔案所代表的名稱，空字串表示取第一個收到的檔案
    /// @return 檔案所在位置
    std::string getFilename(const std::string& name = std::string()) const;

    /// @brief 取得所有檔案列表
    /// @return 所有檔案位置
    std::vector<std::string> getReceivedFiles() const;

    /// @brief 把接收的檔案從儲存設備刪除
    void removeFiles();

    /// @brief 收到的檔案總數
    /// @return 總數
    size_t size() const { return mpReceivedFiles.size(); }

    /// @brief 檔案列表是空的?
    /// @return true - 是, false - 否
    bool empty() const { return mpReceivedFiles.empty(); }

    /// @brief 顯示所有接收到的檔案 (for debug)
    void dumpReceivedFiles();

private:
    std::string maPathPrefix;
    // TODO: 紀錄所有上傳過來的檔案
    std::map<std::string, std::string> mpReceivedFiles;
};

} // namespace HttpHelper
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
