
#include <OxOOL/Module/Base.h>

#include <Poco/URI.h>
#include <Poco/Net/HTMLForm.h>

namespace OxOOL
{
namespace Module
{

std::string Base::getName() const { return "OxOOL::Module::Base"; }

std::string Base::getServiceURI() const { return ""; }

void Base::handleRequest(const Poco::Net::HTTPRequest& request, Poco::MemoryInputStream& message,
                         const std::shared_ptr<StreamSocket>& socket)
{
    Poco::Net::HTMLForm form(request, message);
    std::cout << request.getMethod() << " from " << socket->clientAddress()
              << "URI:" << request.getURI() << std::endl;
;
}

std::string Base::handleAdminMessage(const std::string&) const { return ""; }

std::string Base::handleClientMessage(const std::string&) const { return ""; }

} // namespace Module
} // namespace OxOOL
