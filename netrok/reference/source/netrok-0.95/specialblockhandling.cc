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
#include <math.h>
#include "main.h"
#include "putsprites.h"
#include "specialblockhandling.h"
#include "graphicengine.h"
#include "scrolling.h"
#include "collisiondetect.h"


using namespace std;

extern SDL_Surface *t[100];
extern SDL_Surface *screen; 
extern SDL_Surface *fig[180];
extern unsigned short int leveldat[32][13][400];
extern Mix_Chunk *snd_kran;

void gehe_horizontale_plattform_durch(platform &Plattformen,int &level, int &aktuelle_spalte, int &aktuelle_zeile, 
							int &aktuelle_plattform, int &plattform_durchgehen, int &zaehler)
{
	if(leveldat[level][aktuelle_zeile][aktuelle_spalte+1]>=200 &&
		leveldat[level][aktuelle_zeile][aktuelle_spalte+1]<=203 && 
		aktuelle_spalte!=399)
	{
		Plattformen.type[aktuelle_plattform]=PLATFORM_HORIZONTAL;
		plattform_durchgehen=1;
		if(leveldat[level][aktuelle_zeile][aktuelle_spalte+1]==203)
			Plattformen.aktuelle_x[aktuelle_plattform]=(aktuelle_spalte+1)*16;
								
		while(plattform_durchgehen+aktuelle_spalte<=399)
		{
			if(leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]>=200 &&
				leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]<=203)	
			{
				if(leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]==200)
					Plattformen.laenge[aktuelle_plattform]=PLATFORM_SMALL;
				if(leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]==201)
					Plattformen.laenge[aktuelle_plattform]=PLATFORM_MEDIUM;
				if(leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]==202)
					Plattformen.laenge[aktuelle_plattform]=PLATFORM_LARGE;
				if(leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]==203)
					Plattformen.aktuelle_x[aktuelle_plattform]=(aktuelle_spalte+plattform_durchgehen)*16;
								 
				leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen]=0;
				Plattformen.stop_x[aktuelle_plattform]=(aktuelle_spalte+plattform_durchgehen+1)*16;
				Plattformen.stop_y[aktuelle_plattform]=(aktuelle_zeile)*16;	
			}
			if(leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen+1]!=200 &&
				leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen+1]!=201 &&
				leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen+1]!=202 &&
				leveldat[level][aktuelle_zeile][aktuelle_spalte+plattform_durchgehen+1]!=203)
				aktuelle_spalte=400;
							
			plattform_durchgehen++;
		}
		aktuelle_spalte=0;
		aktuelle_zeile=0;
		zaehler=0;
		plattform_durchgehen=1;
		aktuelle_plattform++;
	}		
}

void gehe_vertikale_plattform_durch(platform &Plattformen,int &level, int &aktuelle_spalte, int &aktuelle_zeile, 
							int &aktuelle_plattform, int &plattform_durchgehen, int &zaehler)
{
	if(leveldat[level][aktuelle_zeile+1][aktuelle_spalte]>=200 &&
		leveldat[level][aktuelle_zeile+1][aktuelle_spalte]<=203 &&
		aktuelle_zeile!=12)
	{
		Plattformen.type[aktuelle_plattform]=PLATFORM_VERTIKAL;
		plattform_durchgehen=1;
		if(leveldat[level][aktuelle_zeile+1][aktuelle_spalte]==203)Plattformen.aktuelle_y[aktuelle_plattform]=(aktuelle_zeile+1)*16;
		while(plattform_durchgehen+aktuelle_zeile<=12)
		{
			if(leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]>=200 &&
				leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]<=203)	
			{
				if(leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]==200)
					Plattformen.laenge[aktuelle_plattform]=PLATFORM_SMALL;
				if(leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]==201)
					Plattformen.laenge[aktuelle_plattform]=PLATFORM_MEDIUM;
				if(leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]==202)
					Plattformen.laenge[aktuelle_plattform]=PLATFORM_LARGE;
				if(leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]==203)
					Plattformen.aktuelle_y[aktuelle_plattform]=(aktuelle_zeile+plattform_durchgehen)*16;
				leveldat[level][aktuelle_zeile+plattform_durchgehen][aktuelle_spalte]=0;
				Plattformen.stop_x[aktuelle_plattform]=(aktuelle_spalte)*16;
				Plattformen.stop_y[aktuelle_plattform]=(aktuelle_zeile+plattform_durchgehen)*16;	
			}
			if(leveldat[level][aktuelle_zeile+plattform_durchgehen+1][aktuelle_spalte]!=200 &&
				leveldat[level][aktuelle_zeile+plattform_durchgehen+1][aktuelle_spalte]!=201 &&
				leveldat[level][aktuelle_zeile+plattform_durchgehen+1][aktuelle_spalte]!=202 &&
				leveldat[level][aktuelle_zeile+plattform_durchgehen+1][aktuelle_spalte]!=203)
				aktuelle_zeile=13;
								
			plattform_durchgehen++;
		}
		aktuelle_spalte=0;
		aktuelle_zeile=0;
		zaehler=0;
		plattform_durchgehen=1;
		aktuelle_plattform++;
	}
}


