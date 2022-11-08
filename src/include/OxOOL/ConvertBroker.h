
#pragma once

#include <string>
#include <functional>

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
                  const std::string& toFormat,
                  const std::string& saveAsOptions = std::string());

    virtual ~ConvertBroker();

    typedef std::function<void()> CallbackFn;
    /// @brief 文件載入完畢後，可介入後續處理，若未自訂 callback，則會自動執行 saveAsDocument()
    /// @param fn - 自訂的 callback 函數
    void loadedCallback(const CallbackFn& fn) { mpCallback = fn; }

    /// @brief 取得 Client seccion
    /// @return Client seccion
    std::shared_ptr<ClientSession> getClientSession() const { return mpClientSession ; }

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

    /// @brief 另存新檔
    void saveAsDocument();

    /// Called when removed from the DocBrokers list
    void dispose() override;

    /// Cleanup path and its parent
    void removeFile(const std::string &uri);

private:
    const std::string maFormat;
    const std::string maSaveAsOptions;

    CallbackFn mpCallback;
    std::shared_ptr<ClientSession> mpClientSession;
};

} // namespace OxOOL
