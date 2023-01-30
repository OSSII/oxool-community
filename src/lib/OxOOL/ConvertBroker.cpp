
#include <Poco/URI.h>
#include <Poco/Path.h>
#include <Poco/File.h>

#include <OxOOL/ConvertBroker.h>

#include <common/Log.hpp>
#include <net/Socket.hpp>
#include <wsd/RequestDetails.hpp>
#include <wsd/DocumentBroker.hpp>
#include <wsd/ClientSession.hpp>

static std::mutex BrokersMutex;
static std::map<std::string, std::shared_ptr<DocumentBroker>> Brokers;

namespace OxOOL
{

ConvertBroker::ConvertBroker(const std::string& uri,
                             const Poco::URI& uriPublic,
                             const std::string& docKey,
                             const std::string& toFormat,
                             const std::string& saveAsOptions)
    : StatelessBatchBroker(uri, uriPublic, docKey)
    , maFormat(toFormat)
    , maSaveAsOptions(saveAsOptions)
    , mpCallback(nullptr)
    , mbCallbackIsCalled(false)
{
    static const std::chrono::seconds limit_convert_secs(
        LOOLWSD::getConfigValue<int>("per_document.limit_convert_secs", 100));
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
    _clientSession = std::make_shared<ClientSession>(nullPtr, id, docBroker,
        getPublicUri(), isReadOnly, requestDetails);
    _clientSession->construct();

    if (!_clientSession)
        return false;

    // addCallback 前，要先進入執行緒
    startThread();

    addCallback([this, socket]()
    {
        _clientSession->setSaveAsSocket(socket);

        // First add and load the session.
        addSession(_clientSession);

        // Load the document manually and request saving in the target format.
        std::string encodedFrom;
        Poco::URI::encode(getPublicUri().getPath(), "", encodedFrom);
        // add batch mode, no interactive dialogs
        sendMessageToKit("load url=" + encodedFrom + " batch=true");

        // 載入完畢後會觸發 setLoaded()
    });

    return true;
}

void ConvertBroker::dispose()
{
    if (!_uriOrig.empty())
    {
        StatelessBatchBroker::removeFile(_uriOrig);
        _uriOrig.clear();
    }
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
    _clientSession->handleMessage(message);
}

ConvertBroker::~ConvertBroker()
{
    // Calling a virtual function from a dtor
    // is only valid if there are no inheritors.
    dispose();
}

std::shared_ptr<ConvertBroker>
ConvertBroker::create(const std::string& fromFile,
                      const std::string& toFormat,
                      const std::string& saveAsOptions)
{
    std::unique_lock<std::mutex> brokersLock(BrokersMutex);
    Poco::URI uriPublic = RequestDetails::sanitizeURI(fromFile);
    const std::string docKey = RequestDetails::getDocKey(uriPublic);
    auto docBroker = std::make_shared<ConvertBroker>(fromFile, uriPublic, docKey,
                                                     toFormat, saveAsOptions);
    Brokers.emplace(docKey, docBroker);

    return docBroker;
}

void ConvertBroker::cleanup()
{
    std::thread([&]
    {
        std::unique_lock<std::mutex> brokersLock(BrokersMutex);
        // 有 Brokers 才進行清理工作
        if (const int beforeClean = Brokers.size(); beforeClean > 0)
        {
            for (auto it = Brokers.begin(); it != Brokers.end();)
            {
                std::shared_ptr<DocumentBroker> docBroker = it->second;
                if (!docBroker->isAlive())
                {
                    docBroker->dispose();
                    it = Brokers.erase(it);
                    continue;
                }
                else
                {
                    ++it;
                }
            }
            const int afterClean = Brokers.size();
            LOG_DBG("Clean " << beforeClean - afterClean << " Convert Broker, leaving " << afterClean << ".");
        }
    }).detach();
}

} // namespace OxOOL
