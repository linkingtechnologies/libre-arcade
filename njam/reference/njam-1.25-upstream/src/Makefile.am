INCLUDES=-I$(top_srcdir)

BUILT_SOURCES = defaults.h
DISTCLEANFILES = defaults.h
CONFIG_CLEAN_FILES = defaults.h
defaults.h: Makefile
	echo '// This file is generated from makefile. Do not edit!' > defaults.h
	echo '#define DEFAULT_PREFIX "@DEFAULT_PREFIX@"' >> defaults.h
	echo '#define DEFAULT_LIBDIR "@DEFAULT_LIBDIR@"' >> defaults.h
	echo '#define PACKAGE "@PACKAGE@"' >> defaults.h

njam.$(OBJEXT): defaults.h

bin_PROGRAMS= njam

njam_SOURCES =  njam.h  njam.cpp \
		njamgame.cpp \
		njamfont.h njamfont.cpp \
		njamedit.h njamedit.cpp \
		njammap.h  njammap.cpp \
		njamnet.cpp \
		njamutils.h  njamutils.cpp

uninstall-local:
	for i in $(bin_PROGRAMS); do \
		rm -f $(exec_prefix)/bin/$$i; \
	done

