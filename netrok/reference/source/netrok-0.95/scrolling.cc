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
#include "scrolling.h"
#include "graphicengine.h"

using namespace std;


extern unsigned short int leveldat[32][13][400];
extern SDL_Surface *t[100];


void map_scrollen(player &Spieler, int zaehler)
{
	int a,b;
	Spieler.anzahl_lastdrawtile=0;
	a=Spieler.scrollwert/16;
	b=a+20;
	
	for(int y_tile = 0; y_tile <= 12; y_tile++)
	{
		for(int x_tile = a-2; x_tile <= b; x_tile++)
		{   
			if(leveldat[Spieler.level][y_tile][x_tile]!=0 && !(leveldat[Spieler.level][y_tile][x_tile]>=200 && 
				leveldat[Spieler.level][y_tile][x_tile]<=203)) 
			{
				if(leveldat[Spieler.level][y_tile][x_tile]!=37)
				{	
					if(leveldat[Spieler.level][y_tile][x_tile]==33 || leveldat[Spieler.level][y_tile][x_tile]==34 || 
						leveldat[Spieler.level][y_tile][x_tile]==40 || leveldat[Spieler.level][y_tile][x_tile]==41 ||
						leveldat[Spieler.level][y_tile][x_tile]==80 || leveldat[Spieler.level][y_tile][x_tile]==81 )
					{
						Spieler.anzahl_lastdrawtile++;
						Spieler.xpos_lastdrawtile[Spieler.anzahl_lastdrawtile]=(x_tile*16)-Spieler.scrollwert;
						Spieler.ypos_lastdrawtile[Spieler.anzahl_lastdrawtile]=y_tile*16;
						Spieler.type_lastdrawtile[Spieler.anzahl_lastdrawtile]=leveldat[Spieler.level][y_tile][x_tile];
					}
					else
						DrawIMG(t[leveldat[Spieler.level][y_tile][x_tile]], (x_tile*16)-Spieler.scrollwert, y_tile*16 );
				}	
				else
				{
					if(zaehler<=10)DrawIMG(t[38], (x_tile*16)-Spieler.scrollwert, y_tile*16 );
					if(zaehler>10)DrawIMG(t[39], (x_tile*16)-Spieler.scrollwert, y_tile*16 );	
				}
			}
		}
	}
}