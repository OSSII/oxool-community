

include_paths = -I$(abs_top_builddir)/src/include \
                -I$(abs_top_builddir)/common \
                -I$(abs_top_builddir)/net \
                -I$(abs_top_builddir)/wsd

bin_PROGRAMS = @PACKAGE_NAME@-xml-config

@PACKAGE_NAME@_xml_config_CPPFLAGS = -pthread \
			      ${include_paths}

@PACKAGE_NAME@_xml_config_LDADD = $(abs_top_builddir)/@LIB_NAME@.la
@PACKAGE_NAME@_xml_config_SOURCES = XmlConfig.cpp
