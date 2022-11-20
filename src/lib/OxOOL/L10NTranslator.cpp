/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <Poco/Exception.h>
#include <OxOOL/L10NTranslator.h>
#include <OxOOL/HttpHelper.h>
#include <OxOOL/ModuleManager.h>

#include <common/Log.hpp>

namespace OxOOL
{

L10NTranslator::L10NTranslator(const std::string& language,
                               const std::string& moduleName,
                               const bool isAdmin) :
    maLanguage(language)
{
    mpModule = OxOOL::ModuleManager::instance().getModuleByName(moduleName);
    makeTranslator(isAdmin);
}

L10NTranslator::L10NTranslator(const Poco::Net::HTTPRequest& request,
                               const OxOOL::Module::Ptr& module,
                               const bool isAdmin) :
    mpModule(module)
{
    maLanguage = OxOOL::HttpHelper::getAcceptLanguage(request);
    makeTranslator(isAdmin);
}

const std::string L10NTranslator::getTranslation(std::string& message) const
{
    if (mpTranslator != nullptr && mpTranslator->has(message))
    {
        return mpTranslator->getValue<std::string>(message);
    }

    return message;
}

void L10NTranslator::makeTranslator(const bool isAdmin)
{
    mpTranslator = nullptr;

    if (mpModule == nullptr)
        return;

    std::string rootPath = mpModule->getDocumentRoot() + (isAdmin ? "/admin" : "/html");
    // 有取得 client 的語系
    if (!maLanguage.empty())
    {
        // 語系列表檔所在路徑
        const Poco::File adminL10NFile(rootPath + "/localizations.json");
        // 語系列表檔案存在，就讀取內容
        if (adminL10NFile.exists())
        {
            // 把語系檔讀入字串
            Poco::FileInputStream fis(adminL10NFile.path(), std::ios::binary);
            std::stringstream localizationsJsonStr;
            Poco::StreamCopier::copyStream(fis, localizationsJsonStr);
            fis.close();

            Poco::JSON::Parser parser;
            auto result = parser.parse(localizationsJsonStr.str());

            try
            {
                Poco::JSON::Object::Ptr L10NJSON = result.extract<Poco::JSON::Object::Ptr>();
                // 有包含該語系
                if (L10NJSON->has(maLanguage))
                {
                    // 該語系檔案所在位置
                    Poco::File langFile(rootPath + "/" + L10NJSON->getValue<std::string>(maLanguage));

                    // 語系檔案存在，就讀入內容
                    if (langFile.exists())
                    {
                        Poco::FileInputStream langFileStrem(langFile.path(), std::ios::binary);
                        std::stringstream translateStr;
                        Poco::StreamCopier::copyStream(langFileStrem, translateStr);
                        langFileStrem.close();

                        parser.reset();
                        auto langResult = parser.parse(translateStr.str());
                        try
                        {
                            mpTranslator = langResult.extract<Poco::JSON::Object::Ptr>();
                        }
                        catch(const Poco::Exception& exc)
                        {
                            LOG_ERR("Admin module [" << mpModule->getDetail().name << "]:" << exc.displayText());
                        }
                    }
                }
            }
            catch(const Poco::Exception& exc)
            {
                LOG_ERR("Admin module [" << mpModule->getDetail().name << "]:" << exc.displayText());
            }
        }
    }
}

} // namespace OxOOL