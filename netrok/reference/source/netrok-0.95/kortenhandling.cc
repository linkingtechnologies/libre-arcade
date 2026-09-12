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
#include "main.h"
#include "loadfiles.h"
#include "graphicengine.h"
#include "collisiondetect.h"
#include "scrolling.h"
#include "putsprites.h"
#include "specialblockhandling.h"
#include "kortenhandling.h"

using namespace std;

extern SDL_Surface *screen; 
extern SDL_Surface *t[100];
extern SDL_Surface *fig[180];
extern unsigned short int leveldat[32][13][400];
extern Uint32 starttime,stoptime;
extern Mix_Chunk *snd_coins;
extern Mix_Chunk *snd_kran;
extern Mix_Chunk *snd_kanoneabschiess;


void acceleration_speed(player &Spieler)
{
	if(Spieler.korten_beschleunigung==0)Spieler.korten_geschwindigkeit=0;
	if(Spieler.korten_beschleunigung>0 && Spieler.korten_beschleunigung <=6)
		Spieler.korten_geschwindigkeit=1;
	if(Spieler.korten_beschleunigung>6 && Spieler.korten_beschleunigung <=18)
		Spieler.korten_geschwindigkeit=1;
	if(Spieler.korten_beschleunigung>18 && Spieler.korten_beschleunigung <=24)
		Spieler.korten_geschwindigkeit=2;
	if(Spieler.korten_beschleunigung<0 && Spieler.korten_beschleunigung >=-6)
		Spieler.korten_geschwindigkeit=0;
	if(Spieler.korten_beschleunigung<-6 && Spieler.korten_beschleunigung >=-18)
		Spieler.korten_geschwindigkeit=-1;
	if(Spieler.korten_beschleunigung<-18 && Spieler.korten_beschleunigung >=-24)
		Spieler.korten_geschwindigkeit=-2;		
}

void level_hintergrundfarbe_einlesen(player &Spieler)
{
	Spieler.hintergrund_farbe=SDL_MapRGB(screen->format, leveldat[Spieler.level][0][0], leveldat[Spieler.level][0][1],
											leveldat[Spieler.level][0][2] );
	leveldat[Spieler.level][0][0]=0;
	leveldat[Spieler.level][0][1]=0;
	leveldat[Spieler.level][0][2]=0;
}

void startinitialisierungen(player &Spieler, kanone &Kanonen, kugel &Kugeln, enemy &Enemies, platform &Plattformen)
{
	char aktueller_dateiname[13];
	for(int zaehlx=1; zaehlx <= 20; zaehlx++)
	{
		sprintf(aktueller_dateiname,"%d",zaehlx);
		map_laden(aktueller_dateiname,zaehlx);
	}
	Plattformen.anzahl_plattformen_in_level=0;
	Spieler.oneupscore=0;
	Spieler.level=1;
	Spieler.zaehler=0;
	Spieler.scrollwert=0;
	Spieler.korten_y=10;
	Spieler.sprungzaehler=0;
	Spieler.runterfall_zaehler=0;
	Spieler.unverwundbarkeits_zaehler=0;
	Spieler.kortenaussehen=KORTENAUSSEHEN_RECHTS;
	Spieler.korten_beschleunigung=0;
	Spieler.korten_geschwindigkeit=0;
	Spieler.game_runs=1;
	Spieler.fall_geschwindigkeit=0;
	Spieler.sprung_geschwindigkeit;
	Spieler.position_zug=-230;
	Spieler.zug_phase=0;
	Spieler.coins=0;
	Spieler.scrollwertsave_fuer_korten=0;
	Spieler.berechtigt_hoch=true;
	Spieler.berechtigt_runter=true;
	Spieler.berechtigt_links=true;
	Spieler.berechtigt_rechts=true;
	Spieler.korten_tot=false;
	Spieler.max_sprung_hoehe=24;
	Spieler.auf_treppe=false;
	Spieler.festhalten_an_treppe=false;
	Spieler.treppenzaehler=0;
	Spieler.upgradetype=UPGRADE_NORMAL;
	Spieler.unverwundbarkeits_timer=0;
	Spieler.shield_selected=false;
	for(int zaehler=0; zaehler<=49; zaehler++)Kanonen.verwendet[zaehler]=false;
	for(int zaehler=0; zaehler<=299; zaehler++)Kugeln.verwendet[zaehler]=false;
	for(int zaehler=0; zaehler<25; zaehler++)Enemies.verwendet[zaehler]=false;
	for(int zaehler=0; zaehler<=12; zaehler++)
		for(int zaehler2=0; zaehler2<=399; zaehler2++)
			Spieler.collected_coins[zaehler][zaehler2]=false;
	
	Spieler.shield[HOCH]=1;
	Spieler.shield[RUNTER]=1;
	Spieler.shield[LINKS]=2;
	Spieler.shield[RECHTS]=2;
	Spieler.kortenaussehen_unabhaengig=RECHTS;
	Spieler.last_scrollwert_veraenderung=RECHTS;
	Spieler.fahnenposition_spalte=0;
	Spieler.fahnenposition_zeile=0;
	Spieler.fahnenposition_y=0;
	Spieler.fahne_gesetzt=false;
	Spieler.joylinks=false;
	Spieler.joyrechts=false;
	Spieler.joyhoch=false;
	Spieler.joyrunter=false;
	Spieler.keylinks=false;
	Spieler.keyrechts=false;
	Spieler.keyhoch=false;
	Spieler.keyrunter=false;
	Spieler.joybt1=false;
	Spieler.joybt2=false;
	Spieler.timeleft=200;
	Spieler.keylctrl=false;
	Spieler.score=0;
	Spieler.leben=5;
	Enemies.bosstreffer=3;
	level_hintergrundfarbe_einlesen(Spieler);
	Enemies.zaehler=0;	
	Spieler.score_aktuelle_stelle=0;
	sprintf(Spieler.wert,"%d",Spieler.leben);
	sprintf(Spieler.scorewert,"%d",Spieler.score);
	sprintf(Spieler.levelwert,"%d",Spieler.level);
	loesche_platformspeicher(Plattformen);
	checke_alle_plattformen_in_level(Plattformen, Spieler.level);
}

