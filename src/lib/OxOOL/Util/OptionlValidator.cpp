/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <algorithm>

#include <OxOOL/Util/OptionlValidator.h>

#include <Poco/StringTokenizer.h>
#include <Poco/String.h>
#include <Poco/Util/Option.h>
#include <Poco/Util/OptionException.h>

namespace OxOOL
{
namespace Util
{

OptionValidator::OptionValidator(const std::vector<std::string>& optionValues,
                                 bool multipleChoices)
    : mbMultipleChoices(multipleChoices)
    , mpOptions(optionValues) {}

void OptionValidator::validate(const Poco::Util::Option& option,
                               const std::string& value)
{
    //const std::string errHeader = "[" + option.fullName() + "]\n";
    // 只能單選
    if (!mbMultipleChoices)
    {
        checkValid(option, Poco::trim(value));
    }
    else // 可多重選擇
    {
        // 把檢查值分割成 tokens
        Poco::StringTokenizer tokens(value, ",",
            Poco::StringTokenizer::TOK_TRIM | Poco::StringTokenizer::TOK_IGNORE_EMPTY);

        // 檢查每個 token 是否符合 mpOptions 所列舉的項目
        for (auto token : tokens)
            checkValid(option, token);
    }
}

/**
 * @brief 尋找選項列表中，是否有指定的值
 *
 * @param value - 欲尋找的值
 */
void OptionValidator::checkValid(const Poco::Util::Option& option, const std::string& value)
{
    // 沒有找到
    if (std::find(mpOptions.begin(), mpOptions.end(), value) == mpOptions.end())
    {
        const std::string fullName = option.fullName().empty() ? "" : "--" + option.fullName();
        const std::string shortName = option.shortName().empty() ? "" : "-" + option.shortName();
        const std::string errorHeader = Poco::cat(fullName,
            std::string(!fullName.empty() && !shortName.empty() ? " or " : ""), shortName);
        const std::string errorMessage = mbMultipleChoices
            ? "Must be one of the following options: "
            : "Can only be one of the following: " ;

        throw Poco::Util::UnknownOptionException(errorHeader + " = \"" + value + "\"\n"
            + errorMessage
            + "\"" + Poco::cat(std::string("\", \""), mpOptions.begin(), mpOptions.end()) + "\".\n");
    }
}

} // namespace Util
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
