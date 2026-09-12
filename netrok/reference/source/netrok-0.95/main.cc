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
#include "loadfiles.h"
#include "gameinitialize.h"
#include "graphicengine.h"
#include "collisiondetect.h"
#include "scrolling.h"
#include "putsprites.h"
#include "specialblockhandling.h"
#include "kortenhandling.h"
#include "menu.h"

using namespace std;

SDL_Surface *back; 
SDL_Surface *image; 
SDL_Surface *screen; 
SDL_Surface *t[100];
SDL_Surface *fig[180];
unsigned short int leveldat[32][13][400];
Uint32 starttime,stoptime;
SDL_Joystick *joystick;
SDL_Event event;
SFont_Font* Font;
Uint8 *keystate;
Mix_Music *music = NULL;
Mix_Music *music1 = NULL;
Mix_Music *music2 = NULL;
Mix_Music *music3 = NULL;
Mix_Music *music4 = NULL;
Mix_Music *music5 = NULL;
Mix_Music *music6 = NULL;
Mix_Music *music7 = NULL;
Mix_Chunk *snd_absprung = NULL;
Mix_Chunk *snd_andecke = NULL;
Mix_Chunk *snd_kanoneabschiess = NULL;
Mix_Chunk *snd_enemykill_ver = NULL;
Mix_Chunk *snd_enemykill_hor = NULL;
Mix_Chunk *snd_coins = NULL;
Mix_Chunk *snd_timeleft = NULL;
Mix_Chunk *snd_treffer = NULL;
Mix_Chunk *snd_tot = NULL;
Mix_Chunk *snd_gameover = NULL;
Mix_Chunk *snd_levelfinish = NULL;
Mix_Chunk *snd_gamefinish = NULL;
Mix_Chunk *snd_timeabzaehl = NULL;
Mix_Chunk *snd_newhighscore = NULL;
Mix_Chunk *snd_kran = NULL;
Mix_Chunk *snd_button = NULL;
Mix_Chunk *snd_fahne = NULL;
Mix_Chunk *snd_boss_tot = NULL;

void starttiming()
{
	starttime=SDL_GetTicks();
	stoptime=0;	
}

void endtiming(int wartezeit)
{
	do
	{
		stoptime=SDL_GetTicks();
	}
	while((stoptime-starttime)<=wartezeit);
}

void init_audio()
{
	int audio_rate = 22050;
	Uint16 audio_format = AUDIO_S16; /* 16-bit stereo */
	int audio_channels = 2;
	int audio_buffers = 4096;
	if(Mix_OpenAudio(audio_rate, audio_format, audio_channels, audio_buffers)) 
	{
		printf("Unable to open audio!\n");
		exit(1);
	}
	Mix_QuerySpec(&audio_rate, &audio_format, &audio_channels);
	music = Mix_LoadMUS("musik1.mid");
	music2 = Mix_LoadMUS("musik2.mid");
	music3 = Mix_LoadMUS("musik3.mid");
	music4 = Mix_LoadMUS("musik4.mid");
	music5 = Mix_LoadMUS("musik5.mid");
	music6 = Mix_LoadMUS("musik6.mid");
	music7 = Mix_LoadMUS("musik7.mid");
	
	snd_absprung  = Mix_LoadWAV("sprung.wav");
	snd_enemykill_hor = Mix_LoadWAV("punch.wav");
	snd_enemykill_ver = Mix_LoadWAV("punch2.wav");
	snd_andecke = Mix_LoadWAV("andecke.wav");			
	snd_kanoneabschiess = Mix_LoadWAV("kanone.wav");
	snd_coins = Mix_LoadWAV("coins.wav");
	snd_timeleft = Mix_LoadWAV("TIC_TOC.wav");
	snd_treffer = Mix_LoadWAV("treffer.wav");
	snd_tot = Mix_LoadWAV("tot.wav");				
	snd_gameover = Mix_LoadWAV("gameover.wav");		
	snd_levelfinish = Mix_LoadWAV("levelfinish.wav");
	snd_gamefinish = Mix_LoadWAV("gamefinish.wav");
	snd_timeabzaehl = Mix_LoadWAV("boing.wav");
	snd_fahne = snd_timeabzaehl;
	snd_newhighscore = Mix_LoadWAV("highscore.wav");
	snd_kran = Mix_LoadWAV("kran.wav");
	snd_button = Mix_LoadWAV("button.wav");
//	snd_fahne = Mix_LoadWAV("boing.wav");			
	snd_boss_tot = Mix_LoadWAV("boss_tot.wav"); 	
}
 
