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
#include <SDL/SDL_mixer.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "main.h"
#include "putsprites.h"
#include "collisiondetect.h"
#include "specialblockhandling.h"


using namespace std;

extern unsigned short int leveldat[32][13][400];
extern Mix_Chunk *snd_treffer;
extern Mix_Chunk *snd_enemykill_ver;
extern Mix_Chunk *snd_enemykill_hor;
extern Mix_Chunk *snd_button;


bool collisiondetect_rechts(player &Spieler)
{
	if(Spieler.korten_y <-255) return true;
	if(Spieler.scrollwert+144>=6224)return false;
	int ixs[8],yps[8];
	int aktuelle_spalte,aktuelle_zeile;

	ixs[3]=Spieler.scrollwert+144+16-2;	yps[3]=Spieler.korten_y;
	ixs[4]=Spieler.scrollwert+144+16-2;	yps[4]=Spieler.korten_y+15+10;
	ixs[5]=Spieler.scrollwert+144+16-2;	yps[5]=Spieler.korten_y+15;		// beim modifizieren dieser werte auch werte in
														// check_korten_fallenderstein entsprechend abändern
	
	aktuelle_zeile=yps[3]/16;
	aktuelle_spalte=ixs[3]/16;
	
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36)) 	// beim modifizieren dieser werte auch werte in void setze_fahne(player &Spieler) 
													// aus specialblockhandling.cc beachten und entsprechend abändern!!
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	aktuelle_zeile=yps[4]/16;
	aktuelle_spalte=ixs[4]/16;
		
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	
	aktuelle_zeile=yps[5]/16;
	aktuelle_spalte=ixs[5]/16;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	
	return true;

}

bool collisiondetect_links(player &Spieler)
{
	if(Spieler.korten_y <-255) return true;
	int ixs[8],yps[8];
	int aktuelle_spalte,aktuelle_zeile;

	ixs[0]=Spieler.scrollwert+144-1+2;	yps[0]=Spieler.korten_y;
	ixs[7]=Spieler.scrollwert+144-1+2;	yps[7]=Spieler.korten_y+15+10;
	ixs[6]=Spieler.scrollwert+144-1+2;	yps[6]=Spieler.korten_y+15;

	aktuelle_zeile=yps[7]/16;
	aktuelle_spalte=ixs[7]/16;
	
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	aktuelle_zeile=yps[0]/16;
	aktuelle_spalte=ixs[0]/16;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	
	aktuelle_zeile=yps[6]/16;
	aktuelle_spalte=ixs[6]/16;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
		
	return true;
}

bool collisiondetect_oben(player &Spieler)
{
	if(Spieler.korten_y <-255) return true;
	int ixs[8],yps[8];
	int aktuelle_spalte,aktuelle_zeile;

	ixs[1]=Spieler.scrollwert+144+2;		yps[1]=Spieler.korten_y-1;
	ixs[2]=Spieler.scrollwert+144+15-2;	yps[2]=Spieler.korten_y-1;

	aktuelle_zeile=yps[1]/16;
	aktuelle_spalte=ixs[1]/16;
	
	if(aktuelle_zeile<0)return true;
	
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	aktuelle_zeile=yps[2]/16;
	aktuelle_spalte=ixs[2]/16;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 6 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 7 &&
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte] != 8)
		{
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
		}
	}
	if((Spieler.zug_phase==1 || Spieler.zug_phase==2) && (Spieler.korten_y<=Spieler.position_zug+190))return false;
	return true;
}

