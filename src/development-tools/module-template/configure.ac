# -*- Mode: Autoconf; tab-width: 4; indent-tabs-mode: nil -*-
# Generated on %GENERATE_DATETIME%
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
m4_define([oxool_NAME], [%OXOOL_NAME%])
m4_define([module_NAME], [%MODULE_NAME%])

AC_INIT(m4_defn([oxool_NAME])[-module-]m4_defn([module_NAME]),
        [%MODULE_VERSION%],
        [%MODULE_AUTHOR%])

LT_INIT([shared, disable-static])
AC_CONFIG_HEADERS([config.h])

AM_INIT_AUTOMAKE([1.10 foreign subdir-objects tar-pax -Wno-portability])

AC_CONFIG_MACRO_DIR([m4])

AC_SUBST([OXOOL_NAME], m4_defn([oxool_NAME]))
AC_SUBST([MODULE_NAME], m4_defn([module_NAME]))


# Checks for programs.
AC_PROG_CXX
AC_PROG_CC
AC_PROG_INSTALL

CXXFLAGS="$CXXFLAGS -Werror"
CFLAGS="$CFLAGS -Werror"

# Checks for libraries.

PKG_CHECK_MODULES([OXOOL], ${OXOOL_NAME}, [found="yes"], [found=no])
if test "${found}" = "yes" ; then
        AC_SUBST([OXOOL_MODULE_CONFIG_DIR], `${PKG_CONFIG} ${OXOOL_NAME} --variable=module_config_dir`)
        AC_SUBST([OXOOL_MODULES_DIR], `${PKG_CONFIG} ${OXOOL_NAME} --variable=modules_dir`)
        AC_SUBST([OXOOL_MODULE_DATA_DIR], `${PKG_CONFIG} ${OXOOL_NAME} --variable=module_data_dir`)
else
        AC_MSG_ERROR([OxOOL is not installed or the version is too old.])
fi

# Checks for header files.

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.

XML_CONFIG_CMD="${OXOOL_NAME}-xml-config"
AC_SUBST([XML_CONFIG_CMD])

MODULE_SUMMARY=`${XML_CONFIG_CMD} -f module.xml.in --get module.detail.summary 2> /dev/null`
AC_SUBST([MODULE_SUMMARY])


MODULE_LICENSE=`${XML_CONFIG_CMD} -f module.xml.in --get module.detail.license 2> /dev/null`
AC_SUBST([MODULE_LICENSE])


MODULE_DESCRIPTION=`${XML_CONFIG_CMD} -f module.xml.in --get module.detail.description 2> /dev/null`
AC_SUBST([MODULE_DESCRIPTION])

# 是否需包含後臺管理範本
ENABLE_ADMIN=false
MODULE_ADMIN_ITEM=`${XML_CONFIG_CMD} -f module.xml.in --get module.detail.adminItem 2> /dev/null`
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
        ${MODULE_NAME}.xml:module.xml.in
        ${PACKAGE_TARNAME}.spec:module.spec.in
        debian/control
])
AC_OUTPUT

AC_MSG_RESULT([
    Enable console admin:       ${ENABLE_ADMIN}
])

dnl vim:set shiftwidth=4 softtabstop=4 expandtab:
