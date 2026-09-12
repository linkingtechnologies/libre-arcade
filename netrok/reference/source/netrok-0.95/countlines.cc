/*
Netrok SDL GPL open source platform 
game for Windows/Linux

Copyright (C) 2004  Ioan-Tudor Parvulescu

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.

written by Ioan-Tudor Parvulescu <ioantudor@gmx.net>
http://www.itpsoft.de
*/


#include <stdio.h>
#include <stdlib.h>
#include <string.h>

using namespace std;


void countfile(char dateinamestr[30],int &zeilencounter)
{
	char buffer[200];
	FILE *datei;
	
	datei = fopen(dateinamestr,"r");
	while(!feof(datei))
		if(fgetc(datei)==10)zeilencounter++;
	fclose(datei);
}

 
int main( int argc, char* argv[] ) 
{ 
	int zeilencounter=0;
	
	countfile("collisiondetect.cc",zeilencounter);
	countfile("gameinitialize.cc",zeilencounter);
	countfile("graphicengine.cc",zeilencounter);
	countfile("loadfiles.cc",zeilencounter);
	countfile("main.cc",zeilencounter);
	countfile("putsprites.cc",zeilencounter);
	countfile("scrolling.cc",zeilencounter);
	countfile("specialblockhandling.cc",zeilencounter);
	countfile("kortenhandling.cc",zeilencounter);
	countfile("SFont.c",zeilencounter);
	countfile("mapeditor.cc",zeilencounter);
	countfile("menu.cc",zeilencounter);
	
	countfile("collisiondetect.h",zeilencounter);
	countfile("gameinitialize.h",zeilencounter);
	countfile("graphicengine.h",zeilencounter);
	countfile("loadfiles.h",zeilencounter);
	countfile("main.h",zeilencounter);
	countfile("putsprites.h",zeilencounter);
	countfile("scrolling.h",zeilencounter);
	countfile("specialblockhandling.h",zeilencounter);
	countfile("kortenhandling.h",zeilencounter);
	countfile("SFont.h",zeilencounter);
	countfile("menu.h",zeilencounter);


	printf("%i",zeilencounter);
	return(0); 
} 
