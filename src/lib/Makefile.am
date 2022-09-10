
lib_LTLIBRARIES = libOxOOL.la

include_paths = -I$(top_srcdir) \
		-I$(top_srcdir)/src/include \
		-I${top_srcdir}/bundled/include \
		-I${top_srcdir}/common \
		-I${top_srcdir}/net \
		-I${top_srcdir}/wsd \
		-I${top_srcdir}/kit

AM_CPPFLAGS = -pthread ${include_paths} -fPIC

if !ENABLE_DEBUG
AM_CPPFLAGS += -DNDEBUG
endif

AM_LDFLAGS = -pthread -Wl,-E

libOxOOL_la_SOURCES = \
	OxOOL/ENV.cpp \
	OxOOL/Module/Base.cpp
