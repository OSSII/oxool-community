
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

#include <memory>

#include <Poco/Net/HTTPRequest.h>
#include <Poco/MemoryStream.h>

#include <net/Socket.hpp>


namespace OxOOL {
namespace Module {

class Base
{
public:
    virtual ~Base() {};

    virtual std::string getName() const { return "OxOOL::Module::Base"; }
    virtual std::string getServiceURI() const { return ""; }
    virtual void handleRequest(const Poco::Net::HTTPRequest& request,
			       Poco::MemoryInputStream& message,
			       const std::shared_ptr<StreamSocket>& socket) {}
    virtual std::string handleAdminMessage(const std::string&) const { return ""; }
};

} } // namespace OxOOL::Module

// Define a pointer type
typedef std::shared_ptr<OxOOL::Module::Base> OxOOLModulePtr;

// Define a pointer type to the entry point.
typedef OxOOLModulePtr (*OxOOLModuleEntry)();

#define OXOOL_MODULE_ENTRY_NAME "oxoolModuleEntry"
#define OXOOL_MODULE_ENTRY_FUNC oxoolModuleEntry()

#define OXOOL_MODULE_EXPORT(ClassName) \
extern "C" OxOOLModulePtr OXOOL_MODULE_ENTRY_FUNC \
{ \
    return std::make_shared<ClassName>(); \
}

