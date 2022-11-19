/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>
#include <OxOOL/Module/Base.h>

#include <Poco/Net/HTTPRequest.h>
#include <Poco/File.h>
#include <Poco/FileStream.h>
#include <Poco/StreamCopier.h>
#include <Poco/JSON/Parser.h>
#include <Poco/JSON/Object.h>

namespace OxOOL
{

class L10NTranslator
{
    L10NTranslator() = delete;
public:
    L10NTranslator(const std::string& language,
                   const std::string& moduleName,
                   const bool isAdmin = false);

    L10NTranslator(const Poco::Net::HTTPRequest& request,
                   const OxOOL::Module::Ptr& module,
                   const bool isAdmin = false);

    virtual ~L10NTranslator() {};

    /// @brief 取得翻譯器能翻譯的語言
    /// @return
    const std::string& getLanguage() const { return maLanguage; }

    /// @brief 取得翻譯結果
    /// @param message 原文
    /// @return 翻譯結果
    const std::string getTranslation(std::string& message) const;

private:
    void makeTranslator(const bool isAdmin = false);

private:
    OxOOL::Module::Ptr mpModule;

    /// @brief 翻譯的語言
    std::string maLanguage;

    Poco::JSON::Object::Ptr mpTranslator = nullptr;
};

} // namespace OxOOL