void korten_mit_kanone_abschiessen(player &Spieler, platform &Plattformen, fallender_stein &Steine1, enemy &Enemies, kugel &Kugeln,
							kanone &Kanonen)
{
	int korten_y_ziel=Spieler.korten_y+19;
	for(Spieler.korten_y;Spieler.korten_y<=korten_y_ziel;Spieler.korten_y++)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		Enemies.zaehler++;
		if(Enemies.zaehler==50)Enemies.zaehler=0;	
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		
		check_kanonen_enemies(Kanonen, Spieler, Enemies); 
		if(Spieler.fahnenposition_spalte!=0)fahne_darstellen(Spieler);
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		enemies_bewegen(Spieler, Enemies, Steine1, Plattformen, Kanonen, Kugeln);
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		bewege_plattformen(Plattformen);
		korten_darstellen(Spieler);
		steine_fallen_lassen(Steine1, Spieler.level, Spieler.scrollwert);
		kugeln_bewegen(Kanonen, Spieler, Kugeln);
		gr_kanone_neudarstellen(Spieler);
		if(Spieler.zug_phase>0)bewege_zug(Spieler);
		lastdrawtiles_darstellen(Spieler);	
		statusleiste_darstellen(Spieler);
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);   	
		endtiming(10);
	}
	korten_y_ziel=Spieler.korten_y-19;
	for(Spieler.korten_y;Spieler.korten_y>=korten_y_ziel;Spieler.korten_y--)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		check_kanonen_enemies(Kanonen, Spieler, Enemies); 
		if(Spieler.fahnenposition_spalte!=0)fahne_darstellen(Spieler);
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		enemies_bewegen(Spieler, Enemies, Steine1, Plattformen, Kanonen, Kugeln);
		korten_darstellen(Spieler);
		steine_fallen_lassen(Steine1, Spieler.level, Spieler.scrollwert);
		
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		bewege_plattformen(Plattformen);
		kugeln_bewegen(Kanonen, Spieler, Kugeln);
		gr_kanone_neudarstellen(Spieler);
		if(Spieler.zug_phase>0)bewege_zug(Spieler);
		lastdrawtiles_darstellen(Spieler);
		statusleiste_darstellen(Spieler);
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);   		
		endtiming(10);
	}
	Mix_PlayChannel(-1, snd_kanoneabschiess, 0);
	Spieler.sprungzaehler=80;	
	
}

