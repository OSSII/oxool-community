
#include <OxOOL/HttpHelper.h>
#include <OxOOL/Module/Base.h>

class Alive : public OxOOL::Module::Base
{
public:
    void handleRequest(const RequestDetails& requestDetails,
                       const Poco::Net::HTTPRequest& request,
                       const std::shared_ptr<StreamSocket>& socket) override
    {
        // Avoid -Werror=unused-parameter
        (void)requestDetails;
        (void)request;

        OxOOL::HttpHelper::sendResponseAndShutdown(
            socket, request.getMethod() == "HEAD" ? "" : "OK");
    }
};

OXOOL_MODULE_EXPORT(Alive);
