#!/usr/bin/sh
# Configuring runtime environment of the Docker container
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2023 Collabora Online contributors <https://github.com/CollaboraOnline/online/commits/2e86ea4/docker/from-packages/scripts/start-collabora-online.sh>
# Copyright 2024 Buo-ren Lin <buoren.lin@ossii.com.tw>
# SPDX-License-Identifier: MPL-2.0

set -eu

# if the first arg looks like a flag, assume we want to run the service executable itself
if test "${1:0:1}" = '-'; then
    set -- oxoolwsd "$@"
fi

# Prepare environment only for the oxoolwsd command
if test "${1}" = oxoolwsd; then
    if test "${DONT_GEN_SSL_CERT-set}" = set; then
        # Generate new SSL certificate instead of using the default
        mkdir -p /tmp/ssl/
        cd /tmp/ssl/
        mkdir -p certs/ca
        openssl rand -writerand /opt/oxool/.rnd
        openssl genrsa -out certs/ca/root.key.pem 2048
        openssl req -x509 -new -nodes -key certs/ca/root.key.pem -days 9131 -out certs/ca/root.crt.pem -subj "/C=DE/ST=BW/L=Stuttgart/O=Dummy Authority/CN=Dummy Authority"
        mkdir -p certs/servers
        mkdir -p certs/tmp
        mkdir -p certs/servers/localhost
        openssl genrsa -out certs/servers/localhost/privkey.pem 2048
        if test "${cert_domain-set}" = set; then
        openssl req -key certs/servers/localhost/privkey.pem -new -sha256 -out certs/tmp/localhost.csr.pem -subj "/C=DE/ST=BW/L=Stuttgart/O=Dummy Authority/CN=localhost"
        else
        openssl req -key certs/servers/localhost/privkey.pem -new -sha256 -out certs/tmp/localhost.csr.pem -subj "/C=DE/ST=BW/L=Stuttgart/O=Dummy Authority/CN=${cert_domain}"
        fi
        openssl x509 -req -in certs/tmp/localhost.csr.pem -CA certs/ca/root.crt.pem -CAkey certs/ca/root.key.pem -CAcreateserial -out certs/servers/localhost/cert.pem -days 9131
        mv -f certs/servers/localhost/privkey.pem /etc/oxool/key.pem
        mv -f certs/servers/localhost/cert.pem /etc/oxool/cert.pem
        mv -f certs/ca/root.crt.pem /etc/oxool/ca-chain.cert.pem
    fi
fi

exec "$@"
