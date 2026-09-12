## Source directory

h_sources = CON_console.h CON_consolecommands.h DT_drawtext.h
cc_sources = CON_console.c CON_consolecommands.c DT_drawtext.c

#library_includedir=$(includedir)/$(GENERIC_LIBRARY_NAME)
#library_include_HEADERS = $(h_sources)

#INCLUDES = -I$(top_srcdir)

lib_LTLIBRARIES= libSDL_console.la
libSDL_console_la_SOURCES= $(h_sources) $(cc_sources)
#libSDL_console_la_LDFLAGS= -version-info $(GENERIC_LIBRARY_VERSION) -release $(GENERIC_RELEASE)
