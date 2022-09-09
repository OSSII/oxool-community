
lib_LTLIBRARIES = libOxOOL.la

include_paths = -I$(top_srcdir) -I$(top_srcdir)/src/include

AM_CPPFLAGS = -pthread ${include_paths}

if !ENABLE_DEBUG
AM_CPPFLAGS += -DNDEBUG
endif

AM_LDFLAGS = -pthread -Wl,-E

libOxOOL_la_SOURCES = \
	OxOOL/ENV.cpp