int main( int argc, char* argv[] ) 
{ 
	player Spieler;
	platform Plattformen;
	fallender_stein Steine1;
	kanone Kanonen;
	enemy Enemies;
	kugel Kugeln;
	char aktueller_dateiname[13];
	
	Game_Init();
	Font = SFont_InitFont(SDL_LoadBMP("font2.bmp"));
	if(!Font) 
	{
		fprintf(stderr, "An error occured while loading the font.");
		exit(1);
	}
	startinitialisierungen(Spieler, Kanonen, Kugeln, Enemies, Plattformen);

	loesche_steinzustaende(Steine1);
	srand((unsigned) time(NULL));	

	int auswahl;
	Spieler.game_runs=0;
	
	init_audio();
	
	while(auswahl!=3)
	{
	
	startinitialisierungen(Spieler, Kanonen, Kugeln, Enemies, Plattformen);	
	auswahl=menu(Spieler);
	
	if(auswahl==0)
	{
		Spieler.game_runs=1;
		Mix_PlayMusic(music, -1);
	}	
	
	while(Spieler.game_runs==1 && auswahl==0) 
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		Enemies.zaehler++;
		if(Enemies.zaehler==50)
		{
			Enemies.zaehler=0;
			Spieler.timeleft--;
			if(Spieler.timeleft<=0)Spieler.korten_tot=true;
			sprintf(Spieler.timeleftchar,"%d",Spieler.timeleft);
		}	
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		if(Spieler.treppenzaehler>=40)Spieler.treppenzaehler=0;
		Spieler.korten_auf_plattform_nr=99;
		kollisionserkennungen_einmal_durchnehmen(Spieler);
		Spieler.korten_auf_plattform_nr=check_korten_plattform(Spieler, Plattformen);
		if(Spieler.korten_auf_plattform_nr!=99)Spieler.berechtigt_runter=false;	
		bewege_plattformen(Plattformen);
		if(Spieler.korten_auf_plattform_nr!=99)move_korten_with_plattform(Spieler, Plattformen);	
				
		if((Spieler.keylinks || Spieler.joylinks)&& Spieler.korten_beschleunigung>=-24 && !Spieler.festhalten_an_treppe)
		{
			Spieler.korten_beschleunigung=Spieler.korten_beschleunigung-2;
			if(!Spieler.berechtigt_runter)Spieler.kortenaussehen=KORTENAUSSEHEN_LINKS;
			Spieler.kortenaussehen_unabhaengig=KORTENAUSSEHEN_LINKS;
		}
		if((Spieler.keyrechts || Spieler.joyrechts)&& Spieler.korten_beschleunigung<=24 && !Spieler.festhalten_an_treppe)
		{
			Spieler.korten_beschleunigung=Spieler.korten_beschleunigung+2;
			if(!Spieler.berechtigt_runter)Spieler.kortenaussehen=KORTENAUSSEHEN_RECHTS;
			Spieler.kortenaussehen_unabhaengig=KORTENAUSSEHEN_RECHTS;
		}
		check_kanonen_enemies(Kanonen, Spieler, Enemies); 
		
		Spieler.auf_treppe=check_korten_treppe(Spieler);
		if(!Spieler.auf_treppe)Spieler.festhalten_an_treppe=false; 
		if((Spieler.keyhoch || Spieler.joyhoch) && Spieler.auf_treppe)Spieler.festhalten_an_treppe=true;
		if((Spieler.keyrunter || Spieler.joyrunter) && Spieler.auf_treppe)Spieler.festhalten_an_treppe=true;
		korten_auf_treppe_bewegen(Spieler);
		
		if((Spieler.keyrunter || Spieler.joyrunter)&& check_korten_kanone(Spieler))
		{
			korten_mit_kanone_abschiessen(Spieler, Plattformen, Steine1, Enemies, Kugeln, Kanonen);
		}
		
		acceleration_speed(Spieler);
				
		if((Spieler.keylctrl || Spieler.joybt1)&& Spieler.korten_beschleunigung > 24 && !Spieler.festhalten_an_treppe && 
			Spieler.zug_phase!=2 && Spieler.zug_phase!=3)
			if(!Spieler.berechtigt_runter)
				Spieler.korten_geschwindigkeit=4;
		
		if((Spieler.keylctrl || Spieler.joybt1)&& Spieler.korten_beschleunigung < -24 && !Spieler.festhalten_an_treppe &&
			Spieler.zug_phase!=2 && Spieler.zug_phase!=3)
			if(!Spieler.berechtigt_runter)
				Spieler.korten_geschwindigkeit=-4;
		
		Spieler.korten_x=Spieler.scrollwert+144;
		if(Spieler.scrollwert<0)Spieler.scrollwert=1;
		
		if(!Spieler.berechtigt_rechts && Spieler.korten_beschleunigung > 0)
			Spieler.korten_beschleunigung=0;
		if(!Spieler.berechtigt_links && Spieler.korten_beschleunigung < 0)
			Spieler.korten_beschleunigung=0;
		
		if(Spieler.berechtigt_runter && Spieler.sprungzaehler==0 && !Spieler.festhalten_an_treppe && Spieler.zug_phase!=2 &&
			Spieler.zug_phase!=3)
			korten_faellt_runter(Spieler, Plattformen);
		if(!Spieler.berechtigt_hoch && Spieler.sprungzaehler>0)Mix_PlayChannel(-1, snd_andecke, 0);
		if(!Spieler.berechtigt_hoch) Spieler.sprungzaehler=0;
		
		if(Spieler.sprungzaehler != 0)
			korten_springt(Spieler);
		
		if(Spieler.sprungzaehler==0 && Spieler.berechtigt_runter)
		{
			if(Spieler.runterfall_zaehler==0)Spieler.runterfall_zaehler=1;
			Spieler.runterfall_zaehler++;
		}
		if(!Spieler.berechtigt_runter)Spieler.runterfall_zaehler=0;

		korten_runterfall_geschwindigkeit(Spieler);
		
		korten_horizontal_bewegen(Spieler);				
		
		if(Spieler.korten_geschwindigkeit>=0)Spieler.richtung=RECHTS;
		if(Spieler.korten_geschwindigkeit<0)Spieler.richtung=LINKS;
		if(Spieler.sprungzaehler > 0)Spieler.max_hoeherspringen++;
		
		maxsprunghoehe(Spieler);		

		if(Spieler.keybt2 || Spieler.joybt2)
		{
			if(Spieler.sprungzaehler > 0 && Spieler.max_hoeherspringen < Spieler.max_sprung_hoehe 
				&& !Spieler.festhalten_an_treppe)
			Spieler.sprungzaehler++;
		}			
				
		if(Spieler.max_hoeherspringen==24 && !Spieler.berechtigt_runter)
			Spieler.max_hoeherspringen=0;
		if(!Spieler.berechtigt_runter)
			Spieler.max_hoeherspringen=0;
		
		if(Spieler.position_upgradebutton>0 && Spieler.position_upgradebutton<15 )upgradebutton_darstellen(Spieler);
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		if(Spieler.fahnenposition_spalte!=0)fahne_darstellen(Spieler);
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		if(Spieler.korten_beschleunigung!=0)Spieler.zaehler++;
		if(Spieler.korten_auf_plattform_nr!=99 && Spieler.korten_beschleunigung==0)Spieler.zaehler=9;
			
		enemies_bewegen(Spieler, Enemies, Steine1, Plattformen, Kanonen, Kugeln);
		korten_darstellen(Spieler);
			
		if(Spieler.zaehler==30)Spieler.zaehler=0;

		while(SDL_PollEvent(&event)) 
		{
			switch(event.type) 
			{
				case SDL_KEYDOWN:
					switch(event.key.keysym.sym) 
					{
						case SDLK_ESCAPE:
							Spieler.game_runs = 0; 
							Spieler.korten_tot=true;
							Spieler.leben=0;
							break;
						case SDLK_END:
							if(Spieler.sprungzaehler == 0 && !Spieler.berechtigt_runter && !Spieler.festhalten_an_treppe)
								Spieler.sprungzaehler = 8;
							Spieler.keybt2=true;
							Mix_PlayChannel(-1, snd_absprung, 0);
							break;
						case SDLK_PAGEDOWN:
							Spieler.keylctrl=true;
							break;	
						case SDLK_UP:
							Spieler.keyhoch=true;
							break;
						case SDLK_DOWN:
							Spieler.keyrunter=true;
							break;
						case SDLK_LEFT:
							Spieler.keylinks=true;
							break;
						case SDLK_RIGHT:
							Spieler.keyrechts=true;
							break;							
						case SDLK_KP4:
							schilde_ummodulieren(Spieler, LINKS);							
							break;
						case SDLK_KP8:
							schilde_ummodulieren(Spieler, HOCH);					
							break;
						case SDLK_KP6:
							schilde_ummodulieren(Spieler, RECHTS);
							break;
						case SDLK_HOME:
							if(!Spieler.fahne_gesetzt)setze_fahne(Spieler);
							Mix_PlayChannel(-1, snd_fahne, 0);	
							break;	
						case SDLK_KP2:
							schilde_ummodulieren(Spieler, RUNTER);
							break;
						case SDL_JOYAXISMOTION: 
							if((event.jaxis.value < -1) || (event.jaxis.value > 1)) 
							{
								if(event.jaxis.axis==0) 
								{
									   Spieler.joylinks=true;
								}
								if(event.jaxis.axis==1) 
								{
									    /* Up-Down movement code goes here */
								}
							}
							break;
						case SDL_JOYBUTTONDOWN: 
							if(event.jbutton.button==0) 
								Spieler.joybt1=true;
							if(event.jbutton.button==1)
							{	
								if(Spieler.sprungzaehler == 0 && !Spieler.berechtigt_runter && !Spieler.festhalten_an_treppe)
									Spieler.sprungzaehler = 8;
								Spieler.joybt2=true;
							}	
							break;	
						default:
							break;
					}
					break;
				case SDL_KEYUP:
					switch(event.key.keysym.sym) 
					{	
						case SDLK_END:
							Spieler.keybt2=false;
						break;
						case SDLK_PAGEDOWN:
							Spieler.keylctrl=false;
							break;	
						case SDLK_UP:
							Spieler.keyhoch=false;
							break;
						case SDLK_DOWN:
							Spieler.keyrunter=false;
							break;
						case SDLK_LEFT:
							Spieler.keylinks=false;
							break;
						case SDLK_RIGHT:
							Spieler.keyrechts=false;
							break;		
						case SDL_JOYBUTTONDOWN: 
							if(event.jbutton.button==0) 
								Spieler.joybt1=false;
							if(event.jbutton.button==1)
								Spieler.joybt2=false;
							break;
						default:
							break;
					}
					break;
			
 				case SDL_QUIT:
					Spieler.game_runs = 0;
				break;
			}
		}
		if(Spieler.fahne_gesetzt && (Spieler.fahnenposition_y!=Spieler.fahnenposition_zeile*16))Spieler.fahnenposition_y++;	
		check_korten_fallender_stein(Spieler, Steine1);	
		steine_fallen_lassen(Steine1, Spieler.level, Spieler.scrollwert);
		
 		for(int zaehler=0; zaehler<=49; zaehler++)Kanonen.timer[zaehler]--;
 		kugeln_bewegen(Kanonen, Spieler, Kugeln);
		
		if(check_korten_upgradebutton(Spieler) && !Spieler.berechtigt_runter)
		{
			Mix_PlayChannel(-1, snd_button, 0);
			korten_upgraden(Spieler);
		}	
		lastdrawtiles_darstellen(Spieler);
		if(Spieler.zug_phase>0)bewege_zug(Spieler);
		
		statusleiste_darstellen(Spieler);
		
		
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);
		
		korten_coin_einsammel(Spieler);

		Spieler.scrollwertsave_fuer_korten=Spieler.scrollwert;

		if(!Spieler.berechtigt_runter &&Spieler.korten_beschleunigung>0)
			Spieler.korten_beschleunigung--;
		if(!Spieler.berechtigt_runter &&Spieler.korten_beschleunigung<0)
			Spieler.korten_beschleunigung++;
		
		if(Spieler.berechtigt_runter && Spieler.korten_beschleunigung>0 && Spieler.unverwundbarkeits_zaehler<10)
			Spieler.korten_beschleunigung--;
		if(Spieler.berechtigt_runter && Spieler.korten_beschleunigung<0 && Spieler.unverwundbarkeits_zaehler<10)
			Spieler.korten_beschleunigung++;
		

		if(gefaehrliche_zacken(Spieler.berechtigt_runter,Spieler.korten_x,Spieler.korten_y, Spieler.level))
			Spieler.korten_tot=true;
		if(Spieler.timeleft<40)Mix_PlayChannel(-1, snd_timeleft, -1);
		
		if(Spieler.korten_y>174 || Spieler.korten_tot) 
		{
			Mix_HaltChannel(-1);
			Mix_FadeOutMusic(3000);
			Mix_PlayChannel(-1, snd_tot, 0);
			korten_tot(Spieler, Plattformen, Steine1, Kanonen, Kugeln, aktueller_dateiname, Enemies);
			if(Spieler.leben==-1)
			{
				gameover(Spieler);
				Spieler.game_runs=0;
			}	
			if(Spieler.leben!=-1)
			{
				if(liednumber(Spieler.level)==1)Mix_PlayMusic(music, -1);
				if(liednumber(Spieler.level)==2)Mix_PlayMusic(music2, -1);
				if(liednumber(Spieler.level)==3)Mix_PlayMusic(music3, -1);
				if(liednumber(Spieler.level)==4)Mix_PlayMusic(music4, -1);
				if(liednumber(Spieler.level)==5)Mix_PlayMusic(music5, -1);
				if(liednumber(Spieler.level)==6)Mix_PlayMusic(music6, -1);
				if(liednumber(Spieler.level)==7)Mix_PlayMusic(music7, -1);
			}
		}	

		if(!Spieler.berechtigt_runter && leveldat[Spieler.level][(Spieler.korten_y+16+10)/16][(Spieler.scrollwert+144+8)/16]==9)
		{
			Mix_HaltChannel(-1);
			Mix_FadeOutMusic(3000);
			Mix_PlayChannel(-1, snd_levelfinish, 0);
			level_finished(Spieler, Plattformen, Steine1, Kanonen, Kugeln, Enemies);
			if(liednumber(Spieler.level)==1)Mix_PlayMusic(music, -1);
			if(liednumber(Spieler.level)==2)Mix_PlayMusic(music2, -1);
			if(liednumber(Spieler.level)==3)Mix_PlayMusic(music3, -1);
			if(liednumber(Spieler.level)==4)Mix_PlayMusic(music4, -1);
			if(liednumber(Spieler.level)==5)Mix_PlayMusic(music5, -1);
			if(liednumber(Spieler.level)==6)Mix_PlayMusic(music6, -1);
			if(liednumber(Spieler.level)==7)Mix_PlayMusic(music7, -1);
		}	
		
		if(Spieler.korten_geschwindigkeit==3 && !Spieler.berechtigt_runter)
			Spieler.korten_geschwindigkeit=2;
		if(Spieler.korten_geschwindigkeit==-3 && !Spieler.berechtigt_runter)
			Spieler.korten_geschwindigkeit=-2;
		if(Spieler.unverwundbarkeits_timer>0)Spieler.unverwundbarkeits_timer--;
		if(Spieler.oneupscore>=5000)
		{
			Spieler.oneupscore=0;
			Spieler.leben++;
			sprintf(Spieler.wert,"%d",Spieler.leben);
		}
		endtiming(10);
	}
	
	}
	
	Mix_CloseAudio();
	SDL_Quit();
	return(0); 
} 
