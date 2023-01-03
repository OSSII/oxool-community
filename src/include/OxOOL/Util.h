/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>

#include <string>

namespace OxOOL
{
namespace Util
{

    /// 以 AES 256 加密字串
    std::string encryptAES256(const std::string& text,
                              const std::string& password = std::string());

    /// 以 AES 256 解密字串
    std::string decryptAES256(const std::string& text,
                              const std::string& password = std::string());

    /// @brief  取得用於 http 標頭的日期時間字串
    /// @return std::string
    std::string getHttpTimeNow();

} // namespace Util
} // namespace OxOOL

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
