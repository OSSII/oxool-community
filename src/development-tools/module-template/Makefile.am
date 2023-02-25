
ACLOCAL_AMFLAGS = -I m4

SUBDIRS = .

EXTRA_DIST = Package.settings \
	     @PACKAGE_TARNAME@.spec

MODULE_DATA_DIR = @OXOOL_MODULE_DATA_DIR@/@MODULE_NAME@

# Module config file install path
configdir = @OXOOL_MODULE_CONFIG_DIR@
dist_config_DATA = @MODULE_NAME@.xml

# Module install path
moduledir = @OXOOL_MODULES_DIR@
module_LTLIBRARIES = @MODULE_NAME@.la
@MODULE_NAME@_la_CPPFLAGS = -pthread -I$(abs_top_builddir) $(OXOOL_CFLAGS)
@MODULE_NAME@_la_LDFLAGS = -avoid-version -module $(OXOOL_LIBS)
@MODULE_NAME@_la_SOURCES = src/OxModule.cpp

# Module admin console
if ENABLE_ADMIN
admindir = $(MODULE_DATA_DIR)/admin
dist_admin_DATA = \
	admin/admin.html \
	admin/admin.js \
	admin/localizations.json

adminl10ndir = $(MODULE_DATA_DIR)/admin/l10n
dist_adminl10n_DATA = admin/l10n/*
endif
