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
#include "main.h"
#include "gameinitialize.h"
#include "loadfiles.h"

using namespace std;

extern SDL_Surface *screen; 
extern SDL_Surface *t[100];
extern SDL_Surface *fig[180]; 
extern SDL_Joystick *joystick;


void Game_Init() 
{ 
	char aktueller_dateiname[13];

	SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER );   
	//SDL_Init( SDL_INIT_VIDEO | SDL_INIT_TIMER );   
	//screen = SDL_SetVideoMode(320, 200, 8, SDL_HWSURFACE | SDL_DOUBLEBUF | SDL_FULLSCREEN | SDL_HWACCEL | SDL_RLEACCEL ); 
	screen = SDL_SetVideoMode(320, 200, 8, SDL_HWSURFACE | SDL_DOUBLEBUF | SDL_HWACCEL | SDL_RLEACCEL | SDL_FULLSCREEN ); 
	
	tiles_laden();

	int zaehlx=0;
	while(zaehlx<88)
	{
		SDL_SetColorKey(t[zaehlx], SDL_SRCCOLORKEY, SDL_MapRGB(t[zaehlx]->format, 255, 255, 255));
		zaehlx++;
		if(zaehlx==18)zaehlx=21;
		if(zaehlx==42)zaehlx=61;
	}
	for(zaehlx=150; zaehlx<=164; zaehlx++)
		SDL_SetColorKey(fig[zaehlx], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	
	SDL_SetColorKey(fig[166], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[167], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[170], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[171], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[172], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[173], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[174], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[175], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[176], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[177], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[178], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[179], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[99], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(fig[98], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
		
	zaehlx=100;
	while(zaehlx<=146)
	{
		SDL_SetColorKey(fig[zaehlx], SDL_SRCCOLORKEY, SDL_MapRGB(fig[zaehlx]->format, 255, 255, 255));
		zaehlx++;
	}

	SDL_ShowCursor(0);	
} 
