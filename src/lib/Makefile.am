
lib_LTLIBRARIES = libOxOOL.la

include_paths = -I$(abs_top_builddir) \
		-I$(abs_top_builddir)/src/include \
		-I${abs_top_builddir}/common \
		-I${abs_top_builddir}/net \
		-DLOOLWSD_MODULE_CONFIG_DIR='"@LOOLWSD_MODULE_CONFIG_DIR@"' \
                -DLOOLWSD_MODULE_DIR='"@LOOLWSD_MODULE_DIR@"' \
                -DLOOLWSD_MODULE_DATA_DIR='"@LOOLWSD_MODULE_DATA_DIR@"'

AM_CPPFLAGS = -pthread ${include_paths} -fPIC

if !ENABLE_DEBUG
AM_CPPFLAGS += -DNDEBUG
endif

AM_LDFLAGS = -pthread -Wl,-E

libOxOOL_la_SOURCES = \
	OxOOL/ENV.cpp \
	OxOOL/ModuleManager.cpp \
	OxOOL/HttpHelper.cpp \
	OxOOL/XMLConfig.cpp \
	OxOOL/Module/Base.cpp
