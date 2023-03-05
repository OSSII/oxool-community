#!/bin/bash

RED='\033[0;31m'
GREEN='\033[32m'
NC='\033[0m' # No Color

if test $# != 1 ; then
    echo "Usage: $0 <Path to XML file.>"
    exit 1;
fi

# 檢查 xml 檔案是否存在
XML_FILE=`readlink -e "$1" 2>/dev/null`
if test -z "${XML_FILE}" ; then
    echo -e "${RED}$1 not found.${NC}"
    exit 2;
fi

# 檢查 curl 指令是否存在
CURL_CMD=`which curl 2>/dev/null`
if test -z "${CURL_CMD}" ; then
    echo -e "${RED}Could not find the "curl" command, please install it.${NC}"
    exit 3;
fi

# modaodfweb is running?
MODAODFWEB_PID=`pgrep modaodfweb`
if test -n ${MODAODF_PID} ; then
    PID=${MODAODF_PID}
fi

# oxoolwsd is running?
OXOOLWSD_PID=`pgrep oxoolwsd`
if test -n ${OXOOLWSD_PID} ; then
    PID=${OXOOLWSD_PID}
fi

if test -z "${PID}" ; then
    echo -e "${RED}'oxoolwsd' or 'modaodfweb' are not executed.${NC}"
    exit 4;
fi

TESTING_URL=`cat /tmp/.oxoolmoduletesting 2> /dev/null`
if test -z "$TESTING_URL" ; then
    echo -e "${RED}'/tmp/.oxoolmoduletesting' does not exist, cannot get test URL.${NC}"
    exit 5;
fi

${CURL_CMD} "${TESTING_URL}${XML_FILE}"
