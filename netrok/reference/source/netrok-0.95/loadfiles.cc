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

#include <SDL/SDL.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "loadfiles.h"

using namespace std;

extern SDL_Surface *t[100];
extern SDL_Surface *fig[180];


extern unsigned short int leveldat[32][13][400];

void tiles_laden()
{	
	char dateinamestr[9];
	int tile=0;
	
	while(tile<=87)
	{	
		sprintf(dateinamestr,"%d",tile);
		strcat(dateinamestr,".bmp");

		t[tile] = SDL_LoadBMP(dateinamestr);
		tile++;
		if(tile==18)tile=21;
		if(tile==42)tile=61;
	}
	
	tile=100;
	while(tile<=146)
	{	
		sprintf(dateinamestr,"%d",tile);
		strcat(dateinamestr,".bmp");

		fig[tile] = SDL_LoadBMP(dateinamestr);
		tile++;
	}
	
	
	fig[170] = SDL_LoadBMP("menu1.bmp");
	fig[171] = SDL_LoadBMP("menu2.bmp");
	fig[172] = SDL_LoadBMP("menu3.bmp");
	fig[173] = SDL_LoadBMP("menu4.bmp");
	fig[174] = SDL_LoadBMP("back.bmp");
	fig[175] = SDL_LoadBMP("instructions.bmp");
	fig[176] = SDL_LoadBMP("about.bmp");
	fig[177] = SDL_LoadBMP("gameover.bmp");
	fig[178] = SDL_LoadBMP("levelfinished.bmp");
	fig[179] = SDL_LoadBMP("logo.bmp");
	fig[99]=SDL_LoadBMP("itpsoft.bmp");
	fig[98]=SDL_LoadBMP("98.bmp");
	
	
	tile=150;
	while(tile<=167)
	{
		sprintf(dateinamestr,"%d",tile);
		strcat(dateinamestr,".bmp");

		fig[tile] = SDL_LoadBMP(dateinamestr);
		tile++;
	}	
}

void map_laden(char dateiname[13], int zu_ladendes_level)
{	

	char buffer[5];
	FILE *datei;
	datei = fopen(dateiname,"r");
	if(datei == NULL)
	{
		printf("ACHTUNG: Datei konnte nicht geoeffnet werden");
	}
	for(int lesey=0; lesey<=12; lesey++)
	{
		for(int lesex=0;lesex<=399;lesex++)
		{
			fscanf(datei,"%s\n", buffer);
			leveldat[zu_ladendes_level][lesey][lesex]=atoi(buffer);
			
			strcpy(buffer, "\0" );	
		}
	}
	fclose(datei);	

}
