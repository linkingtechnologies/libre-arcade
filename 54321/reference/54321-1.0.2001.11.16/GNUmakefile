############################################################
all:
############################################################
# HAS_NOWEB := 1

ifdef HAS_NOWEB
    LINE_NUMBERS := -L
endif

ARCH := $(shell uname -s)
BUILD := Build/$(ARCH)
CODE  := code

ifdef HAS_NOWEB

NWS := \
	nws/intro.nw \
	nws/cube.nw \
	nws/font.nw \
	nws/sound.nw \
	nws/control.nw \
	nws/view.nw \
	nws/menu.nw \
	nws/menuview.nw \
	nws/help.nw \
	nws/flipflop.nw \
	nws/fcontrol.nw \
	nws/fview.nw \
	nws/bomb.nw \
	nws/bcontrol.nw \
	nws/bview.nw \
	nws/maze.nw \
	nws/mcontrol.nw \
	nws/mview.nw \
	nws/peg.nw \
	nws/pview.nw \
	nws/pcontrol.nw \
	nws/tile.nw \
	nws/tcontrol.nw \
	nws/tview.nw \
	nws/life.nw \
	nws/lcontrol.nw \
	nws/lview.nw \
	nws/main.nw \
	nws/darwin.nw \
	nws/end.nw

endif

DOC := doc/54321-dev.pdf

