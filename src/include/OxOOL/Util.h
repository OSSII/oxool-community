/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <OxOOL/OxOOL.h>

#include <set>
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

/// Return true if the subject matches in given set. It uses regex
/// Mainly used to match WOPI hosts patterns
bool matchRegex(const std::set<std::string>& set, const std::string& subject);

/// Given one or more patterns to allow, and one or more to deny,
/// the match member will return true if, and only if, the subject
/// matches the allowed list, but not the deny.
/// By default, everything is denied.
class RegexListMatcher
{
public:
    RegexListMatcher() :
        _allowByDefault(false)
    {
    }

    RegexListMatcher(const bool allowByDefault) :
        _allowByDefault(allowByDefault)
    {
    }

    RegexListMatcher(std::initializer_list<std::string> allowed) :
        _allowByDefault(false),
        _allowed(allowed)
    {
    }

    RegexListMatcher(std::initializer_list<std::string> allowed,
                        std::initializer_list<std::string> denied) :
        _allowByDefault(false),
        _allowed(allowed),
        _denied(denied)
    {
    }

    RegexListMatcher(const bool allowByDefault,
                        std::initializer_list<std::string> denied) :
        _allowByDefault(allowByDefault),
        _denied(denied)
    {
    }

    void allow(const std::string& pattern) { _allowed.insert(pattern); }
    void deny(const std::string& pattern)
    {
        _allowed.erase(pattern);
        _denied.insert(pattern);
    }

    void clear()
    {
        _allowed.clear();
        _denied.clear();
    }

    bool match(const std::string& subject) const
    {
        return (_allowByDefault ||
                matchRegex(_allowed, subject)) &&
                !matchRegex(_denied, subject);
    }

    // whether a match exist within both _allowed and _denied
    bool matchExist(const std::string& subject) const
    {
        return (matchRegex(_allowed, subject) ||
                matchRegex(_denied, subject));
    }

    bool empty() const
    {
        return _allowed.empty() && _denied.empty();
    }

private:
    const bool _allowByDefault;
    std::set<std::string> _allowed;
    std::set<std::string> _denied;
};

} // namespace OxOOL::Util

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
