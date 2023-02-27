/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
  * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include "config.h"

#include <git2.h>

#include <sysexits.h>

#include <iostream>
#include <string>
#include <memory>
#include <iostream>
#include <fstream>
#include <sstream>

#include <OxOOL/XMLConfig.h>
#include <OxOOL/Util/FileValidator.h>
#include <OxOOL/Util/OptionlValidator.h>

#include <Poco/String.h>
#include <Poco/Path.h>
#include <Poco/File.h>
#include <Poco/Timestamp.h>
#include <Poco/LocalDateTime.h>
#include <Poco/DateTimeFormat.h>
#include <Poco/DateTimeFormatter.h>
#include <Poco/Util/Application.h>
#include <Poco/Util/HelpFormatter.h>
#include <Poco/Util/Option.h>
#include <Poco/Util/OptionSet.h>
#include <Poco/Util/OptionCallback.h>
#include <Poco/Util/RegExpValidator.h>

class ModuleMaker : public Poco::Util::Application
{
public:
    ModuleMaker()
    {
        _xmlConfig = std::make_shared<OxOOL::XMLConfig>();
        git_libgit2_init();
    }

    ~ModuleMaker()
    {
        git_libgit2_shutdown();
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

        // 取得使用者 git 的 user.name 及 user.email
        const std::string userName = getGitConfig("user.name");
        const std::string userEmail = getGitConfig("user.email");
        // 組合成 "name <email>" 格式
        const std::string author(userName + " <" + userEmail + ">");

        // 設定 config 預設值
        std::map<std::string, std::string> defaultConfig = {
            {"user-name", userName},
            {"user-email", userEmail},
            {"module-name", ""},
            {"module-serviceURI", ""},
            {"module-version", "0.0.1"},
            {"module-summary", ""},
            {"module-author", author},
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
            .required(false).repeatable(false).argument("name")
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
            Poco::Util::Option("author", "", "Author. default: \"" + author + "\"")
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
            .validator(new OxOOL::Util::FileValidator(
                OxOOL::Util::FileValidator::Exists |
                OxOOL::Util::FileValidator::Directory |
                OxOOL::Util::FileValidator::Read))
        );

        optionSet.addOption(
            Poco::Util::Option("output-path", "", "Specify the path where the project is located. (default: user home directory '~/')")
            .required(false).repeatable(false).argument("path")
            .binding("output-path")
            .validator(new OxOOL::Util::FileValidator(
                OxOOL::Util::FileValidator::Exists |
                OxOOL::Util::FileValidator::Directory |
                OxOOL::Util::FileValidator::Read |
                OxOOL::Util::FileValidator::Write))
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

        // 檢查 git user.name 和 user.email 是否設定
        if (config().getString("user-name").empty() || config().getString("user-email").empty())
            fatal("Git Username and Email are not set.\n"
                  "You can set it with the following command:\n"
                  "\tgit config --global --add user.name \"Your name\"\n"
                  "\tgit config --global --add user.email \"E-mail address\""
            );


        // 檢查模組名稱是否設定
        const std::string moduleName = config().getString("module-name");
        if (moduleName.empty())
            fatal("Module name must be specified.");

        // 專案輸出路徑
        Poco::Path projectPath(config().getString("output-path"));
        projectPath.append(PACKAGE_NAME "-module-" + config().getString("module-name"));

        // 專案輸出已經存在
        if (Poco::File(projectPath).exists())
            fatal("Project directory: '" + projectPath.toString() + "' already exists.");

        // 模組範本路徑
        Poco::File templatePath(config().getString("template-path"));

        // 範本目錄內，需有如下檔案
        const std::vector<std::string> requiredFiles =
        {
            "configure.ac",
            "debian/changelog"
        };
        for (auto file : requiredFiles)
        {
            const std::string requiredFile = templatePath.path() + "/" + file;
            if (!Poco::File(requiredFile).exists())
                fatal("'" + templatePath.path() + "' is not a mod template directory.");
        }

        try
        {
            /*
             * 一、複製範本目錄到專案目錄，若目標檔案已存在，會拋出例外
             */
            templatePath.copyTo(projectPath.toString(), Poco::File::OPT_FAIL_ON_OVERWRITE);

            /*
             * 二、更改指定範本檔的預設值
             */
            for (auto file : requiredFiles)
            {
                convertTemplate2Project(templatePath.path(), projectPath.toString(), file);
            }

            /*
             * 三、建立模組設定檔
             */
            // 從範本目錄讀出模組組態檔
            _xmlConfig->load(templatePath.path() + "/module.xml.in");
            // 載入 share library 檔名
            _xmlConfig->setString("module.load", "@MODULE_NAME@.so");
            _xmlConfig->setString("module.detail.name", "@MODULE_NAME@");
            // 服務位址
            _xmlConfig->setString("module.detail.serviceURI", config().getString("module-serviceURI"));
            // 版本編號依據 configure.ac 所訂
            _xmlConfig->setString("module.detail.version", "@PACKAGE_VERSION@");
            // 簡介
            _xmlConfig->setString("module.detail.summary", config().getString("module-summary"));
            // 作者依據 configure.ac 所訂
            _xmlConfig->setString("module.detail.author", "@PACKAGE_BUGREPORT@");
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
            // 存到專案目錄
            _xmlConfig->save(projectPath.toString() + "/module.xml.in");

            /*
             * 四、初始化 git 專案
             */
            if (initGitRepository(projectPath.toString()))
            {
                std::cout << "The project is created successfully, and the directory is located at:\n"
                          << "\t" << projectPath.toString() << std::endl;
            }
            else // 失敗就移除已經建立的專案目錄
            {
                Poco::File(projectPath).remove(true);
                return Poco::Util::Application::EXIT_CONFIG;
            }
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
        stopOptionsProcessing();
        displayHelp();
    }

    void displayHelp()
    {
        Poco::Util::HelpFormatter helpFormatter(options());
        helpFormatter.setCommand(commandName());
        helpFormatter.setUsage("OPTIONS");
        helpFormatter.setHeader("Quickly create OxOOL module projects.");
        helpFormatter.format(std::cout);
        std::exit(EX_OK);
    }

    void convertTemplate2Project(const std::string& templatePath,
                                 const std::string& projectPath,
                                 const std::string& filename)
    {
        // RFC 1123 格式的日期時間字串
        // e.g. Mon, 27 Feb 2023 14:32:22 +0800
        const static std::string GENERATE_DATETIME = Poco::DateTimeFormatter::format(
            Poco::LocalDateTime(), Poco::DateTimeFormat::RFC1123_FORMAT);

        const static std::string moduleName = config().getString("module-name");
        // 模組版本
        const static std::string moduleVersion = config().getString("module-version");
        // 模組作者
        const static std::string moduleAuthor = config().getString("module-author");

        // 1.從範本目錄讀取檔案
        const std::string file = templatePath + "/" + filename;
        std::stringstream outStr;
        std::ifstream inputFile(file);
        outStr << inputFile.rdbuf();
        inputFile.close();
        // 2.取代範本字串
        std::string newContent = Poco::replace(outStr.str(), std::string("%MODULE_NAME%"), moduleName);
        newContent = Poco::replace(newContent, std::string("%GENERATE_DATETIME%"), GENERATE_DATETIME);
        newContent = Poco::replace(newContent, std::string("%OXOOL_NAME%"), std::string(PACKAGE_NAME));
        newContent = Poco::replace(newContent, std::string("%MODULE_VERSION%"), moduleVersion);
        newContent = Poco::replace(newContent, std::string("%MODULE_AUTHOR%"), moduleAuthor);
        // 3.存入專案目錄
        std::ofstream fileOut(projectPath + "/" + filename);
        fileOut << newContent;
        fileOut.close();
    }

    std::string getGitConfig(const std::string& key)
    {
        std::string returnValue;

        git_config *cfg = NULL;
        int error = git_config_open_default(&cfg);
        if (!error)
        {
            git_config_entry *entry = NULL;
            error = git_config_get_entry(&entry, cfg, key.c_str());
            if (!error)
            {
                returnValue = entry->value;
                git_config_entry_free(entry);
            }
            git_config_free(cfg);
        }

        return returnValue;
    }

    bool initGitRepository(const std::string& repositoryPath)
    {
        enum print_options {
            NONE = 0,
            SKIP = 1,
            VERBOSE = 2,
            UPDATE = 4,
        };

        struct print_payload {
                enum print_options options;
                git_repository *repo;
        };

        // 1. 初始化 git
        git_repository *repo = NULL;
        int error = git_repository_init(&repo, repositoryPath.c_str(), false);
        if (!error)
        {
            // 2.取得預設的簽名資訊
            git_signature *sig;
            error = git_signature_default(&sig, repo);
            if (!error)
            {
                // 3. 取得所有檔案索引
                git_index *idx = NULL;
                error = git_repository_index(&idx, repo);
                if (!error)
                {
                    char *paths[] = {(char *)"."};
                    git_strarray arr = {paths, 1};
                    struct print_payload payload;
                    payload.options = print_options::NONE;
                    payload.repo = repo;
                    git_index_add_all(idx, &arr, 0, NULL, &payload);
                    git_index_write(idx);

                    git_oid tree_id;
                    error = git_index_write_tree(&tree_id, idx);
                    if (!error)
                    {
                        git_tree *tree;
                        error = git_tree_lookup(&tree, repo, &tree_id);
                        if (!error)
                        {
                            // Ready to create the initial commit.
                            git_oid commit_id;
                            error = git_commit_create_v(
                                        &commit_id, repo, "HEAD", sig, sig,
                                        "UTF-8", "Initialize module.", tree, 0);
                            if (error)
                                fatalNoExit("Could not create the initial commit.");

                            git_tree_free(tree);
                        }
                        else
                        {
                            fatalNoExit("Could not look up initial tree.");
                        }
                    }
                    else
                    {
                        fatalNoExit("Unable to write initial tree from index.");
                    }

                    git_index_free(idx);
                }
                else
                {
                    fatalNoExit("Could not open repository index");
                }
                git_signature_free(sig);
            }
            else
            {
                fatalNoExit("Unable to create a commit signature.\n"
                    "Perhaps 'user.name' and 'user.email' are not set.\n"
                    "You can set it with the following command:\n"
                    "\tgit config --global --add user.name \"Your name\"\n"
                    "\tgit config --global --add user.email \"E-mail address\""
                    );
            }
            git_repository_free(repo);
        }
        else
        {
            fatalNoExit("Could not initialize repository.");
        }

        return !error;
    }

    void fatal(const std::string& message)
    {
        std::cerr << message << std::endl;
        std::exit(1);
    }

    bool fatalNoExit(const std::string& message)
    {
        std::cerr << message << std::endl;
        return false;
    }

private:

    std::shared_ptr<OxOOL::XMLConfig> _xmlConfig;

    static std::string _defaultTemplatePath;
};

std::string ModuleMaker::_defaultTemplatePath = MODULE_TEMPLATE_DIR;


POCO_APP_MAIN(ModuleMaker)

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
