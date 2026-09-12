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
#include <time.h>
#include "SFont.h"
#include "main.h"
#include "graphicengine.h"
#include "putsprites.h"

using namespace std;

bool einmallaufen=false;
extern SDL_Surface *fig[180];
extern SDL_Event event;
extern SFont_Font* Font;
extern SDL_Surface *screen; 
extern Mix_Music *music;



int taste()
{
	while(SDL_PollEvent(&event)) 
		{
			switch(event.type) 
			{
				case SDL_KEYDOWN:
					switch(event.key.keysym.sym) 
					{
						case SDLK_RETURN:
							return 1;
						break;
						case SDLK_ESCAPE:
							return 5;
						break;
						case SDLK_UP:
							return 2;		
						break;
						case SDLK_DOWN:
							return 3;						
						break;	
					}
			}
		}	
	return 0;	
}

void moving_background(player &Spieler)
{
	for(int zaehl=0;zaehl<=10;zaehl++)
		for(int zaehl2=0; zaehl2<=20; zaehl2++)
			DrawIMG(fig[174],Spieler.xpos[zaehl]+zaehl2*60,Spieler.ypos[zaehl]);
			
	for(int z=0;z<11;z++)
	{
		Spieler.xpos[z]++;
		Spieler.ypos[z]--;
		if(Spieler.ypos[z]==-24)
		{
			Spieler.ypos[z]=240;
			Spieler.xpos[z]=-260;
		}	
	}	
}

void menu_runter(int auswahl, player &Spieler)
{
	int menupos=-124;
	while(menupos<40)
	{
		starttiming();
		moving_background(Spieler);
		menupos+=4;
		if(auswahl==0)DrawIMG(fig[170],100,menupos);	
		if(auswahl==1)DrawIMG(fig[171],100,menupos);	
		if(auswahl==2)DrawIMG(fig[172],100,menupos);	
		if(auswahl==3)DrawIMG(fig[173],100,menupos);
		SDL_Flip(screen);
		endtiming(10);
	}		
}

void menu_hoch(int auswahl, player &Spieler)
{
	int menupos=40;
	while(menupos>-124)
	{
		starttiming();
		moving_background(Spieler);
		menupos-=4;
		if(auswahl==0)DrawIMG(fig[170],100,menupos);	
		if(auswahl==1)DrawIMG(fig[171],100,menupos);	
		if(auswahl==2)DrawIMG(fig[172],100,menupos);	
		if(auswahl==3)DrawIMG(fig[173],100,menupos);
		SDL_Flip(screen);
		endtiming(10);
	}	
}

void instructions(player &Spieler)
{
	int menupos=-215;
	int a=0,b=16;
	
	char text[35][50];
	FILE *datei;
	datei = fopen("instructions.txt","r");
	if(datei == NULL) printf("ACHTUNG: Datei konnte nicht geoeffnet werden");
	for(int l=0; l<=33; l++)
		fgets(text[l],50,datei);
	fclose(datei);
	
	while(menupos<5)
	{
		starttiming();
		moving_background(Spieler);
		menupos+=5;
		DrawIMG(fig[175],10,menupos);
		SDL_Flip(screen);
		endtiming(10);	
	}	
	
	int tastendruck=0;
	while(tastendruck!=1 && tastendruck!=5)
	{
		starttiming();
		tastendruck=taste();
		moving_background(Spieler);
		if(tastendruck==2 && a>0)
		{
			a--;
			b--;
		}
		if(tastendruck==3 && b<33)
		{
			a++;
			b++;
		}
		for(int l=a; l<=b; l++)
			SFont_Write(screen, Font,18,5+8+(l*10)-(a*10),text[l]);	
		
		DrawIMG(fig[175],10,5);
		SDL_Flip(screen);
		endtiming(10);
	}
	
	while(menupos>-215)
	{
		starttiming();
		moving_background(Spieler);
		menupos-=5;
		DrawIMG(fig[175],10,menupos);
		SDL_Flip(screen);
		endtiming(10);	
	}
}