bool collisiondetect_unten(player &Spieler)
{
	if(Spieler.korten_y <-255) return true;
	int ixs[9],yps[9];
	int aktuelle_spalte,aktuelle_zeile;
	int aktuelle_spalte2,aktuelle_zeile2;

	ixs[5]=Spieler.scrollwert+144+15-2;	yps[5]=Spieler.korten_y+16+10;
	ixs[6]=Spieler.scrollwert+144+2;		yps[6]=Spieler.korten_y+16+10;
	ixs[7]=Spieler.scrollwert+144+15-2;	yps[7]=Spieler.korten_y+16-1+10;
	ixs[8]=Spieler.scrollwert+144+2;		yps[8]=Spieler.korten_y+16-1+10;
	
	aktuelle_zeile=yps[5]/16;
	aktuelle_spalte=ixs[5]/16;
	
	if(aktuelle_zeile<0)return true;
	
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		aktuelle_zeile2=yps[7]/16;
		aktuelle_spalte2=ixs[7]/16;
		if(leveldat[Spieler.level][aktuelle_zeile2][aktuelle_spalte2]==6 || 
			leveldat[Spieler.level][aktuelle_zeile2][aktuelle_spalte2]==7 ||
			leveldat[Spieler.level][aktuelle_zeile2][aktuelle_spalte2]==8) return true;  
		
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
	}
	aktuelle_zeile=yps[6]/16;
	aktuelle_spalte=ixs[6]/16;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==26 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
	{
		aktuelle_zeile2=yps[8]/16;
		aktuelle_spalte2=ixs[8]/16;
		if(leveldat[Spieler.level][aktuelle_zeile2][aktuelle_spalte2]==6 || 
			leveldat[Spieler.level][aktuelle_zeile2][aktuelle_spalte2]==7 ||
			leveldat[Spieler.level][aktuelle_zeile2][aktuelle_spalte2]==8) return true; 
		
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0 && aktuelle_zeile>=0)return false;
	}
	return true;

}

bool collisiondetect_enemy_links(player &Spieler, enemy &Enemies, int zaehler)
{
	if(Spieler.korten_y <-255) return true;
	int aktuelle_zeile=(Enemies.y[zaehler]+8)/16;
	int aktuelle_spalte=(Enemies.x[zaehler]-1)/16;	
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0)
			return false;
	return true;
}

bool collisiondetect_enemy_rechts(player &Spieler, enemy &Enemies, int zaehler)
{
	if(Spieler.korten_y <-255) return true;
	int aktuelle_zeile=(Enemies.y[zaehler]+8)/16;
	int aktuelle_spalte=(Enemies.x[zaehler]+16)/16;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0)
			return false;
	return true;	
}

bool collisiondetect_enemy_unten(player &Spieler, enemy &Enemies, int zaehler)
{
	if(Spieler.korten_y <-255) return true;
	int aktuelle_zeile=(Enemies.y[zaehler]+16)/16;
	int aktuelle_spalte=(Enemies.x[zaehler]+2)/16;	
	int aktuelle_spalte2=(Enemies.x[zaehler]+13)/16;	
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]<=36))
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]!=0)
			return false;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]<=20 || 
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]==40 ||
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]==41 ||
		(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]>=29 &&
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]<=36))
		if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]!=0)
			return false;

	return true;	
}


