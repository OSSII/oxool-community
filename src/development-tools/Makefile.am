
if ENABLE_DEBUG
MODULE_TEMPLATE_DIR = $(abs_top_builddir)/src/development-tools/module-template
else
MODULE_TEMPLATE_DIR = ${datarootdir}/@PACKAGE_NAME@-devel/module-template
endif

include_paths = -I$(abs_top_builddir)/src/include \
                -I$(abs_top_builddir)/common \
                -I$(abs_top_builddir)/net \
                -I$(abs_top_builddir)/wsd

bin_PROGRAMS = @PACKAGE_NAME@-module-maker

@PACKAGE_NAME@_module_maker_CPPFLAGS = -pthread \
			      -DMODULE_TEMPLATE_DIR='"${MODULE_TEMPLATE_DIR}"' \
			      ${include_paths} \
			      $(GIT2_CFLAGS)

@PACKAGE_NAME@_module_maker_LDADD = $(GIT2_LIBS) $(abs_top_builddir)/@LIB_NAME@.la
@PACKAGE_NAME@_module_maker_SOURCES = ModuleMaker.cpp

EXTRA_DIST = module-template

install-data-hook:
	mkdir -p $(DESTDIR)$(MODULE_TEMPLATE_DIR)
	cp -aR module-template/. $(DESTDIR)$(MODULE_TEMPLATE_DIR)/

uninstall-hook:
	rm -fr $(DESTDIR)$(MODULE_TEMPLATE_DIR)
