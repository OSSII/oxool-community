
include_paths = -I$(abs_top_builddir)/src/include \
		-I$(abs_top_builddir)/common \
		-I$(abs_top_builddir)/net \
		-I$(abs_top_builddir)/wsd

configdir = @LOOLWSD_MODULE_CONFIG_DIR@
dist_config_DATA = alive.xml

# Module install path
moduledir = @LOOLWSD_MODULE_DIR@
module_LTLIBRARIES = alive.la

alive_la_CPPFLAGS = -pthread ${include_paths}

alive_la_LDFLAGS = -avoid-version -module

alive_la_SOURCES = src/Alive.cpp