void collisiondetect_kugel_spieler(player &Spieler, kugel &Kugeln, int zaehler2)
{
	if(absolut(Spieler.scrollwert+144-Kugeln.x[zaehler2])<=11)
	{	
		if(absolut((Spieler.korten_y+13)-(Kugeln.y[zaehler2]+8))<=18) 
		{
			Spieler.unverwundbarkeits_timer=150;
			if(absolut(Spieler.scrollwert+144-Kugeln.x[zaehler2])<=8)
			{
				if((Spieler.korten_y+13)>(Kugeln.y[zaehler2]+8))
				{
					if(Spieler.shield[HOCH]>0)Spieler.shield[HOCH]--;
					else Spieler.korten_tot=true;
					Spieler.score=Spieler.score-50;
					sprintf(Spieler.scorewert,"%d",Spieler.score);	
					Mix_PlayChannel(-1, snd_treffer, 0);
					return;	
				}
				else
				{
					if(Spieler.shield[RUNTER]>0)Spieler.shield[RUNTER]--;
					else Spieler.korten_tot=true;
					Spieler.score=Spieler.score-50;
					sprintf(Spieler.scorewert,"%d",Spieler.score);	
					Mix_PlayChannel(-1, snd_treffer, 0);
					return;
				}							
			}		
			else
			{
				if(Kugeln.x[zaehler2]+8<=Spieler.korten_x+8)
				{
					if(Spieler.shield[LINKS]>0)Spieler.shield[LINKS]--;
					else Spieler.korten_tot=true;
					Spieler.score=Spieler.score-50;
					sprintf(Spieler.scorewert,"%d",Spieler.score);	
					Mix_PlayChannel(-1, snd_treffer, 0);					
					return;	
					
				}
				else
				{
					if(Spieler.shield[RECHTS]>0)Spieler.shield[RECHTS]--;
					else Spieler.korten_tot=true;
					Spieler.score=Spieler.score-50;
					sprintf(Spieler.scorewert,"%d",Spieler.score);	
					Mix_PlayChannel(-1, snd_treffer, 0);					
					return;	
				}
			}	
		}
	}
}

int check_korten_plattform(player &Spieler, platform &Plattform)
{
	int zaehler=0;
	int plaenge=0;
	
	for(zaehler=0;zaehler<=Plattform.anzahl_plattformen_in_level-1; zaehler++)
	{
		if(Plattform.laenge[zaehler]==PLATFORM_SMALL)plaenge=LAENGE_PLATFORM_SMALL;
		if(Plattform.laenge[zaehler]==PLATFORM_MEDIUM)plaenge=LAENGE_PLATFORM_MEDIUM;
		if(Plattform.laenge[zaehler]==PLATFORM_LARGE)plaenge=LAENGE_PLATFORM_LARGE;
		
		if(Spieler.korten_x+11 >= Plattform.aktuelle_x[zaehler] && 
			Spieler.korten_x+3 <= Plattform.aktuelle_x[zaehler]+plaenge)
		{
			if(Spieler.korten_y+15+10 == Plattform.aktuelle_y[zaehler])
				return zaehler;			
			if(Spieler.korten_y+16+10 == Plattform.aktuelle_y[zaehler])
				return zaehler;
		}	
	}
	return 99;	
}

bool gefaehrliche_zacken(int berechtigt_runter, int korten_x, int korten_y, int level)
{
	if(korten_y < -255) return false;
	int aktuelle_zeile=(korten_y+10)/16;
	int aktuelle_spalte=(korten_x+4)/16;
	int aktuelle_spalte2=(korten_x+12)/16;

	if(!berechtigt_runter)
	{
		//if(leveldat[level][aktuelle_zeile+1][aktuelle_spalte]==21) return true;
		if(leveldat[level][aktuelle_zeile][aktuelle_spalte]==21) return true;
		if(leveldat[level][aktuelle_zeile][aktuelle_spalte2]==21) return true;
		else return false;
	}
	return false;
}

bool check_korten_kanone(player &Spieler)
{
	if(Spieler.korten_y < -255) return false;
	int aktuelle_zeile=(Spieler.korten_y+7+10)/16;
	int aktuelle_spalte=(Spieler.scrollwert+144-1)/16;
	int aktuelle_spalte2=(Spieler.scrollwert+144+16)/16;
	if(Spieler.zug_phase==1 || Spieler.zug_phase==2 || Spieler.zug_phase==3)return false;
	if(!Spieler.berechtigt_runter)
	{
		if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==30 &&
			leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte2]==31)return true;
		
	}
	return false;	
}

