/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <string>
#include <vector>

#include <Poco/Util/Validator.h>

namespace Poco {
namespace Util {

class Option;

} } // namespace Poco::Util

namespace OxOOL
{
namespace Util
{

/**
 * @brief 驗證器檢查選項值是否在允許的列表中
 * The validator checks that the option value is in the allowed list.
 */
class OptionValidator : public Poco::Util::Validator
{
public:
    /**
     * @brief 建構驗證器
     * Construct a new Option Validator object.
     *
     * @param optionValues - 允許的選項列表
     * List of allowed options.
     *
     * @param multipleChoices - 可否多重選項(預設不可)
     * Whether multiple options are available (not available by default)
     */
    OptionValidator(const std::vector<std::string>& optionValues, bool multipleChoices = false);

    /**
     * @brief Destroy the Option Validator object
     */
    ~OptionValidator() {};

    /**
     * @brief 驗證指定的值是否在選項列表中，如果無效，會產生 OptionException 例外
     * Validates that the specified value is in the options list and
     * raises an OptionException if invalid.
     */
    void validate(const Poco::Util::Option& option, const std::string& value) override;

private:
    OptionValidator();

    void checkValid(const Poco::Util::Option& option, const std::string& value);

    bool mbMultipleChoices;
    std::vector<std::string> mpOptions;
};


} // namespace Util
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