void checke_alle_plattformen_in_level(platform &Plattformen, int level)
{
	int aktuelle_plattform=0;
	int zaehler=1;
	int plattform_durchgehen=1;

	int aktuelle_spalte=0,aktuelle_zeile=0;
	
	for(int pinit=0; pinit<30 ; pinit++)
	{
		Plattformen.aktuelle_x[pinit]=0;
		Plattformen.aktuelle_y[pinit]=0;
	}
	
	while(zaehler<=13*400)
	{	
		if(leveldat[level][aktuelle_zeile][aktuelle_spalte]>=200 &&
			leveldat[level][aktuelle_zeile][aktuelle_spalte]<=203)
		{
			Plattformen.start_x[aktuelle_plattform]=aktuelle_spalte*16;
			Plattformen.start_y[aktuelle_plattform]=aktuelle_zeile*16;
			if(leveldat[level][aktuelle_zeile][aktuelle_spalte]==200)
				Plattformen.laenge[aktuelle_plattform]=PLATFORM_SMALL;
			if(leveldat[level][aktuelle_zeile][aktuelle_spalte]==201)
				Plattformen.laenge[aktuelle_plattform]=PLATFORM_MEDIUM;
			if(leveldat[level][aktuelle_zeile][aktuelle_spalte]==202)
				Plattformen.laenge[aktuelle_plattform]=PLATFORM_LARGE;

			leveldat[level][aktuelle_zeile][aktuelle_spalte]=0;

			gehe_horizontale_plattform_durch(Plattformen,level, aktuelle_spalte, aktuelle_zeile, 
									aktuelle_plattform, plattform_durchgehen, zaehler);
			gehe_vertikale_plattform_durch(Plattformen,level, aktuelle_spalte, aktuelle_zeile, 
									aktuelle_plattform, plattform_durchgehen, zaehler);
		}
		aktuelle_zeile++;
		if(aktuelle_zeile==13)
		{
			aktuelle_zeile=0;
			aktuelle_spalte++;	
		}
		zaehler++;
	}	
	Plattformen.anzahl_plattformen_in_level=aktuelle_plattform;

	for(int pzaehler=0; pzaehler<Plattformen.anzahl_plattformen_in_level; pzaehler++)
	{
		if(Plattformen.type[pzaehler]==PLATFORM_HORIZONTAL)Plattformen.aktuelle_richtung[pzaehler]=RECHTS;
		if(Plattformen.type[pzaehler]==PLATFORM_VERTIKAL)Plattformen.aktuelle_richtung[pzaehler]=RUNTER;
		if(Plattformen.aktuelle_x[pzaehler]==0)Plattformen.aktuelle_x[pzaehler]=Plattformen.start_x[pzaehler];
		if(Plattformen.aktuelle_y[pzaehler]==0)Plattformen.aktuelle_y[pzaehler]=Plattformen.start_y[pzaehler];
	}
}