bool check_korten_treppe(player &Spieler)
{
	if(Spieler.korten_y < -255) return false;
	int aktuelle_zeile=(Spieler.korten_y+7+10)/16;
	int aktuelle_spalte=(Spieler.korten_x+2)/16;
	int aktuelle_spalte2=(Spieler.korten_x+13)/16;

	
	if(aktuelle_zeile>=0 && aktuelle_zeile <=13)
	{
		if(aktuelle_spalte>=0 && aktuelle_spalte <=399)
		{
		
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==23 ||
				leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==24) 
				return true;	
	
			if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]==23 ||
				leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte2]==24) 
				return true;
		}
	}
	return false;
}

void check_korten_fallender_stein(player &Spieler, fallender_stein &Stein)
{
	int aktuelle_zeile=(Spieler.korten_y+10)/16;
	int aktuelle_spalte=(Spieler.scrollwert+144+2+1)/16;
	int aktuelle_spalte2=(Spieler.scrollwert+144+16-2-1)/16; //abhängig von werten in collisiondetect_links/rechts
	bool ueberspringen=false,ueberspringen2=false;
	
	if(!Spieler.berechtigt_runter)
	{
		for(int zaehler2=0; zaehler2<Stein.aktueller_stein; zaehler2++)
		{
			if(Stein.zeile[zaehler2]==aktuelle_zeile+1 && 
				Stein.spalte[zaehler2]==aktuelle_spalte)
			{
				if(Stein.steinzustand[zaehler2]!=0)ueberspringen=true;
			}
			
			if(Stein.zeile[zaehler2]==aktuelle_zeile+1 && 
				Stein.spalte[zaehler2]==aktuelle_spalte2)
			{
				if(Stein.steinzustand[zaehler2]!=0)ueberspringen2=true;
			}
			
		}
		
		if(!ueberspringen && Spieler.timeleft<197)
		{
			if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==5)
			{
				Stein.steinzustand[Stein.aktueller_stein]=STEIN_WIRDFALLEN;
				Stein.zeile[Stein.aktueller_stein]=aktuelle_zeile+1;
				Stein.spalte[Stein.aktueller_stein]=aktuelle_spalte;
				Stein.aktuelle_x[Stein.aktueller_stein]=(aktuelle_spalte)*16;
				Stein.aktuelle_y[Stein.aktueller_stein]=(aktuelle_zeile+1)*16;
				Stein.timer[Stein.aktueller_stein]=30;		
				Stein.aktueller_stein++;
			}
		}
		if(!ueberspringen2 && Spieler.timeleft<197)
		{
			if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte2]==5)
			{
				Stein.steinzustand[Stein.aktueller_stein]=STEIN_WIRDFALLEN;	
				Stein.zeile[Stein.aktueller_stein]=aktuelle_zeile+1;
				Stein.spalte[Stein.aktueller_stein]=aktuelle_spalte2;
				Stein.aktuelle_x[Stein.aktueller_stein]=(aktuelle_spalte2)*16;
				Stein.aktuelle_y[Stein.aktueller_stein]=(aktuelle_zeile+1)*16;
				Stein.timer[Stein.aktueller_stein]=30;	
				Stein.aktueller_stein++;
			}
		}
	}
}

void check_enemy_fallender_stein(enemy Enemies, player Spieler, int z, fallender_stein &Stein)
{
	int aktuelle_zeile=(Enemies.y[z]+8)/16;
	int aktuelle_spalte=(Enemies.x[z]+8)/16;
	bool ueberspringen=false;
	
	if(!collisiondetect_enemy_unten(Spieler, Enemies, z))
	{
		for(int zaehler2=0; zaehler2<Stein.aktueller_stein; zaehler2++)
		{
			if(Stein.zeile[zaehler2]==aktuelle_zeile+1 && 
				Stein.spalte[zaehler2]==aktuelle_spalte)
			{
				if(Stein.steinzustand[zaehler2]!=0)ueberspringen=true;	
			}
		}	
	}
	

	if(!ueberspringen)
	{
		if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==5)
		{
			Stein.steinzustand[Stein.aktueller_stein]=STEIN_WIRDFALLEN;
			Stein.zeile[Stein.aktueller_stein]=aktuelle_zeile+1;
			Stein.spalte[Stein.aktueller_stein]=aktuelle_spalte;
			Stein.aktuelle_x[Stein.aktueller_stein]=(aktuelle_spalte)*16;
			Stein.aktuelle_y[Stein.aktueller_stein]=(aktuelle_zeile+1)*16;
			Stein.timer[Stein.aktueller_stein]=30;		
			Stein.aktueller_stein++;
		}
	}
}

