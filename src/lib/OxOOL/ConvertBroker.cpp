
#include <config.h>

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
                             const std::string& toFormat,
                             const std::string& saveAsOptions) :
    DocumentBroker(ChildType::Batch, uri, uriPublic, docKey),
    maFormat(toFormat),
    maSaveAsOptions(saveAsOptions),
    mpCallback(nullptr),
    mbCallbackIsCalled(false)
{
    static const int limit_convert_secs = LOOLWSD::getConfigValue<int>("per_document.limit_convert_secs", 100);
    _limitLifeSeconds = limit_convert_secs;
}

bool ConvertBroker::loadDocument(const std::shared_ptr<StreamSocket>& socket, const bool isReadOnly)
{
    std::shared_ptr<ConvertBroker> docBroker =
        std::static_pointer_cast<ConvertBroker>(shared_from_this());

    std::string id("ConvertBroker-" + std::to_string(socket->getFD()));
    // FIXME: associate this with moveSocket (?)
    std::shared_ptr<ProtocolHandlerInterface> nullPtr;
    RequestDetails requestDetails("convert-broker");
    mpClientSession = std::make_shared<ClientSession>(nullPtr, id, docBroker,
        getPublicUri(), isReadOnly, requestDetails);
    mpClientSession->construct();

    if (!mpClientSession)
        return false;

    // addCallback 前，要先進入執行緒
    startThread();

    addCallback([this, socket]()
    {
        mpClientSession->setSaveAsSocket(socket);

        // First add and load the session.
        addSession(mpClientSession);

        // Load the document manually and request saving in the target format.
        std::string encodedFrom;
        Poco::URI::encode(getPublicUri().getPath(), "", encodedFrom);
        sendMessageToKit("load url=" + encodedFrom);

        // 載入完畢後會觸發 setLoaded()
    });

    return true;
}

void ConvertBroker::setLoaded()
{
    DocumentBroker::setLoaded();

    // 若有指定 callback，必須自己處理載入完畢後的所有工作，包括另存新檔
    if (mpCallback != nullptr)
    {
        // 避免 Callback function 被呼叫兩次以上
        if (!mbCallbackIsCalled)
        {
            mbCallbackIsCalled = true;
            mpCallback();
        }
    }
    // 否則直接另存新檔
    else
        saveAsDocument();
}

void ConvertBroker::saveAsDocument()
{
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
    sendMessageToKit(saveAsCmd);
}

void ConvertBroker::sendMessageToKit(const std::string& command)
{
    std::vector<char> message(command.begin(), command.end());
    mpClientSession->handleMessage(message);
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

} // namespace OxOOL
