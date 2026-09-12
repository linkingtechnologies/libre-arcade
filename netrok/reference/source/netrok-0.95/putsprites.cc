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
#include "SFont.h"
#include "main.h"
#include "graphicengine.h"
#include "putsprites.h"
#include "menu.h"
#include "scrolling.h"
#include "specialblockhandling.h"
#include "kortenhandling.h"

using namespace std;

extern SDL_Surface *fig[180];
extern SDL_Surface *t[100];
extern unsigned short int leveldat[32][13][400];
extern SDL_Surface *screen; 
extern SFont_Font* Font;
extern Mix_Chunk *snd_timeabzaehl;
extern Mix_Chunk *snd_newhighscore;
extern Mix_Chunk *snd_gamefinish;
extern Mix_Chunk *snd_gameover;
extern Mix_Chunk *snd_levelfinish;
extern Mix_Chunk *snd_boss_tot;



void korten_setzen_stand(player &Spieler)
{
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT)DrawIMG(fig[127],144,Spieler.korten_y);
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT2)DrawIMG(fig[128],144,Spieler.korten_y);
	if(Spieler.upgradetype==UPGRADE_NORMAL)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[100],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[101],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_SCHUHE)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[110],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[111],144,Spieler.korten_y);
	}
	if(Spieler.upgradetype==UPGRADE_HEMD)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[118],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[119],144,Spieler.korten_y);
	}
}

void korten_setzen1(player &Spieler)
{
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT)DrawIMG(fig[127],144,Spieler.korten_y);
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT2)DrawIMG(fig[128],144,Spieler.korten_y);
	if(Spieler.upgradetype==UPGRADE_NORMAL)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[102],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[103],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_SCHUHE)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[112],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[113],144,Spieler.korten_y);
	}
	if(Spieler.upgradetype==UPGRADE_HEMD)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[120],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[121],144,Spieler.korten_y);
	}
}

void korten_setzen2(player &Spieler)
{
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT)DrawIMG(fig[127],144,Spieler.korten_y);
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT2)DrawIMG(fig[128],144,Spieler.korten_y);
	if(Spieler.upgradetype==UPGRADE_NORMAL)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[104],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[105],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_SCHUHE)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[114],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[115],144,Spieler.korten_y);
	}
	if(Spieler.upgradetype==UPGRADE_HEMD)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[122],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[123],144,Spieler.korten_y);
	}	
}

void korten_setzen3(player &Spieler)
{
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT)DrawIMG(fig[127],144,Spieler.korten_y);
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT2)DrawIMG(fig[128],144,Spieler.korten_y);
	if(Spieler.upgradetype==UPGRADE_NORMAL)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[106],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[107],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_SCHUHE)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[129],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[130],144,Spieler.korten_y);
	}
	if(Spieler.upgradetype==UPGRADE_HEMD)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[124],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[125],144,Spieler.korten_y);
	}	
}

void korten_setzen_sprung(player &Spieler)
{	
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT)DrawIMG(fig[127],144,Spieler.korten_y);
	if(Spieler.kortenaussehen==KORTENAUSSEHEN_TOT2)DrawIMG(fig[128],144,Spieler.korten_y);
	if(Spieler.upgradetype==UPGRADE_NORMAL)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[108],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[109],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_SCHUHE)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[131],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[132],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_HEMD)
	{
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_RECHTS)DrawIMG(fig[137],144,Spieler.korten_y);
		if(Spieler.kortenaussehen==KORTENAUSSEHEN_LINKS)DrawIMG(fig[138],144,Spieler.korten_y);	
	}
}

