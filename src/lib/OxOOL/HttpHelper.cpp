/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <OxOOL/HttpHelper.h>

#include <unordered_map>
#include <algorithm>
#include <string>
#include <zlib.h>

#include <Poco/Net/HTTPResponse.h>

#include <common/Common.hpp>
#include <common/FileUtil.hpp>
#include <common/Util.hpp>
#include <net/Socket.hpp>

namespace OxOOL
{
namespace HttpHelper
{
void sendResponse(const std::shared_ptr<StreamSocket>& socket,
                  const std::string& body,
                  Poco::Net::HTTPResponse::HTTPStatus statusCode,
                  const std::string& mimeType,
                  const KeyValueMap& extraHeader)
{
    Poco::Net::HTTPResponse response;

    response.setStatus(statusCode);
    response.setReason(Poco::Net::HTTPResponse::getReasonForStatus(statusCode));
    response.setContentLength(body.size());
    // 有要回應的內容，才設定 Content-Type
    if (body.size())
    {
        response.setContentType(mimeType.empty() ? "text/plain" : mimeType);
    }

    // 需增加額外標頭
    if (!extraHeader.empty())
    {
        for (auto it : extraHeader)
        {
            response.set(it.first, it.second);
        }
    }
    socket->send(response);

    if (body.size())
    {
        socket->send(body);
    }
}

void sendResponseAndShutdown(const std::shared_ptr<StreamSocket>& socket,
                             const std::string& body,
                             Poco::Net::HTTPResponse::HTTPStatus statusCode,
                             const std::string& mimeType,
                             const KeyValueMap& extraHeader)
{
    sendResponse(socket, body, statusCode, mimeType, extraHeader);
    socket->shutdown();
}

void sendError(Poco::Net::HTTPResponse::HTTPStatus errorCode,
               const std::shared_ptr<StreamSocket>& socket,
               const std::string& body,
               const std::string& mimeType,
               const KeyValueMap& extraHeader)
{
    sendResponse(socket, body, errorCode, mimeType, extraHeader);
}

void sendErrorAndShutdown(Poco::Net::HTTPResponse::HTTPStatus errorCode,
                          const std::shared_ptr<StreamSocket>& socket,
                          const std::string& body,
                          const std::string& mimeType,
                          const KeyValueMap& extraHeader)
{
    sendResponse(socket, body, errorCode, mimeType, extraHeader);
    socket->shutdown();
}

void sendUncompressedFileContent(const std::shared_ptr<StreamSocket>& socket,
                                 const std::string& path, const int bufferSize)
{
    std::ifstream file(path, std::ios::binary);
    std::unique_ptr<char[]> buf(new char[bufferSize]);
    do
    {
        file.read(&buf[0], bufferSize);
        const int size = file.gcount();
        if (size > 0)
            socket->send(&buf[0], size, true);
        else
            break;
    } while (file);
}

void sendDeflatedFileContent(const std::shared_ptr<StreamSocket>& socket, const std::string& path,
                             const int fileSize)
{
    // FIXME: Should compress once ahead of time
    // compression of bundle.js takes significant time:
    //   200's ms for level 9 (468k), 72ms for level 1(587k)
    //   down from 2Mb.
    if (fileSize > 0)
    {
        std::ifstream file(path, std::ios::binary);
        std::unique_ptr<char[]> buf(new char[fileSize]);
        file.read(&buf[0], fileSize);

        static const unsigned int Level = 1;
        const long unsigned int size = file.gcount();
        long unsigned int compSize = compressBound(size);
        std::unique_ptr<char[]> cbuf(new char[compSize]);
        compress2((Bytef*)&cbuf[0], &compSize, (Bytef*)&buf[0], size, Level);

        if (size > 0)
            socket->send(&cbuf[0], compSize, true);
    }
}

void sendFileAndShutdown(const std::shared_ptr<StreamSocket>& socket, const std::string& path,
                         const std::string& mediaType, Poco::Net::HTTPResponse* optResponse,
                         const bool noCache, const bool deflate, const bool headerOnly)
{
    Poco::Net::HTTPResponse* response = optResponse;
    Poco::Net::HTTPResponse localResponse;
    if (!response)
        response = &localResponse;

    FileUtil::Stat st(path);
    if (st.bad())
    {
        LOG_WRN('#' << socket->getFD() << ": Failed to stat [" << path
                    << "]. File will not be sent.");
        throw Poco::FileNotFoundException("Failed to stat [" + path + "]. File will not be sent.");
    }

    if (!noCache)
    {
        // 60 * 60 * 24 * 128 (days) = 11059200
        response->set("Cache-Control", "max-age=11059200");
        response->set("ETag", "\"" + OxOOL::VersionHash + "\"");
    }
    else
    {
        response->set("Cache-Control", "no-cache");
    }

    response->setContentType(mediaType);
    response->add("X-Content-Type-Options", "nosniff");

    int bufferSize = std::min<std::size_t>(st.size(), Socket::MaximumSendBufferSize);
    if (static_cast<long>(st.size()) >= socket->getSendBufferSize())
    {
        socket->setSocketBufferSize(bufferSize);
        bufferSize = socket->getSendBufferSize();
    }

    // Disable deflate for now - until we can cache deflated data.
    // FIXME: IE/Edge doesn't work well with deflate, so check with
    // IE/Edge before enabling the deflate again
    if (!deflate || true)
    {
        response->setContentLength(st.size());
        LOG_TRC('#' << socket->getFD() << ": Sending " << (headerOnly ? "header for " : "")
                    << " file [" << path << "].");
        socket->send(*response);

        if (!headerOnly)
            sendUncompressedFileContent(socket, path, bufferSize);
    }
    else
    {
        response->set("Content-Encoding", "deflate");
        LOG_TRC('#' << socket->getFD() << ": Sending " << (headerOnly ? "header for " : "")
                    << " file [" << path << "].");
        socket->send(*response);

        if (!headerOnly)
            sendDeflatedFileContent(socket, path, st.size());
    }
    socket->shutdown();
}

std::string getMimeType(const std::string& fileName)
{
    static std::unordered_map<std::string, std::string> aMimeTypes {
        { "svg", "image/svg+xml" },
        { "pot", "application/vnd.ms-powerpoint" },
        { "xla", "application/vnd.ms-excel" },

        // Writer documents
        { "sxw", "application/vnd.sun.xml.writer" },
        { "odt", "application/vnd.oasis.opendocument.text" },
        { "fodt", "application/vnd.oasis.opendocument.text-flat-xml" },

        // Calc documents
        { "sxc", "application/vnd.sun.xml.calc" },
        { "ods", "application/vnd.oasis.opendocument.spreadsheet" },
        { "fods", "application/vnd.oasis.opendocument.spreadsheet-flat-xml" },

        // Impress documents
        { "sxi", "application/vnd.sun.xml.impress" },
        { "odp", "application/vnd.oasis.opendocument.presentation" },
        { "fodp", "application/vnd.oasis.opendocument.presentation-flat-xml" },

        // Draw documents
        { "sxd", "application/vnd.sun.xml.draw" },
        { "odg", "application/vnd.oasis.opendocument.graphics" },
        { "fodg", "application/vnd.oasis.opendocument.graphics-flat-xml" },

        // Chart documents
        { "odc", "application/vnd.oasis.opendocument.chart" },

        // Text master documents
        { "sxg", "application/vnd.sun.xml.writer.global" },
        { "odm", "application/vnd.oasis.opendocument.text-master" },

        // Math documents
        // In fact Math documents are not supported at all.
        // See: https://bugs.documentfoundation.org/show_bug.cgi?id=97006
        { "sxm", "application/vnd.sun.xml.math" },
        { "odf", "application/vnd.oasis.opendocument.formula" },

        // Text template documents
        { "stw", "application/vnd.sun.xml.writer.template" },
        { "ott", "application/vnd.oasis.opendocument.text-template" },

        // Writer master document templates
        { "otm", "application/vnd.oasis.opendocument.text-master-template" },

        // Spreadsheet template documents
        { "stc", "application/vnd.sun.xml.calc.template" },
        { "ots", "application/vnd.oasis.opendocument.spreadsheet-template" },

        // Presentation template documents
        { "sti", "application/vnd.sun.xml.impress.template" },
        { "otp", "application/vnd.oasis.opendocument.presentation-template" },

        // Drawing template documents
        { "std", "application/vnd.sun.xml.draw.template" },
        { "otg", "application/vnd.oasis.opendocument.graphics-template" },

        // MS Word
        { "doc", "application/msword" },
        { "dot", "application/msword" },

        // MS Excel
        { "xls", "application/vnd.ms-excel" },

        // MS PowerPoint
        { "ppt", "application/vnd.ms-powerpoint" },

        // OOXML wordprocessing
        { "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        { "docm", "application/vnd.ms-word.document.macroEnabled.12" },
        { "dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template" },
        { "dotm", "application/vnd.ms-word.template.macroEnabled.12" },

        // OOXML spreadsheet
        { "xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template" },
        { "xltm", "application/vnd.ms-excel.template.macroEnabled.12" },
        { "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { "xlsb", "application/vnd.ms-excel.sheet.binary.macroEnabled.12" },
        { "xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12" },

        // OOXML presentation
        { "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
        { "pptm", "application/vnd.ms-powerpoint.presentation.macroEnabled.12" },
        { "potx", "application/vnd.openxmlformats-officedocument.presentationml.template" },
        { "potm", "application/vnd.ms-powerpoint.template.macroEnabled.12" },

        // Others
        { "wpd", "application/vnd.wordperfect" },
        { "pdb", "application/x-aportisdoc" },
        { "hwp", "application/x-hwp" },
        { "wps", "application/vnd.ms-works" },
        { "wri", "application/x-mswrite" },
        { "dif", "application/x-dif-document" },
        { "slk", "text/spreadsheet" },
        { "csv", "text/csv" },
        { "dbf", "application/x-dbase" },
        { "wk1", "application/vnd.lotus-1-2-3" },
        { "cgm", "image/cgm" },
        { "dxf", "image/vnd.dxf" },
        { "emf", "image/x-emf" },
        { "wmf", "image/x-wmf" },
        { "cdr", "application/coreldraw" },
        { "vsd", "application/vnd.visio2013" },
        { "vss", "application/vnd.visio" },
        { "pub", "application/x-mspublisher" },
        { "lrf", "application/x-sony-bbeb" },
        { "gnumeric", "application/x-gnumeric" },
        { "mw", "application/macwriteii" },
        { "numbers", "application/x-iwork-numbers-sffnumbers" },
        { "oth", "application/vnd.oasis.opendocument.text-web" },
        { "p65", "application/x-pagemaker" },
        { "rtf", "text/rtf" },
        { "txt", "text/plain" },
        { "htm", "text/html" },
        { "html", "text/html" },
        { "js", "application/javascript" },
        { "json", "application/json" },
        { "css", "text/css" },
        { "xml", "text/xml" },
        { "fb2", "application/x-fictionbook+xml" },
        { "cwk", "application/clarisworks" },
        { "wpg", "image/x-wpg" },
        { "pages", "application/x-iwork-pages-sffpages" },
        { "ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow" },
        { "key", "application/x-iwork-keynote-sffkey" },
        { "abw", "application/x-abiword" },
        { "fh", "image/x-freehand" },
        { "sxs", "application/vnd.sun.xml.chart" },
        { "602", "application/x-t602" },
        { "bmp", "image/bmp" },
        { "png", "image/png" },
        { "gif", "image/gif" },
        { "tiff", "image/tiff" },
        { "jpg", "image/jpg" },
        { "jpeg", "image/jpeg" },
        { "ico", "image/vnd.microsoft.icon" },
        { "pdf", "application/pdf" },
        { "jar", "application/java-archive" },
    };

    const std::string sExt = Poco::Path(fileName).getExtension();
    if (const auto it = aMimeTypes.find(sExt); it != aMimeTypes.end())
        return it->second;

    return "";
}

} // namespace HttpHelper
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