void bewege_plattformen(platform &Plattformen)
{
	int plaenge=16;
	for(int pzaehler=0; pzaehler<=Plattformen.anzahl_plattformen_in_level-1; pzaehler++)
	{
		if(Plattformen.laenge[pzaehler]==PLATFORM_SMALL)plaenge=LAENGE_PLATFORM_SMALL;
		if(Plattformen.laenge[pzaehler]==PLATFORM_MEDIUM)plaenge=LAENGE_PLATFORM_MEDIUM;
		if(Plattformen.laenge[pzaehler]==PLATFORM_LARGE)plaenge=LAENGE_PLATFORM_LARGE;

		if(Plattformen.type[pzaehler]==PLATFORM_HORIZONTAL)
		{
			if(Plattformen.aktuelle_richtung[pzaehler]==RECHTS)
			{
				if(Plattformen.aktuelle_x[pzaehler]+plaenge!=Plattformen.stop_x[pzaehler])
					Plattformen.aktuelle_x[pzaehler]++;
				else
					Plattformen.aktuelle_richtung[pzaehler]=LINKS;
			}
			if(Plattformen.aktuelle_richtung[pzaehler]==LINKS)
			{
				if(Plattformen.aktuelle_x[pzaehler]!=Plattformen.start_x[pzaehler])
					Plattformen.aktuelle_x[pzaehler]--;
				else
					Plattformen.aktuelle_richtung[pzaehler]=RECHTS;
			}
		}
		if(Plattformen.type[pzaehler]==PLATFORM_VERTIKAL)
		{
			if(Plattformen.aktuelle_richtung[pzaehler]==RUNTER)
			{
				if(Plattformen.aktuelle_y[pzaehler]!=Plattformen.stop_y[pzaehler])
					Plattformen.aktuelle_y[pzaehler]++;
				else
					Plattformen.aktuelle_richtung[pzaehler]=HOCH;
			}
			if(Plattformen.aktuelle_richtung[pzaehler]==HOCH)
			{
				if(Plattformen.aktuelle_y[pzaehler]!=Plattformen.start_y[pzaehler])
					Plattformen.aktuelle_y[pzaehler]--;
				else
					Plattformen.aktuelle_richtung[pzaehler]=RUNTER;
			}
		}
	}
}

void loesche_platformspeicher(platform &Plattformen)
{
	for(int zaehler2=0; zaehler2 <= Plattformen.anzahl_plattformen_in_level-1; zaehler2++)
	{
		Plattformen.aktuelle_x[zaehler2]=0;
		Plattformen.aktuelle_y[zaehler2]=0;
		Plattformen.start_x[zaehler2]=0;
		Plattformen.start_y[zaehler2]=0;
		Plattformen.stop_x[zaehler2]=0;
		Plattformen.stop_y[zaehler2]=0;			
	}
	Plattformen.anzahl_plattformen_in_level=0;
}

void loesche_steinzustaende(fallender_stein &Stein)
{
	Stein.aktueller_stein=0;
	for(int zaehler2=0; zaehler2<1000; zaehler2++)
	{
		Stein.steinzustand[zaehler2]=STEIN_FEST;	
	}
}

void steine_fallen_lassen(fallender_stein &Stein, int level, int scrollwert)
{
	for(int zaehler2=0; zaehler2<Stein.aktueller_stein; zaehler2++)
	{
		if(Stein.steinzustand[zaehler2]==STEIN_WIRDFALLEN && Stein.timer[zaehler2]>0)
		{
			Stein.timer[zaehler2]--;
		}
		if(Stein.steinzustand[zaehler2]==STEIN_WIRDFALLEN && Stein.timer[zaehler2]==0)
		{
			Stein.steinzustand[zaehler2]=STEIN_FAELLT;
			leveldat[level][Stein.zeile[zaehler2]][Stein.spalte[zaehler2]]=0;
		}
		if(Stein.steinzustand[zaehler2]==STEIN_FAELLT && Stein.aktuelle_y[zaehler2]<220)
		{
			Stein.aktuelle_y[zaehler2]+=3;
			DrawIMG(t[5],(Stein.aktuelle_x[zaehler2])-scrollwert,Stein.aktuelle_y[zaehler2]);
		}
	}
}

