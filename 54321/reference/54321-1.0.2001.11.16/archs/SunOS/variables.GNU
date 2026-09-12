############################################################
CXX := CC
STRIP := strip
############################################################
MKDIR_CMD = test -d $(@D) || mkdir -p $(@D)
############################################################

SDL_IMAGE := $(HOME)

CPPFLAGS += $(shell sdl-config --cflags) -I${SDL_IMAGE}/include/SDL

ifdef STATIC
    LDFLAGS += \
	    -L$(SDL_IMAGE)/lib \
	    -Bstatic -lSDL_image -lpng -lz -ljpeg -lSDL -lSDLmain \
	    -Bdynamic -lX11 -lXext -lsocket -ldl -lkstat -lpthread -lposix4
else
    LDFLAGS += \
	    -L$(SDL_IMAGE)/lib -R$(SDL_IMAGE)/lib \
	    -lSDL_image -lpng -lSDL $(shell sdl-config --libs) -lSDLmain
endif

prog:	Release/54321-$(ARCH)

Release/54321-$(ARCH):
	-@$(MKDIR_CMD)
	echo '#!/bin/sh' > $@
	echo "cd ./bin/$(ARCH) && exec ./54321 \$$*" >> $@
	chmod 755 $@
