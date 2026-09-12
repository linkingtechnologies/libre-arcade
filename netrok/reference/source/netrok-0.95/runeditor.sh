#!/bin/bash

pwd=$(pwd)

export PS1='\w\$ '
umask 022

echo "--------------------------------------------------------------"
echo "Setting PATH to $pwd:$PATH"
export PATH=$pwd:$PATH

if [ ! -d home ];then
	mkdir home
fi

export HOME=$pwd/home
export XDG_DATA_HOME=$pwd/home
export XDG_CONFIG_HOME=$pwd/home
#export SDL_VIDEODRIVER="omapdss"
#export SDL_OMAP_VSYNC="1"
#export SDL_OMAP_LAYER_SIZE="768x480"

if [ ! -d $XDG_CONFIG_HOME ];then
 echo initialized home folder
 mkdir -p $XDG_CONFIG_HOME
fi

if [ ! -f 1 ];then
 echo installing levels
 cp levels/* .
fi

./mapeditor

