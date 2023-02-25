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
#include <iostream>
#include <fstream>
#include <sstream>

#include <OxOOL/Util/OptionlValidator.h>
#include <OxOOL/XMLConfig.h>

#include <Poco/String.h>
#include <Poco/Path.h>
#include <Poco/File.h>
#include <Poco/Process.h>
#include <Poco/Util/Application.h>
#include <Poco/Util/HelpFormatter.h>
#include <Poco/Util/Option.h>
#include <Poco/Util/OptionSet.h>
#include <Poco/Util/OptionCallback.h>
#include <Poco/Util/OptionException.h>
#include <Poco/Util/RegExpValidator.h>
#include <Poco/Util/XMLConfiguration.h>

#include <Poco/Util/Validator.h>

class TemplatePathValidator : public Poco::Util::Validator
{
public:
    void validate(const Poco::Util::Option& /* option */, const std::string& value) override
    {

        Poco::File templatePath(value);
        if (templatePath.exists() && templatePath.isDirectory() && templatePath.canRead())
        {
            if (!Poco::File(templatePath.path() + "/configure.ac").exists())
            {
                throw Poco::Util::InvalidArgumentException(value, "Not a module template directory for OxOOL.");
            }
        }
        else
        {
            std::string reason;
            if (!templatePath.exists())
                reason = "Not exists.";
            else if (!templatePath.isDirectory())
                reason = "Not a directory.";
            else if (!templatePath.canRead())
                 reason = "Unable to read.";
            else
                reason = "Unknown reason.";

            throw Poco::Util::InvalidArgumentException(value, reason);
        }
    }
};

/**
 * 存放專案路徑檢查
 *
 */
class OutputPathValidator : public Poco::Util::Validator
{
public:
    void validate(const Poco::Util::Option& /* option */, const std::string& value) override
    {
        const Poco::Path pathValue(value); // 可將 '~' 轉成真正家目錄路徑
        Poco::File outputPath(pathValue);
        if (outputPath.exists() && outputPath.isDirectory()
            && outputPath.canRead() && outputPath.canWrite())
        {
            return;
        }

        std::string reason;
        if (!outputPath.exists())
            reason = "Not exists.";
        else if (!outputPath.isDirectory())
            reason = "Not a directory.";
        else if (!outputPath.canRead())
                reason = "Unable to read.";
        else if (!outputPath.canWrite())
            reason = "Unable to write.";
        else
            reason = "Unknown reason.";

        throw Poco::Util::InvalidArgumentException(value, reason);
    }
};

class ModuleMaker : public Poco::Util::Application
{
public:
    ModuleMaker()
    {
        _xmlConfig = std::make_shared<OxOOL::XMLConfig>();
    }

    ~ModuleMaker()
    {
    }

protected:
    void initialize(Application& self) override
    {
        _xmlConfig->loadEmpty("config");
        Poco::Util::Application::initialize(self);
    }

    void uninitialize() override
    {
        Poco::Util::Application::uninitialize();
    }

