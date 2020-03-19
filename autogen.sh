#! /bin/bash

srcdir=`dirname $0`
test -n "$srcdir" || srcdir=.

olddir=`pwd`
cd "$srcdir"

./autoclean.sh

function failed {
    cat << EOF 1>&2

Result: $1 failed

Please try running the commands from autogen.sh manually, and fix errors.
EOF
    exit 1
}

if test `uname -s` = Linux; then
    libtoolize || failed "libtool"
fi

aclocal || failed "aclocal"

autoheader || failed "autoheader"

automake --add-missing || failed "automake"

autoreconf || failed "autoreconf"

cat << EOF

Result: All went OK, please run $srcdir/configure (with the appropriate parameters) now.

EOF

./configure --with-lo-path=/opt/oxoffice --enable-ssl --disable-werror --with-max-documents=4096 --with-max-connections=4096 --enable-debug --with-lokit-path=bundled/include

cd "$olddir"
