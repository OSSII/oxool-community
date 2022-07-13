# -*- Mode: Autoconf; tab-width: 4; indent-tabs-mode: nil -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.63])

AC_INIT([oxool], [4.0.0], [develop@ossii.com.tw])
LT_INIT([shared, disable-static, dlopen])

AM_INIT_AUTOMAKE([1.10 foreign subdir-objects tar-pax -Wno-portability])

AC_CONFIG_MACRO_DIR([m4])

# We don't want to require pkg-config and PKG_CHECK_MODULES on macOS
m4_if(m4_esyscmd_s([uname -s]),Linux,[],[m4_define([PKG_CHECK_MODULES],[])])

LOOLWSD_VERSION_MAJOR=`echo $VERSION | awk -F. '{print $1}'`
LOOLWSD_VERSION_MINOR=`echo $VERSION | awk -F. '{print $2}'`
LOOLWSD_VERSION_MICRO=`echo $VERSION | awk -F. '{print $3}'`

LOOLWSD_VERSION="$LOOLWSD_VERSION_MAJOR.$LOOLWSD_VERSION_MINOR.$LOOLWSD_VERSION_MICRO"
LOOLWSD_VERSION_DIST=1

AC_SUBST([LOOLWSD_VERSION_MAJOR])
AC_SUBST([LOOLWSD_VERSION_MINOR])
AC_SUBST([LOOLWSD_VERSION_MICRO])
AC_SUBST([LOOLWSD_VERSION])
AC_SUBST([LOOLWSD_VERSION_DIST])

AC_DEFINE_UNQUOTED([LOOLWSD_VERSION_DIST],[["$LOOLWSD_VERSION_DIST"]],[dist number
 for oxool spec])

AC_DEFINE_UNQUOTED([LOOLWSD_VERSION],[["$LOOLWSD_VERSION"]],[OxOffice Online WebSocket server version])

# try to add a git hash for a version if we're developing
LOOLWSD_VERSION_HASH="$LOOLWSD_VERSION"
git_hash=`cd ${srcdir} && ( cat dist_git_hash 2> /dev/null || git log -1 --format=%h 2> /dev/null )`
if test "z$git_hash" != "z"; then
   LOOLWSD_VERSION_HASH=$git_hash
fi
AC_SUBST([LOOLWSD_VERSION_HASH])

AC_DEFINE_UNQUOTED([LOOLWSD_VERSION_HASH],[["$LOOLWSD_VERSION_HASH"]],[OxOffice Online git hash if present])

AC_CONFIG_SRCDIR([wsd/LOOLWSD.cpp])

AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CXX
AC_PROG_CC

AC_LANG_PUSH([C++])

AS_IF([test `uname -s` = Linux],
      [AC_PATH_PROG([SETCAP], setcap,[],[/bin:/usr/bin:/sbin:/usr/sbin])]
       AS_IF([test -z "$SETCAP"],
       [AC_MSG_ERROR([The setcap command is needed. It might be in a package called libcap-progs.])]))

#-----------------------------------------------------------------------
# Check for fontconfig support
#-----------------------------------------------------------------------
PKG_CHECK_MODULES(FONTCONFIG, fontconfig >= 2.12.6, use_fontconfig="yes", use_fontconfig="no")
if test "$use_fontconfig" = "no" ; then
    AC_MSG_ERROR([Need fontconfig, but not found or version too old.])
fi

