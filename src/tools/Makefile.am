
if ENABLE_DEBUG
MODULE_TEMPLATE_DIR = $(abs_top_builddir)/src/tools/module-template
else
MODULE_TEMPLATE_DIR = $(pkgdatadir)/module-template
endif

include_paths = -I$(abs_top_builddir)/src/include \
                -I$(abs_top_builddir)/common \
                -I$(abs_top_builddir)/net \
                -I$(abs_top_builddir)/wsd

bin_PROGRAMS = oxool-module-maker

oxool_module_maker_CPPFLAGS = -pthread \
			      -DMODULE_TEMPLATE_DIR='"${MODULE_TEMPLATE_DIR}"' \
			      ${include_paths}

oxool_module_maker_LDADD = $(abs_top_builddir)/libOxOOL.la
oxool_module_maker_SOURCES = oxool-module-maker.cpp

EXTRA_DIST = module-template/*

install-data-hook:
	mkdir -p $(DESTDIR)$(MODULE_TEMPLATE_DIR)
	cp -aR module-template/* $(DESTDIR)$(MODULE_TEMPLATE_DIR)/

uninstall-hook:
	rm -fr $(DESTDIR)$(MODULE_TEMPLATE_DIR)
