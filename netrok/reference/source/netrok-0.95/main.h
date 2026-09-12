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

using namespace std;

#define VERSION						0.95
#define ALPHAVERSION					0.95
#define LINKS						1
#define RECHTS						2
#define HOCH						3
#define RUNTER						4

#define KORTENAUSSEHEN_LINKS			1
#define KORTENAUSSEHEN_RECHTS			2
#define KORTENAUSSEHEN_TOT			3
#define KORTENAUSSEHEN_TOT2			4
#define KORTENAUSSEHEN_TREPPE1		5
#define KORTENAUSSEHEN_TREPPE2		6

#define UPGRADE_NORMAL				0
#define UPGRADE_SCHUHE				1
#define UPGRADE_HEMD				2	

#define PLATFORM_SMALL				0
#define PLATFORM_MEDIUM				1
#define PLATFORM_LARGE				2

#define PLATFORM_VERTIKAL				0
#define PLATFORM_HORIZONTAL			1

#define KANONE_HORIZONTAL			0
#define KANONE_VERTIKAL				1
#define KANONE_HORIZONTAL2			2
#define KANONE_VERTIKAL2				3

#define STEIN_FEST					0
#define STEIN_WIRDFALLEN				1
#define STEIN_FAELLT					2

#define ENEMY_LEBENDIG				0
#define ENEMY_TOT					1

#define LAENGE_PLATFORM_SMALL			16
#define LAENGE_PLATFORM_MEDIUM		48
#define LAENGE_PLATFORM_LARGE			80

#define true						1
#define false						0



struct player
{
	int zaehler;
	int unverwundbarkeits_zaehler;
	int treppenzaehler;
	int game_runs;
	int level;
	char levelwert[5];
	int coins;
	int score;
	char scorewert[10];
	int scrollwert;
	int richtung;
	int korten_x,korten_y;
	int sprungzaehler;
	int max_hoeherspringen;
	int kortenaussehen;
	int kortenaussehen_unabhaengig;
	int last_scrollwert_veraenderung;
	int leben;
	int korten_geschwindigkeit;
	int korten_beschleunigung;
	int runterfall_zaehler;
	int fall_geschwindigkeit;
	int sprung_geschwindigkeit;
	int scrollwertsave_fuer_korten;
	int korten_auf_plattform_nr;		// gültig 0-29, 99=auf keiner plattform
	int max_sprung_hoehe;
	int upgradetype;
	int shield[5];
	int primary_shield_selected;
	int secondary_shield_selected;
	int fahnenposition_spalte;
	int fahnenposition_zeile;
	int fahnenposition_y;
	int unverwundbarkeits_timer;
	int position_zug;
	int position_upgradebutton;
	int upgradebutton_gefunden_zeile;
	int upgradebutton_gefunden_spalte;
	int zug_phase;
	int xpos_lastdrawtile[265];
	int ypos_lastdrawtile[265];
	int type_lastdrawtile[265];
	int anzahl_lastdrawtile;
	int timeleft;
	int upgradebutton_type;
	Uint32 hintergrund_farbe;
	char wert[5];
	char timeleftchar[7];
	bool collected_coins[13][400];
	bool fahne_gesetzt;
	bool shield_selected;
	bool berechtigt_links; 
	bool berechtigt_rechts; 
	bool berechtigt_hoch; 
	bool berechtigt_runter;
	bool korten_tot;
	bool auf_treppe;
	bool festhalten_an_treppe;
	bool joylinks;
	bool joyrechts;
	bool joyhoch;
	bool joyrunter;
	bool joybt1;
	bool joybt2;
	bool joybt3;
	bool joybt4;
	bool keybt2;
	bool keylinks;
	bool keyrechts;
	bool keyhoch;
	bool keyrunter;
	bool keylctrl;
	int oneupscore;
	int xpos[12];
	int ypos[12];
	int score_aktuelle_stelle;
	int score_posx[25];
	int score_posy[25];
	int score_posy_finish[25];
	bool score_verwendet[25];
	char score_dazu[25][10];
};

struct enemy
{
	bool verwendet[25];
	int x[25];
	int y[25];
	int richtung[25];
	int type[25];
	int status[25];
	int zaehler;
	int parabell_x[25];
	int parabell_y[25];
	int bosstimer;
	int bosstreffer;
	int bossblinktimer;
};	

struct platform 
{ 
	int type[30];
	int laenge[30];
	int aktuelle_x[30];
	int aktuelle_y[30];
	int aktuelle_richtung[30];
	int start_x[30];
	int start_y[30];
	int stop_x[30];
	int stop_y[30];
	int anzahl_plattformen_in_level;
};

struct fallender_stein
{
	int steinzustand[1000];
	int timer[1000];
	int aktuelle_x[1000];
	int aktuelle_y[1000];
	int zeile[1000];
	int spalte[1000];
	int aktueller_stein;
};

struct kanone
{
	bool verwendet[50];
	int zeile[50];
	int spalte[50];
	int timer[50];
	int type[50];
};

struct kugel
{
	bool verwendet[300];
	int x[300];
	int y[300];
	int richtung[300];	
};

 
void starttiming();
void endtiming(int wartezeit);

int main( int argc, char* argv[] );
void init_audio();

