/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <string>
#include <memory>

#include <Poco/Util/XMLConfiguration.h>

namespace OxOOL
{

class XMLConfig final : public Poco::Util::XMLConfiguration
{
public:
	using Ptr = std::shared_ptr<XMLConfig>;

	XMLConfig() {}

	XMLConfig(const std::string& configFile);
};

} // namespace OxOOL
