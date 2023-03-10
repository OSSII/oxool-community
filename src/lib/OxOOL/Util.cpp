/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <OxOOL/Util.h>

#include <set>
#include <string>


#include <Poco/String.h>
#include <Poco/Crypto/Crypto.h>
#include <Poco/Crypto/Cipher.h>
#include <Poco/Crypto/CipherKey.h>
#include <Poco/Crypto/CipherFactory.h>

namespace OxOOL::Util
{

std::string encryptAES256(const std::string& text,
                            const std::string& password)
{
    std::string insurePassword = password.size() == 0 ? "80542203" : password;
    // 縮放大小為 32 bytes(256 bits)，不足的話補 '0'，太長就縮短
    insurePassword.resize(32, '0');
    const std::string ivString("80542203805422038054220380542203");
    Poco::Crypto::Cipher::ByteVec iv{ivString.begin(), ivString.end()};
    Poco::Crypto::Cipher::ByteVec passwordKey{ insurePassword.begin(), insurePassword.end() };
    Poco::Crypto::CipherKey key("aes-256-cbc", passwordKey, iv);
    Poco::Crypto::Cipher::Ptr cipher = Poco::Crypto::CipherFactory::defaultFactory().createCipher(key);
    return cipher->encryptString(text, Poco::Crypto::Cipher::ENC_BASE64);
}

std::string decryptAES256(const std::string& text,
                            const std::string& password)
{
    std::string insurePassword = password.size() == 0 ? "80542203" : password;
    // 縮放大小為 32 bytes(256 bits)，不足的話補 '0'，太長就縮短
    insurePassword.resize(32, '0');
    const std::string ivString("80542203805422038054220380542203");
    Poco::Crypto::Cipher::ByteVec iv{ ivString.begin(), ivString.end() };
    Poco::Crypto::Cipher::ByteVec passwordKey{ insurePassword.begin(), insurePassword.end() };
    Poco::Crypto::CipherKey key("aes-256-cbc", passwordKey, iv);
    Poco::Crypto::Cipher::Ptr pCipherAES256 = Poco::Crypto::CipherFactory::defaultFactory().createCipher(key);
    return pCipherAES256->decryptString(text, Poco::Crypto::Cipher::ENC_BASE64);
}

bool stringToBool(const std::string& str)
{
    static std::set<std::string> trueSet = { "true", "yes", "on"};

    // 找是否符合條件的字串
    if (auto it = trueSet.find(Poco::toLower(str)); it != trueSet.end())
        return true;

    // 試著轉成 long int
    try
    {
        return std::stol(str) != 0 ? true : false;
    }
    catch(const std::exception& e)
    {
        // do nothing.
    }
    return false;
}

} // namespace OxOOL::Util

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
