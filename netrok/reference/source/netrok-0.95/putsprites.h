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

void korten_setzen_stand(player &Spieler);
void korten_setzen1(player &Spieler);
void korten_setzen2(player &Spieler);
void korten_setzen3(player &Spieler);
void korten_setzen_sprung(player &Spieler);
void korten_setzen_treppe(player &Spieler);
void korten_darstellen(player &Spieler);
void plattformen_darstellen(platform &Plattformen, int scrollwert);
void statusleiste_darstellen(player &Spieler);
void fahne_darstellen(player &Spieler);
void kugeln_darstellen(player &Spieler, kugel &Kugeln, int zaehler2);
void level_hintergrund_darstellen(player &Spieler);
void gr_kanone_neudarstellen(player &Spieler);
void upgradebutton_darstellen(player &Spieler);
void lastdrawtiles_darstellen(player &Spieler);
void enemies_darstellen(player &Spieler, enemy &Enemies, int type, int zaehler);
void zwischenlevel(player &Spieler);
void gameover(player &Spieler);
void endanimation();
void bosstot(int zaehler, player &Spieler, enemy &Enemies, platform &Plattformen, 
	fallender_stein &Steine1, kanone &Kanonen, kugel &Kugeln);