void level_finished(player &Spieler, platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln, enemy &Enemies)
{
	Plattformen.anzahl_plattformen_in_level=0;
	loesche_platformspeicher(Plattformen);
	for(int z=0;z<25;z++)Enemies.verwendet[z]=false;
	Spieler.level++;
	Spieler.scrollwert=0;
	Spieler.korten_y=10;
	Spieler.zaehler=0;
	Spieler.korten_beschleunigung=0;
	Spieler.korten_geschwindigkeit=0;
	Spieler.sprungzaehler=0;
	Spieler.runterfall_zaehler=0;
	Spieler.unverwundbarkeits_zaehler=0;
	Spieler.kortenaussehen=KORTENAUSSEHEN_RECHTS;
	Spieler.kortenaussehen_unabhaengig=RECHTS;
	Spieler.korten_tot=false;	
	Spieler.auf_treppe=false;	
	Spieler.shield_selected=false;
	checke_alle_plattformen_in_level(Plattformen, Spieler.level);
	Spieler.fahnenposition_spalte=0;
	Spieler.fahnenposition_zeile=0;
	Spieler.fahne_gesetzt=false;
	Spieler.unverwundbarkeits_timer=0;
	loesche_steinzustaende(Steine1);
	Spieler.berechtigt_hoch=true;
	Spieler.berechtigt_runter=true;
	Spieler.berechtigt_links=true;
	Spieler.berechtigt_rechts=true;
	for(int zaehler=0; zaehler<=49; zaehler++)Kanonen.verwendet[zaehler]=false;
	for(int zaehler=0; zaehler<=299; zaehler++)Kugeln.verwendet[zaehler]=false;
	for(int zaehler=0; zaehler<=12; zaehler++)
		for(int zaehler2=0; zaehler2<=399; zaehler2++)
			Spieler.collected_coins[zaehler][zaehler2]=false;	
	srand((unsigned) time(NULL));
	level_hintergrundfarbe_einlesen(Spieler);	
	sprintf(Spieler.wert,"%d",Spieler.leben);
	zwischenlevel(Spieler);		
	Spieler.timeleft=200;	
	sprintf(Spieler.levelwert,"%d",Spieler.level);
	Spieler.joylinks=false;
	Spieler.joyrechts=false;
	Spieler.joyhoch=false;
	Spieler.joyrunter=false;
	Spieler.keylinks=false;
	Spieler.keyrechts=false;
	Spieler.keyhoch=false;
	Spieler.keyrunter=false;
	Spieler.joybt1=false;
	Spieler.joybt2=false;
	Spieler.keylctrl=false;
}

void korten_tot(player &Spieler, platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln, 
			char aktueller_dateiname[13], enemy &Enemies)
{
	for(int z=0;z<25;z++)Enemies.verwendet[z]=false;
	Spieler.kortenaussehen=KORTENAUSSEHEN_TOT;
	Spieler.unverwundbarkeits_timer=350;
	int endzaehl=Spieler.korten_y-65;
	for(Spieler.korten_y;Spieler.korten_y>=endzaehl;Spieler.korten_y-=2)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		
		SDL_Flip(screen);
		
		level_hintergrund_darstellen(Spieler);   
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		korten_darstellen(Spieler);
		lastdrawtiles_darstellen(Spieler);
		statusleiste_darstellen(Spieler);
		endtiming(10);
	}
	Spieler.kortenaussehen=KORTENAUSSEHEN_TOT2;
	for(Spieler.korten_y;Spieler.korten_y<=220;Spieler.korten_y+=2)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);   
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		korten_darstellen(Spieler);
		lastdrawtiles_darstellen(Spieler);
		statusleiste_darstellen(Spieler);
		endtiming(10);
	}
	Spieler.leben--;
	Spieler.score=Spieler.score-1000;
	sprintf(Spieler.scorewert,"%d",Spieler.score);
	Spieler.scrollwert=0;
	Spieler.korten_y=10;
			
	Spieler.zaehler=0;
	Spieler.sprungzaehler=0;
	Spieler.runterfall_zaehler=0;
	Spieler.kortenaussehen=KORTENAUSSEHEN_RECHTS;
	Spieler.kortenaussehen_unabhaengig=RECHTS;
	Spieler.last_scrollwert_veraenderung=RECHTS;
	Spieler.korten_tot=false;
	Spieler.auf_treppe=false;
	Spieler.upgradetype=UPGRADE_NORMAL;
	Spieler.shield[HOCH]=1;
	Spieler.shield[RUNTER]=1;
	Spieler.shield[LINKS]=2;
	Spieler.shield[RECHTS]=2;
	Spieler.shield_selected=false;
	Spieler.unverwundbarkeits_timer=0;		
	Spieler.position_zug=-230;
	Spieler.zug_phase=0;
	sprintf(aktueller_dateiname,"%d",Spieler.level);
	map_laden(aktueller_dateiname,Spieler.level);
	bereits_eingesammelte_coins_entfernen(Spieler);
	
	loesche_steinzustaende(Steine1);
	for(int zaehler=0; zaehler<=49; zaehler++)Kanonen.verwendet[zaehler]=false;
	for(int zaehler=0; zaehler<=299; zaehler++)Kugeln.verwendet[zaehler]=false;
				
	level_hintergrundfarbe_einlesen(Spieler);
	sprintf(Spieler.wert,"%d",Spieler.leben);
	if(Spieler.fahnenposition_zeile!=0 && Spieler.fahne_gesetzt)level_fade_in(Spieler, Plattformen, Steine1, Kanonen, Kugeln,Enemies);
	Spieler.timeleft=200;	
}