bool check_coin_contact(player &Spieler,int x, int y)
{
	int aktuelle_zeile=y/16;
	int aktuelle_spalte=x/16;
	//printf("x: %d\n", x);
	//printf("y: %d\n", y);
	//printf("tile: %d\n", leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]);
	if(y<-255) return false;
	if(leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==37)
	{
		if( (x>=(aktuelle_spalte*16)+3) && (x<=(aktuelle_spalte*16)+13) && 
			(y>=(aktuelle_zeile*16)+3) && (y<=(aktuelle_zeile*16)+13) )
			return true;
		else
			return false;
	
	}	
	else return false;
}

void kollision_kugeln_ablenkstein(player &Spieler, kugel &Kugeln, int zaehler2)
{
	int kugelspalte=(Kugeln.x[zaehler2]+4)/16;
	int kugelzeile=(Kugeln.y[zaehler2]+4)/16;

	if(leveldat[Spieler.level][kugelzeile][kugelspalte]==35)
	{
		if(Kugeln.x[zaehler2]==kugelspalte*16 && Kugeln.y[zaehler2]==kugelzeile*16)
		{
			if(Kugeln.richtung[zaehler2]==RECHTS)
			{
				Kugeln.richtung[zaehler2]=HOCH; return;
			}
			if(Kugeln.richtung[zaehler2]==LINKS)
			{
				Kugeln.richtung[zaehler2]=RUNTER; return;
			}
			if(Kugeln.richtung[zaehler2]==RUNTER)
			{
				Kugeln.richtung[zaehler2]=LINKS; return;
			}
			if(Kugeln.richtung[zaehler2]==HOCH)
			{
				Kugeln.richtung[zaehler2]=RECHTS; return;
			}
		}
	}	
	if(leveldat[Spieler.level][kugelzeile][kugelspalte]==36)
	{  
		if(Kugeln.x[zaehler2]==kugelspalte*16 && Kugeln.y[zaehler2]==kugelzeile*16)
		{
			if(Kugeln.richtung[zaehler2]==RECHTS)
			{
				Kugeln.richtung[zaehler2]=RUNTER; return;
			}
			if(Kugeln.richtung[zaehler2]==LINKS)
			{
				Kugeln.richtung[zaehler2]=HOCH; return;
			}
			if(Kugeln.richtung[zaehler2]==RUNTER)
			{
				Kugeln.richtung[zaehler2]=RECHTS; return;
			}	
			if(Kugeln.richtung[zaehler2]==HOCH)
			{
				Kugeln.richtung[zaehler2]=LINKS; return;
			}	
		}	
	}
	
}

bool check_korten_upgradebutton(player &Spieler)
{
	if(Spieler.korten_y < -255) return false;
	if(Spieler.zug_phase!=0)return false;
	int aktuelle_zeile=(Spieler.korten_y+7+10)/16;
	int aktuelle_spalte=(Spieler.korten_x)/16;
	int aktuelle_spalte2=(Spieler.korten_x+15)/16;
		
	if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==25 ||
		leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==26)
	{
		Spieler.upgradebutton_gefunden_zeile=aktuelle_zeile+1;
		Spieler.upgradebutton_gefunden_spalte=aktuelle_spalte;
		if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==25)Spieler.upgradebutton_type=1;
		if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte]==26)Spieler.upgradebutton_type=2;
		return true;
	}
	if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte2]==25 ||
		leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte2]==26)
	{
		Spieler.upgradebutton_gefunden_zeile=aktuelle_zeile+1;
		Spieler.upgradebutton_gefunden_spalte=aktuelle_spalte2;	
		if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte2]==25)Spieler.upgradebutton_type=1;
		if(leveldat[Spieler.level][aktuelle_zeile+1][aktuelle_spalte2]==26)Spieler.upgradebutton_type=2;
		return true;
	}
	return false;
}

