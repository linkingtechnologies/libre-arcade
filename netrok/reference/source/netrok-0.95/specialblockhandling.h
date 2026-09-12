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

void gehe_horizontale_plattform_durch(platform &Plattformen,int &level, int &aktuelle_spalte, int &aktuelle_zeile, 
							int &aktuelle_plattform, int &plattform_durchgehen, int &zaehler);
void gehe_vertikale_plattform_durch(platform &Plattformen,int &level, int &aktuelle_spalte, int &aktuelle_zeile, 
							int &aktuelle_plattform, int &plattform_durchgehen, int &zaehler);							
void checke_alle_plattformen_in_level(platform &Plattformen, int level);
void bewege_plattformen(platform &Plattformen);
void loesche_platformspeicher(platform &Plattformen);
void loesche_steinzustaende(fallender_stein &Stein);
void steine_fallen_lassen(fallender_stein &Stein, int level, int scrollwert);
void check_in_spalte_kanonen(kanone &Kanonen, player &Spieler, int spalte_kanonen_aufnehm, int zaehler);
void check_in_spalte_enemies(int aktuelle_spalte, enemy &Enemies, int zaehler, int type);
void check_in_spalte(kanone &Kanonen, player &Spieler, int spalte_kanonen_aufnehm, enemy &Enemies, int aktuelle_spalte);
void check_kanonen_enemies(kanone &Kanonen, player &Spieler, enemy &Enemies);
int absolut (int x);
void erzeuge_kugel(kanone &Kanonen, kugel &Kugeln, int zaehler, int aktuelle_spalte, int aktuelle_zeile);
void kugeln_bewegen(kanone &Kanonen, player &Spieler, kugel &Kugeln);
void setze_fahne(player &Spieler);
void bewege_zug(player &Spieler);
int fallfunktion_enemies(int x, enemy &Enemies, int z);
void enemies_bewegen(player &Spieler, enemy &Enemies, fallender_stein &Stein, platform &Plattformen, kanone &Kanonen, kugel &Kugeln);