void level_fade_in(player &Spieler,platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln,enemy &Enemies)
{
	if(Spieler.leben!=-1)
	{
	Spieler.zug_phase=5;
	for(Spieler.scrollwert=Spieler.scrollwert;Spieler.scrollwert<=((Spieler.fahnenposition_spalte*16)-144);Spieler.scrollwert+=10)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		Spieler.unverwundbarkeits_timer=50;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		Enemies.zaehler++;
		Spieler.position_zug=Spieler.korten_y-190;
		if(Enemies.zaehler==50)Enemies.zaehler=0;	
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		
		check_kanonen_enemies(Kanonen, Spieler, Enemies); 
		if(Spieler.fahnenposition_spalte!=0)fahne_darstellen(Spieler);
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		enemies_bewegen(Spieler, Enemies, Steine1, Plattformen, Kanonen, Kugeln);
		
		
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		bewege_plattformen(Plattformen);
		
		DrawIMG(fig[100],144,Spieler.korten_y);
		
		steine_fallen_lassen(Steine1, Spieler.level, Spieler.scrollwert);
		kugeln_bewegen(Kanonen, Spieler, Kugeln);
		gr_kanone_neudarstellen(Spieler);
		lastdrawtiles_darstellen(Spieler);
		DrawIMG(fig[126],136,Spieler.position_zug);
		statusleiste_darstellen(Spieler);
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);   	
		endtiming(10);
	}

	for(Spieler.korten_y=Spieler.korten_y;Spieler.korten_y<=((Spieler.fahnenposition_zeile*16)-16);Spieler.korten_y+=2)
	{
		starttiming();
		Spieler.unverwundbarkeits_zaehler++;
		Spieler.unverwundbarkeits_timer=50;
		if(Spieler.unverwundbarkeits_zaehler==20)Spieler.unverwundbarkeits_zaehler=0;
		Enemies.zaehler++;
		if(Enemies.zaehler==50)Enemies.zaehler=0;	
		map_scrollen(Spieler,Spieler.unverwundbarkeits_zaehler);
		
		check_kanonen_enemies(Kanonen, Spieler, Enemies); 
		if(Spieler.fahnenposition_spalte!=0)fahne_darstellen(Spieler);
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		enemies_bewegen(Spieler, Enemies, Steine1, Plattformen, Kanonen, Kugeln);
		
		plattformen_darstellen(Plattformen, Spieler.scrollwert);
		bewege_plattformen(Plattformen);
		
		DrawIMG(fig[100],144,Spieler.korten_y);
		
		steine_fallen_lassen(Steine1, Spieler.level, Spieler.scrollwert);
		kugeln_bewegen(Kanonen, Spieler, Kugeln);
		gr_kanone_neudarstellen(Spieler);
		lastdrawtiles_darstellen(Spieler);
		Spieler.position_zug+=2;
		DrawIMG(fig[126],136,Spieler.position_zug);
		statusleiste_darstellen(Spieler);
		SDL_Flip(screen);
		level_hintergrund_darstellen(Spieler);   	
		endtiming(10);
	}
	Spieler.zug_phase=4;
	}
	Spieler.korten_beschleunigung=0;
	Spieler.korten_geschwindigkeit=0;
}

