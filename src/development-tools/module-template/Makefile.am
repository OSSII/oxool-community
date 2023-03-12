
ACLOCAL_AMFLAGS = -I m4

SUBDIRS = .

EXTRA_DIST = \
	@PACKAGE_TARNAME@.spec \
	debian/changelog \
	debian/compat \
	debian/control \
	debian/rules \
	debian/source/*

if CUSTOM_HTML
EXTRA_DIST += html
endif

if ENABLE_ADMIN
EXTRA_DIST += admin
endif

MODULE_DATA_DIR = @OXOOL_MODULE_DATA_DIR@/@MODULE_NAME@

# Module config file install path
configdir = @OXOOL_MODULE_CONFIG_DIR@
dist_config_DATA = @MODULE_NAME@.xml

if BUILD_SHARED_LIBRARY
# Module install path
moduledir = @OXOOL_MODULES_DIR@
module_LTLIBRARIES = @MODULE_NAME@.la
@MODULE_NAME@_la_CPPFLAGS = -pthread -I$(abs_top_builddir) $(OXOOL_CFLAGS)
@MODULE_NAME@_la_LDFLAGS = -avoid-version -module $(OXOOL_LIBS)
@MODULE_NAME@_la_SOURCES = src/Module.cpp
endif

install-data-local:
if CUSTOM_HTML
	$(MKDIR_P) $(DESTDIR)/$(MODULE_DATA_DIR)/html
	cp -aR html/. $(DESTDIR)/$(MODULE_DATA_DIR)/html
endif
if ENABLE_ADMIN
	$(MKDIR_P) $(DESTDIR)/$(MODULE_DATA_DIR)/admin
	cp -aR admin/. $(DESTDIR)/$(MODULE_DATA_DIR)/admin
endif

uninstall-local:
if CUSTOM_HTML
	rm -fr $(DESTDIR)/$(MODULE_DATA_DIR)/html
endif
if ENABLE_ADMIN
	rm -fr $(DESTDIR)/$(MODULE_DATA_DIR)/admin
endif
