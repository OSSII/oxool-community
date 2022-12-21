/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <Poco/Net/NetSSL.h>
#include <Poco/Net/PrivateKeyPassphraseHandler.h>
#include <iostream>

namespace OxOOL
{

namespace Net
{

/// An implementation of PrivateKeyPassphraseHandler.
class PrivateKeyHandler: public Poco::Net::PrivateKeyPassphraseHandler
{
public:
	/// Creates the OxOOLPrivateKeyHandler.
	PrivateKeyHandler(bool server, const std::string& password = std::string()) :
		PrivateKeyPassphraseHandler(server),
		maDefaultPassword(password) {}

	/// Destroys the OxOOLPrivateKeyHandler
	virtual ~PrivateKeyHandler() {}

	/// Set private key password.
	void onPrivateKeyRequested(const void* /*pSender*/, std::string& privateKey)
	{
		// 沒有預設的密碼，由 Console 輸入取得
		//
		if (maDefaultPassword.empty())
		{
			std::cout << "Please enter the private key password: ";
			std::cin >> privateKey;
		}
		else // 直接回覆預設密碼
			privateKey = maDefaultPassword;
	}

private:
	std::string maDefaultPassword;
};

} // namespace Net

} // namespace OxOOL