void korten_setzen_treppe(player &Spieler)
{
	if(Spieler.upgradetype==UPGRADE_NORMAL)
	{
		if(Spieler.treppenzaehler < 20)DrawIMG(fig[116],144,Spieler.korten_y);
		if(Spieler.treppenzaehler >= 20)DrawIMG(fig[117],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_SCHUHE)
	{
		if(Spieler.treppenzaehler < 20)DrawIMG(fig[133],144,Spieler.korten_y);
		if(Spieler.treppenzaehler >= 20)DrawIMG(fig[134],144,Spieler.korten_y);	
	}
	if(Spieler.upgradetype==UPGRADE_HEMD)
	{
		if(Spieler.treppenzaehler < 20)DrawIMG(fig[135],144,Spieler.korten_y);
		if(Spieler.treppenzaehler >= 20)DrawIMG(fig[136],144,Spieler.korten_y);	
	}
	
}

void korten_darstellen(player &Spieler)
{
	if(!Spieler.festhalten_an_treppe)
	{
		if(Spieler.sprungzaehler==0)
		{
			if(Spieler.scrollwertsave_fuer_korten!=Spieler.scrollwert)
			{
				if(Spieler.korten_geschwindigkeit==1 || Spieler.korten_geschwindigkeit==-1)
				{
					if(Spieler.unverwundbarkeits_timer==0)
					{
						if(Spieler.zaehler<=10)korten_setzen1(Spieler);
						if(Spieler.zaehler>10)korten_setzen2(Spieler);
					}	
					else
					{
						if(Spieler.unverwundbarkeits_zaehler<=10)
						{
							if(Spieler.zaehler<=10)korten_setzen1(Spieler);
							if(Spieler.zaehler>10)korten_setzen2(Spieler);
						}	
					}	
				}
				if(Spieler.korten_geschwindigkeit==2 || Spieler.korten_geschwindigkeit==-2)
				{
					if(Spieler.unverwundbarkeits_timer==0)
					{
						if(Spieler.zaehler<=10)korten_setzen1(Spieler);
						if(Spieler.zaehler>10 && Spieler.zaehler <= 20)korten_setzen2(Spieler);
						if(Spieler.zaehler>20)korten_setzen3(Spieler);
					}
					else
					{
						if(Spieler.unverwundbarkeits_zaehler<=10)
						{
							if(Spieler.zaehler<=10)korten_setzen1(Spieler);
							if(Spieler.zaehler>10 && Spieler.zaehler <= 20)korten_setzen2(Spieler);
							if(Spieler.zaehler>20)korten_setzen3(Spieler);
						}
					}	
				}
				if(Spieler.korten_geschwindigkeit>=3 || Spieler.korten_geschwindigkeit<=-3)
				{
					if(Spieler.unverwundbarkeits_timer==0)
					{
						if(Spieler.zaehler<=5)korten_setzen1(Spieler);
						if(Spieler.zaehler>5 && Spieler.zaehler<=10)korten_setzen2(Spieler);
						if(Spieler.zaehler>10 && Spieler.zaehler<=15)korten_setzen3(Spieler);	
						if(Spieler.zaehler>15 && Spieler.zaehler<=20)korten_setzen1(Spieler);
						if(Spieler.zaehler>20 && Spieler.zaehler<=25)korten_setzen2(Spieler);
						if(Spieler.zaehler>25)korten_setzen3(Spieler);
					}
					else
					{
						if(Spieler.unverwundbarkeits_zaehler<=10)
						{
							if(Spieler.zaehler<=5)korten_setzen1(Spieler);
							if(Spieler.zaehler>5 && Spieler.zaehler<=10)korten_setzen2(Spieler);
							if(Spieler.zaehler>10 && Spieler.zaehler<=15)korten_setzen3(Spieler);	
							if(Spieler.zaehler>15 && Spieler.zaehler<=20)korten_setzen1(Spieler);
							if(Spieler.zaehler>20 && Spieler.zaehler<=25)korten_setzen2(Spieler);
							if(Spieler.zaehler>25)korten_setzen3(Spieler);
						}
					}	
				}
				if(Spieler.korten_geschwindigkeit==0 && Spieler.korten_auf_plattform_nr!=99)
				{
					if(Spieler.unverwundbarkeits_timer==0)korten_setzen_stand(Spieler);
					else
						if(Spieler.unverwundbarkeits_zaehler<=10)korten_setzen_stand(Spieler);	
				}
			}

			if(Spieler.scrollwertsave_fuer_korten==Spieler.scrollwert)
			{
				if(Spieler.unverwundbarkeits_timer==0)korten_setzen_stand(Spieler);
				else
					if(Spieler.unverwundbarkeits_zaehler<=10)korten_setzen_stand(Spieler);
			}
		}
		if(Spieler.sprungzaehler!=0)
		{
			if(Spieler.unverwundbarkeits_timer==0)korten_setzen_sprung(Spieler);
			else
				if(Spieler.unverwundbarkeits_zaehler<=10)korten_setzen_sprung(Spieler);	
		}
	}
	else
	{
		if(Spieler.unverwundbarkeits_timer==0)korten_setzen_treppe(Spieler);	
		else
			if(Spieler.unverwundbarkeits_zaehler<=10)korten_setzen_treppe(Spieler);		
	}

}

void plattformen_darstellen(platform &Plattformen, int scrollwert)
{
	for(int pzaehler=0; pzaehler<=Plattformen.anzahl_plattformen_in_level-1; pzaehler++)
	{
		DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]-scrollwert, Plattformen.aktuelle_y[pzaehler]);
		if(Plattformen.laenge[pzaehler]==PLATFORM_MEDIUM)
		{
			DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]+16-scrollwert, Plattformen.aktuelle_y[pzaehler]);
			DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]+32-scrollwert, Plattformen.aktuelle_y[pzaehler]);
		}
		if(Plattformen.laenge[pzaehler]==PLATFORM_LARGE)
		{
			DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]+16-scrollwert, Plattformen.aktuelle_y[pzaehler]);
			DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]+32-scrollwert, Plattformen.aktuelle_y[pzaehler]);
			DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]+48-scrollwert, Plattformen.aktuelle_y[pzaehler]);
			DrawIMG(t[22], Plattformen.aktuelle_x[pzaehler]+64-scrollwert, Plattformen.aktuelle_y[pzaehler]);
		}
	}
}


