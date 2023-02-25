# -*- Mode: Autoconf; tab-width: 4; indent-tabs-mode: nil -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
m4_define([module_NAME], [%MODULE_NAME%])

AC_INIT([oxool-module-]m4_defn([module_NAME]),
        [%MODULE_VERSION%],
        [%MODULE_AUTHOR%])

LT_INIT([shared, disable-static])
AC_CONFIG_HEADERS([config.h])

AM_INIT_AUTOMAKE([1.10 foreign subdir-objects tar-pax -Wno-portability])

AC_CONFIG_MACRO_DIR([m4])

AC_SUBST([MODULE_NAME], m4_defn([module_NAME]))


# Checks for programs.
AC_PROG_CXX
AC_PROG_CC
AC_PROG_INSTALL

# 檢查 xmllint 指令是否存在
AC_CHECK_PROG([XMLLINT], [xmllint], [yes], [no])
if test x"${XMLLINT}" = x"no" ; then
        AC_MSG_ERROR([Command 'xmllint' not found, it belongs to libxml2 suite.])
fi

CXXFLAGS="$CXXFLAGS -Werror"
CFLAGS="$CFLAGS -Werror"

# Checks for libraries.

PKG_CHECK_MODULES([OXOOL], [oxool], [found="yes"], [found=no])
if test "${found}" = "yes" ; then
        AC_SUBST([OXOOL_MODULE_CONFIG_DIR], `${PKG_CONFIG} oxool --variable=module_config_dir`)
        AC_SUBST([OXOOL_MODULES_DIR], `${PKG_CONFIG} oxool --variable=modules_dir`)
        AC_SUBST([OXOOL_MODULE_DATA_DIR], `${PKG_CONFIG} oxool --variable=module_data_dir`)
else
        AC_MSG_ERROR([OxOOL is not installed or the version is too old.])
fi

# Checks for header files.

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.

AC_SUBST([MODULE_SUMMARY], `xmllint --xpath "/config/module/detail/summary/text()" ${MODULE_NAME}.xml.in 2> /dev/null`)
AC_SUBST([MODULE_LICENSE], `xmllint --xpath "/config/module/detail/license/text()" ${MODULE_NAME}.xml.in 2> /dev/null`)
AC_SUBST([MODULE_DESCRIPTION], `xmllint --xpath "/config/module/detail/description/text()" ${MODULE_NAME}.xml.in 2> /dev/null`)

# 是否需包含後臺管理範本
ENABLE_ADMIN=false
MODULE_ADMIN_ITEM=`xmllint --xpath "/config/module/detail/adminItem/text()" ${MODULE_NAME}.xml.in 2> /dev/null`
if test -n "${MODULE_ADMIN_ITEM}" ; then
    ENABLE_ADMIN=true
    AC_DEFINE([ENABLE_ADMIN], [1], [Contains Admin management.])
else
    AC_DEFINE([ENABLE_ADMIN], [0], [Admin management is not included.])
fi
AC_SUBST([ENABLE_ADMIN])
AM_CONDITIONAL([ENABLE_ADMIN], [test "${ENABLE_ADMIN}" = "true"])

# AC_OUTPUT
AC_CONFIG_FILES([
        Makefile
        ${MODULE_NAME}.xml
        ${PACKAGE_TARNAME}.spec:module.spec.in
])
AC_OUTPUT

AC_MSG_RESULT([
    Enable console admin:       ${ENABLE_ADMIN}
])

dnl vim:set shiftwidth=4 softtabstop=4 expandtab:
