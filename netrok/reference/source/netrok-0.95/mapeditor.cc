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
#include "SFont.h"

#define		SAVEDIALOG		0
#define		LOADDIALOG		1

void DrawIMG (SDL_Surface *img, int x, int y);
void DrawPixel(SDL_Surface *screen, int x, int y, Uint8 R, Uint8 G, Uint8 B); 
void Slock(SDL_Surface *screen);
void Sulock(SDL_Surface *screen);
void zeichnegitter(int gittercolor);
void zeichnefeld();
void zeige_gewaehltes_tile();
void map_abspeichern();
void map_laden();
void zeichne_statusleiste();
int auswahlmenu();
void init_editor();
void erlaubte_tiles_festlegen();
void load_tiles();
void zeichne_farbauswahlanzeige();
void show_helpwindow();
bool show_escape_screen(bool levelmodified);
bool show_loadorsave_screen(bool levelmodified, int type);

SDL_Surface *back; 
SDL_Surface *cursor;
SDL_Surface *cursormenu;
SDL_Surface *menu;
SDL_Surface *rahmen;
SDL_Surface *t[250];
SDL_Surface *screen; 

int xpos=10,ypos=10; 
int level_finished = 0;
int a=0,b=39;
unsigned short int leveldat[13][400];
int tileart[3][33];
int yzeichne,xzeichne;
int zaehlx,zaehly;
Uint32 hintergrundfarbe;
int cursorzeile=0,cursorspalte=0;
int tileindex=0;
FILE *datei;
char dateiname[13];
char buffer[5];
int lesex=0,lesey=0,schreibex=0,schreibey=0;
void map_neu();
char janein[3];
SFont_Font* Font;
bool erlaubte_tiles[204];
int rgb_color[3];
SDL_Event event;

void zeichnefeld()
{
	for(zaehlx=a;zaehlx<=b;zaehlx++)
	{
		for(zaehly=0;zaehly<=12;zaehly++)
		{
			if(leveldat[zaehly][zaehlx]!=0)
				DrawIMG(t[leveldat[zaehly][zaehlx]], zaehlx*16-(a*16), zaehly*16);				
		}
	}
}

void zeichnegitter(int gittercolor)
{
	Slock(screen);
	for(xzeichne=0; xzeichne <= 640; xzeichne = xzeichne + 16)
	{
		for(yzeichne=0; yzeichne <= 208; yzeichne ++)
		{
			DrawPixel(screen,xzeichne,yzeichne, gittercolor, gittercolor, gittercolor);
		}
	}

	for(xzeichne=0; xzeichne <= 640; xzeichne++)
	{
		for(yzeichne=0; yzeichne <= 208; yzeichne = yzeichne + 16)
		{
			DrawPixel(screen,xzeichne,yzeichne, gittercolor, gittercolor, gittercolor);
		}
	}
	Sulock(screen);
}

void zeige_gewaehltes_tile()
{
	SFont_Write(screen, Font, 400,210,"selected tile: ");
	DrawIMG(t[tileindex],480,210);
}

void map_abspeichern()
{
	leveldat[0][0]=rgb_color[0];
	leveldat[0][1]=rgb_color[1];
	leveldat[0][2]=rgb_color[2];
	datei = fopen(dateiname,"w");
	for(schreibey=0; schreibey<=12; schreibey++)
	{
		for(schreibex=0;schreibex<=399;schreibex++)
		{ 
			sprintf(buffer,"%d",leveldat[schreibey][schreibex]);
			fprintf(datei,"%s\n", buffer);
					
			strcpy(buffer, "\0" );		
		}
	}
	fclose(datei);
}

void map_laden()
{	
	datei = fopen(dateiname,"r");
	if(datei == NULL)
	{
		printf("ACHTUNG: Datei konnte nicht geoeffnet werden");
	}
	for(lesey=0; lesey<=12; lesey++)
	{
		for(lesex=0;lesex<=399;lesex++)
		{
			fscanf(datei,"%s\n", buffer);
			leveldat[lesey][lesex]=atoi(buffer);
			
			strcpy(buffer, "\0" );	
		}
	}
	fclose(datei);	
	rgb_color[0]=leveldat[0][0];
	rgb_color[1]=leveldat[0][1];
	rgb_color[2]=leveldat[0][2];
}