void statusleiste_darstellen(player &Spieler)
{
	int x=10,y=10;
	DrawIMG(fig[100], x, y);	
	
	if(Spieler.shield[HOCH]>=1)DrawIMG(fig[143], x, y-9);
	if(Spieler.shield[HOCH]==2)DrawIMG(fig[143], x, y-13);
	if(Spieler.shield[RUNTER]>=1)DrawIMG(fig[142], x, y+20);
	if(Spieler.shield[RUNTER]==2)DrawIMG(fig[142], x, y+24);
	if(Spieler.shield[LINKS]>=1)DrawIMG(fig[141], x-9, y);
	if(Spieler.shield[LINKS]==2)DrawIMG(fig[141], x-13, y);
	if(Spieler.shield[RECHTS]>=1)DrawIMG(fig[140], x+9, y);
	if(Spieler.shield[RECHTS]==2)DrawIMG(fig[140], x+13, y);
		
	DrawIMG(fig[146],190,10);
	if(Spieler.coins>0)
		for(int zaehler=1; zaehler<=Spieler.coins; zaehler++)
			DrawIMG(fig[145],191-6+(zaehler*6),11);
		
	SFont_Write(screen, Font, x-2+26,y+9,"x");
	SFont_Write(screen, Font, x+5+26,y+9,Spieler.wert);
	SFont_Write(screen, Font, x-2+26+25,y+9,"score:");	
	SFont_Write(screen, Font, x-2+26+25+35,y+9,Spieler.scorewert);
	SFont_Write(screen, Font, x-2+26+25+35+70,y+9,"time:");	
	SFont_Write(screen, Font, x-2+26+25+35+70+37,y+9,Spieler.timeleftchar);	
	SFont_Write(screen, Font, x-2+26+25+35+70+70,y+9,"level:");	
	SFont_Write(screen, Font, x-2+26+25+35+70+37+75,y+9,Spieler.levelwert);	
}

