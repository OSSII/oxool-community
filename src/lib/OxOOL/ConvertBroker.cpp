

#include <Poco/URI.h>
#include <Poco/Path.h>
#include <Poco/File.h>

#include <OxOOL/ConvertBroker.h>

#include <net/Socket.hpp>
#include <wsd/RequestDetails.hpp>

namespace OxOOL
{

ConvertBroker::ConvertBroker(const std::string& uri,
                             const Poco::URI& uriPublic,
                             const std::string& docKey,
                             const std::string& format,
                             const std::string& saveAsOptions) :
    DocumentBroker(ChildType::Batch, uri, uriPublic, docKey),
    maFormat(format),
    maSaveAsOptions(saveAsOptions)
{
    static const int limit_convert_secs = LOOLWSD::getConfigValue<int>("per_document.limit_convert_secs", 100);
    _limitLifeSeconds = limit_convert_secs;
}

bool ConvertBroker::startConversion(std::shared_ptr<StreamSocket> socket, const std::string &id)
{
    std::shared_ptr<ConvertBroker> docBroker = std::static_pointer_cast<ConvertBroker>(shared_from_this());

    // Create a session to load the document.
    const bool isReadOnly = true;
    // FIXME: associate this with moveSocket (?)
    std::shared_ptr<ProtocolHandlerInterface> nullPtr;
    RequestDetails requestDetails("convert-broker");
    mpClientSession = std::make_shared<ClientSession>(nullPtr, id, docBroker, getPublicUri(), isReadOnly, requestDetails);
    mpClientSession->construct();

    if (!mpClientSession)
        return false;

    // Make sure the thread is running before adding callback.
    docBroker->startThread();

    docBroker->addCallback([docBroker, socket]()
    {
        docBroker->mpClientSession->setSaveAsSocket(socket);

        // First add and load the session.
        docBroker->addSession(docBroker->mpClientSession);

        // Load the document manually and request saving in the target format.
        std::string encodedFrom;
        Poco::URI::encode(docBroker->getPublicUri().getPath(), "", encodedFrom);
        const std::string loadCommand = "load url=" + encodedFrom;
        std::vector<char> loadRequest(loadCommand.begin(), loadCommand.end());
        docBroker->mpClientSession->handleMessage(loadRequest);

        // Save is done in the setLoaded
    });

    return true;
}

void ConvertBroker::dispose()
{
    if (!_uriOrig.empty())
    {
        removeFile(_uriOrig);
        _uriOrig.clear();
    }
}

ConvertBroker::~ConvertBroker()
{
    // Calling a virtual function from a dtor
    // is only valid if there are no inheritors.
    dispose();
}

void ConvertBroker::removeFile(const std::string &uriOrig)
{
    if (!uriOrig.empty())
    {
        try
        {
            // 移除暫存檔案及目錄
            Poco::Path path = uriOrig;
            Poco::File(path).remove();
            Poco::File(path.makeParent()).remove();
        } catch (const std::exception &ex) {
            LOG_ERR("Error while removing conversion temporary: '" << uriOrig << "' - " << ex.what());
        }
    }
}

void ConvertBroker::setLoaded()
{
    DocumentBroker::setLoaded();

    // FIXME: Check for security violations.
    Poco::Path toPath(getPublicUri().getPath());
    toPath.setExtension(maFormat);

    // file:///user/docs/filename.ext normally, file:///<jail-root>/user/docs/filename.ext in the nocaps case
    const std::string toJailURL = "file://" +
        (LOOLWSD::NoCapsForKit? getJailRoot(): "") +
        std::string(JAILED_DOCUMENT_ROOT) + toPath.getFileName();

    std::string encodedTo;
    Poco::URI::encode(toJailURL, "", encodedTo);

    // Convert it to the requested format.
    const std::string saveAsCmd = "saveas url=" + encodedTo + " format=" + maFormat + " options=" + maSaveAsOptions;

    // Send the save request ...
    std::vector<char> saveasRequest(saveAsCmd.begin(), saveAsCmd.end());

    mpClientSession->handleMessage(saveasRequest);
}

} // namespace OxOOL