void schilde_ummodulieren(player &Spieler, int richtung)
{
	if(!Spieler.shield_selected)
	{
		Spieler.shield_selected=true;
		Spieler.primary_shield_selected=richtung;
		if(Spieler.shield[Spieler.primary_shield_selected]==0)Spieler.shield_selected=false;
	}
	else
	{
		Spieler.shield_selected=false;
		Spieler.secondary_shield_selected=richtung;
		if(Spieler.primary_shield_selected != Spieler.secondary_shield_selected &&
			Spieler.shield[Spieler.secondary_shield_selected]<2)
		{
			Spieler.shield[Spieler.primary_shield_selected]--;
			Spieler.shield[Spieler.secondary_shield_selected]++;
			Spieler.score=Spieler.score-10;
			sprintf(Spieler.scorewert,"%d",Spieler.score);
		}
	}	
}

void korten_auf_treppe_bewegen(player &Spieler)
{
	if((Spieler.keylinks || Spieler.joylinks)&& Spieler.festhalten_an_treppe && Spieler.berechtigt_links)
	{
		Spieler.scrollwert--;
		Spieler.treppenzaehler+=2;
		Spieler.kortenaussehen_unabhaengig=KORTENAUSSEHEN_LINKS;
		Spieler.last_scrollwert_veraenderung=LINKS;
	}
	if((Spieler.keyrechts || Spieler.joyrechts)&& Spieler.festhalten_an_treppe && Spieler.berechtigt_rechts)
	{
		Spieler.scrollwert++;
		Spieler.treppenzaehler+=2;
		Spieler.kortenaussehen_unabhaengig=KORTENAUSSEHEN_RECHTS;
		Spieler.last_scrollwert_veraenderung=RECHTS;
	}
	if((Spieler.keyhoch || Spieler.joyhoch )&& Spieler.festhalten_an_treppe && Spieler.berechtigt_hoch && Spieler.zug_phase!=2)
	{
		Spieler.korten_y--;
		Spieler.treppenzaehler++;
	}
	if((Spieler.keyrunter || Spieler.joyrunter)&& Spieler.festhalten_an_treppe && Spieler.berechtigt_runter && Spieler.zug_phase!=2)
	{
		Spieler.korten_y++;
		Spieler.treppenzaehler++;
	}	
}

void kollisionserkennungen_einmal_durchnehmen(player &Spieler)
{
	if(collisiondetect_unten(Spieler))
		Spieler.berechtigt_runter=true;
	else
		Spieler.berechtigt_runter=false;
	if(collisiondetect_oben(Spieler))
		Spieler.berechtigt_hoch=true;
	else
		Spieler.berechtigt_hoch=false;
	if(collisiondetect_links(Spieler))
		Spieler.berechtigt_links=true;
	else
		Spieler.berechtigt_links=false;
	if(collisiondetect_rechts(Spieler))
		Spieler.berechtigt_rechts=true;
	else
		Spieler.berechtigt_rechts=false;
}

void korten_faellt_runter(player &Spieler, platform &Plattformen)
{
	for(int zaehler2=1;zaehler2<=Spieler.fall_geschwindigkeit;zaehler2++)
	{
		Spieler.korten_auf_plattform_nr=check_korten_plattform(Spieler, Plattformen);
		if(Spieler.korten_auf_plattform_nr!=99)
		{
			Spieler.berechtigt_runter=false;
			break;
		}
		
		if(collisiondetect_unten(Spieler) && Spieler.korten_auf_plattform_nr==99)
			Spieler.korten_y++;
	}
}

