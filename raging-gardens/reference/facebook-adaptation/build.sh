#!/bin/sh

PWD=$(pwd)
YUI=$(pwd)/yuicompressor-2.4.8pre.jar
BUILD=$(pwd)/build

if [ ! -d $BUILD ]; then
	echo "Build folder($BUILD) does not exist!"
	exit
fi

if [ ! -e $YUI ]; then
	echo "YUI not found in $YUI!"
	exit
fi

echo "Building ..."

### Cleanup old build files
find $BUILD -type f ! -name ".gitkeep" |xargs -i rm {}
find $BUILD -type d ! -name ".gitkeep" -and ! -name "build" |xargs -i rmdir {} -p

### Copy required files
#find . -not -name "/.git*" -and ! -iname "build" -and ! -name "*.jar" -and ! -name "tests*" -and ! -name ".*" | xargs  -i  cp {} $BUILD/{} -R
#find . \( -name '.project*' -o -name '.git*' -o -name '*.sh' -o -name 'build*' -o -name '.settings*' -o -name 'tests.*' -o -name '*.jar'  \) \
#-prune -o -print | xargs echo {}# cp {} $BUILD/{} -R

cp art/ $BUILD -R
cp css/ $BUILD -R
cp lib/ $BUILD -R
cp sfx/ $BUILD -R
cp src/ $BUILD -R
cp channel.php favicon.ico HISTORY index.php LICENSE README.md .htaccess $BUILD

### Obfuscate javascript
cd $BUILD/css
java -jar $YUI  -o 'style.min.css' style.css
rm style.css
cd $BUILD/src
java -jar $YUI  -o '.js$:.js' *.js

### Production
cd $BUILD
sed -i 's/style.css/style.min.css/g' index.php
sed -i 's/dev/prod/g' index.php


echo "Build completed."
