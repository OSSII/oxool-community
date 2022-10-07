
#include <memory>

#include <OxOOL/Module/Base.h>
#include <OxOOL/HttpHelper.h>

namespace OxOOL
{
namespace Module
{

void Base::handleRequest(const RequestDetails& requestDetails,
                         const Poco::Net::HTTPRequest& request,
                         const std::shared_ptr<StreamSocket>& socket)
{
    const std::string realURI = parseRealURI(requestDetails);

    Poco::Path requestFile(rootPath + "/html" + realURI);
    if (requestFile.isDirectory())
        requestFile.append("index.html");

    if (Poco::File(requestFile).exists())
    {
        std::string mimeType = OxOOL::HttpHelper::getMimeType(requestFile.toString());
        if (mimeType.empty())
            mimeType = "text/plane";

        bool isHead = request.getMethod() == "HEAD";

        OxOOL::HttpHelper::sendFileAndShutdown(socket, requestFile.toString(), mimeType, nullptr,
                                               true, false, isHead);
    }
    else
    {
        OxOOL::HttpHelper::sendErrorAndShutdown(Poco::Net::HTTPResponse::HTTP_NOT_FOUND, socket);
    }
}

std::string Base::handleAdminMessage(const std::string& message)
{
    (void)message; // avoid -Werror=unused-parameter
    return MODULE_METHOD_IS_ABSTRACT;
}

std::string Base::handleClientMessage(const std::string& message)
{
    (void)message; // avoid -Werror=unused-parameter
    return MODULE_METHOD_IS_ABSTRACT;
}

// PROTECTED METHODS
std::string Base::parseRealURI(const RequestDetails& requestDetails) const
{
    // 完整請求位址
    std::string requestURI = requestDetails.getURI();
    // 若帶有 '?key1=asd&key2=xxx' 參數字串，去除參數字串，只保留完整位址
    if (size_t queryPos = requestURI.find_first_of('?'); queryPos != std::string::npos)
        requestURI.resize(queryPos);

    // service uri 是否為 End point?(最後字元不是 '/')
    bool isEndPoint = detail.serviceURI.at(detail.serviceURI.length() - 1) != '/';

    std::string realURI = detail.serviceURI;
    // 該位址是 end point，表示要取得最右邊 '/' 之後的字串
    if (isEndPoint)
    {
        if (size_t lastPathSlash = requestURI.rfind('/'); lastPathSlash != std::string::npos)
            realURI = requestURI.substr(lastPathSlash);
    }
    else
    {
        size_t stripLength = detail.serviceURI.length();
        // 去掉前導的 serviceURI
        realURI = stripLength >= requestURI.length() ? "/" : requestURI.substr(stripLength - 1);
    }
    return realURI;
}

} // namespace Module
} // namespace OxOOL
