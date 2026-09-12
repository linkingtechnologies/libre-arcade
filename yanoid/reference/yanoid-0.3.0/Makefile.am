SUBDIRS = src data

#EXTRA_DIST = bootstrap config  yanoid.xpm DOCS src/Makefile.linux.mdk80
EXTRA_DIST = bootstrap config doc 

# Hook for making sure that we do not distribute CVS stuff
dist-hook:
	find $(distdir) -type d -name "*CVS*" | xargs rm -Rf