void bewege_zug(player &Spieler)
{
	if(Spieler.position_upgradebutton<15)Spieler.position_upgradebutton++;
	if(Spieler.position_upgradebutton==15)
	{	
		if(Spieler.upgradebutton_type==1)
		{	
			leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile][Spieler.upgradebutton_gefunden_spalte]=27;
			if(leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile+1][Spieler.upgradebutton_gefunden_spalte]==2)
				leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile+1][Spieler.upgradebutton_gefunden_spalte]=12;
		}	
		else
		{	
			leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile][Spieler.upgradebutton_gefunden_spalte]=28;
			if(leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile+1][Spieler.upgradebutton_gefunden_spalte]==2)
				leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile+1][Spieler.upgradebutton_gefunden_spalte]=11;
		}	
	}	
	
	if(Spieler.zug_phase==1 && (Spieler.position_zug+190<=Spieler.korten_y))
		Spieler.position_zug++;
	if(Spieler.zug_phase==2 && Spieler.position_zug>-230)
	{	
		Spieler.position_zug--;
		Spieler.korten_y--;
	}	
	if(Spieler.zug_phase==3 && collisiondetect_unten(Spieler))
	{	
		Spieler.position_zug++;
		Spieler.korten_y++;
	}	
	if(Spieler.zug_phase==4 && Spieler.position_zug>-230)
		Spieler.position_zug--;
	
	DrawIMG(fig[126],136,Spieler.position_zug);
		
	if(Spieler.zug_phase==1 && (Spieler.position_zug+190>=Spieler.korten_y))
	{
		Spieler.zug_phase=2;
		Mix_PlayChannel(-1, snd_kran, 0);
	}	

	if(Spieler.zug_phase==2 && (Spieler.position_zug==-230))
	{	
		Spieler.zug_phase=3;
		Spieler.upgradetype=Spieler.upgradebutton_type;
	}	
	if(Spieler.zug_phase==3 && !Spieler.berechtigt_runter)
	{
		Spieler.zug_phase=4;
		Mix_PlayChannel(-1, snd_kran, 0);
	}	
	if(Spieler.zug_phase==4 && (Spieler.position_zug==-230))
		Spieler.zug_phase=0;
	if(Spieler.zug_phase==3 && Spieler.position_zug>0)
	{
		Spieler.zug_phase=4;	
		Mix_PlayChannel(-1, snd_kran, 0);
	}	
}

void check_in_spalte_kanonen(kanone &Kanonen, player &Spieler, int spalte_kanonen_aufnehm, int zaehler)
{
	bool bereits_aufgenommen=false;
	for(int zaehler2=0; zaehler2<=49; zaehler2++)
	{
		if(Kanonen.verwendet[zaehler2])
		{
			if(Kanonen.zeile[zaehler2]==zaehler && Kanonen.spalte[zaehler2]==spalte_kanonen_aufnehm)
			{
				bereits_aufgenommen=true;
				zaehler2=50;
			}
		}
	}
	if(!bereits_aufgenommen)
	{
		for(int zaehler2=0; zaehler2<=49; zaehler2++)
		{
			if(!Kanonen.verwendet[zaehler2])
			{
				Kanonen.verwendet[zaehler2]=true;	
				Kanonen.zeile[zaehler2]=zaehler;	
				Kanonen.spalte[zaehler2]=spalte_kanonen_aufnehm;	
				Kanonen.timer[zaehler2]=10;
				if(leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==33)
					Kanonen.type[zaehler2]=KANONE_HORIZONTAL;
				if(leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==34)
					Kanonen.type[zaehler2]=KANONE_VERTIKAL;
				if(leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==40)
					Kanonen.type[zaehler2]=KANONE_HORIZONTAL2;
				if(leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==41)
					Kanonen.type[zaehler2]=KANONE_VERTIKAL2;
				zaehler2=50;	
			}
		}
	}
}	

void check_in_spalte_enemies(int aktuelle_spalte, enemy &Enemies, int zaehler, int type)
{
	for(int zaehler2=0; zaehler2<=24; zaehler2++)
	{
		if(!Enemies.verwendet[zaehler2])
		{
			Enemies.verwendet[zaehler2]=true;
			Enemies.y[zaehler2]=zaehler*16;
			Enemies.x[zaehler2]=(aktuelle_spalte+18)*16;
			Enemies.richtung[zaehler2]=LINKS;
			Enemies.status[zaehler2]=ENEMY_LEBENDIG;
			Enemies.type[zaehler2]=type;
			Enemies.bosstimer=0;
			Enemies.bosstreffer=3;
			Enemies.bossblinktimer=0;
			return;
		}
	}
}

