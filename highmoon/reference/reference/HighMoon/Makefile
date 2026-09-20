# HighMoon - Duel in Space
# Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>

# __Something like /usr/local/share/highmoon. All Files (Data and Binary) will be copied there:__ 
INSTALLPATH=/home/pat/Programme/Spiele/HighMoon

# __Set this to a bin-Path. The Installer will create a small Execution-Script in that Path:__
INSTALLBIN=/home/pat/Programme/Spiele/bin

CACHE	 = #ccache	# use http://ccache.samba.org to speedup compiling
CXX      = $(CACHE) g++ 
CXXFLAGS = -g -O3 -Wall `sdl-config --cflags`
LDFLAGS  = #-static -s
LIBS     = -L. `sdl-config --libs` -lSDL_image
#LIBS     = -L. `sdl-config --static-libs` -lSDL_image -lpng -ljpeg -lz -lm
SRCDIR   = src
BIN      = ufo

OBJS = 	$(SRCDIR)/main.o $(SRCDIR)/vector_2.o $(SRCDIR)/language.o $(SRCDIR)/sound.o $(SRCDIR)/graphics.o $(SRCDIR)/object.o $(SRCDIR)/galaxy.o $(SRCDIR)/shoot.o

all:	$(BIN)

$(BIN):	$(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $(BIN) $(OBJS) $(LIBS)

clean:        
	@echo "Removing Backup- and Object-Files."
	@rm -f $(SRCDIR)/*.o
	@rm -f $(SRCDIR)/*~
	@rm -f *~

new: 	clean all

install:
	@echo -n "Installing HighMoon v"
	@cat VERSION
	@echo "Path to Install: $(INSTALLPATH)"
	@echo "Creating Directories and Installing Files."
	@mkdir -p $(INSTALLBIN)
	@mkdir --mode=755 -p $(INSTALLPATH)/gfx $(INSTALLPATH)/snd
	@install --strip --mode=755 $(BIN) $(INSTALLPATH)
	@install --mode=644 gfx/* $(INSTALLPATH)/gfx
	@install --mode=644 snd/* $(INSTALLPATH)/snd
	@echo "Creating $(INSTALLBIN)/highmoon to run HighMoon."
	@echo >$(INSTALLBIN)/highmoon '#!/bin/sh'
	@echo >>$(INSTALLBIN)/highmoon 'cd $(INSTALLPATH)'
	@echo >>$(INSTALLBIN)/highmoon './$(BIN) $$1'
	@chmod 755 $(INSTALLBIN)/highmoon

uninstall:
	@echo -n "Uninstalling HighMoon v"
	@cat VERSION
	@echo "Removing Files and Directories."
	@rm -f $(INSTALLBIN)/highmoon
	@rm -f -r $(INSTALLPATH)