void fahne_darstellen(player &Spieler)
{
	if(Spieler.fahnenposition_y==Spieler.fahnenposition_zeile*16)
		DrawIMG(fig[144], (Spieler.fahnenposition_spalte*16)-Spieler.scrollwert,(Spieler.fahnenposition_zeile*16)-10);
	else
		DrawIMG(fig[144], (Spieler.fahnenposition_spalte*16)-Spieler.scrollwert,Spieler.fahnenposition_y-10);
	
}

void kugeln_darstellen(player &Spieler, kugel &Kugeln, int zaehler2)
{
	DrawIMG(fig[139], Kugeln.x[zaehler2]-Spieler.scrollwert, Kugeln.y[zaehler2]); 
}

void level_hintergrund_darstellen(player &Spieler)
{
	SDL_FillRect(screen, 0, Spieler.hintergrund_farbe);
}

void gr_kanone_neudarstellen(player &Spieler)
{
	for(int durchlauf_zeilen=0;durchlauf_zeilen<=12;durchlauf_zeilen++)
	{
		for(int durchlauf_spalten=0;durchlauf_spalten<=399;durchlauf_spalten++)
		{
			if(leveldat[Spieler.level][durchlauf_zeilen][durchlauf_spalten]>=29 &&
				leveldat[Spieler.level][durchlauf_zeilen][durchlauf_spalten]<=32)
			{
				DrawIMG(t[leveldat[Spieler.level][durchlauf_zeilen][durchlauf_spalten]],
					(durchlauf_spalten*16)-Spieler.scrollwert,durchlauf_zeilen*16);	
			}
		}
	}
}	

void upgradebutton_darstellen(player &Spieler)
{
	if(Spieler.upgradebutton_type==1)DrawIMG(t[25],(Spieler.upgradebutton_gefunden_spalte*16)-Spieler.scrollwert,
		(Spieler.upgradebutton_gefunden_zeile*16)+Spieler.position_upgradebutton);
	if(Spieler.upgradebutton_type==2)DrawIMG(t[26],(Spieler.upgradebutton_gefunden_spalte*16)-Spieler.scrollwert,
		(Spieler.upgradebutton_gefunden_zeile*16)+Spieler.position_upgradebutton);
}

void lastdrawtiles_darstellen(player &Spieler)
{
	for(int zaehler=1; zaehler<=Spieler.anzahl_lastdrawtile; zaehler++)
		DrawIMG(t[Spieler.type_lastdrawtile[zaehler]],Spieler.xpos_lastdrawtile[zaehler],Spieler.ypos_lastdrawtile[zaehler]);
}

void enemies_darstellen(player &Spieler,enemy &Enemies, int type,int zaehler)
{
	if(type==150)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[150],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[151],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==152)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[152],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[153],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==154)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[154],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[155],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==156)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[156],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[157],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==158)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[158],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[159],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==160)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[160],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[161],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==162)
	{
		if(Enemies.zaehler<=25)DrawIMG(fig[162],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
		if(Enemies.zaehler>25)DrawIMG(fig[163],Enemies.x[zaehler]-Spieler.scrollwert-4,Enemies.y[zaehler]-4);
	}
	if(type==165)
	{
		if(Enemies.bossblinktimer==0)
		{
			if(Enemies.zaehler<=25)DrawIMG(fig[164],Enemies.x[zaehler]-Spieler.scrollwert-32,Enemies.y[zaehler]-36);
			if(Enemies.zaehler>25)DrawIMG(fig[166],Enemies.x[zaehler]-Spieler.scrollwert-32,Enemies.y[zaehler]-36);
		}
		else
		{
			if(Spieler.unverwundbarkeits_zaehler<10)
				DrawIMG(fig[164],Enemies.x[zaehler]-Spieler.scrollwert-32,Enemies.y[zaehler]-36);	
			else
				DrawIMG(fig[167],Enemies.x[zaehler]-Spieler.scrollwert-32,Enemies.y[zaehler]-36);
		}
			
	}
	
}