# check for python modules
for MODULE in lxml polib; do
    AC_MSG_CHECKING([for ${MODULE} for python3])
    if /usr/bin/env python3 -c "import ${MODULE}" 2> /dev/null ; then
        AC_MSG_RESULT([yes])
    else
        AC_MSG_RESULT([no])
        AS_IF([test `uname -s` = Linux],
              [AC_MSG_ERROR([${MODULE} for python3 is needed. It might be in a package called python3-${MODULE}.])],
              [AC_MSG_WARN([${MODULE} for python3 is needed. It might be in a package called python3-${MODULE}. But
               if you are building the JS bits on another (Linux) machine, that doesn't matter])])
    fi
done

# On some platforms, std::atomic needs a helper library
AC_MSG_CHECKING([for the need of -latomic])
AC_LINK_IFELSE([AC_LANG_SOURCE([
    #include <atomic>
    #include <cstdint>
    std::atomic<std::int64_t> v;
    int main() {
      return v;
    }
    ])],
               [AC_MSG_RESULT([No])],
               [AC_MSG_RESULT([Yes])
                LIBS="$LIBS -latomic"])

# Declare options
AC_ARG_ENABLE([debug],
              AS_HELP_STRING([--enable-debug],
                             [Enable debugging, link with debugging version of Poco libraries]))

AC_ARG_ENABLE([bundle],
              AS_HELP_STRING([--enable-bundle],
                             [Enable creating bundled JS and CSS even with --enable-debug]))

AC_ARG_ENABLE([debug-protocol],
    AS_HELP_STRING([--disable-debug-protocol],
        [Disables JS protocol logging by default, otherwise it is slaved to enable-debug.])
)

AC_ARG_ENABLE([browsersync],
              AS_HELP_STRING([--enable-browsersync],
                             [Don't copy files to the target directory but create the symlink to allow browsersync usage]))

AC_ARG_ENABLE([anonymization],
              AS_HELP_STRING([--enable-anonymization],
                             [Enable anonymization/obfuscation of user-data in logs]))

AC_ARG_WITH([app-branding],
              AS_HELP_STRING([--with-app-branding=<path>],
                             [Point to a directory containing a branding.css file and possibly other files it references,
                              to be bundled and used by the iOS app. The directory structure is copied to
                              "loleaflet/dist/branding" and that directory ends upp in the app bundle as "branding".]))

AC_ARG_WITH([project],
              AS_HELP_STRING([--with-project=<project name>],
                             [If the project name is specified, the authorized quantity
                              and expiration date will not be checked.]))

AC_ARG_WITH([app-name],
              AS_HELP_STRING([--with-app-name=<name>],
                             [Set the user-visible name of the app you build.]))

AC_ARG_WITH([icon-theme],
              AS_HELP_STRING([--with-icon-theme=<path>],
                             [Path to custom icon theme (similar to loleflet/images).]))

AC_ARG_WITH(vendor,
    AS_HELP_STRING([--with-vendor="John the Builder"],
        [Set vendor of the build.]),
,)

AC_ARG_WITH(info-url,
    AS_HELP_STRING([--with-info-url="https://john-the-builder.org"],
        [Set the info url of the build.]),
,)

AC_ARG_ENABLE([seccomp],
              AS_HELP_STRING([--disable-seccomp],
                             [Disable use of linux/seccomp.h header when kernel on target system does not support it.
                              Beware of the security consequences!]))
AC_ARG_WITH([lokit-path],
            AS_HELP_STRING([--with-lokit-path=<path>],
                           [Path to the "include" directory with the OxOfficeKit headers]))

AC_ARG_WITH([lo-path],
            AS_HELP_STRING([--with-lo-path=<path>],
                           [Path to a working installation directory or instdir of OxOffice]))

AC_ARG_WITH([logfile],
            AS_HELP_STRING([--with-logfile=<path>],
                           [Path to the location of the logfile.]))

AC_ARG_WITH([poco-includes],
            AS_HELP_STRING([--with-poco-includes=<path>],
                           [Path to the "include" directory with the Poco
                            headers.  If you are building for Android 64bit,
                            you need two, separated by a colon ':'.]))

AC_ARG_WITH([poco-libs],
            AS_HELP_STRING([--with-poco-libs=<path>],
                           [Path to the "lib" directory with the Poco
                            libraries.  If you are building for Android 64bit,
                            you need two, separated by a colon ':'.]))

AC_ARG_WITH([libpng-includes],
            AS_HELP_STRING([--with-libpng-includes=<path>],
                           [Path to the "include" directory with the libpng
                            headers.  Not used on Android.]))

AC_ARG_WITH([libpng-libs],
            AS_HELP_STRING([--with-libpng-libs=<path>],
                           [Path to the "lib" directory with the libpng
                            libraries.  Not used on Android.]))

AC_ARG_WITH([cppunit-includes],
            AS_HELP_STRING([--with-cppunit-includes=<path>],
                           [Path to the "include" directory with the Cppunit headers]))

AC_ARG_WITH([cppunit-libs],
            AS_HELP_STRING([--with-cppunit-libs=<path>],
                           [Path to the "lib" directory with the Cppunit libraries]))

AC_ARG_ENABLE([ssl],
            AS_HELP_STRING([--disable-ssl],
                           [Compile without SSL support]))

AC_ARG_WITH([support-public-key],
            AS_HELP_STRING([--with-support-public-key=<public-key-name.pub>],
                [Implements signed key with expiration required for support. Targeted at OxOffice Online Service Providers.]))

AC_ARG_WITH([max-connections],
            AS_HELP_STRING([--with-max-connections],
                           [Set the limit on the total number of client connections. Def: 20, Min: 3.]))

AC_ARG_WITH([max-documents],
             AS_HELP_STRING([--with-max-documents],
                           [Set the limit on the total number of documents. Def: 10, Min: 2.]))

AC_ARG_WITH([feedback-location],
            AS_HELP_STRING([--with-feedback-location=<url>],
                           [User feedback URL location. Default to http://127.0.0.1:8000/Rate/feedback.html]))

AC_ARG_ENABLE(welcome-message,
    AS_HELP_STRING([--enable-welcome-message],
        [Enables welcome message on version update. Can be changed later in oxoolwsd.xml.])
)

AC_ARG_ENABLE(feedback,
    AS_HELP_STRING([--enable-feedback],
        [Enables feedback, user rating.])
)

AC_ARG_WITH([sanitizer],
             AS_HELP_STRING([--with-sanitizer],
                           [Enable one or more compatible sanitizers. E.g. --with-sanitizer=address,undefined,leak]))

AC_ARG_WITH([compiler-plugins],
            AS_HELP_STRING([--with-compiler-plugins=<path>],
                [Experimental! Unlikely to work for anyone except Noel! Enable compiler plugins that will perform additional checks during
                 building.]))

AC_ARG_ENABLE([setcap],
            AS_HELP_STRING([--disable-setcap],
                          [Do not set capabilities on files. For packaging builds]))

AC_ARG_ENABLE([werror],
            AS_HELP_STRING([--disable-werror],
                          [Do not turn warnings into errors.]))

AC_ARG_ENABLE([vereign],
            AS_HELP_STRING([--enable-vereign],
                          [Set Vereign document_signing_url configuration key to the default app.vereign.com.]))

# Handle options
AS_IF([test "$enable_debug" = yes -a -n "$with_poco_libs"],
      [POCO_DEBUG_SUFFIX=d],
      [POCO_DEBUG_SUFFIX=])

ENABLE_DEBUG=false
ENABLE_DEBUG_PROTOCOL=false
ENABLE_BUNDLE=true
LOOLWSD_LOGLEVEL="warning"
LOOLWSD_LOG_TO_FILE="true"
LOOLWSD_LOGFILE="/var/log/oxoolwsd.log"
OXOOLWSD_TRACEEVENTFILE="/var/log/oxoolwsd.trace.json"
LOOLWSD_ANONYMIZE_USER_DATA=false
LOLEAFLET_LOGGING="false"
debug_msg="secure mode: product build"
anonym_msg=""
if test "$enable_debug" = "yes"; then
   AC_DEFINE([ENABLE_DEBUG],1,[Whether to compile in some extra debugging support code and disable some security pieces])
   ENABLE_DEBUG=true
   ENABLE_DEBUG_PROTOCOL=true
   LOOLWSD_LOGLEVEL="trace"
   LOOLWSD_LOG_TO_FILE="true"
   LOOLWSD_LOGFILE="/tmp/oxoolwsd.log"
   OXOOLWSD_TRACEEVENTFILE="/tmp/oxoolwsd.trace.json"
   LOOLWSD_ANONYMIZE_USER_DATA=false
   LOLEAFLET_LOGGING="true"
   debug_msg="low security debugging mode"
   if test "$enable_bundle" != "yes"; then
      ENABLE_BUNDLE=false
      bundle_msg="using individual JS and CSS files"
   fi
else
    AC_DEFINE([ENABLE_DEBUG],0,[Whether to compile in some extra debugging support code and disable some security pieces])
fi
AC_SUBST(ENABLE_DEBUG)
AC_SUBST(ENABLE_BUNDLE)
AC_SUBST(LOOLWSD_LOGLEVEL)
AC_SUBST(LOOLWSD_LOG_TO_FILE)
AC_SUBST(LOLEAFLET_LOGGING)

LOOLWSD_BRANCH=`( cat dist_git_branch 2> /dev/null || git rev-parse --abbrev-ref HEAD 2> /dev/null ) | cut -d '-' -f 1`

# 是否為專案
PROJECT_NAME=`cat dist_project 2>/dev/null`
# 未預設專案
if test "z$PROJECT_NAME" = "z"; then
    # 是否指定專案名稱
    if test -n "$with_project"; then
        PROJECT_NAME="$with_project"
        echo "$PROJECT_NAME" > dist_project
    else
        rm -f dist_project
    fi
fi
# 再一次檢查 PROJECT_NAME 是否有值？
# 有的話就設定專案編譯
if test "z$PROJECT_NAME" != "z"; then
    AC_DEFINE_UNQUOTED([PROJECT_NAME],["$PROJECT_NAME"],[Project name.])
    AC_SUBST(PROJECT_NAME)
    # 重新定義 LOOLWSD_BRANCH(改成專案名稱)
    LOOLWSD_BRANCH="$PROJECT_NAME"
    project_msg="$PROJECT_NAME"
else
    project_msg="None."
fi
AC_SUBST([LOOLWSD_BRANCH])
AC_DEFINE_UNQUOTED([LOOLWSD_BRANCH], [["$LOOLWSD_BRANCH"]],[git branch name])

if test "$enable_debug_protocol" = no; then
   ENABLE_DEBUG_PROTOCOL=false
fi
AC_SUBST(ENABLE_DEBUG_PROTOCOL)

ENABLE_BROWSERSYNC=
browsersync_msg="disabled: copy files to the target directory"
if test "$enable_browsersync" = "yes"; then
   ENABLE_BROWSERSYNC=true
   browsersync_msg="enabled: create symlinks in the target directory"
fi
AC_SUBST(ENABLE_BROWSERSYNC)

if test -n "$with_logfile" ; then
   LOOLWSD_LOGFILE="$with_logfile"
fi
AC_SUBST(LOOLWSD_LOGFILE)

if test -n "$with_trace_event_file" ; then
   OXOOLWSD_TRACEEVENTFILE="$with_trace_event_file"
fi
AC_SUBST(OXOOLWSD_TRACEEVENTFILE)
AC_DEFINE_UNQUOTED([OXOOLWSD_TRACEEVENTFILE], [["]$OXOOLWSD_TRACEEVENTFILE["]], [Destination for Trace Event output])

if test "$enable_anonymization" = "yes" ; then
   LOOLWSD_ANONYMIZE_USER_DATA=true
   anonym_msg="anonymization of user-data is enabled"
fi
AC_DEFINE_UNQUOTED([LOOLWSD_ANONYMIZE_USER_DATA],[$LOOLWSD_ANONYMIZE_USER_DATA],[Enable permanent anonymization in logs])
AC_SUBST(LOOLWSD_ANONYMIZE_USER_DATA)

if test -z "$anonym_msg";  then
  anonym_msg="anonymization of user-data is disabled"
fi

LIBPNG_INCLUDES="$with_libpng_includes"
LIBPNG_LIBS="$with_libpng_libs"

LOKIT_PATH="bundled/include"
if test -z $with_lokit_path; then
    with_lokit_path="$LOKIT_PATH"
fi

AC_SUBST(LIBPNG_INCLUDES)
AC_SUBST(LIBPNG_LIBS)
AC_SUBST(LOKIT_PATH)

APP_NAME="OxOffice Online"
if test -n "$with_app_name"; then
   APP_NAME="$with_app_name"
fi
AC_DEFINE_UNQUOTED([APP_NAME],["$APP_NAME"],[The user-visible name of the app you build.])
AC_SUBST(APP_NAME)

VENDOR=
AC_MSG_CHECKING([for vendor])
if test -z "$with_vendor" -o "$with_vendor" = "no"; then
    VENDOR="OSS Integral Institute Co., Ltd"

    if test -z "$VENDOR"; then
        VENDOR="$USER"
    fi

    if test -z "$VENDOR"; then
        VENDOR="`id -u -n`"
    fi

    AC_MSG_RESULT([not set, using $VENDOR])
else
    VENDOR="$with_vendor"
    AC_MSG_RESULT([$VENDOR])
fi
AC_SUBST(VENDOR)

INFO_URL='https://www.libreoffice.org'
if test -n "$with_info_url" -a "$with_info_url" != "no"; then
    INFO_URL="$with_info_url"
fi
AC_SUBST(INFO_URL)

AC_MSG_CHECKING([for custom icon theme])
CUSTOM_ICONS_DIRECTORY=
if test -d "$with_icon_theme"; then
    CUSTOM_ICONS_DIRECTORY=`readlink -f $with_icon_theme`
    AC_MSG_RESULT([$CUSTOM_ICONS_DIRECTORY])
else
    AC_MSG_RESULT([no])
fi
AC_SUBST(CUSTOM_ICONS_DIRECTORY)

MAX_CONNECTIONS=20
AS_IF([test -n "$with_max_connections" && test "$with_max_connections" -gt "0"],
      [MAX_CONNECTIONS="$with_max_connections"])
AS_IF([test "$MAX_CONNECTIONS" -lt "3"],
      [MAX_CONNECTIONS="3"])
AC_DEFINE_UNQUOTED([MAX_CONNECTIONS],[$MAX_CONNECTIONS],[Limit the maximum number of open connections])
AC_SUBST(MAX_CONNECTIONS)

MAX_DOCUMENTS=10
AS_IF([test -n "$with_max_documents" && test "$with_max_documents" -gt "0"],
      [MAX_DOCUMENTS="$with_max_documents"])
AS_IF([test "$MAX_DOCUMENTS" -gt "$MAX_CONNECTIONS"],
      [MAX_DOCUMENTS="$MAX_CONNECTIONS"])
AS_IF([test "$MAX_DOCUMENTS" -lt "2"],
      [MAX_DOCUMENTS="2"])
AC_DEFINE_UNQUOTED([MAX_DOCUMENTS],[$MAX_DOCUMENTS],[Limit the maximum number of open documents])
AC_SUBST(MAX_DOCUMENTS)

ENABLE_WELCOME_MESSAGE=false
AS_IF([test "$enable_welcome_message" = "yes"],
      [ENABLE_WELCOME_MESSAGE="true"])
AC_DEFINE_UNQUOTED([ENABLE_WELCOME_MESSAGE],["$ENABLE_WELCOME_MESSAGE"],[Should the Release notes message on startup be enabled by default?])
AC_SUBST(ENABLE_WELCOME_MESSAGE)

ENABLE_FEEDBACK=
FEEDBACK_LOCATION=

if test "$enable_feedback" = "yes"; then
   ENABLE_FEEDBACK="true"

   if test -n "$with_feedback_location"; then
       FEEDBACK_LOCATION=$with_feedback_location
   else
       FEEDBACK_LOCATION="http://127.0.0.1:8000/Rate/feedback.html"
   fi
fi

AC_DEFINE_UNQUOTED([ENABLE_FEEDBACK],["$ENABLE_FEEDBACK"],[User feedback rating])
AC_DEFINE_UNQUOTED([FEEDBACK_LOCATION],["$FEEDBACK_LOCATION"],[User feedback URL location])
AC_SUBST(ENABLE_FEEDBACK)
AM_CONDITIONAL([ENABLE_FEEDBACK], [test "$ENABLE_FEEDBACK" = "true"])

ENABLE_WELCOME_MESSAGE_BUTTON=false
AS_IF([test "$enable_welcome_message_button" = "yes"],
      [ENABLE_WELCOME_MESSAGE_BUTTON="true"])
AC_DEFINE_UNQUOTED([ENABLE_WELCOME_MESSAGE_BUTTON],["$ENABLE_WELCOME_MESSAGE_BUTTON"],[Should the Release notes message on startup should have a dismiss button instead of an x button to close by default?])
AC_SUBST(ENABLE_WELCOME_MESSAGE_BUTTON)

USER_INTERFACE_MODE='compact'
AC_DEFINE_UNQUOTED([USER_INTERFACE_MODE],["$USER_INTERFACE_MODE"],[Which user interface mode should be activated])
AC_SUBST(USER_INTERFACE_MODE)

VEREIGN_URL=
if test "$enable_vereign" = "yes"; then
    VEREIGN_URL="https://app.vereign.com"
fi
AC_DEFINE_UNQUOTED([VEREIGN_URL],["$VEREIGN_URL"],[Default value of per_documents.document_signing_url])
AC_SUBST(VEREIGN_URL)

# Test for build environment

CFLAGS="$CFLAGS -Wall -Wextra"

AC_MSG_CHECKING([whether to turn warnings to errors])
if test -z "$enable_werror" -o "$enable_werror" = "yes"; then
    AC_MSG_RESULT([yes])
    CXXFLAGS="$CXXFLAGS -Werror"
    CFLAGS="$CFLAGS -Werror"
else
    AC_MSG_RESULT([no])
fi

AC_MSG_CHECKING([whether to turn sanitizers on])
if test "x$with_sanitizer" != "x"; then
    AC_MSG_RESULT([yes ($with_sanitizer)])
    SANITIZER_FLAGS="-O1 -fno-omit-frame-pointer -fsanitize=$with_sanitizer -frtti -static-libasan"
    CXXFLAGS="$CXXFLAGS $SANITIZER_FLAGS"
    CFLAGS="$CFLAGS $SANITIZER_FLAGS"
else
    AC_MSG_RESULT([no])
fi

# check for C++11 support
HAVE_CXXSTD=
AC_MSG_CHECKING([whether $CXX supports C++17, C++14 or C++11])
for flag in -std=c++17 -std=gnu++14 -std=gnu++1y -std=c++14 -std=c++1y -std=gnu++11 -std=gnu++0x -std=c++11 -std=c++0x ; do
    save_CXXFLAGS=$CXXFLAGS
    CXXFLAGS="$CXXFLAGS $flag -Werror"
    AC_LANG_PUSH([C++])
    AC_COMPILE_IFELSE([AC_LANG_PROGRAM([[
        #include <algorithm>
        #include <functional>
        #include <vector>
        void f(std::vector<int> & v, std::function<bool(int, int)> fn) {
            std::sort(v.begin(), v.end(), fn);
        }
        ]])],[CXXFLAGS_CXXSTD=$flag])
    AC_LANG_POP([C++])
    CXXFLAGS=$save_CXXFLAGS
    if test -n "$CXXFLAGS_CXXSTD"; then
        HAVE_CXXSTD=TRUE
        break
    fi
done
if test "$HAVE_CXXSTD" = TRUE; then
    AC_MSG_RESULT([yes ($CXXFLAGS_CXXSTD)])
else
    AC_MSG_ERROR(no)
fi

STD_FILESYSTEM=
if test "$CXXFLAGS_CXXSTD" = "-std=c++17" ; then
    save_CXXFLAGS=$CXXFLAGS
    CXXFLAGS="$CXXFLAGS -Werror"
    save_LIBS=$LIBS
    LIBS="$save_LIBS -lstdc++fs"
    AC_LANG_PUSH([C++])
    AC_LINK_IFELSE([AC_LANG_SOURCE([[
        #include <experimental/filesystem>
        int main()
        {
            if (!std::experimental::filesystem::temp_directory_path().empty())
                return 0;
            return 1;
        }
        ]])],[STD_FILESYSTEM=experimental])
    AC_LINK_IFELSE([AC_LANG_SOURCE([[
        #include <filesystem>
        int main()
        {
            if (!std::filesystem::temp_directory_path().empty())
                return 0;
            return 1;
        }
        ]])],[STD_FILESYSTEM=TRUE])
    AC_LANG_POP([C++])
    CXXFLAGS=$save_CXXFLAGS
    LIBS=$save_LIBS
fi

if test -n "$STD_FILESYSTEM" ; then
    LIBS="$LIBS -lstdc++fs"
    AC_DEFINE([HAVE_STD_FILESYSTEM],1,[Whether the used C++ has support for std::filesystem.])
    if test "$STD_FILESYSTEM" = "experimental" ; then
        AC_DEFINE([HAVE_STD_FILESYSTEM_EXPERIMENTAL],1,[Whether the std::filesystem is in the experimental header.])
    else
        AC_DEFINE([HAVE_STD_FILESYSTEM_EXPERIMENTAL],0,[Whether the std::filesystem is in the experimental header.])
    fi
else
    AC_DEFINE([HAVE_STD_FILESYSTEM],0,[Whether the used C++ has support for std::filesystem.])
    AC_DEFINE([HAVE_STD_FILESYSTEM_EXPERIMENTAL],0,[Whether the std::filesystem is in the experimental header.])
fi

AS_IF([test -n "$LOKIT_PATH"],
      [CPPFLAGS="$CPPFLAGS -I${LOKIT_PATH}"])
lokit_msg="$LOKIT_PATH"

AS_IF([test "$ENABLE_IOSAPP" != "true" -a "$ENABLE_ANDROIDAPP" != "true" -a "$enable_fuzzers" != "yes"],
      [AC_MSG_CHECKING([for OxOffice path])
      if test -n "$with_lo_path"; then
          # strip trailing '/' from LO_PATH, 'ln -s' with such path will otherwise fail
          LO_PATH="${with_lo_path%/}"
          AC_MSG_RESULT([found])
      else
          LO_PATH="/opt/oxoffice"
          AC_MSG_RESULT([default(/opt/oxoffice)])
      fi
      ])

JAIL_PATH=not-set
SYSTEMPLATE_PATH=not-set
have_lo_path=false
AC_MSG_CHECKING([whether to run tests against a OxOffice])
version_file="$with_lo_path/program/versionrc"
if test -f $version_file; then
    JAILS_PATH="\${abs_top_builddir}/jails"
    SYSTEMPLATE_PATH="\${abs_top_builddir}/systemplate"
    have_lo_path=true
    lo_msg="test against $LO_PATH"
    AC_MSG_RESULT([yes])
else
    lo_msg="no integration tests"
    AC_MSG_RESULT([no])
fi

AC_SUBST(LO_PATH)
AC_DEFINE_UNQUOTED([LO_PATH],["$LO_PATH"],[Path to OxOffice installation])
AC_SUBST(JAILS_PATH)
AC_SUBST(SYSTEMPLATE_PATH)
AM_CONDITIONAL(HAVE_LO_PATH,[test "$have_lo_path" = "true"])

AS_IF([test -n "$with_poco_includes"],
      [CPPFLAGS="$CPPFLAGS -isystem ${with_poco_includes}"])

AS_IF([test -n "$with_poco_libs"],
      [LDFLAGS="$LDFLAGS -L${with_poco_libs}"])

AS_IF([test -n "$LIBPNG_INCLUDES"],
      [CPPFLAGS="$CPPFLAGS -isystem ${LIBPNG_INCLUDES}"])

AS_IF([test -n "$LIBPNG_LIBS"],
      [LDFLAGS="$LDFLAGS -L${LIBPNG_LIBS}"])

AS_IF([test -n "$with_cppunit_includes"],
      [CPPFLAGS="$CPPFLAGS -isystem ${with_cppunit_includes}"])

AS_IF([test -n "$with_cppunit_libs"],
      [LDFLAGS="$LDFLAGS -L${with_cppunit_libs}"])

AS_IF([test `uname -s` = Linux],
      [AS_IF([test -n "$with_poco_libs"],
             [LDFLAGS="$LDFLAGS -Wl,-rpath,${with_poco_libs}"])])

AS_IF([test `uname -s` = Linux],
      [AS_IF([test -n "$with_cppunit_libs"],
             [LDFLAGS="$LDFLAGS -Wl,-rpath,${with_cppunit_libs}"])])

AS_IF([test `uname -s` != Darwin],
      [AC_SEARCH_LIBS([dlopen],
                      [dl dld],
                      [],
                      [AC_MSG_ERROR([dlopen not found])])])

AS_IF([test "$ENABLE_IOSAPP" != "true" -a "$ENABLE_ANDROIDAPP" != "true"],
      [AC_SEARCH_LIBS([png_create_write_struct],
                      [png],
                      [],
                      [AC_MSG_ERROR([libpng not available?])])
       PKG_CHECK_MODULES([ZLIB], [zlib])

       PKG_CHECK_MODULES([CPPUNIT], [cppunit])
       ])

AS_IF([test `uname -s` = Linux],
      [AC_SEARCH_LIBS([cap_get_proc],
                      [cap],
                      [],
                      [AC_MSG_ERROR([libcap not available?])])])

AM_CONDITIONAL([ENABLE_DEBUG], [test "$ENABLE_DEBUG" = "true"])

ENABLE_SSL=true
if test "$enable_ssl" != "no" ; then
   ssl_msg="ssl enabled"
   ENABLE_SSL=true
   AC_DEFINE([ENABLE_SSL],1,[Whether to enable SSL])
else
   ssl_msg="insecure: ssl disabled"
   ENABLE_SSL=false
   AC_DEFINE([ENABLE_SSL],0,[Whether to enable SSL])
fi
AM_CONDITIONAL([ENABLE_SSL], [$ENABLE_SSL])
AC_SUBST(ENABLE_SSL)

AS_IF([test "$ENABLE_ANDROIDAPP" != "true"],
      [AC_CHECK_HEADERS([security/pam_appl.h],
                        [],
                        [AC_MSG_ERROR([header security/pam_appl.h not found, install PAM development package])])
       AC_CHECK_LIB(pam, pam_start, [], [AC_MSG_ERROR([No. Install PAM development package])])])

AC_MSG_CHECKING([whether to build with support public key])
if test "x$with_support_public_key" != "x"; then
    AC_DEFINE([ENABLE_SUPPORT_KEY],1,[Whether to enable support key])

    # generate the public key include
    echo -e "#ifndef INCLUDED_SUPPORT_PUBLIC_KEY_HPP\n#define INCLUDED_SUPPORT_PUBLIC_KEY_HPP\n#include <string>\nconst static std::string SUPPORT_PUBLIC_KEY(" > "${srcdir}/common/support-public-key.hpp"
    sed 's/\(.*\)/"\1\\n"/' "$with_support_public_key" >> "${srcdir}/common/support-public-key.hpp"
    echo -e ");\n#endif" >> "${srcdir}/common/support-public-key.hpp"
    AC_MSG_RESULT([yes])
else
    AC_DEFINE([ENABLE_SUPPORT_KEY],0,[Whether to enable support key])
    rm -f "${srcdir}/common/support-public-key.hpp"
    AC_MSG_RESULT([no])
fi
AC_SUBST(ENABLE_SUPPORT_KEY)

LIBS="$LIBS -lPocoNetSSL${POCO_DEBUG_SUFFIX} -lPocoNet${POCO_DEBUG_SUFFIX} -lPocoUtil${POCO_DEBUG_SUFFIX} -lPocoJSON${POCO_DEBUG_SUFFIX} -lPocoXML${POCO_DEBUG_SUFFIX} -lPocoFoundation${POCO_DEBUG_SUFFIX} -lPocoCrypto${POCO_DEBUG_SUFFIX} -lPocoZip${POCO_DEBUG_SUFFIX}"

AS_IF([test "$ENABLE_SSL" = "true"],
      [LIBS="$LIBS -lssl -lcrypto"])

AS_IF([test "$ENABLE_IOSAPP" != "true" -a "$ENABLE_ANDROIDAPP" != "true"],
      [AC_CHECK_HEADERS([LibreOfficeKit/LibreOfficeKit.h],
                        [],
                        [AC_MSG_ERROR([header LibreOfficeKit/LibreOfficeKit.h not found, perhaps you want to use --with-lokit-path])])
       AC_CHECK_HEADERS([Poco/Net/WebSocket.h],
                        [],
                        [AC_MSG_ERROR([header Poco/Net/WebSocket.h not found, perhaps you want to use --with-poco-includes])])
       DISABLE_SECCOMP=
       if test "$enable_seccomp" != "no"; then
           AC_CHECK_HEADERS([linux/seccomp.h],
                            [],
                            [AC_MSG_ERROR([critical security header linux/seccomp.h not found. If kernel on target system does not support SECCOMP, you can use --disable-seccomp, but mind the security consequences.])])
           AC_DEFINE([DISABLE_SECCOMP],0,[Whether to disable SECCOMP])
       else
           AC_DEFINE([DISABLE_SECCOMP],1,[Whether to disable SECCOMP])
       fi

       AC_MSG_CHECKING([Whether OpenSSL has PKCS5_PBKDF2_HMAC()])
       AC_COMPILE_IFELSE([AC_LANG_SOURCE([
       #include <openssl/opensslv.h>
       #if OPENSSL_VERSION_NUMBER < 0x10001000L
       #error PKCS5_PBKDF2_HMAC() is in OpenSSL 1.0.1 or newer
       #endif
       ])],
                         [AC_MSG_RESULT([yes])
                          AC_DEFINE([HAVE_PKCS5_PBKDF2_HMAC],1,[whether OpenSSL has PKCS5_PBKDF2_HMAC()])],
                         [AC_MSG_RESULT([no])
                          AC_MSG_WARN([OpenSSL is too old. Secure password storage for Admin Console is not supported.])
                          AC_DEFINE([HAVE_PKCS5_PBKDF2_HMAC],0,[Whether OpenSSL has PKCS5_PBKDF2_HMAC()])])

       AC_MSG_CHECKING([POCO version])
       AC_COMPILE_IFELSE([AC_LANG_SOURCE([
       #include <Poco/Version.h>
       #if POCO_VERSION < 0x01070100
       #error Require Poco 1.7.1 or newer
       #endif
       ])],
                         [AC_MSG_RESULT([OK])],
                         [AC_MSG_ERROR([The POCO version is too old])])

       # If poco is built with --unbundled, it uses the system pcre library
       AC_MSG_CHECKING([If we need to link with -lpcre])
       AC_LINK_IFELSE([AC_LANG_SOURCE([
       #include <Poco/RegularExpression.h>
       int main(int argc, char **argv)
       {
           (void)argc;
           Poco::RegularExpression e("abc.[def]");
           Poco::RegularExpression::Match m;
           return e.match(argv[[1]], m);
       }
       ])],
                      [AC_MSG_RESULT([No])],
                      [AC_MSG_RESULT([Yes])
                       LIBS="$LIBS -lpcre"])

       ])

AS_IF([test `uname -s` = "Linux"],
      # We need npm and node only on Linux, both in the normal Online case,
      # and when only building JS for the iOS app. When building the iOS app itself on macOS,
      # don't do this.
      [AC_PATH_PROG(NPM, npm, no)
       if test "$NPM" = "no"; then
           AC_MSG_ERROR([npm required to build loleaflet, but not installed])
       else
           NPM_VER=`npm -v | awk -F. '{ print (($1 * 100) + $2) * 100 + $3;}'`
           if test "$NPM_VER" -lt 50000; then
               AC_MSG_ERROR([This npm version is too old, upgrade to >= 5.0.0])
           fi
       fi

       AC_PATH_PROG(NODE, node, no)
       if test "$NODE" = "no"; then
           AC_MSG_ERROR([node required to build loleaflet, but not installed])
       else
           NODE_VER=`node --version | sed 's/^v//' | awk -F. '{ print (($1 * 100) + $2) * 100 + $3;}'`
           if test "$NODE_VER" -lt 100000; then
               AC_MSG_ERROR([This node version is old, upgrade to >= 10.0.0])
           fi
       fi
       ])

# need this after the other stuff that uses the compiler because we don't want to run configure-tests with the plugins enabled
AS_IF([test -n "$with_compiler_plugins"],
      [CPPFLAGS="$CPPFLAGS -Xclang -load -Xclang ${with_compiler_plugins}/compilerplugins/obj/plugin.so -Xclang -add-plugin -Xclang loplugin -Xclang -plugin-arg-loplugin -Xclang --lool-base-path=\${abs_top_srcdir}"])

LOOLWSD_CONFIGDIR=${sysconfdir}/${PACKAGE}
AC_SUBST(LOOLWSD_CONFIGDIR)

LOOLWSD_MODULES_DIR=${libdir}/${PACKAGE}
AC_SUBST(LOOLWSD_MODULES_DIR)

LOOLWSD_MODULE_CONFIG_DIR=${sysconfdir}/${PACKAGE}/conf.d
AC_SUBST(LOOLWSD_MODULE_CONFIG_DIR)

LOOLWSD_MODULE_DATA_DIR=/var/lib/${PACKAGE}
AC_SUBST(LOOLWSD_MODULE_DATA_DIR)

LOOLWSD_DATADIR=${datadir}/${PACKAGE}
AC_SUBST(LOOLWSD_DATADIR)

AM_CONDITIONAL([ENABLE_SETCAP], [test "$enable_setcap" != "no"])

ENABLE_SETCAP=
if test "$enable_setcap" != "no"; then
    ENABLE_SETCAP=true
    setcap_msg="setcap enabled"
else
    setcap_msg="setcap disabled"
fi

AC_SUBST(ENABLE_SETCAP)

AC_CONFIG_LINKS([discovery.xml:discovery.xml])
AC_CONFIG_LINKS([oxoolkitconfig.xcu:oxoolkitconfig.xcu])
AC_CONFIG_LINKS([loleaflet/package.json:loleaflet/package.json])
AC_LINK_FILES([loleaflet/archived-packages], [loleaflet/archived-packages])

APP_BRANDING_DIR=
APP_IC_LAUNCHER="ic_launcher"
APP_HAS_BRANDING="false"
if test "$with_app_branding" != no -a -d "$with_app_branding"; then
    APP_BRANDING_DIR="$with_app_branding"
    APP_IC_LAUNCHER="ic_launcher_brand"
    APP_HAS_BRANDING="true"
fi
AC_SUBST(APP_BRANDING_DIR)
AC_SUBST(APP_IC_LAUNCHER)
AC_SUBST(APP_HAS_BRANDING)

AC_CHECK_FUNCS(ppoll)

AC_CONFIG_FILES([Makefile
                 loleaflet/Makefile
                 loleaflet/npm-shrinkwrap.json
                 extensions/Makefile
                 fonts/Makefile
                 fonts/00-oxool.conf
                 support/Makefile
                 oxoolwsd.spec
                 oxoolwsd.xml
                 debian/oxool.postinst])

AC_CONFIG_FILES([test/run_unit.sh],[chmod +x test/run_unit.sh])

AC_OUTPUT

AC_LANG_POP

echo "
Configuration:
    Branch name             $LOOLWSD_BRANCH
    LOKit path              ${lokit_msg}
    LO path                 $LO_PATH
    LO integration tests    ${lo_msg}
    SSL support             $ssl_msg
    Debug & low security    $debug_msg
    Anonymization           $anonym_msg
    Set capabilities        $setcap_msg
    Browsersync             $browsersync_msg
    Project name            $project_msg

    \$ make # to compile"
if test -n "$with_lo_path"; then
echo "    \$ make run # to start oxoolwsd
    \$ make sync-writer|calc|impress # to start browsersync with specified app
"
fi

dnl vim:set shiftwidth=4 softtabstop=4 expandtab:
