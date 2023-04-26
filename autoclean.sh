#!/bin/bash

if [ -f Makefile ] ; then
    make distclean
fi

find -name "Makefile.in" -exec rm -f {} \;
rm -f stamp-h1
rm -f config*.h
rm -f config.log
rm -f config.status
rm -f *.log
rm -f aclocal.m4
rm -f install-sh
rm -f libtool
rm -f ltmain.sh
rm -f missing
rm -f configure
rm -f depcomp
rm -fr autom4te.cache
rm -f *.tar.*
rm -f dist_*
