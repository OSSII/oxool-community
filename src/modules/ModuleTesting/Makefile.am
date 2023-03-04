
include_paths = -I$(abs_top_builddir)/src/include \
		-I$(abs_top_builddir)/common \
		-I$(abs_top_builddir)/net \
		-I$(abs_top_builddir)/wsd

configdir = @LOOLWSD_MODULE_CONFIG_DIR@
dist_config_DATA = ModuleTesting.xml

# Module install path
moduledir = @LOOLWSD_MODULE_DIR@
module_LTLIBRARIES = ModuleTesting.la

ModuleTesting_la_CPPFLAGS = -pthread ${include_paths}

ModuleTesting_la_LDFLAGS = -avoid-version -module

ModuleTesting_la_SOURCES = src/ModuleTesting.cpp