void about(player &Spieler)
{
	int menupos=-160;
	int a=0,b=11;
	while(menupos<30)
	{
		starttiming();
		moving_background(Spieler);
		menupos+=5;
		DrawIMG(fig[176],60,menupos);
		SDL_Flip(screen);
		endtiming(10);	
	}	
	
	char buffer[20];
	char text[24][32];
	FILE *datei;
	datei = fopen("about.txt","r");
	if(datei == NULL) printf("ACHTUNG: Datei konnte nicht geoeffnet werden");
	for(int l=0; l<=22; l++)
		fgets(text[l],31,datei);
	fclose(datei);	

	
	int tastendruck=0;
	while(tastendruck!=1 && tastendruck!=5)
	{
		starttiming();
		tastendruck=taste();
		moving_background(Spieler);
		
		if(tastendruck==2 && a>0)
		{
			a--;
			b--;
		}
		if(tastendruck==3 && b<22)
		{
			a++;
			b++;
		}
		for(int l=a; l<=b; l++)
			SFont_Write(screen, Font,68,38+(l*10)-(a*10),text[l]);	
		DrawIMG(fig[176],60,30);
		SDL_Flip(screen);
		endtiming(10);
	}
	
	while(menupos>-160)
	{
		starttiming();
		moving_background(Spieler);
		menupos-=5;
		DrawIMG(fig[176],60,menupos);
		SDL_Flip(screen);
		endtiming(10);	
	}
}


int menu(player &Spieler)
{
	int auswahl=0;
	
	int xxpos=-200,yypos=200;
	int zaehl=0;
	for(int xx=-60;xx>-280;xx-=20)
	{
		Spieler.xpos[zaehl]=xx;
		zaehl++;
	}
	zaehl=0;
	for(int yy=0;yy<=240;yy+=24)
	{
		Spieler.ypos[zaehl]=yy;
		zaehl++;
	}
	int tastendruck=0;
	bool enter=false;
	Uint32 farbe;
	farbe = SDL_MapRGB(screen->format, 0, 0, 0);
	
	int introy=260;
	int zaehler=0;
	Mix_PlayMusic(music, -1);
	if(!einmallaufen)
	{
		while(tastendruck!=1 && tastendruck!=5)
		{
			starttiming();
			tastendruck=taste();
		
			moving_background(Spieler);
			zaehler++;
			if(zaehler==2)
			{
				introy--;
				zaehler=0;
			}	
			DrawIMG(fig[99],138,introy);
			if(introy+200>0)SFont_Write(screen, Font,135,introy+200,"presents");
			if(introy+400>0)SFont_Write(screen, Font,90,introy+400,"an Ioan-Tudor Parvulescu game");
			DrawIMG(fig[179],95,introy+600);
			if(introy+800>0)SFont_Write(screen, Font,10,introy+800,"A big machine has taken control of Netrok's world.");
			if(introy+820>0)SFont_Write(screen, Font,10,introy+820,"All his friends have been caught in metal cages");
			if(introy+840>0)SFont_Write(screen, Font,10,introy+840,"and the only possibility to free them again  ");
				
			if(introy+860>0)SFont_Write(screen, Font,10,introy+860,"is to find the button that turns it off... ");

			DrawIMG(fig[179],95,introy+1040);	
			if(introy+1040==4)tastendruck=1;
			SDL_Flip(screen);
			endtiming(10);
		}
		einmallaufen=true;
	}
	
	menu_runter(auswahl, Spieler);

	while(!enter)
	{
		starttiming();
	        moving_background(Spieler);
		tastendruck=taste();
		if(tastendruck==1)
		{
			Spieler.score+=2;
			Spieler.oneupscore+=2;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
			if(auswahl==0)
			{
				menu_hoch(auswahl, Spieler);
				return auswahl;
			}	
			if(auswahl==1)
			{
				menu_hoch(auswahl, Spieler);
				instructions(Spieler); 
				menu_runter(auswahl, Spieler);
			}
			if(auswahl==2)
			{
				menu_hoch(auswahl, Spieler);
				about(Spieler);
				menu_runter(auswahl, Spieler);
			}
			if(auswahl==3)
			{
				menu_hoch(auswahl, Spieler);
				return auswahl;
			}	
		}
		
		if(tastendruck==2)
		{
			auswahl--;
			Spieler.score++;
			Spieler.oneupscore++;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
			if(auswahl<0)auswahl=3;
		}
		
		if(tastendruck==3)
		{
			auswahl++;
			Spieler.score++;
			Spieler.oneupscore++;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
			if(auswahl>3)auswahl=0;	
		}
		
		if(auswahl==0)DrawIMG(fig[170],100,40);	
		if(auswahl==1)DrawIMG(fig[171],100,40);	
		if(auswahl==2)DrawIMG(fig[172],100,40);	
		if(auswahl==3)DrawIMG(fig[173],100,40);
		DrawIMG(fig[179],95,4);	
		SFont_Write(screen, Font,120+10,165,"score:");
		SFont_Write(screen, Font,165+10,165,Spieler.scorewert);	
		SDL_Flip(screen);
		endtiming(10);
	}
}