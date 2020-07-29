
lib_LTLIBRARIES = liboxool.la

AM_CPPFLAGS = -I$(top_srcdir) \
	-I$(top_srcdir)/src/include


liboxool_la_SOURCES = \
	oxool.cpp

liboxool_la_LIBADD = \
		$(top_builddir)/common/liboxoolcommon.la \
		$(top_builddir)/net/liboxoolnet.la
