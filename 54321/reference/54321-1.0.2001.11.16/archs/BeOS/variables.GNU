############################################################
CXX := c++
STRIP := strip
############################################################
MKDIR_CMD = test -d $(@D) || mkdir -p $(@D)
############################################################

CPPFLAGS += -I/boot/develop/tools/gnupro/include/SDL

LDFLAGS += \
    -L$(HOME)/config/lib -lSDL -lSDL_image -lSDLmain

prog:	Release/54321-$(ARCH)

Release/54321-$(ARCH):
	-@$(MKDIR_CMD)
	ln -s bin/$(ARCH)/54321 $@
