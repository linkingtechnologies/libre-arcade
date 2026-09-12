############################################################
CXX := CC
STRIP := strip
############################################################
MKDIR_CMD = test -d $(@D) || mkdir -p $(@D)
############################################################

TARGET_DIR := $(TARGET).app/Contents
TARGET := $(TARGET_DIR)/MacOS/54321

SRCS += \
	$(CODE)/Darwin-main.m \
	$(CODE)/Darwin-main-help.cpp

OBJS += \
	$(BUILD)/Darwin-main.o \
	$(BUILD)/Darwin-main-help.o

CPPFLAGS += $(shell sdl-config --cflags) -I/sw/include
LDFLAGS  += -L/usr/local/lib -lSDL_image $(shell sdl-config --libs) -lpng

$(CODE)/%.m:	$(NWS)
	-@$(MKDIR_CMD)
	notangle $(LINE_NUMBERS) -R$(@F) $^ | cpif $@

$(BUILD)/Darwin-main.o:	$(CODE)/Darwin-main.m
	-@$(MKDIR_CMD)
	$(CC) $(CPPFLAGS) -c -o $@ $<

$(TARGET):	$(TARGET_DIR)/Info.plist
$(TARGET):	$(TARGET_DIR)/PkgInfo
$(TARGET):	$(TARGET_DIR)/Resources/English.lproj/InfoPlist.strings
$(TARGET):	$(TARGET_DIR)/Resources/SDLMain.nib/classes.nib
$(TARGET):	$(TARGET_DIR)/Resources/SDLMain.nib/info.nib
$(TARGET):	$(TARGET_DIR)/Resources/SDLMain.nib/objects.nib
$(TARGET):	$(TARGET_DIR)/Resources/54321.icns

$(TARGET_DIR)/%:	archs/Darwin/%
	-@$(MKDIR_CMD)
	cp -p $< $@

prog:	Release/54321-$(ARCH)

Release/54321-$(ARCH):
	-@$(MKDIR_CMD)
	ln -s bin/$(ARCH)/54321.app $@
