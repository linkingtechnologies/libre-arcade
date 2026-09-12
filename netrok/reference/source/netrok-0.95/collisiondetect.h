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

bool collisiondetect_rechts(player &Spieler);
bool collisiondetect_links(player &Spieler);
bool collisiondetect_oben(player &Spieler);
bool collisiondetect_unten(player &Spieler);
void collisiondetect_kugel_spieler(player &Spieler, kugel &Kugeln, int zaehler2);
bool collisiondetect_enemy_links(player &Spieler, enemy &Enemies, int zaehler);
bool collisiondetect_enemy_rechts(player &Spieler, enemy &Enemies, int zaehler);
bool collisiondetect_enemy_unten(player &Spieler, enemy &Enemies, int zaehler);
int check_korten_plattform(player &Spieler, platform &Plattform);
bool gefaehrliche_zacken(int berechtigt_runter, int korten_x, int korten_y, int level );
bool check_korten_kanone(player &Spieler);
bool check_korten_treppe(player &Spieler);
void check_korten_fallender_stein(player &Spieler, fallender_stein &Stein);
bool check_coin_contact(player &Spieler,int x, int y);
void kollision_kugeln_ablenkstein(player &Spieler, kugel &Kugeln, int zaehler2);
bool check_korten_upgradebutton(player &Spieler);
int collisiondetect_spieler_enemies(player &Spieler, enemy &Enemies, int zaehler);
void kollision_spieler_enemies(player &Spieler, enemy &Enemies, int zaehler, platform &Plattformen, fallender_stein &Steine1, 
						kanone &Kanonen, kugel &Kugeln);
void save_parabell_werte(enemy &Enemies, int zaehler);
void check_enemy_fallender_stein(enemy Enemies, player Spieler, int z, fallender_stein &Stein);