void zwischenlevel(player &Spieler)
{
	Spieler.score+=1000;
	Spieler.oneupscore+=1000;
	char wert[5];
	sprintf(wert,"%d",Spieler.leben);
	SFont_Write(screen, Font, 10+240,220,wert);	
	
	char buffer[10];
	char timeleftchar[7];
	char scoreanzeige[10];
	sprintf(scoreanzeige,"%d",Spieler.score);
	
	FILE *datei;
	datei = fopen("scr","r");
	if(datei == NULL)printf("ACHTUNG: Datei konnte nicht geoeffnet werden");
	fscanf(datei,"%s\n", buffer);
	int highscore=atoi(buffer);	
	int tastendruck=0;
	fclose(datei);
	
	int copytime=Spieler.timeleft;
	sprintf(timeleftchar,"%d",copytime);
	
	int menupos=-124;
	while(menupos<60)
	{
		starttiming();
		moving_background(Spieler);
		menupos+=4;
		DrawIMG(fig[178],60,menupos);	
		
		SDL_Flip(screen);
		endtiming(10);
	}
	
	int zaehler=0;
	while(tastendruck!=1 && tastendruck!=5)
	{
		zaehler++;
		starttiming();
		tastendruck=taste();
		moving_background(Spieler);
		
		SFont_Write(screen, Font, 70,90,"highscore: ");
		SFont_Write(screen, Font, 70,105,"your score: ");
		SFont_Write(screen, Font, 70,120,"time left: ");
		
		SFont_Write(screen, Font, 130,90,buffer);
		SFont_Write(screen, Font, 130,105,scoreanzeige);
		SFont_Write(screen, Font, 130,120,timeleftchar);
		
		if(zaehler==5 && copytime>0)
		{
			zaehler=0;
			Spieler.score=Spieler.score+10;
			Spieler.oneupscore+=10;
			copytime--;
			Mix_PlayChannel(-1, snd_timeabzaehl, 0);
			sprintf(scoreanzeige,"%d",Spieler.score);
			sprintf(timeleftchar,"%d",copytime);
		}	
		
		DrawIMG(fig[178],60,menupos);	
		
		SDL_Flip(screen);
		endtiming(10);
	}	
	if(copytime>0)
	{
		Spieler.score=Spieler.score+copytime*10;
		Spieler.oneupscore=Spieler.oneupscore+copytime*10;
		copytime=0;
		sprintf(scoreanzeige,"%d",Spieler.score);
	}
	sprintf(Spieler.scorewert,"%d",Spieler.score);
	
	while(menupos>-125)
	{
		starttiming();
		moving_background(Spieler);
		menupos-=4;
		DrawIMG(fig[178],60,menupos);	
		SDL_Flip(screen);
		endtiming(10);
	}
}

void gameover(player &Spieler)
{
	char buffer[10];
	FILE *datei;
	datei = fopen("scr","r");
	if(datei == NULL)printf("ACHTUNG: Datei konnte nicht geoeffnet werden");
	fscanf(datei,"%s\n", buffer);
	int highscore=atoi(buffer);	
	int tastendruck=0;
	fclose(datei);
	
	int menupos=-124;
	while(menupos<60)
	{
		starttiming();
		moving_background(Spieler);
		menupos+=4;
		DrawIMG(fig[177],60,menupos);	
		
		SDL_Flip(screen);
		endtiming(10);
	}
	if(Spieler.score<=highscore)	Mix_PlayChannel(-1, snd_gameover, 0);
	
	while(tastendruck!=1 && tastendruck!=5)
	{
		starttiming();
		tastendruck=taste();
		moving_background(Spieler);
		SFont_Write(screen, Font, 70,90,"highscore: ");
		SFont_Write(screen, Font, 70,105,"your score: ");
		
		SFont_Write(screen, Font, 130,90,buffer);
		SFont_Write(screen, Font, 130,105,Spieler.scorewert);
		DrawIMG(fig[177],60,menupos);
		
		SDL_Flip(screen);
		endtiming(10);
	}	
	if(Spieler.score>highscore)
	{
		Mix_PlayChannel(-1, snd_newhighscore, 0);
		datei = fopen("scr","w");
		fprintf(datei,"%s\n", Spieler.scorewert);
		fclose(datei);
	}
	while(menupos>-125)
	{
		starttiming();
		moving_background(Spieler);
		menupos-=4;
		DrawIMG(fig[177],60,menupos);	
		SDL_Flip(screen);
		endtiming(10);
	}
}

