/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <string>

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
 * @brief 驗證器檔案是否符合要求
 * Whether the validator file meets the requirements.
 */
class FileValidator : public Poco::Util::Validator
{
public:

    enum CheckType
    {
        NotExists = 0,
        Exists = 1,
        File = 2,
        Directory = 4,
        Read = 8,
        Write = 16,
        Execute = 32
    };

    FileValidator() : _defaultType(CheckType::NotExists) {}

    FileValidator(unsigned int defaultType) { _defaultType = defaultType; }

    void validate(const Poco::Util::Option& option, const std::string& value) override;

private:
    unsigned int _defaultType;
};

} // Util
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
