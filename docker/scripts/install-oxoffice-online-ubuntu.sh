#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Refresh repos otherwise installations later may fail
apt-get update

# Install HTTPS transport
apt-get -y install apt-transport-https

# Install tzdata to accept the TZ environment variable
apt-get -y install tzdata

# Install some more fonts
apt-get -y install fonts-open-sans

# Install gnupg for apt-key
apt-get -y install gnupg

# install ca-certificates
apt-get -y install ca-certificates

# install ssh-keygen binary for the WOPI proof key
apt-get -y install openssh-client

# Install curl for simple healthchecks
apt-get -y install curl

# Add OxOffice Online repos
curl http://www.oxoffice.com.tw/deb/OSSII-2022.key | apt-key add
cd /etc/apt/sources.list.d/
sudo wget http://www.oxoffice.com.tw/deb/oxool-community-v4-focal.list
apt-get update

# Install the OxOffice Online packages
apt-get -y install oxool

# Install inotifywait and killall to automatic restart oxoolwsd, if oxoolwsd.xml changes
apt-get -y install inotify-tools psmisc

# Cleanup
rm -rf /var/lib/apt/lists/*

# Remove WOPI Proof key generated by the package, we need unique key for each container
rm -rf /etc/oxool/proof_key*

# Fix permissions
# cf. start-oxoffice-online.sh that is run by lool user
# # Fix domain name resolution from jails
# cp /etc/resolv.conf /etc/hosts /opt/oxool/systemplate/etc/
chown lool:lool /opt/oxool/systemplate/etc/hosts /opt/oxool/systemplate/etc/resolv.conf
# generated ssl cert/key and WOPI proof key go into /etc/oxool
chown lool:lool /etc/oxool
