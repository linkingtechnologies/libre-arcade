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

void acceleration_speed(player &Spieler);
void level_hintergrundfarbe_einlesen(player &Spieler);
void startinitialisierungen(player &Spieler, kanone &Kanonen, kugel &Kugeln, enemy &Enemies, platform &Plattformen);
void korten_mit_kanone_abschiessen(player &Spieler, platform &Plattformen, fallender_stein &Steine1, enemy &Enemies, kugel &Kugeln,
							kanone &Kanonen);
void level_finished(player &Spieler, platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln, enemy &Enemies);
void korten_tot(player &Spieler, platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln, 
			char aktueller_dateiname[13], enemy &Enemies);
void schilde_ummodulieren(player &Spieler, int richtung);
void korten_auf_treppe_bewegen(player &Spieler);
void kollisionserkennungen_einmal_durchnehmen(player &Spieler);
void korten_faellt_runter(player &Spieler, platform &Plattformen);
void korten_runterfall_geschwindigkeit(player &Spieler);
void korten_springt(player &Spieler);
void maxsprunghoehe(player &Spieler);
void korten_horizontal_bewegen(player &Spieler);
void move_korten_with_plattform(player &Spieler, platform &Plattform);
void bereits_eingesammelte_coins_entfernen(player &Spieler);
void korten_get_coin(player &Spieler, int aktuelle_zeile, int aktuelle_spalte);
void korten_coin_einsammel(player &Spieler);
int finde_guenstige_freistelle_fuer_shield(player &Spieler);
void korten_kriegt_neues_shield(player &Spieler);
void korten_upgraden(player &Spieler);
void level_fade_in(player &Spieler,platform &Plattformen, fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln,enemy &Enemies);
int liednumber(int level);



