
oxoolforkit_includedir = $(includedir)/oxool/kit

oxoolforkit_include_HEADERS = \
		ChildSession.hpp \
		Delta.hpp \
		DummyLibreOfficeKit.hpp \
		KitHelper.hpp \
		Watermark.hpp \
		Kit.hpp

include_paths = -I ${top_srcdir}/src/include -I${top_srcdir}/common -I${top_srcdir}/net -I${top_srcdir}/wsd -I${top_srcdir}/kit ${ZLIB_CFLAGS}

AM_CPPFLAGS = -pthread -DLOOLWSD_DATADIR='"@LOOLWSD_DATADIR@"' \
              -DLOOLWSD_CONFIGDIR='"@LOOLWSD_CONFIGDIR@"' \
              -DDEBUG_ABSSRCDIR='"@abs_top_srcdir@"' \
              ${include_paths}

if !ENABLE_DEBUG
AM_CPPFLAGS += -DNDEBUG
endif

AM_LDFLAGS = -pthread -Wl,-E,-rpath,/snap/oxoolwsd/current/usr/lib -lpam $(ZLIB_LIBS) $(top_builddir)/src/lib/liboxool.la

if ENABLE_SSL
AM_LDFLAGS += -lssl -lcrypto
endif

oxoolforkit_SOURCES = ChildSession.cpp \
		      ForKit.cpp \
		      Kit.cpp

bin_PROGRAMS = oxoolforkit
		   