void map_neu()
{
	for(zaehlx=0; zaehlx <= 399; zaehlx++)
		for(zaehly=0; zaehly <= 12; zaehly++)
			leveldat[zaehly][zaehlx]=0;
}

int auswahlmenu()
{
	int auswahl=1;
	int spalte=1,zeile=0;
	int cursorx=50,cursory=100-2;
	bool fertig=false;
	
	do
	{
		DrawIMG(menu, 50, 82);
		DrawIMG(cursormenu,cursorx,cursory);
		while(SDL_PollEvent(&event)) 
		{
			switch(event.type) 
			{
				case SDL_KEYDOWN:
					switch(event.key.keysym.sym) 
					{
						case SDLK_RETURN:
							fertig=true;
						break;
						case SDLK_LEFT:
							if(spalte>1)
							{
								cursorx-=13;
								spalte--;
								auswahl--;
							}
						break;
						case SDLK_RIGHT:
							if(spalte<10)
							{
								cursorx+=13;
								spalte++;
								auswahl++;
							}
						break;
						case SDLK_UP:
							if(zeile>0)
							{
								cursory-=9;
								zeile--;
								auswahl-=10;
							}
						break;
						case SDLK_DOWN:
							if(zeile<1)
							{
								cursory+=9;
								zeile++;
								auswahl+=10;
							}
						break;
						
						case SDLK_ESCAPE:
							SDL_Quit();
						break;
					}
				}
			}
		SDL_Flip(screen);
		hintergrundfarbe = SDL_MapRGB(screen->format, 0, 0, 0);
		SDL_FillRect(screen, 0, hintergrundfarbe);
	}
	while(!fertig);
	return auswahl;
}

void zeichne_farbauswahlanzeige()
{
	char rgbwert[5];
	sprintf(rgbwert,"%d",rgb_color[0]);
	SFont_Write(screen, Font, 10+240,220,rgbwert);
	sprintf(rgbwert,"%d",rgb_color[1]);
	SFont_Write(screen, Font, 30+240,220,rgbwert);
	sprintf(rgbwert,"%d",rgb_color[2]);
	SFont_Write(screen, Font, 50+240,220,rgbwert);
	SFont_Write(screen, Font,250-115,210,"Backgroundcolor:     R:   G:   B:");	
}

void zeichne_statusleiste()
{
	Slock(screen);
	for(int xzeichne=0; xzeichne<=640; xzeichne++)
			for(int yzeichne=201; yzeichne<=240; yzeichne++) 
				DrawPixel(screen,xzeichne,yzeichne, 0, 0, 0);
	Sulock(screen);		
	zeige_gewaehltes_tile();
	zeichne_farbauswahlanzeige();
	SFont_Write(screen, Font,540,210,"Press F1 for help");	
	int pos=0;		
	int posy=250;			
	for(int zaehlx=0; zaehlx<=203; zaehlx++)
		if(erlaubte_tiles[zaehlx])
		{
			pos++;
			if(pos==31)
			{
				pos=0;
				posy+=20;
			}
			DrawIMG(t[zaehlx], pos*20, posy);	
		}	
			
}	