void endanimation()
{
	Uint32 hintergrundfarbe;
	hintergrundfarbe = SDL_MapRGB(screen->format, 126, 181, 255);
	int step=0;
	int zaehler=0;
	int zaehler2=0;
	int zugpos=-220;
	int schritt=0;
	int tastendruck=0;
	int fertig=false;
	Mix_PlayChannel(-1, snd_gamefinish, 0);
	while(schritt<5)
	{
		starttiming();
		if(step==0)
		{
			for(int x=0; x<=21; x++)
			{
				DrawIMG(t[17],x*16,176);	
				DrawIMG(t[17],x*16,192);
			}	
			DrawIMG(fig[151],20,156);
			DrawIMG(fig[154],80,156);
			DrawIMG(fig[158],180,156);
			DrawIMG(fig[162],280,156);
			DrawIMG(t[83],64,160);
			DrawIMG(t[84],64,144);
			DrawIMG(t[85],64,128);
		
			DrawIMG(t[87],128,160);
			DrawIMG(t[86],160,160);
			DrawIMG(t[86],160,144);
			DrawIMG(t[86],160,128);
			DrawIMG(t[86],160,112);
			DrawIMG(t[87],160,96);
			zaehler++;
			if(zaehler==400)
			{
				step=1;
				zaehler=0;
			}	
		}
		if(step==1)
		{
			if(zaehler2<10)
			{
				for(int x=0; x<=21; x++)
				{
					DrawIMG(t[17],x*16,176);	
					DrawIMG(t[17],x*16,192);
				}	
			
				DrawIMG(t[83],64,160);
				DrawIMG(t[84],64,144);
				DrawIMG(t[85],64,128);
		
				DrawIMG(t[87],128,160);
				DrawIMG(t[86],160,160);
				DrawIMG(t[86],160,144);
				DrawIMG(t[86],160,128);
				DrawIMG(t[86],160,112);
				DrawIMG(t[87],160,96);
				
			}	
			else
			{
				for(int x=0; x<=21; x++)
				{
					DrawIMG(t[1],x*16,176);	
					DrawIMG(t[1],x*16,192);
				}	
			
				DrawIMG(t[70],64,160);
				DrawIMG(t[71],64,144);
				DrawIMG(t[72],64,128);
		
				DrawIMG(t[63],128,160);
				DrawIMG(t[61],160,160);
				DrawIMG(t[61],160,144);
				DrawIMG(t[61],160,128);
				DrawIMG(t[61],160,112);
				DrawIMG(t[62],160,96);
			}
				
			DrawIMG(fig[151],20,156);
			DrawIMG(fig[154],80,156);
			DrawIMG(fig[158],180,156);
			DrawIMG(fig[162],280,156);	
				
			zaehler++;
			zaehler2++;
			
			if(zaehler2==20)zaehler2=0;
				
			if(zaehler==400)
			{
				zaehler=0;
				step=2;	
			}	
		}
		
		if(step==2)
		{
			for(int x=0; x<=21; x++)
			{
				DrawIMG(t[1],x*16,176);	
				DrawIMG(t[1],x*16,192);
			}	
			if(zugpos<-25 && schritt==0)zugpos++;
			if(zugpos==-25 && schritt==0)schritt=1;
			if(zugpos>-220 && schritt==1)zugpos--;
			if(zugpos==-220 && schritt==1)schritt=2;
			if(zugpos<-25 && schritt==2)zugpos++;
			if(zugpos==-25 && schritt==2)schritt=3;
			if(zugpos>-220 && schritt==3)zugpos--;	
			if(zugpos==-220 && schritt==3)schritt=4;	
				
			DrawIMG(fig[126],20-7,zugpos);
			DrawIMG(fig[126],80-7,zugpos);
			DrawIMG(fig[126],180-7,zugpos);
			DrawIMG(fig[126],280-7,zugpos);
				
			DrawIMG(t[70],64,160);
			DrawIMG(t[71],64,144);
			DrawIMG(t[72],64,128);
		
			DrawIMG(t[63],128,160);
			DrawIMG(t[61],160,160);
			DrawIMG(t[61],160,144);
			DrawIMG(t[61],160,128);
			DrawIMG(t[61],160,112);
			DrawIMG(t[62],160,96);
				
			if(schritt==0)
			{
				DrawIMG(fig[151],20,156);
				DrawIMG(fig[154],80,156);
				DrawIMG(fig[158],180,156);
				DrawIMG(fig[162],280,156);
			}
			if(schritt==1)
			{
				DrawIMG(fig[151],20,zugpos+180);
				DrawIMG(fig[154],80,zugpos+180);
				DrawIMG(fig[158],180,zugpos+180);
				DrawIMG(fig[162],280,zugpos+180);
			}
			if(schritt==2)
			{
				DrawIMG(fig[98],20,zugpos+180);
				DrawIMG(fig[98],80,zugpos+180);
				DrawIMG(fig[98],180,zugpos+180);
				DrawIMG(fig[98],280,zugpos+180);
			}
			if(schritt>2)
			{
				DrawIMG(fig[98],20,156);
				DrawIMG(fig[98],80,156);
				DrawIMG(fig[98],180,156);
				DrawIMG(fig[98],280,156);
			}
			
			
			SFont_Write(screen, Font, 40,60,"Thank you very much Netrok! You rescued us! ");
			zaehler++;
			if(zaehler>400 && schritt==4)
			{
				for(int l=0;l<=400;l++)
				{
					starttiming();
					SDL_FillRect(screen, 0, hintergrundfarbe);
					SFont_Write(screen, Font, 40,80,"Thank you for playing Netrok!");
					SDL_Flip(screen);
					
					endtiming(10);
				}	
				schritt=5;
			}
		}
		
		
		SDL_Flip(screen);
		SDL_FillRect(screen, 0, hintergrundfarbe);
		endtiming(10);
	}	
}