void check_in_spalte(kanone &Kanonen, player &Spieler, int spalte_kanonen_aufnehm, enemy &Enemies, int aktuelle_spalte)
{
	if(spalte_kanonen_aufnehm<=399)
	{
		for(int zaehler=0; zaehler<=12; zaehler++)
		{	
			if(leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==33 ||
				leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==34 ||
				leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==40 ||
				leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm]==41)
					check_in_spalte_kanonen(Kanonen, Spieler, spalte_kanonen_aufnehm, zaehler);		
			if(leveldat[Spieler.level][zaehler][aktuelle_spalte+18]>=150 &&
				leveldat[Spieler.level][zaehler][aktuelle_spalte+18]<=179)
			{
				check_in_spalte_enemies(aktuelle_spalte, Enemies, zaehler, 
									leveldat[Spieler.level][zaehler][spalte_kanonen_aufnehm] );	
				leveldat[Spieler.level][zaehler][aktuelle_spalte+18]=0;	
			}	
		}
	}	
}

void check_kanonen_enemies(kanone &Kanonen, player &Spieler, enemy &Enemies)
{
	int aktuelle_spalte=(Spieler.scrollwert+144-1)/16;
	int spalte_kanonen_aufnehm;
	int spalte_kanonen_entfern;
	
	if(Spieler.last_scrollwert_veraenderung==LINKS)
	{
		spalte_kanonen_aufnehm=aktuelle_spalte-18;
	 	spalte_kanonen_entfern=aktuelle_spalte+20;	
	}
	if(Spieler.last_scrollwert_veraenderung==RECHTS)
	{
		spalte_kanonen_aufnehm=aktuelle_spalte+18;
		spalte_kanonen_entfern=aktuelle_spalte-20;
	}
	
	check_in_spalte(Kanonen, Spieler, spalte_kanonen_aufnehm, Enemies, aktuelle_spalte);
	
	for(int zaehler2=0; zaehler2<=49; zaehler2++)
		if(Kanonen.verwendet[zaehler2])
			if(Kanonen.spalte[zaehler2]==spalte_kanonen_entfern)
				Kanonen.verwendet[zaehler2]=false;	
}

int absolut (int x)
{
	if(x<0)return -x;
	else return x;
}

void erzeuge_kugel(kanone &Kanonen, kugel &Kugeln, int zaehler, int aktuelle_spalte, int aktuelle_zeile)
{
	if(Kanonen.type[zaehler]==KANONE_HORIZONTAL ||
		Kanonen.type[zaehler]==KANONE_VERTIKAL)Kanonen.timer[zaehler]=10+(rand()% (300-10+1));
	if(Kanonen.type[zaehler]==KANONE_HORIZONTAL2 ||
		Kanonen.type[zaehler]==KANONE_VERTIKAL2)Kanonen.timer[zaehler]=100;
	
	
	for(int zaehler2=0;zaehler2<=299; zaehler2++)
	{
		if(!Kugeln.verwendet[zaehler2])
		{
			Kugeln.verwendet[zaehler2]=true;
			if(Kanonen.type[zaehler]==KANONE_HORIZONTAL)
			{
				if(aktuelle_spalte <= Kanonen.spalte[zaehler])
					Kugeln.richtung[zaehler2]=LINKS;
				else
				 	Kugeln.richtung[zaehler2]=RECHTS;	
			}
			if(Kanonen.type[zaehler]==KANONE_VERTIKAL)
			{
				if(aktuelle_zeile <= Kanonen.zeile[zaehler])
					Kugeln.richtung[zaehler2]=HOCH;
				else		
					Kugeln.richtung[zaehler2]=RUNTER;
			}
			if(Kanonen.type[zaehler]==KANONE_HORIZONTAL2)
			{
				if(aktuelle_spalte <= Kanonen.spalte[zaehler])
					Kugeln.richtung[zaehler2]=LINKS;
				else
				 	Kugeln.richtung[zaehler2]=RECHTS;	
			}
			if(Kanonen.type[zaehler]==KANONE_VERTIKAL2)
			{
				if(aktuelle_zeile <= Kanonen.zeile[zaehler])
					Kugeln.richtung[zaehler2]=HOCH;
				else		
					Kugeln.richtung[zaehler2]=RUNTER;
			}
			
			Kugeln.x[zaehler2]=Kanonen.spalte[zaehler]*16;
			Kugeln.y[zaehler2]=Kanonen.zeile[zaehler]*16;
			
			zaehler2=1000;
			
		}
	}
	
}