SCREENSHOTS := \
    $(wildcard data/webpage/*.jpg) \
    $(wildcard data/webpage/*.png)

WEBPAGES := \
	doc/index.html \
	doc/index.php \
	$(patsubst data/webpage/%, doc/screenshot/%, $(SCREENSHOTS) )

TARGET := Release/bin/$(ARCH)/54321
SRCS := \
	$(CODE)/cube.cpp \
	$(CODE)/font.cpp \
	$(CODE)/soundDev.cpp \
	$(CODE)/controller.cpp \
	$(CODE)/view.cpp \
	$(CODE)/mainmenuController.cpp \
	$(CODE)/mainmenuView.cpp \
	$(CODE)/help.cpp \
	$(CODE)/flipflop.cpp \
	$(CODE)/flipflopController.cpp \
	$(CODE)/flipflopView.cpp \
	$(CODE)/bomb.cpp \
	$(CODE)/bombController.cpp \
	$(CODE)/bombView.cpp \
	$(CODE)/maze.cpp \
	$(CODE)/mazeController.cpp \
	$(CODE)/mazeView.cpp \
	$(CODE)/peg.cpp \
	$(CODE)/pegController.cpp \
	$(CODE)/pegView.cpp \
	$(CODE)/tile.cpp \
	$(CODE)/tileController.cpp \
	$(CODE)/tileView.cpp \
	$(CODE)/life.cpp \
	$(CODE)/lifeController.cpp \
	$(CODE)/lifeView.cpp \
	$(CODE)/main.cpp

OBJS := \
	$(patsubst $(CODE)/%.cpp,$(BUILD)/%.o,$(filter $(CODE)/%.cpp, $(SRCS)))

HDRS := \
	$(CODE)/cube.h \
	$(CODE)/font.h \
	$(CODE)/soundDev.h \
	$(CODE)/controller.h \
	$(CODE)/view.h \
	$(CODE)/help.h \
	$(CODE)/mainmenuController.h \
	$(CODE)/mainmenuView.h \
	$(CODE)/flipflop.h \
	$(CODE)/flipflopController.h \
	$(CODE)/flipflopView.h \
	$(CODE)/bomb.h \
	$(CODE)/bombController.h \
	$(CODE)/bombView.h \
	$(CODE)/maze.h \
	$(CODE)/mazeController.h \
	$(CODE)/mazeView.h \
	$(CODE)/peg.h \
	$(CODE)/pegController.h \
	$(CODE)/pegView.h \
	$(CODE)/tile.h \
	$(CODE)/tileController.h \
	$(CODE)/tileView.h \
	$(CODE)/life.h \
	$(CODE)/lifeController.h \
	$(CODE)/lifeView.h

 HELP_FILES := $(wildcard data/*.hlp)
  PEG_FILES := $(wildcard data/*.peg)
IMAGE_FILES := $(wildcard images/*.png)

DATA := \
	$(patsubst data/%.hlp, Release/data/%.hlp, $(HELP_FILES) ) \
	$(patsubst data/%.peg, Release/data/%.peg, $(PEG_FILES) ) \
	$(patsubst images/%.png, Release/data/%.png, $(IMAGE_FILES) ) \
	Release/README

CXXFLAGS := -O -DNDEBUG=1
CPPFLAGS := -I$(CODE)

############################################################
include archs/$(ARCH)/variables.GNU
############################################################

all: prog $(DOC) $(WEBPAGES)

prog:	$(TARGET) $(DATA)

size:	prog
	@echo 'Size (in Kilobytes) is: ' $(shell du -ks Release)

clean:	tidy
	rm -rf Release
ifdef HAS_NOWEB
	rm -rf $(CODE) doc
else
	rm -rf $(WEBPAGES) doc/screenshot
endif

tidy:
	rm -rf Build \
		$(DOC:%.pdf=%.tex) \
		$(DOC:%.pdf=%.aux) \
		$(DOC:%.pdf=%.log) \
		$(DOC:%.pdf=%.toc)

############################################################

$(TARGET):	$(OBJS)
	-@$(MKDIR_CMD)
	$(CXX) $(CXXFLAGS) -o $@ $(OBJS) $(LDFLAGS) $(LIBS)
	$(STRIP) $@

ifdef HAS_NOWEB

$(CODE)/%.h:	$(NWS)
	-@$(MKDIR_CMD)
	notangle $(LINE_NUMBERS) -R$(@F) $^ | cpif $@

$(CODE)/%.cpp:	$(NWS)
	-@$(MKDIR_CMD)
	notangle $(LINE_NUMBERS) -R$(@F) $^ | cpif $@

$(DOC):	$(DOC:%.pdf=%.tex)
	-@$(MKDIR_CMD)
	( \
	    cd $(@D); \
	    pdflatex $(<F) ; \
	    pdflatex $(<F) ; \
	    pdflatex $(<F) ; \
	)

$(DOC:%.pdf=%.tex):	$(NWS)
	-@$(MKDIR_CMD)
	noweave $^ | cpif $@

endif

############################################################

$(BUILD)/%.o:	$(CODE)/%.cpp
	-@$(MKDIR_CMD)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c -o $@ $<

Release/data/%:	images/%
	-@$(MKDIR_CMD)
	cp -p $< $@

Release/data/%:	data/%
	-@$(MKDIR_CMD)
	cp -p $< $@

Release/README: README
	-@$(MKDIR_CMD)
	cp -p $< $@

doc/screenshot/%:	data/webpage/%
	-@$(MKDIR_CMD)
	cp -p $< $@

doc/index.%:	data/webpage/hdr.% data/webpage/body.html data/webpage/tail.%
	-@$(MKDIR_CMD)
	cat $^ > $@

############################################################

.PHONY: all
.PHONY: prog
.PHONY: size
.PHONY: clean
.PHONY: tidy

.SECONDARY: $(SRCS)
.SECONDARY: $(HDRS)
.SECONDARY: $(DOC:%.pdf=%.tex)
.SECONDARY: $(DOC:%.pdf=%.aux)
.SECONDARY: $(DOC:%.pdf=%.log)
.SECONDARY: $(DOC:%.pdf=%.toc)

############################################################

$(BUILD)/cube.o:	$(CODE)/cube.h

$(BUILD)/font.o:	$(CODE)/font.h

$(BUILD)/soundDev.o:	$(CODE)/soundDev.h

$(BUILD)/controller.o:	$(CODE)/controller.h
$(BUILD)/controller.o:	$(CODE)/cube.h

$(BUILD)/view.o:	$(CODE)/view.h
$(BUILD)/view.o:	$(CODE)/help.h
$(BUILD)/view.o:	$(CODE)/cube.h
$(BUILD)/view.o:	$(CODE)/soundDev.h

$(BUILD)/mainmenuController.o:	$(CODE)/mainmenuController.h
$(BUILD)/mainmenuController.o:	$(CODE)/cube.h
$(BUILD)/mainmenuController.o:	$(CODE)/soundDev.h
$(BUILD)/mainmenuController.o:	$(CODE)/view.h
$(BUILD)/mainmenuController.o:	$(CODE)/controller.h
$(BUILD)/mainmenuController.o:	$(CODE)/mainmenuView.h

$(BUILD)/mainmenuView.o:	$(CODE)/mainmenuView.h
$(BUILD)/mainmenuView.o:	$(CODE)/soundDev.h
$(BUILD)/mainmenuView.o:	$(CODE)/view.h
$(BUILD)/mainmenuView.o:	$(CODE)/cube.h

$(BUILD)/help.o:	$(CODE)/help.h
$(BUILD)/help.o:	$(CODE)/font.h
$(BUILD)/help.o:	$(CODE)/soundDev.h
$(BUILD)/help.o:	$(CODE)/view.h
$(BUILD)/help.o:	$(CODE)/cube.h

$(BUILD)/flipflop.o:	$(CODE)/flipflop.h
$(BUILD)/flipflop.o:	$(CODE)/cube.h
$(BUILD)/flipflop.o:	$(CODE)/soundDev.h
$(BUILD)/flipflop.o:	$(CODE)/view.h
$(BUILD)/flipflop.o:	$(CODE)/flipflopView.h

$(BUILD)/flipflopController.o:	$(CODE)/flipflopController.h
$(BUILD)/flipflopController.o:	$(CODE)/cube.h
$(BUILD)/flipflopController.o:	$(CODE)/controller.h
$(BUILD)/flipflopController.o:	$(CODE)/soundDev.h
$(BUILD)/flipflopController.o:	$(CODE)/view.h
$(BUILD)/flipflopController.o:	$(CODE)/flipflopView.h
$(BUILD)/flipflopController.o:	$(CODE)/flipflop.h

$(BUILD)/flipflopView.o:	$(CODE)/flipflopView.h
$(BUILD)/flipflopView.o:	$(CODE)/cube.h
$(BUILD)/flipflopView.o:	$(CODE)/soundDev.h
$(BUILD)/flipflopView.o:	$(CODE)/view.h

$(BUILD)/bomb.o:	$(CODE)/bomb.h
$(BUILD)/bomb.o:	$(CODE)/cube.h
$(BUILD)/bomb.o:	$(CODE)/soundDev.h
$(BUILD)/bomb.o:	$(CODE)/view.h
$(BUILD)/bomb.o:	$(CODE)/bombView.h

$(BUILD)/bombView.o:	$(CODE)/bombView.h
$(BUILD)/bombView.o:	$(CODE)/cube.h
$(BUILD)/bombView.o:	$(CODE)/font.h
$(BUILD)/bombView.o:	$(CODE)/soundDev.h
$(BUILD)/bombView.o:	$(CODE)/view.h
$(BUILD)/bombView.o:	$(CODE)/bomb.h

$(BUILD)/bombController.o:	$(CODE)/bombController.h
$(BUILD)/bombController.o:	$(CODE)/cube.h
$(BUILD)/bombController.o:	$(CODE)/controller.h
$(BUILD)/bombController.o:	$(CODE)/soundDev.h
$(BUILD)/bombController.o:	$(CODE)/view.h
$(BUILD)/bombController.o:	$(CODE)/bombView.h
$(BUILD)/bombController.o:	$(CODE)/bomb.h

$(BUILD)/maze.o:	$(CODE)/maze.h
$(BUILD)/maze.o:	$(CODE)/cube.h
$(BUILD)/maze.o:	$(CODE)/soundDev.h
$(BUILD)/maze.o:	$(CODE)/view.h
$(BUILD)/maze.o:	$(CODE)/mazeView.h

$(BUILD)/mazeView.o:	$(CODE)/mazeView.h
$(BUILD)/mazeView.o:	$(CODE)/cube.h
$(BUILD)/mazeView.o:	$(CODE)/soundDev.h
$(BUILD)/mazeView.o:	$(CODE)/view.h
$(BUILD)/mazeView.o:	$(CODE)/maze.h

$(BUILD)/mazeController.o:	$(CODE)/mazeController.h
$(BUILD)/mazeController.o:	$(CODE)/cube.h
$(BUILD)/mazeController.o:	$(CODE)/controller.h
$(BUILD)/mazeController.o:	$(CODE)/soundDev.h
$(BUILD)/mazeController.o:	$(CODE)/view.h
$(BUILD)/mazeController.o:	$(CODE)/mazeView.h
$(BUILD)/mazeController.o:	$(CODE)/maze.h

$(BUILD)/peg.o:	$(CODE)/peg.h
$(BUILD)/peg.o:	$(CODE)/cube.h
$(BUILD)/peg.o:	$(CODE)/soundDev.h
$(BUILD)/peg.o:	$(CODE)/view.h
$(BUILD)/peg.o:	$(CODE)/font.h
$(BUILD)/peg.o:	$(CODE)/pegView.h

$(BUILD)/pegView.o:	$(CODE)/pegView.h
$(BUILD)/pegView.o:	$(CODE)/cube.h
$(BUILD)/pegView.o:	$(CODE)/font.h
$(BUILD)/pegView.o:	$(CODE)/soundDev.h
$(BUILD)/pegView.o:	$(CODE)/view.h
$(BUILD)/pegView.o:	$(CODE)/peg.h

$(BUILD)/pegController.o:	$(CODE)/pegController.h
$(BUILD)/pegController.o:	$(CODE)/cube.h
$(BUILD)/pegController.o:	$(CODE)/controller.h
$(BUILD)/pegController.o:	$(CODE)/soundDev.h
$(BUILD)/pegController.o:	$(CODE)/view.h
$(BUILD)/pegController.o:	$(CODE)/font.h
$(BUILD)/pegController.o:	$(CODE)/pegView.h
$(BUILD)/pegController.o:	$(CODE)/peg.h

$(BUILD)/tile.o:	$(CODE)/tile.h
$(BUILD)/tile.o:	$(CODE)/cube.h
$(BUILD)/tile.o:	$(CODE)/soundDev.h
$(BUILD)/tile.o:	$(CODE)/view.h
$(BUILD)/tile.o:	$(CODE)/font.h
$(BUILD)/tile.o:	$(CODE)/tileView.h

$(BUILD)/tileView.o:	$(CODE)/tileView.h
$(BUILD)/tileView.o:	$(CODE)/cube.h
$(BUILD)/tileView.o:	$(CODE)/font.h
$(BUILD)/tileView.o:	$(CODE)/soundDev.h
$(BUILD)/tileView.o:	$(CODE)/view.h

$(BUILD)/tileController.o:	$(CODE)/tileController.h
$(BUILD)/tileController.o:	$(CODE)/cube.h
$(BUILD)/tileController.o:	$(CODE)/controller.h
$(BUILD)/tileController.o:	$(CODE)/soundDev.h
$(BUILD)/tileController.o:	$(CODE)/view.h
$(BUILD)/tileController.o:	$(CODE)/font.h
$(BUILD)/tileController.o:	$(CODE)/tileView.h
$(BUILD)/tileController.o:	$(CODE)/tile.h

$(BUILD)/life.o:	$(CODE)/life.h
$(BUILD)/life.o:	$(CODE)/cube.h
$(BUILD)/life.o:	$(CODE)/soundDev.h
$(BUILD)/life.o:	$(CODE)/view.h
$(BUILD)/life.o:	$(CODE)/font.h
$(BUILD)/life.o:	$(CODE)/lifeView.h

$(BUILD)/lifeView.o:	$(CODE)/lifeView.h
$(BUILD)/lifeView.o:	$(CODE)/cube.h
$(BUILD)/lifeView.o:	$(CODE)/font.h
$(BUILD)/lifeView.o:	$(CODE)/soundDev.h
$(BUILD)/lifeView.o:	$(CODE)/view.h

$(BUILD)/lifeController.o:	$(CODE)/lifeController.h
$(BUILD)/lifeController.o:	$(CODE)/cube.h
$(BUILD)/lifeController.o:	$(CODE)/controller.h
$(BUILD)/lifeController.o:	$(CODE)/soundDev.h
$(BUILD)/lifeController.o:	$(CODE)/view.h
$(BUILD)/lifeController.o:	$(CODE)/font.h
$(BUILD)/lifeController.o:	$(CODE)/lifeView.h
$(BUILD)/lifeController.o:	$(CODE)/life.h

$(BUILD)/main.o:	$(CODE)/cube.h
$(BUILD)/main.o:	$(CODE)/font.h
$(BUILD)/main.o:	$(CODE)/soundDev.h
$(BUILD)/main.o:	$(CODE)/controller.h
$(BUILD)/main.o:	$(CODE)/view.h
$(BUILD)/main.o:	$(CODE)/mainmenuView.h
$(BUILD)/main.o:	$(CODE)/mainmenuController.h
$(BUILD)/main.o:	$(CODE)/flipflopView.h
$(BUILD)/main.o:	$(CODE)/flipflop.h
$(BUILD)/main.o:	$(CODE)/flipflopController.h
$(BUILD)/main.o:	$(CODE)/bombView.h
$(BUILD)/main.o:	$(CODE)/bomb.h
$(BUILD)/main.o:	$(CODE)/bombController.h
$(BUILD)/main.o:	$(CODE)/mazeView.h
$(BUILD)/main.o:	$(CODE)/maze.h
$(BUILD)/main.o:	$(CODE)/mazeController.h
$(BUILD)/main.o:	$(CODE)/pegView.h
$(BUILD)/main.o:	$(CODE)/peg.h
$(BUILD)/main.o:	$(CODE)/pegController.h
$(BUILD)/main.o:	$(CODE)/tileView.h
$(BUILD)/main.o:	$(CODE)/tile.h
$(BUILD)/main.o:	$(CODE)/tileController.h
$(BUILD)/main.o:	$(CODE)/lifeView.h
$(BUILD)/main.o:	$(CODE)/life.h
$(BUILD)/main.o:	$(CODE)/lifeController.h