int collisiondetect_spieler_enemies(player &Spieler, enemy &Enemies, int zaehler)
{
	if(Enemies.type[zaehler]<165)
	{
		if(Spieler.korten_y<Enemies.y[zaehler])
		{
			if((Enemies.y[zaehler]-Spieler.korten_y)>14 &&
				(Enemies.y[zaehler]-Spieler.korten_y)<25)return HOCH;
			
			if((Enemies.y[zaehler]-Spieler.korten_y)<14)	
				if(Enemies.x[zaehler]>Spieler.scrollwert+144)return LINKS;
					else return RECHTS;		
		}
		else
			if(Spieler.korten_y-Enemies.y[zaehler]<15)return RUNTER;
	}
	
	if(Enemies.type[zaehler]==165)
	{
		if(Spieler.korten_y<Enemies.y[zaehler]-36)
		{
			if(((Enemies.y[zaehler]-36)-Spieler.korten_y)>14 &&
				((Enemies.y[zaehler]-36)-Spieler.korten_y)<25)return HOCH;
			
			if(((Enemies.y[zaehler]-36)-Spieler.korten_y)<14)	
				if(Enemies.x[zaehler] >Spieler.scrollwert+144+8)return LINKS;
					else return RECHTS;		
		}
		else
		{	
			if((Spieler.korten_y-(Enemies.y[zaehler]-36))<36)
				if(Enemies.x[zaehler]>Spieler.scrollwert+144+8)return LINKS;
					else return RECHTS;	
			if((Spieler.korten_y-(Enemies.y[zaehler]-36))>=36)return RUNTER;
		}
	}
		
	return 99;
}	

void save_parabell_werte(enemy &Enemies, int zaehler)
{
	Enemies.parabell_x[zaehler]=Enemies.x[zaehler]+16;
	Enemies.parabell_y[zaehler]=Enemies.y[zaehler]-40;
}