void kugeln_bewegen(kanone &Kanonen, player &Spieler, kugel &Kugeln)
{
	int aktuelle_spalte=(Spieler.scrollwert+144-1)/16;	
	int aktuelle_zeile=(Spieler.korten_y+7+10)/16;	
	
	for(int zaehler=0; zaehler<=49; zaehler++)
		if(Kanonen.verwendet[zaehler] && Kanonen.timer[zaehler]==0)
			erzeuge_kugel(Kanonen, Kugeln, zaehler, aktuelle_spalte, aktuelle_zeile);

	for(int zaehler2=0; zaehler2 <= 299; zaehler2++)
	{
		if(Kugeln.verwendet[zaehler2])
		{
			if(Kugeln.richtung[zaehler2]==HOCH)Kugeln.y[zaehler2]-=2;
			if(Kugeln.richtung[zaehler2]==RUNTER)Kugeln.y[zaehler2]+=2;
			if(Kugeln.richtung[zaehler2]==RECHTS)Kugeln.x[zaehler2]+=2;
			if(Kugeln.richtung[zaehler2]==LINKS)Kugeln.x[zaehler2]-=2;
		
			if(Kugeln.richtung[zaehler2]==RECHTS)
				if(Kugeln.x[zaehler2]-(Spieler.scrollwert+144)>=480)Kugeln.verwendet[zaehler2]=false;	
			if(Kugeln.richtung[zaehler2]==LINKS)
				if((Spieler.scrollwert+144)-Kugeln.x[zaehler2]>=480)Kugeln.verwendet[zaehler2]=false;
			if(Kugeln.richtung[zaehler2]==HOCH)
				if(Kugeln.y[zaehler2]<=-20)Kugeln.verwendet[zaehler2]=false;
			if(Kugeln.richtung[zaehler2]==RUNTER)
				if(Kugeln.y[zaehler2]>=220)Kugeln.verwendet[zaehler2]=false;	


			kollision_kugeln_ablenkstein(Spieler, Kugeln, zaehler2);
				
			if(Spieler.unverwundbarkeits_timer==0)collisiondetect_kugel_spieler(Spieler, Kugeln, zaehler2);		
			kugeln_darstellen(Spieler, Kugeln, zaehler2);
		}
	}
	
}


void setze_fahne(player &Spieler)
{
	int aktuelle_spalte=(Spieler.scrollwert+144+8)/16;	
	int aktuelle_zeile=(Spieler.korten_y+7+10)/16;	
	
	for(int zaehler=aktuelle_zeile+1; zaehler<=12; zaehler++)
	{
		if((leveldat[Spieler.level][zaehler][aktuelle_spalte]<=20 || 
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==40 ||
			leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]==41 ||
			(leveldat[Spieler.level][zaehler][aktuelle_spalte]>=29 &&
			 leveldat[Spieler.level][zaehler][aktuelle_spalte]<=36)) &&
			leveldat[Spieler.level][zaehler][aktuelle_spalte]!=0)	
		{
			Spieler.fahnenposition_spalte=aktuelle_spalte;
			Spieler.fahnenposition_zeile=zaehler-1;
			Spieler.fahne_gesetzt=true;
			Spieler.fahnenposition_y=Spieler.korten_y;
			Spieler.score=Spieler.score-2000;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
			return;
		}	
	}	
	Spieler.fahne_gesetzt=true;
	Spieler.fahnenposition_spalte=aktuelle_spalte;
	Spieler.fahnenposition_zeile=0;
	Spieler.fahnenposition_y=Spieler.korten_y;
	Spieler.score=Spieler.score-2500;
	sprintf(Spieler.scorewert,"%d",Spieler.score);
}

int fallfunktion_enemies(enemy &Enemies, int z)
{
	double x=Enemies.x[z];
	return (0.15*(x-Enemies.parabell_x[z])*(x-Enemies.parabell_x[z])+Enemies.parabell_y[z]);
}

