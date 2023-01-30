
#pragma once

#include <string>
#include <functional>

#include <Poco/URI.h>

#include <wsd/DocumentBroker.hpp>

class StreamSocket;
class ClientSession;

namespace OxOOL
{

class ConvertBroker final : public StatelessBatchBroker
{
public:
    /// Construct DocumentBroker with URI and docKey
    ConvertBroker(const std::string& uri,
				  const Poco::URI& uriPublic,
				  const std::string& docKey,
                  const std::string& toFormat,
                  const std::string& saveAsOptions = std::string());

    virtual ~ConvertBroker();

    typedef std::function<void()> CallbackFn;
    /// @brief 文件載入完畢後，可介入後續處理，若未自訂 callback，則會自動執行 saveAsDocument()
    /// @param fn - 自訂的 callback 函數
    void loadedCallback(const CallbackFn& fn) { mpCallback = fn; mbCallbackIsCalled = false; }

    /// @brief 以唯讀模式載入文件
    /// @param socket
    /// @return
    bool loadDocumentReadonly(const std::shared_ptr<StreamSocket>& socket)
    {
        return loadDocument(socket, true);
    }

    /// 載入文件，完成後，會觸發 setLoaded()
    bool loadDocument(const std::shared_ptr<StreamSocket>& socket, const bool isReadonly = false);

    /// 文件載入完成，觸發這個函數
    void setLoaded() override;

    /// Called when removed from the DocBrokers list
    void dispose() override;

    /// @brief 另存新檔，並傳送給 client
    void saveAsDocument();

    /// @brief  傳送指令到 kit
    /// @param command
    void sendMessageToKit(const std::string& command);

    /// @brief 建立 Convert broker
    /// @param fromFile
    /// @param toFormat
    /// @param saveAsOptions
    /// @return
    static std::shared_ptr<ConvertBroker> create(const std::string& fromFile,
                                                 const std::string& toFormat,
                                                 const std::string& saveAsOptions = std::string());

    /// @brief 清理用完的 Convert Brokers
    static void cleanup();

private:
    bool isConvertTo() const override { return true; }

private:
    const std::string maFormat;
    const std::string maSaveAsOptions;

    CallbackFn mpCallback;
    bool mbCallbackIsCalled;
};

} // namespace OxOOL