void bosstot(int zaehler, player &Spieler, enemy &Enemies, platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln)
{
	Mix_PlayChannel(-1, snd_boss_tot, 0);
	for(Enemies.y[zaehler];Enemies.y[zaehler]<=300;Enemies.y[zaehler]++)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		Enemies.zaehler++;
		if(Enemies.zaehler==50)Enemies.zaehler=0;	
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		enemies_darstellen(Spieler, Enemies, Enemies.type[zaehler], zaehler);	
		korten_darstellen(Spieler);
		steine_fallen_lassen(Steine1, Spieler.level, Spieler.scrollwert);
		kugeln_bewegen(Kanonen, Spieler, Kugeln);
		gr_kanone_neudarstellen(Spieler);
		lastdrawtiles_darstellen(Spieler);	
		statusleiste_darstellen(Spieler);
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);   	
		endtiming(10);
	}
	
	leveldat[Spieler.level][12][(Spieler.scrollwert+144+8)/16]=9;
	leveldat[Spieler.level][12][((Spieler.scrollwert+144+8)/16)-1]=9;
	leveldat[Spieler.level][12][((Spieler.scrollwert+144+8)/16)+1]=9;
	
	if(Spieler.level>=20)
	{
		endanimation();
		gameover(Spieler);
		Spieler.game_runs=0;
	}
	Enemies.bosstreffer=3;
	Spieler.scrollwert=0;
}