    void defineOptions(Poco::Util::OptionSet& optionSet) override
    {
        Poco::Util::Application::defineOptions(optionSet);

        // 設定 config 預設值
        std::map<std::string, std::string> defaultConfig = {
            {"module-name", ""},
            {"module-serviceURI", ""},
            {"module-version", "0.0.1"},
            {"module-summary", ""},
            {"module-author", ""},
            {"module-license", "MPLv2.0"},
            {"module-description", ""},
            {"module-adminPrivilege", "false"},
            {"module-adminIcon", "bug-fill"},
            {"module-adminItem", ""},
            {"template-path", _defaultTemplatePath},
            {"output-path", "~/"}, // 新專案所在目錄
        };

        for (auto item : defaultConfig)
        {
            config().setString(item.first, item.second);
        }

        // 顯示選項說明
        optionSet.addOption(
            Poco::Util::Option("help", "h", "Print this help.")
            .required(false).repeatable(false)
            .callback(Poco::Util::OptionCallback<ModuleMaker>(this, &ModuleMaker::displayHelp))
        );

        // 模組名稱
        optionSet.addOption(
            Poco::Util::Option("module-name", "", "The module name.")
            .binding("module-name")
            .required(true).repeatable(false).argument("name")
            .validator(new Poco::Util::RegExpValidator("^[\\w\\-@#]+$"))
        );

        // 服務位址
        optionSet.addOption(
            Poco::Util::Option("serviceURI", "", "The service address of the module.")
            .binding("module-serviceURI")
            .required(false).repeatable(false).argument("service URI")
        );

        // 版本
        optionSet.addOption(
            Poco::Util::Option("version", "", "Version Number. default \"0.0.1\"")
            .binding("module-version")
            .required(false).repeatable(false).argument("version")
        );

        // 簡介
        optionSet.addOption(
            Poco::Util::Option("summary", "", "Summary.")
            .binding("module-summary")
            .required(false).repeatable(false).argument("summary")
        );

        // 作者
        optionSet.addOption(
            Poco::Util::Option("author", "", "Author.")
            .binding("module-author")
            .required(false).repeatable(false).argument("author")
        );

        // 授權
        optionSet.addOption(
            Poco::Util::Option("license", "", "What license. (default: MPLv2.0)")
            .binding("module-license")
            .required(false).repeatable(false).argument("license")
        );

        // 詳細說明
        optionSet.addOption(
            Poco::Util::Option("description", "", "Description.")
            .binding("module-description")
            .required(false).repeatable(false).argument("description")
        );

        // service URI 是否需要管理權限
        optionSet.addOption(
            Poco::Util::Option("adminPrivilege", "", "Whether the service URI needs admin permission. default \"false\"")
            .binding("module-adminPrivilege")
            .required(false).repeatable(false).argument("true/false")
            .validator(new OxOOL::Util::OptionValidator({"true", "false", "yes", "no"}, true))
        );

        // 後臺管理圖示
        optionSet.addOption(
            Poco::Util::Option("adminIcon", "", "Admin management icons(please refer to: https://icons.getbootstrap.com/), default \"bug-fill\"")
            .binding("module-adminIcon")
            .required(false).repeatable(false).argument("icon")
        );

        // 後臺管理選項文字
        optionSet.addOption(
            Poco::Util::Option("adminItem", "", "Admin management text.")
            .binding("module-adminItem")
            .required(false).repeatable(false).argument("text")
        );

        optionSet.addOption(
            Poco::Util::Option("template-path", "", "Manually specify the module template path. (default: " + _defaultTemplatePath + ")")
            .required(false).repeatable(false).argument("path")
            .binding("template-path")
            .validator(new TemplatePathValidator())
        );

        optionSet.addOption(
            Poco::Util::Option("output-path", "", "Specify the path where the project is located. (default: user home directory '~/')")
            .required(false).repeatable(false).argument("path")
            .binding("output-path")
            .validator(new OutputPathValidator())
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
        // 模組名稱
        const std::string moduleName = config().getString("module-name");
        // 模組版本
        const std::string moduleVersion = config().getString("module-version");
        // 模組作者
        const std::string moduleAuthor = config().getString("module-author");

        // 專案輸出路徑
        Poco::Path projectPath(config().getString("output-path"));
        projectPath.append("oxool-module-" + config().getString("module-name"));

        // 專案輸出已經存在
        if (Poco::File(projectPath).exists())
        {
            std::cerr << "Project directory: '" << projectPath.toString() << "' already exists." << std::endl;
            return Poco::Util::Application::EXIT_CANTCREAT;
        }

        // 模組範本路徑
        Poco::File templatePath(config().getString("template-path"));
        try
        {
            /*
             * 一、複製範本目錄到專案目錄，若目標檔案已存在，會拋出例外
             */
            templatePath.copyTo(projectPath.toString(), Poco::File::OPT_FAIL_ON_OVERWRITE);

            /*
             * 二、更改 configure.ac 的預設值
             */
            // 1.從範本目錄讀取 configure.ac
            const std::string configureAC = templatePath.path() + "/configure.ac";
            std::stringstream outStr;
            std::ifstream inputFile(configureAC);
            outStr << inputFile.rdbuf();
            inputFile.close();
            // 2.取代範本字串
            std::string newConfigureAC = Poco::replace(outStr.str(), std::string("%MODULE_NAME%"), moduleName);
            newConfigureAC = Poco::replace(newConfigureAC, std::string("%MODULE_VERSION%"), moduleVersion);
            newConfigureAC = Poco::replace(newConfigureAC, std::string("%MODULE_AUTHOR%"), moduleAuthor);
            // 3.存入專案目錄
            std::ofstream out(projectPath.toString() + "/configure.ac");
            out << newConfigureAC;
            out.close();

            /*
             * 三、建立模組設定檔
             */
            // 預設啟用
            _xmlConfig->setString("module[@enable]", "true");
            // 載入 share library 檔名
            _xmlConfig->setString("module.load", moduleName + ".so");
            _xmlConfig->setString("module.detail.name", moduleName);
            // 服務位址
            _xmlConfig->setString("module.detail.serviceURI", config().getString("module-serviceURI"));
            // 版本編號依據 configure.ac 所訂
            _xmlConfig->setString("module.detail.version", "@PACKAGE_VERSION@");
            // 簡介
            _xmlConfig->setString("module.detail.summary", config().getString("module-summary"));
            // 作者
            _xmlConfig->setString("module.detail.author", moduleAuthor);
            // 授權
            _xmlConfig->setString("module.detail.license", config().getString("module-license"));
            // 詳細說明
            _xmlConfig->setString("module.detail.description", config().getString("module-description"));
            // 該服務是否需 admin 權限
            _xmlConfig->setString("module.detail.adminPrivilege", config().getString("module-adminPrivilege"));
            // 後臺管理圖示
            _xmlConfig->setString("module.detail.adminIcon", config().getString("module-adminIcon"));
            // 後臺管理選項文字
            _xmlConfig->setString("module.detail.adminItem", config().getString("module-adminItem"));
            // 存到專案目錄下名為 模組名稱.xml.in
            _xmlConfig->save(projectPath.toString() + "/" + moduleName + ".xml.in");

            /*
             * 四、初始化 git 專案
             */
            auto initHdl = Poco::Process::launch("git", {"init", "-q"}, projectPath.toString());
            initHdl.wait(); // 等待完成
            auto addHdl = Poco::Process::launch("git", {"add", "."}, projectPath.toString());
            addHdl.wait(); // 等待完成
            auto commitHdl = Poco::Process::launch("git", {"commit", "-q", "-m", "Initialize module."}, projectPath.toString());
            commitHdl.wait(); // 等待完成

            std::cout << "The project is created successfully, and the directory is located at:\n"
                      << "\t" << projectPath.toString() << std::endl;
        }
        catch(const Poco::FileExistsException& e)
        {
            std::cerr << e.name() << ": " << e.message() << '\n';
            return Poco::Util::Application::EXIT_CANTCREAT;
        }

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
        helpFormatter.setHeader("Quickly create OxOOL module projects.");
        helpFormatter.format(std::cout);
        stopOptionsProcessing();
        std::exit(EX_OK);
    }

    std::shared_ptr<OxOOL::XMLConfig> _xmlConfig;

    static std::string _defaultTemplatePath;
};

std::string ModuleMaker::_defaultTemplatePath = MODULE_TEMPLATE_DIR;


POCO_APP_MAIN(ModuleMaker)

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
