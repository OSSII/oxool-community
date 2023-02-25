/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
  * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <sysexits.h>

#include <iostream>
#include <string>
#include <memory>

#include <OxOOL/XMLConfig.h>
#include <OxOOL/Util/FileValidator.h>

#include <Poco/File.h>
#include <Poco/Util/Application.h>
#include <Poco/Util/HelpFormatter.h>
#include <Poco/Util/Option.h>
#include <Poco/Util/OptionSet.h>

class XmlConfig : public Poco::Util::Application
{
public:
    XmlConfig()
    {
        _xmlConfig = std::make_shared<OxOOL::XMLConfig>();
    }

    ~XmlConfig()
    {
    }

protected:
    void initialize(Application& self) override
    {
        Poco::Util::Application::initialize(self);
    }

    void uninitialize() override
    {
        Poco::Util::Application::uninitialize();
    }

    void defineOptions(Poco::Util::OptionSet& optionSet) override
    {
        Poco::Util::Application::defineOptions(optionSet);

        // 顯示選項說明
        optionSet.addOption(
            Poco::Util::Option("help", "h", "Print this help.")
            .required(false).repeatable(false)
            .callback(Poco::Util::OptionCallback<XmlConfig>(this, &XmlConfig::displayHelp))
        );

        // 指定 xml 檔案
        optionSet.addOption(
            Poco::Util::Option("config-file", "f", "The specified xml file.")
            .required(true).repeatable(false)
            .argument("file")
            .validator(new OxOOL::Util::FileValidator(
                OxOOL::Util::FileValidator::CheckType::File |
                OxOOL::Util::FileValidator::CheckType::Read |
                OxOOL::Util::FileValidator::CheckType::Write))
            .callback(Poco::Util::OptionCallback<XmlConfig>(this, &XmlConfig::loadConfig))
        );

        // 讀取指定 key 的內容
        optionSet.addOption(
            Poco::Util::Option("get", "g", "Get the content of the specified key.")
            .required(false).repeatable(true)
            .argument("key")
            .callback(Poco::Util::OptionCallback<XmlConfig>(this, &XmlConfig::getKey))
        );

        // 移除指定 key
        optionSet.addOption(
            Poco::Util::Option("remove", "d", "Remove the specified key.")
            .required(false).repeatable(true)
            .argument("key")
            .callback(Poco::Util::OptionCallback<XmlConfig>(this, &XmlConfig::removeKey))
        );

        // 設定指定 key 的內容
        optionSet.addOption(
            Poco::Util::Option("set", "s", "Set the content of the specified key")
            .required(false).repeatable(true)
            .argument("\"key='value'\"")
            .callback(Poco::Util::OptionCallback<XmlConfig>(this, &XmlConfig::setKey))
        );
    }

    void handleOption(const std::string& optionName,  const std::string& optionValue) override
    {
        // 呼叫 base class
        // Call the base class implementation.
        Poco::Util::Application::handleOption(optionName, optionValue);
    }

    int main(const std::vector<std::string>& args) override
    {
        (void)args;
        return Poco::Util::Application::EXIT_OK;
    }


private:
    /**
     * @brief 顯示指令說明
     *
     */
    void displayHelp(const std::string& /* name */,  const std::string& /* value */)
    {
        Poco::Util::HelpFormatter helpFormatter(options());
        helpFormatter.setCommand(commandName());
        helpFormatter.setUsage("OPTIONS");
        helpFormatter.setHeader("Read or add/delete/modify xml configuration file content.");
        helpFormatter.format(std::cout);
        stopOptionsProcessing();
        std::exit(EX_OK);
    }

    void loadConfig(const std::string& /* name */,  const std::string& value)
    {
        try
        {
            _xmlConfigFile = value;
            _xmlConfig->load(_xmlConfigFile);
        }
        catch(const std::exception& e)
        {
            std::cerr << "File '" << _xmlConfigFile << "' is not a valid xml file." << std::endl;
            std::exit(EX_CONFIG);
        }
    }

    void getKey(const std::string& /* name */,  const std::string& value)
    {
        if (checkKeyExists(value))
            std::cout << _xmlConfig->getString(value);
    }

    void removeKey(const std::string& /* name */,  const std::string& value)
    {
        if (checkKeyExists(value))
        {
            _xmlConfig->remove(value);
            _xmlConfig->save(_xmlConfigFile);
        }
    }

    void setKey(const std::string& /* name */,  const std::string& value)
    {
        const size_t equalSign = value.find_first_of('=');
        if (equalSign == std::string::npos || equalSign == 0)
        {
            std::cerr << "key : '" << value << "' Must be in the format of key=value." << std::endl;
        }
        else
        {
            const std::string key = value.substr(0, equalSign);
            const std::string content = value.substr(equalSign + 1);
            _xmlConfig->setString(key, content);
            _xmlConfig->save(_xmlConfigFile);
        }
    }

    bool checkKeyExists(const std::string& key)
    {
        if (_xmlConfig->has(key))
            return true;

        std::cerr << "Specified key: '" << key << "' not found." << std::endl;
        return false;
    }

    std::string _xmlConfigFile;
    std::shared_ptr<OxOOL::XMLConfig> _xmlConfig;
};

POCO_APP_MAIN(XmlConfig)

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