void enemies_bewegen(player &Spieler, enemy &Enemies, fallender_stein &Stein, platform &Plattformen, kanone &Kanonen, kugel &Kugeln)
{
	for(int z=0;z<=24;z++)
	{
		if(Enemies.verwendet[z])
		{
			bool a=false;
			if(Enemies.status[z]==ENEMY_LEBENDIG && Enemies.type[z]<165)
			{
				if(Enemies.richtung[z]==LINKS && !collisiondetect_enemy_links(Spieler, Enemies, z))
				{
					Enemies.richtung[z]=RECHTS;
					a=true;
				}	
				if(!a && Enemies.richtung[z]==RECHTS && !collisiondetect_enemy_rechts(Spieler, Enemies, z))
					Enemies.richtung[z]=LINKS;
				if(Enemies.richtung[z]==LINKS)
					if(Enemies.type[z]==162)Enemies.x[z]-=2;
					else	Enemies.x[z]--;
				if(Enemies.richtung[z]==RECHTS)
					if(Enemies.type[z]==162)Enemies.x[z]+=2;
					else Enemies.x[z]++;
				if(collisiondetect_enemy_unten(Spieler, Enemies, z))Enemies.y[z]+=2;	
				if(absolut(Spieler.scrollwert+144-Enemies.x[z])<15 && Spieler.unverwundbarkeits_timer==0)
					kollision_spieler_enemies(Spieler, Enemies, z, Plattformen, Stein,Kanonen, Kugeln);
				if(Enemies.type[z]==162)check_enemy_fallender_stein(Enemies, Spieler, z, Stein);	
			}
			
			
			
			if(Enemies.status[z]==ENEMY_LEBENDIG && Enemies.type[z]==165)
			{
				if(Enemies.bosstimer==0)
				{
					Enemies.bosstimer=40+(rand() % (200-40+1));
					int ri=0+(rand() % (1-0+1));
					if(ri==0)
					{
						Enemies.richtung[z]=RECHTS;	
					}
					else
					{
						Enemies.richtung[z]=LINKS;
					}
					
				}	
				if(Enemies.bosstimer>0)Enemies.bosstimer--;
					
				if(Enemies.richtung[z]==LINKS && !collisiondetect_enemy_links(Spieler, Enemies, z))
				{
					Enemies.richtung[z]=RECHTS;
					a=true;
				}	
				if(!a && Enemies.richtung[z]==RECHTS && !collisiondetect_enemy_rechts(Spieler, Enemies, z))
					Enemies.richtung[z]=LINKS;
				if(Enemies.richtung[z]==LINKS)Enemies.x[z]--;
				if(Enemies.richtung[z]==RECHTS)Enemies.x[z]++;
				if(collisiondetect_enemy_unten(Spieler, Enemies, z))Enemies.y[z]+=2;	
				if(absolut(Spieler.scrollwert+144+8-Enemies.x[z])<40 && Spieler.unverwundbarkeits_timer==0)
					kollision_spieler_enemies(Spieler, Enemies, z, Plattformen, Stein,Kanonen, Kugeln);
				if(Enemies.bossblinktimer>0)Enemies.bossblinktimer--;
			}
			
			
			
			if(Enemies.status[z]==ENEMY_TOT && Enemies.type[z]<165)
			{
				Enemies.x[z]++;
				Enemies.y[z]=fallfunktion_enemies(Enemies,z);
			}			
			if(Enemies.status[z]==ENEMY_TOT && Enemies.type[z]==165)
			{
				Spieler.scrollwert=6001;
				Spieler.score=Spieler.score+4000;
				Spieler.oneupscore+=4000;
				sprintf(Spieler.scorewert,"%d",Spieler.score);
			}	
			
			enemies_darstellen(Spieler, Enemies, Enemies.type[z], z);	
			if((Spieler.scrollwert+144)-Enemies.x[z]>500 || Enemies.y[z]>=192)
				if(Enemies.type[z]!=162)Enemies.verwendet[z]=false;
			if(Enemies.type[z]==162 && Enemies.y[z]>=192)Enemies.verwendet[z]=false;		
		}	
	}		
}