void init_editor()
{
	Font = SFont_InitFont(SDL_LoadBMP("font1.bmp"));
	if(!Font) 
	{
		fprintf(stderr, "An error occured while loading the font.");
		exit(1);
	}
	map_neu();
	SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER); 
	screen = SDL_SetVideoMode(640, 480, 8, SDL_HWSURFACE | SDL_DOUBLEBUF);
	atexit(SDL_Quit);
	menu = SDL_LoadBMP("mapeditormenu.bmp");
	cursormenu = SDL_LoadBMP("cursor2.bmp");
	rahmen = SDL_LoadBMP("rahmen.bmp");
	SDL_SetColorKey(menu, SDL_SRCCOLORKEY, SDL_MapRGB(menu->format, 255, 255, 255));
	SDL_SetColorKey(cursormenu, SDL_SRCCOLORKEY, SDL_MapRGB(cursormenu->format, 255, 255, 255));
	erlaubte_tiles_festlegen();
	load_tiles();
	int auswahl=auswahlmenu();
	sprintf(dateiname,"%d",auswahl);
	rgb_color[0]=0;
	rgb_color[1]=0;
	rgb_color[2]=0;
	for(int zaehlx=0; zaehlx<=203; zaehlx++)
		if(erlaubte_tiles[zaehlx])
			SDL_SetColorKey(t[zaehlx], SDL_SRCCOLORKEY, SDL_MapRGB(t[zaehlx]->format, 255, 255, 255));
	SDL_SetColorKey(rahmen, SDL_SRCCOLORKEY, SDL_MapRGB(rahmen->format, 255, 255, 255));
	int lk=0;
	int bk=0;	
	for(int x=0; x<=203;x++)
	{
		if(erlaubte_tiles[x])
		{
			lk++;
			if(lk==31)
			{
				lk=0;
				bk++;
			}
			tileart[bk][lk]=x;
		}	
	}
	map_laden();
}

void erlaubte_tiles_festlegen()
{
	for(int zaehlx=0; zaehlx<=203; zaehlx++)erlaubte_tiles[zaehlx]=false;
	for(zaehlx=0;zaehlx<=17;zaehlx++)erlaubte_tiles[zaehlx]=true;
	erlaubte_tiles[21]=true;
	for(zaehlx=23;zaehlx<=28;zaehlx++)erlaubte_tiles[zaehlx]=true;
	for(zaehlx=61;zaehlx<=87;zaehlx++)erlaubte_tiles[zaehlx]=true;
	erlaubte_tiles[200]=true;
	erlaubte_tiles[201]=true;
	erlaubte_tiles[202]=true;
	erlaubte_tiles[203]=true;
	erlaubte_tiles[150]=true;
	erlaubte_tiles[152]=true;
	erlaubte_tiles[154]=true;
	erlaubte_tiles[156]=true;
	erlaubte_tiles[158]=true;
	erlaubte_tiles[160]=true;
	erlaubte_tiles[162]=true;
	erlaubte_tiles[165]=true;
	
	
	erlaubte_tiles[40]=true;
	erlaubte_tiles[41]=true;
	for(zaehlx=29;zaehlx<=37;zaehlx++)erlaubte_tiles[zaehlx]=true;
		
}

void load_tiles()
{
	char dateinamestr[9];
	int tile=0;
	while(tile<=203)
	{	
		sprintf(dateinamestr,"%d",tile );
		strcat(dateinamestr,".bmp");

		if(erlaubte_tiles[tile]==true)t[tile] = SDL_LoadBMP(dateinamestr);
		tile++;
	}
	cursor = SDL_LoadBMP("cursor.bmp");
}

void show_helpwindow()
{
	bool closed=false;
	while(!closed)
	{
		while(SDL_PollEvent(&event)) 
		{
			switch(event.type) 
			{
				case SDL_KEYDOWN:
					switch(event.key.keysym.sym) 
					{
						case SDLK_RETURN:
							closed=true;
						break;	
						default:
						break;
					}	
				break;	
			}
		}
		Slock(screen);
		for(int xzeichne=10; xzeichne<=310; xzeichne++)
			for(int yzeichne=10; yzeichne<=230; yzeichne++) 
				DrawPixel(screen,xzeichne,yzeichne, 192, 192, 192);
		Sulock(screen);
		SFont_Write(screen, Font,25,25,"Helpscreen");		
		SFont_Write(screen, Font,25,50,"[L]	Reload level from file");		
		SFont_Write(screen, Font,25,60,"[S]	Save level to file");
		SFont_Write(screen, Font,25,70,"[N]	Delete all tiles in Level");
		SFont_Write(screen, Font,25,80,"[ESC]	Quit Leveleditor");
		SFont_Write(screen, Font,25,90,"[F2]	Change color of grid / turn grid on or off");
		SFont_Write(screen, Font,25,100,"[,] / [.]	Scroll Level left and right");
		SFont_Write(screen, Font,25,110,"[PGUP] / [PGDOWN]	select tile");
		SFont_Write(screen, Font,25,120,"[SPACE]	put tile");
		SFont_Write(screen, Font,25,130,"[NUM7] / [NUM1]	change R-value for backgroundc.");
		SFont_Write(screen, Font,25,140,"[NUM8] / [NUM2]	change G-value for backgroundc.");
		SFont_Write(screen, Font,25,150,"[NUM9] / [NUM3]	change B-value for backgroundc.");
		SFont_Write(screen, Font,25,160,"[CURSORKEYS]	move tilecursor");
		SFont_Write(screen, Font,25,170,"[1]..[4]	Place cloud with length 1..4");
		    
		SFont_Write(screen, Font,130,215,"Press [ENTER]");		
		SDL_Flip(screen);
	}
}

