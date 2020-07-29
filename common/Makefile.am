
oxoolcommon_includedir = $(includedir)/oxool/common

oxoolcommon_include_HEADERS = \
		Common.hpp		\
		Crypto.hpp		\
		FileUtil.hpp		\
		IoUtil.hpp		\
		JsonUtil.hpp		\
		Log.hpp			\
		LOOLWebSocket.hpp 	\
		Message.hpp		\
		MessageQueue.hpp	\
		Png.hpp			\
		Protocol.hpp		\
		Rectangle.hpp		\
		Seccomp.hpp		\
		security.h		\
		Session.hpp		\
		SigUtil.hpp		\
		SpookyV2.h		\
		Unit.hpp		\
		UnitHTTP.hpp		\
		Util.hpp		\
		Authorization.hpp

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

noinst_LTLIBRARIES = liboxoolcommon.la

liboxoolcommon_la_SOURCES = \
		FileUtil.cpp	\
		IoUtil.cpp	\
		Log.cpp		\
		Protocol.cpp	\
		Session.cpp	\
		Seccomp.cpp	\
		MessageQueue.cpp\
		SigUtil.cpp	\
		SpookyV2.cpp	\
		Unit.cpp	\
		Util.cpp	\
		Authorization.cpp \
		Crypto.cpp
