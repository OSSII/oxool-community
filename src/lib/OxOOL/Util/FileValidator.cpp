/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <algorithm>

#include <OxOOL/Util/FileValidator.h>

#include <Poco/File.h>
#include <Poco/Util/Option.h>
#include <Poco/Util/OptionException.h>

namespace OxOOL
{
namespace Util
{

void FileValidator::validate(const Poco::Util::Option& /* option */,
                               const std::string& value)
{
    const Poco::File file(value);
    std::string reason;

    // 檢查檔案是否不存在
    if (_defaultType == 0 && file.exists())
        reason = "File already exists.";
    // 指定檢查檔案是否存在
    else if (_defaultType & CheckType::Exists && !file.exists())
        reason = "File does not exist.";
    // 檢查是否是檔案
    else if (_defaultType & CheckType::File && !file.isFile())
        reason = "The specified target is not a file.";
    // 檢查是否是目錄
    else if (_defaultType & CheckType::Directory && !file.isDirectory())
        reason = "The specified target is not a directory.";
    // 檢查能否讀取
    else if (_defaultType & CheckType::Read && !file.canRead())
        reason = "No read permission.";
    // 檢查能否寫入
    else if (_defaultType & CheckType::Write && !file.canWrite())
        reason = "No write permission.";
    // 檢查能否執行
    else if (_defaultType & CheckType::Execute && !file.canExecute())
        reason = "No execute permission.";

    if (!reason.empty())
        throw Poco::Util::InvalidArgumentException(value, reason);
}

} // namespace Util
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