void korten_springt(player &Spieler)
{
	Spieler.sprungzaehler--;
	if(Spieler.sprungzaehler > 0 && Spieler.sprungzaehler <= 5)
		Spieler.sprung_geschwindigkeit=1;
	if(Spieler.sprungzaehler > 5 && Spieler.sprungzaehler <= 12)
		Spieler.sprung_geschwindigkeit=2;
	if(Spieler.sprungzaehler > 12 && Spieler.sprungzaehler <= 27)
		Spieler.sprung_geschwindigkeit=3;
	if(Spieler.sprungzaehler > 27)
		Spieler.sprung_geschwindigkeit=5;
				
	for(int zaehler2=1;zaehler2<=Spieler.sprung_geschwindigkeit;zaehler2++)
		if(collisiondetect_oben(Spieler))Spieler.korten_y--;
}

void korten_runterfall_geschwindigkeit(player &Spieler)
{
	if(Spieler.runterfall_zaehler==1)Spieler.fall_geschwindigkeit=0;
	if(Spieler.runterfall_zaehler >= 2 && Spieler.runterfall_zaehler < 8)
		Spieler.fall_geschwindigkeit=1;
	if(Spieler.runterfall_zaehler >= 8 && Spieler.runterfall_zaehler < 16)
		Spieler.fall_geschwindigkeit=2;
	if(Spieler.runterfall_zaehler >= 16 && Spieler.runterfall_zaehler < 48)
		Spieler.fall_geschwindigkeit=3;
}

void maxsprunghoehe(player &Spieler)
{
	if(Spieler.korten_geschwindigkeit==0)Spieler.max_sprung_hoehe=20;
	if(absolut(Spieler.korten_geschwindigkeit)==1)Spieler.max_sprung_hoehe=24;
	if(absolut(Spieler.korten_geschwindigkeit)==2)Spieler.max_sprung_hoehe=31;
	if(absolut(Spieler.korten_geschwindigkeit)>=3)Spieler.max_sprung_hoehe=40;
}

void korten_horizontal_bewegen(player &Spieler)
{
	if (Spieler.korten_geschwindigkeit < 0 && Spieler.berechtigt_links && !Spieler.festhalten_an_treppe) 
	{
		for(int zaehler2=-1;zaehler2>=Spieler.korten_geschwindigkeit;zaehler2--)
		{
			if(collisiondetect_links(Spieler))
			{
				Spieler.scrollwert--;
				Spieler.last_scrollwert_veraenderung=LINKS;
			}
		}
	}
					
	if (Spieler.korten_geschwindigkeit > 0 && Spieler.berechtigt_rechts && !Spieler.festhalten_an_treppe) 
	{
		if(Spieler.scrollwert!=6080)
		{
			for(int zaehler2=1;zaehler2<=Spieler.korten_geschwindigkeit;zaehler2++)
			{
				if(collisiondetect_rechts(Spieler))
				{	
					Spieler.scrollwert++;
					Spieler.last_scrollwert_veraenderung=RECHTS;
				}
			}				
		}
	}
}

void move_korten_with_plattform(player &Spieler, platform &Plattform)
{
	int plaenge=0;
	if(Plattform.laenge[Spieler.korten_auf_plattform_nr]==PLATFORM_SMALL)plaenge=LAENGE_PLATFORM_SMALL;
	if(Plattform.laenge[Spieler.korten_auf_plattform_nr]==PLATFORM_MEDIUM)plaenge=LAENGE_PLATFORM_MEDIUM;
	if(Plattform.laenge[Spieler.korten_auf_plattform_nr]==PLATFORM_LARGE)plaenge=LAENGE_PLATFORM_LARGE;
	if(Plattform.type[Spieler.korten_auf_plattform_nr]==PLATFORM_HORIZONTAL)
	{
		if(Plattform.aktuelle_richtung[Spieler.korten_auf_plattform_nr]==LINKS && Spieler.berechtigt_links)
			Spieler.scrollwert--;	
		if(Plattform.aktuelle_richtung[Spieler.korten_auf_plattform_nr]==RECHTS && 
			Plattform.aktuelle_x[Spieler.korten_auf_plattform_nr]!=Plattform.start_x[Spieler.korten_auf_plattform_nr] &&
			Spieler.berechtigt_rechts)
			Spieler.scrollwert++;
	}
	if(Plattform.type[Spieler.korten_auf_plattform_nr]==PLATFORM_VERTIKAL)
	{
		Spieler.korten_y=Plattform.aktuelle_y[Spieler.korten_auf_plattform_nr]-16-10;	
	}
}

