
include_paths = -I$(abs_top_builddir)/src/include \
		-I$(abs_top_builddir)/common \
		-I$(abs_top_builddir)/net \
		-I$(abs_top_builddir)/wsd

configdir = @LOOLWSD_MODULE_CONFIG_DIR@
dist_config_DATA = Announce.xml

# Module install path
moduledir = @LOOLWSD_MODULE_DIR@
module_LTLIBRARIES = announce.la

announce_la_CPPFLAGS = -pthread ${include_paths}

announce_la_LDFLAGS = -avoid-version -module

announce_la_SOURCES = src/Announce.cpp

