#!/bin/sh
thisPath=`pwd`
while true ; do
    LOOL_SERVE_FROM_FS=1 ./oxool --o:sys_template_path="$thisPath/systemplate" \
	--o:lo_template_path="/opt/oxoffice" \
	--o:child_root_path="$thisPath/jails" \
	--o:storage.filesystem[@allow]=true \
	--o:tile_cache_path="$thisPath/cache" \
	--o:ssl.cert_file_path="$thisPath/etc/cert.pem" \
  	--o:ssl.key_file_path="$thisPath/etc/key.pem" \
  	--o:ssl.ca_file_path="$thisPath/etc/ca-chain.cert.pem" \
  	--o:logging.file[@enable]=true --o:logging.level=trace \
	--o:file_server_root_path="$thisPath"
done
