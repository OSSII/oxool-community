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

#include <Poco/Net/HTTPResponse.h>

class StreamSocket;

namespace OxOOL
{

namespace HttpHelper
{

typedef std::map<std::string, std::string> KeyValueMap;

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

/// @brief 取得檔案的 Mime type
/// @param fileName
/// @return
std::string getMimeType(const std::string& fileName);

} // namespace HttpHelper
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
