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

using namespace std;

extern SDL_Surface *screen;

void DrawIMG(SDL_Surface *img, int x, int y) 
{ 
	SDL_Rect dest; 
	dest.x = x; 
	dest.y = y; 
	SDL_BlitSurface(img, NULL, screen, &dest); 
  
} 