bool show_escape_screen(bool levelmodified)
{
	bool closed=false;
	int auswahl=0;
	if(levelmodified)
	{
		while(!closed)
		{
			while(SDL_PollEvent(&event)) 
			{
				switch(event.type) 
				{
					case SDL_KEYDOWN:
						switch(event.key.keysym.sym) 
						{
							case SDLK_RETURN:
								closed=true;
							break;
							case SDLK_UP:
								if(auswahl!=0)auswahl--;	
							break;
							case SDLK_DOWN:
								if(auswahl!=2)auswahl++;
							break;	
						
							default:
							break;
						}	
					break;	
				}
			}
			Slock(screen);
			for(int xzeichne=40; xzeichne<=320-40; xzeichne++)
				for(int yzeichne=60; yzeichne<=240-60; yzeichne++) 
					DrawPixel(screen,xzeichne,yzeichne, 192, 192, 192);
			Sulock(screen);
			SFont_Write(screen, Font,45,70,"Level not saved! Save before quit?");	
			SFont_Write(screen, Font,75,103,"Yes");			
			SFont_Write(screen, Font,75,123,"No");
			SFont_Write(screen, Font,75,143,"Cancel");			
			if(auswahl==0)DrawIMG(rahmen, 43,98);
			if(auswahl==1)DrawIMG(rahmen, 43,118);
			if(auswahl==2)DrawIMG(rahmen, 43,138);
		
			DrawIMG(t[2],45,100);	
			DrawIMG(t[2],45,120);
			DrawIMG(t[2],45,140);	
			
			SDL_Flip(screen);
		}
	}
	else
		return true;
	 
	if(auswahl==2)return false;
	if(auswahl==1)return true;
	if(auswahl==0)
	{
		map_abspeichern();
		return true;
	}	
}

bool show_loadorsave_screen(bool levelmodified, int type)
{
	bool closed=false;
	int auswahl=0;
	if(levelmodified)
	{
		while(!closed)
		{
			while(SDL_PollEvent(&event)) 
			{
				switch(event.type) 
				{
					case SDL_KEYDOWN:
						switch(event.key.keysym.sym) 
						{
							case SDLK_RETURN:
								closed=true;
							break;
							case SDLK_UP:
								if(auswahl!=0)auswahl--;	
							break;
							case SDLK_DOWN:
								if(auswahl!=1)auswahl++;
							break;	
						
							default:
							break;
						}	
					break;	
				}
			}
			Slock(screen);
			for(int xzeichne=40; xzeichne<=320-30; xzeichne++)
				for(int yzeichne=60; yzeichne<=240-60; yzeichne++) 
					DrawPixel(screen,xzeichne,yzeichne, 192, 192, 192);
			Sulock(screen);
			if(type==SAVEDIALOG)
			{
				SFont_Write(screen, Font,45,70,"Level modified! Save changes?");	
				SFont_Write(screen, Font,75,103,"Yes");			
				SFont_Write(screen, Font,75,123,"No");
			}
			if(type==LOADDIALOG)
			{
				SFont_Write(screen, Font,45,70,"Level modified! Really reload it from disk?");	
				SFont_Write(screen, Font,75,103,"Yes");			
				SFont_Write(screen, Font,75,123,"No");	
			}
			if(auswahl==0)DrawIMG(rahmen, 43,98);
			if(auswahl==1)DrawIMG(rahmen, 43,118);
		
			DrawIMG(t[2],45,100);	
			DrawIMG(t[2],45,120);
			
			SDL_Flip(screen);
		}
	}
	else
	{
		if(type==SAVEDIALOG)map_abspeichern();
		if(type==LOADDIALOG)map_laden();
		return true;
	}	
	
	if(auswahl==1)return false;
	if(auswahl==0)
	{
		if(type==SAVEDIALOG)map_abspeichern();
		if(type==LOADDIALOG)map_laden();
		return true;
	}	
}



