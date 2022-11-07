
#pragma once

#include <string>

#include <Poco/URI.h>

#include <wsd/DocumentBroker.hpp>
#include <wsd/ClientSession.hpp>

namespace OxOOL
{

class ConvertBroker : public DocumentBroker
{
public:
    /// Construct DocumentBroker with URI and docKey
    ConvertBroker(const std::string& uri,
				  const Poco::URI& uriPublic,
				  const std::string& docKey,
				  const std::string& format,
				  const std::string& saveAsOptions);

    virtual ~ConvertBroker();

    /// Move socket to this broker for response & do conversion
    bool startConversion(std::shared_ptr<StreamSocket> socket, const std::string &id);

    /// Called when removed from the DocBrokers list
    void dispose() override;

    /// When the load completes - lets start saving
    void setLoaded() override;

    /// Cleanup path and its parent
    static void removeFile(const std::string &uri);

private:
	const std::string maFormat;
    const std::string maSaveAsOptions;
    std::shared_ptr<ClientSession> mpClientSession;
};

} // namespace OxOOL
