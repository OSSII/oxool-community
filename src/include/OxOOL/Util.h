/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>

#include <string>

namespace OxOOL::Util
{
/// 以 AES 256 加密字串
std::string encryptAES256(const std::string& text,
                            const std::string& password = std::string());

/// 以 AES 256 解密字串
std::string decryptAES256(const std::string& text,
                            const std::string& password = std::string());

/// @brief 將字串轉成 bool
/// 如果字串內容是 "true"、"yes" "on" 或是數字非 "0"，則傳回 true，否則為 false
/// @param str - 不分大小寫字串
/// @return true / false
bool stringToBool(const std::string& str);

} // namespace OxOOL::Util

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
