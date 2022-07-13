/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4; fill-column: 100 -*- */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#include <Poco/Net/NetSSL.h>
#include <Poco/Net/PrivateKeyPassphraseHandler.h>
#include <iostream>

namespace Poco {
namespace Net {

class NetSSL_API OxOOLPrivateKeyHandler: public PrivateKeyPassphraseHandler
	/// An implementation of PrivateKeyPassphraseHandler.
	{
public:
	/// Creates the OxOOLPrivateKeyHandler.
	OxOOLPrivateKeyHandler(bool server, std::string password = "") :
		PrivateKeyPassphraseHandler(server),
		defaultPassword(password)
	{

	}

	/// Destroys the OxOOLPrivateKeyHandler
	virtual ~OxOOLPrivateKeyHandler()
	{

	}

	/// Set private key password.
	void onPrivateKeyRequested(const void* /*pSender*/, std::string& privateKey)
	{
		// 有預設的密碼，直接回覆預設密碼
		if (defaultPassword.size() > 0)
		{
			privateKey = defaultPassword;
		}
		else
		{
			// 否則由 Console 輸入取得
			std::cout << "Please enter the private key password: ";
			std::cin >> privateKey;
		}
	}

private:
	std::string defaultPassword;
};


} } // namespace Poco::Net