int main( int argc, char* argv[] ) 
{ 
	bool levelmodified=false;
	init_editor();
	int gittercolor=0;
	Uint8 *keystate;
	int mx=0,my=0;
	bool mousepush=false;
	bool closed=false;
	while(!closed) 
	{
		while(SDL_PollEvent(&event)) 
		{
			switch(event.type) 
			{
				case SDL_MOUSEMOTION:
					mx=event.motion.x;
					my=event.motion.y;
				break;
				case SDL_MOUSEBUTTONDOWN:
					mousepush=true;
				break;	
				case SDL_MOUSEBUTTONUP:
					mousepush=false;
				break;
				
				case SDL_KEYDOWN:
					switch(event.key.keysym.sym) 
					{
						case SDLK_ESCAPE:
							if(show_escape_screen(levelmodified))closed=true;
						break;

						case SDLK_s:
							if(show_loadorsave_screen(levelmodified,SAVEDIALOG))levelmodified=false;
						break;

						case SDLK_l:
							if(show_loadorsave_screen(levelmodified,LOADDIALOG))levelmodified=false;
						break;

						case SDLK_n:
							map_neu();
							levelmodified=true;
						break;
						
						case SDLK_F1:
							show_helpwindow();
						break;	
						
						case SDLK_F2:
							if(gittercolor==255)
							{
								gittercolor=0;
								break;
							}
							else
							{
								if(gittercolor==0)
								{
									gittercolor=99;
									break;
								}
								else
									gittercolor=255;
							}	
						break;
						
						default:
						break;
					}

				break;
				case SDL_QUIT:
					closed = true;
				break;
			}
		}
		keystate = SDL_GetKeyState(0);

		if(keystate[SDLK_1])
		{	
			if(my<=200)
			{
				int wolkez=my/16;
				int wolkes=mx/16;
				leveldat[wolkez][wolkes+a]=76;	
				leveldat[wolkez][wolkes+1+a]=78;
				leveldat[wolkez+1][wolkes+a]=73;	
				leveldat[wolkez+1][wolkes+1+a]=75;
				levelmodified=true;
			}
		}	
		
		if(keystate[SDLK_2])
		{	
			if(my<=200)
			{
				int wolkez=my/16;
				int wolkes=mx/16;
				leveldat[wolkez][wolkes+a]=76;	
				leveldat[wolkez][wolkes+1+a]=77;
				leveldat[wolkez][wolkes+2+a]=78;
				leveldat[wolkez+1][wolkes+a]=73;	
				leveldat[wolkez+1][wolkes+1+a]=74;
				leveldat[wolkez+1][wolkes+2+a]=75;
				levelmodified=true;
			}
		}
		
		if(keystate[SDLK_3])
		{	
			if(my<=200)
			{
				int wolkez=my/16;
				int wolkes=mx/16;
				leveldat[wolkez][wolkes+a]=76;	
				leveldat[wolkez][wolkes+1+a]=77;
				leveldat[wolkez][wolkes+2+a]=77;
				leveldat[wolkez][wolkes+3+a]=78;
				leveldat[wolkez+1][wolkes+a]=73;	
				leveldat[wolkez+1][wolkes+1+a]=74;
				leveldat[wolkez+1][wolkes+2+a]=74;
				leveldat[wolkez+1][wolkes+3+a]=75;
				levelmodified=true;
			}
		}
		
		if(keystate[SDLK_4])
		{	
			if(my<=200)
			{
				int wolkez=my/16;
				int wolkes=mx/16;
				leveldat[wolkez][wolkes+a]=76;	
				leveldat[wolkez][wolkes+1+a]=77;
				leveldat[wolkez][wolkes+2+a]=77;
				leveldat[wolkez][wolkes+3+a]=77;
				leveldat[wolkez][wolkes+4+a]=78;
				leveldat[wolkez+1][wolkes+a]=73;	
				leveldat[wolkez+1][wolkes+1+a]=74;
				leveldat[wolkez+1][wolkes+2+a]=74;
				leveldat[wolkez+1][wolkes+3+a]=74;
				leveldat[wolkez+1][wolkes+4+a]=75;
				levelmodified=true;
			}
		}
		
		if(keystate[SDLK_KP7])
		{	
			if(rgb_color[0]!=255)rgb_color[0]++;
			levelmodified=true;
		}
		if(keystate[SDLK_KP1])
		{	
			if(rgb_color[0]!=0)rgb_color[0]--;
			levelmodified=true;				
		}
		if(keystate[SDLK_KP8])
		{	
			if(rgb_color[1]!=255)rgb_color[1]++;
			levelmodified=true;	
		}		
		if(keystate[SDLK_KP2])
		{	
			if(rgb_color[1]!=0)rgb_color[1]--;
			levelmodified=true;	
		}		
		if(keystate[SDLK_KP9])
		{
			if(rgb_color[2]!=255)rgb_color[2]++;
			levelmodified=true;	
		}		
		if(keystate[SDLK_KP3])
		{	
			if(rgb_color[2]!=0)rgb_color[2]--;
			levelmodified=true;	
		}		
		if (keystate[SDLK_LEFT])
		{
			if(a!=0)
			{
				a--;
				b--;
			}
			SDL_Delay(30);
		}
		if (keystate[SDLK_RIGHT])
		{
			if(b!=399)
			{
				a++;
				b++;
			}
			SDL_Delay(30);
		}
		if (keystate[SDLK_SPACE])
		{	
			leveldat[cursorzeile][cursorspalte+a]=tileindex;	
			levelmodified=true;
		}
		if (keystate[SDLK_COMMA])
		{
			if(a!=0)
			{
				a--;
				b--;
			}
			SDL_Delay(30);
		}
		if (keystate[SDLK_PERIOD]) 
		{
			if(b!=399)
			{
				a++;
				b++;
			}
			SDL_Delay(30);
		}
		if(mousepush)
		{
			int tilezeile=0;
			int tilespalte=0;
			if(my<200)
			{
				cursorzeile=my/16;
				cursorspalte=mx/16;
				leveldat[cursorzeile][cursorspalte+a]=tileindex;	
				levelmodified=true;
			}
			if(my>=250 && my<=310)
			{
				if(my>=250 && my<270)tilezeile=0;
				if(my>=270 && my<290)tilezeile=1;
				if(my>=290 && my<310)tilezeile=2;
				tilespalte=mx/20;
				tileindex=tileart[tilezeile][tilespalte];
			}
		}

		hintergrundfarbe = SDL_MapRGB(screen->format, rgb_color[0], rgb_color[1], rgb_color[2]);
		SDL_FillRect(screen, 0, hintergrundfarbe);
		zeichnefeld();
		if(gittercolor!=99)zeichnegitter(gittercolor);
		zeichne_statusleiste();
		SDL_Flip(screen);
	}
	SDL_Quit();
	SFont_FreeFont(Font);
	return(0); 
} 


void DrawIMG(SDL_Surface *img, int x, int y) 
{ 
	SDL_Rect dest; 
	dest.x = x; 
	dest.y = y; 
	SDL_BlitSurface(img, NULL, screen, &dest); 
  
} 

void DrawPixel(SDL_Surface *screen, int x, int y, Uint8 R, Uint8 G, Uint8 B)
{
	Uint32 color = SDL_MapRGB(screen->format, R, G, B);
  
	Uint8 *bufp;
    bufp = (Uint8 *)screen->pixels + y*screen->pitch + x;
    *bufp = color;
  
}

void Slock(SDL_Surface *screen)
{
  if ( SDL_MUSTLOCK(screen) )
  {
    if ( SDL_LockSurface(screen) < 0 )
    {
      return;
    }
  }
}

void Sulock(SDL_Surface *screen)
{
  if ( SDL_MUSTLOCK(screen) )
  {
    SDL_UnlockSurface(screen);
  }
}