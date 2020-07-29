
oxoolnet_includedir = $(includedir)/oxool/net

oxoolnet_include_HEADERS = \
		DelaySocket.hpp		\
		FakeSocket.hpp		\
		ServerSocket.hpp	\
		Socket.hpp		\
		Ssl.hpp			\
		SslSocket.hpp		\
		WebSocketHandler.hpp

include_paths = -I$(top_srcdir)			\
		-I$(top_srcdir)/src/include	\
		-I$(top_srcdir)/common		\
		-I$(top_srcdir)/net		\
		-I$(top_srcdir)/wsd		\
		-I$(top_srcdir)/kit

AM_CPPFLAGS = -DLOOLWSD_DATADIR='"@LOOLWSD_DATADIR@"' \
	      -DLOOLWSD_CONFIGDIR='"@LOOLWSD_CONFIGDIR@"' \
	      -DDEBUG_ABSSRCDIR='"@abs_top_srcdir@"' \
	      ${include_paths}

if !ENABLE_DEBUG
AM_CPPFLAGS += -DNDEBUG
endif

AM_LDFLAGS = -pthread -Wl,-E,-rpath,/snap/oxoolwsd/current/usr/lib -lpam $(ZLIB_LIBS)

if ENABLE_SSL
AM_LDFLAGS += -lssl -lcrypto
endif

noinst_LTLIBRARIES = liboxoolnet.la

liboxoolnet_la_SOURCES = \
		DelaySocket.cpp	\
		FakeSocket.cpp	\
		Socket.cpp	\
		Ssl.cpp