void kollision_spieler_enemies(player &Spieler, enemy &Enemies, int zaehler, platform &Plattformen, fallender_stein &Steine1, 
						kanone &Kanonen, kugel &Kugeln)
{
	int trefferort=collisiondetect_spieler_enemies(Spieler, Enemies, zaehler);
	
	if(trefferort==HOCH)
	{
		if(Enemies.type[zaehler]==150 || Enemies.type[zaehler]==156 || Enemies.type[zaehler]==162 || Enemies.type[zaehler]==165 ||
			((Enemies.type[zaehler]==152 || Enemies.type[zaehler]==154)
			&& Spieler.upgradetype==UPGRADE_SCHUHE))
		{
			if(Enemies.type[zaehler]<165)
			{
				Enemies.status[zaehler]=ENEMY_TOT;
				save_parabell_werte(Enemies, zaehler);
				Spieler.score=Spieler.score+200;
				Spieler.oneupscore+=200;
				sprintf(Spieler.scorewert,"%d",Spieler.score);
				Spieler.sprungzaehler+=5;
				Mix_PlayChannel(-1, snd_enemykill_ver, 0);
			}	
			if(Enemies.type[zaehler]==165)
			{
				if(Enemies.bossblinktimer==0)
				{
					Enemies.bosstreffer--;
					Enemies.bossblinktimer=150;
					Spieler.korten_geschwindigkeit-=4;
					Spieler.korten_beschleunigung-=30;
					if(Enemies.bosstreffer==0)
					{
						Enemies.status[zaehler]=ENEMY_TOT;
						bosstot(zaehler, Spieler, Enemies, Plattformen, Steine1, Kanonen, Kugeln);
					}	
				}	
				Spieler.sprungzaehler+=16;
			}				
			return;
		}
		if(((Enemies.type[zaehler]==152 || Enemies.type[zaehler]==154) && Spieler.upgradetype!=UPGRADE_SCHUHE ) ||
			Enemies.type[zaehler]==158 ||
			Enemies.type[zaehler]==160)
		{	
			if(Spieler.unverwundbarkeits_timer==0)
			{
				if(Spieler.shield[RUNTER]>0)Spieler.shield[RUNTER]--;
					else Spieler.korten_tot=true;
				Spieler.unverwundbarkeits_timer=150;
				Mix_PlayChannel(-1, snd_treffer, 0);
			}		
		}			
		return;
	}		
	if(trefferort==RUNTER)
	{
		if(Spieler.unverwundbarkeits_timer==0)
		{	
			if(Spieler.shield[HOCH]>0)Spieler.shield[HOCH]--;
				else Spieler.korten_tot=true;
			Spieler.unverwundbarkeits_timer=150;	
			Mix_PlayChannel(-1, snd_treffer, 0);	
		}
		return;
	}	
	if(trefferort==LINKS)
	{
		if(Enemies.type[zaehler]==152 || Enemies.type[zaehler]==158 || Enemies.type[zaehler]==162 || 
			((Enemies.type[zaehler]==150 || Enemies.type[zaehler]==154)&& Spieler.upgradetype==UPGRADE_HEMD))
		{
			
			Enemies.status[zaehler]=ENEMY_TOT;
			save_parabell_werte(Enemies, zaehler);
			Spieler.score=Spieler.score+100;
			Spieler.oneupscore+=100;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
			Mix_PlayChannel(-1, snd_enemykill_hor, 0);
			return;
		}
		if(((Enemies.type[zaehler]==150 || Enemies.type[zaehler]==154) && Spieler.upgradetype!=UPGRADE_HEMD) ||
			Enemies.type[zaehler]==156 || Enemies.type[zaehler]==160 || Enemies.type[zaehler]==165)
		{	
			if(Spieler.unverwundbarkeits_timer==0)
			{
				if(Spieler.shield[RECHTS]>0)Spieler.shield[RECHTS]--;
					else Spieler.korten_tot=true;
				Spieler.unverwundbarkeits_timer=150;
				Mix_PlayChannel(-1, snd_treffer, 0);	
			}		
		}			
		return;
	}	
	if(trefferort==RECHTS)
	{
		if(Enemies.type[zaehler]==152 || Enemies.type[zaehler]==158 || Enemies.type[zaehler]==162 ||
			((Enemies.type[zaehler]==150 || Enemies.type[zaehler]==154)&& Spieler.upgradetype==UPGRADE_HEMD))
		{
			
			Enemies.status[zaehler]=ENEMY_TOT;
			save_parabell_werte(Enemies, zaehler);
			Spieler.score=Spieler.score+100;
			Spieler.oneupscore+=100;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
			Mix_PlayChannel(-1, snd_enemykill_hor, 0);	
			return;
		}
		if(((Enemies.type[zaehler]==150 || Enemies.type[zaehler]==154) && Spieler.upgradetype!=UPGRADE_HEMD) ||
			Enemies.type[zaehler]==156 || Enemies.type[zaehler]==160 || Enemies.type[zaehler]==165)
		{	
			if(Spieler.unverwundbarkeits_timer==0)
			{
				if(Spieler.shield[LINKS]>0)Spieler.shield[LINKS]--;
					else Spieler.korten_tot=true;
				Spieler.unverwundbarkeits_timer=150;
				Mix_PlayChannel(-1, snd_treffer, 0);	
			}		
		}			
		return;
	}			
}
