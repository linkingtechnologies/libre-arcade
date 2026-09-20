/******************************************************************************************
 *
 * HighNoon - Duel in Space
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "constants.cpp"
 * 
 * This file contains important parameters of the game.
 *
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 ******************************************************************************************/

#ifndef __CONSTANTS_HPP__
#define __CONSTANTS_HPP__

#include <iostream>

#include <SDL/SDL.h>

//#define __DEBUG__		// Print out Some Debug Information
//#define __TRAINERMODE__	// Show Shootpath, toggle Weapon
//#define __THREADS__		// Tested Threads... didn't work faster =( 
#define __ENVIRONMENT__		// Has OS Environment?

const std::string VERSION 	= "1.2.4";
const std::string COPYRIGHT 	= "Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>";
const std::string WEBSITE 	= "http://highmoon.gerdsmeier.net";

const double PI 		=  3.141592;

// SCREEN
const int SCREENWIDTH		= 1024; 
const int SCREENHEIGHT 		= 768;

const int BORDERWIDTH 		= 70;
const int SCROLLBORDERWIDTH 	= 20;		// Screen scrolls if shoot is above that line  
const int SCROLLBACKSPEED 	= 10;  		// Steps to scroll back Screen
const int TICK_INTERVAL_SCREEN 	= 30; 
const int TICK_INTERVAL_GAME 	= 30; 
const int ANIMFRAME 		= 3;		// Normal nth Frame is next Anim
const int BLINKTIME 		= 45;		// For flashing Text
const int SCROLLERSPEED 	= 4;
const int _TITLETEXT 		= 10;

// KEYBOARD. I think this Keyboard functions are Ok:
const int KEY_DECSHOOT 		= SDLK_LEFT;
const int KEY_INCSHOOT 		= SDLK_RIGHT;
const int KEY_MOVEUP 		= SDLK_UP;
const int KEY_MOVEDOWN 		= SDLK_DOWN;
const int KEY_FIRE 		= SDLK_SPACE;
const int KEY_QUIT 		= SDLK_ESCAPE;
const int KEY_WARPGALAXY 	= SDLK_TAB;
const int KEY_CHOOSEBONUS 	= SDLK_RETURN;
const int KEY_TOGGLEFULLSCREEN 	= SDLK_f;
const int KEY_TOGGLESCROLLER 	= SDLK_F1;
const int KEY_TOGGLELANGUAGE 	= SDLK_F2;
const int KEY_SCREENSHOT 	= SDLK_F12;
const int UKEY_ONEPLAYER 	= 48+1;		// For french Keyboard
const int UKEY_TWOPLAYER 	= 48+2;
const int UKEY_DEMO 		= 48+3;
const int KEY_STRENGTH 		= SDLK_c;
const int KEY_TOGGLESOUND 	= SDLK_s;
const int KEY_TOGGLEHINT 	= SDLK_h;	// undocumented feature, built in for testing only...  = )
const int KEY_NEXTWEAPON 	= SDLK_n;	// undocumented feature, built in for testing only...  = )

// GAME+GALAXY
const int MAXPLAYER 		= 2;		// Don't change! (Actually?) only 2 Players are supported
const int MAXENERGY 		= 100;
const int WINNINGWAIT 		= 400;		// Frames to wait if Game has a Winner

const int MAXHOLE 		= 60;		// Pixels in Blackholes
const int MAXWORM 		= 150;		// Pixels in Wormholes
const int MAXGOLDRAIN 		= 150;		// Pixels in Goldrain
const int MAXSTARS 		= 100;		// Stars in Background

// WEAPONS
const int MAXCLUSTERLASER 	= 5;
const int CLUSTERLASERANGLE 	= 30;
enum WeaponId {
	WEAPON_LASER   = 0,
	WEAPON_HEAVY   = 1,
	WEAPON_CLUSTER = 2,
	WEAPON_FUNGHI  = 3
};

// PLANETS
const int MAXPLANETS 		= 9;		// max. Planets in a Galaxy
const int MINPLANETS 		= 5;		// min. -"-
const int WEIGHT_JUPITER 	= 350;		// Weight is important for the gravity!
const int WEIGHT_EARTH 		= 300;
const int WEIGHT_MARS 		= 200;
const int WEIGHT_VENUS 		= 180;
const int WEIGHT_SATURN	 	= 250;
const int WEIGHT_BLACKHOLE 	= -100;
const int WEIGHT_WORMHOLE 	= 100;
const int MAXSTONES 		= 35;

// SHOOT
const int MAXSHOOTS 		= 1;		// Shoots per Player (Don't change!)
const int MAXSHOOTPOWER 	= 100;		// 1..100
const int SHOOTPOWERFACTOR 	= 3;
const int MAXSHOOTRUN 		= 700;		// max. Frames a Shoot should run
const int SHOOT_INTERVAL 	= 30; 

// COMPUTER
const int MAXCOMPUTERSEARCH 	= 150; 		// Amount of paths the computer explores for shooting.
const int MAXPRECALC 		= MAXSHOOTRUN;	// How deep should the computer think.

// SOUND
const int NUMBEROFCHANNELS 	= 4;
static const int _SOUNDSETNAMES = 8;
enum SoundId {
	SOUND_EXPLOSION   = 0,
	SOUND_SHOOT 	  = 1,
	SOUND_WINNINGGAME = 2,
	SOUND_WARPGALAXY  = 3,
	SOUND_HITUFO 	  = 4,
	SOUND_NEWGAME 	  = 5,
	SOUND_NEWEXTRA 	  = 6,
	SOUND_BUYWEAPON   = 7
};

extern void verbose( std::string info );

#define RANDOM(max,min) ((max-min)*(rand()/(RAND_MAX+1.0))+min)

#define SCREAM(t) std::cout << t << std::endl << std::flush;


#endif