void bereits_eingesammelte_coins_entfernen(player &Spieler)
{
	for(int zaehler=0; zaehler<=12; zaehler++)
		for(int zaehler2=0; zaehler2<=399; zaehler2++)
			if(Spieler.collected_coins[zaehler][zaehler2])leveldat[Spieler.level][zaehler][zaehler2]=0;	
}

void korten_get_coin(player &Spieler, int aktuelle_zeile, int aktuelle_spalte)
{
	if(Spieler.coins<20)
	{
		leveldat[Spieler.level][aktuelle_zeile][aktuelle_spalte]=0;
		Spieler.collected_coins[aktuelle_zeile][aktuelle_spalte]=true;
		Spieler.coins++;
		Spieler.score=Spieler.score+20;
		Spieler.oneupscore+=20;
		sprintf(Spieler.scorewert,"%d",Spieler.score);
		Mix_PlayChannel(-1, snd_coins, 0);
	}	
	
}

void korten_coin_einsammel(player &Spieler)
{
	if(check_coin_contact(Spieler,Spieler.scrollwert+144+15, Spieler.korten_y))
		korten_get_coin(Spieler, (Spieler.korten_y-1)/16, (Spieler.scrollwert+144+15)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144+15, Spieler.korten_y+15))
		korten_get_coin(Spieler, (Spieler.korten_y+15)/16, (Spieler.scrollwert+144+15)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144+15, Spieler.korten_y+25))
		korten_get_coin(Spieler, (Spieler.korten_y+25)/16, (Spieler.scrollwert+144+15)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144, Spieler.korten_y+25))
		korten_get_coin(Spieler, (Spieler.korten_y+25)/16, (Spieler.scrollwert+144)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144, Spieler.korten_y+15))
		korten_get_coin(Spieler, (Spieler.korten_y+15)/16, (Spieler.scrollwert+144)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144, Spieler.korten_y))
		korten_get_coin(Spieler, (Spieler.korten_y)/16, (Spieler.scrollwert+144)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144+8, Spieler.korten_y))
		korten_get_coin(Spieler, (Spieler.korten_y)/16, (Spieler.scrollwert+144+8)/16);
	if(check_coin_contact(Spieler,Spieler.scrollwert+144+8, Spieler.korten_y+25))
		korten_get_coin(Spieler, (Spieler.korten_y+25)/16, (Spieler.scrollwert+144+8)/16);
	if(Spieler.coins==20)
		korten_kriegt_neues_shield(Spieler);
}

int finde_guenstige_freistelle_fuer_shield(player &Spieler)
{
	for(int zaehler=1;zaehler<=4;zaehler++)
		if(Spieler.shield[zaehler]==0)return zaehler;
	for(int zaehler=1;zaehler<=4;zaehler++)
		if(Spieler.shield[zaehler]==1)return zaehler;
	return 0;		
}

void korten_kriegt_neues_shield(player &Spieler)
{
	int pos=finde_guenstige_freistelle_fuer_shield(Spieler);
	if(pos!=0)
	{
		if(Spieler.shield[pos]<2)
		{
			Spieler.coins=Spieler.coins-20;
			Spieler.shield[pos]++;
		}
	}	
}

void korten_upgraden(player &Spieler)
{
	Spieler.position_zug=-200;
	Spieler.position_upgradebutton=0;
	leveldat[Spieler.level][Spieler.upgradebutton_gefunden_zeile][Spieler.upgradebutton_gefunden_spalte]=0;
	Spieler.zug_phase=1;
	Mix_PlayChannel(-1, snd_kran, 0);
	Spieler.score=Spieler.score-200;
	sprintf(Spieler.scorewert,"%d",Spieler.score);
}	

int liednumber(int level)
{
	if(level==1)return 1;
	if(level==2)return 4;
	if(level==3)return 6;
	if(level==4)return 5;
	if(level==5)return 3;
	if(level==6)return 1;
	if(level==7)return 4;
	if(level==8)return 2;
	if(level==9)return 7;
	if(level==10)return 6;
	if(level==11)return 1;
	if(level==12)return 4;
	if(level==13)return 2;
	if(level==14)return 4;
	if(level==15)return 3;
	if(level==16)return 1;
	if(level==17)return 5;
	if(level==18)return 2;
	if(level==19)return 7;
	if(level==20)return 3;
}