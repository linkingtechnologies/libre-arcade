/******************************************************************************************
 *
 * HighNoon - Duell im All Version 1.0
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "sound.hpp"
 * 
 * This class contains methods to play sounds in a 
 * soundset.
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

#ifndef __SOUND_HPP__
#define __SOUND_HPP__

#include <SDL/SDL.h>
#include <SDL/SDL_audio.h>

#include "constants.hpp"

//-----------------------------------------------------------------------------------------
class Soundset
//-----------------------------------------------------------------------------------------
{
public:
	struct Sample {
	    Uint8 *data;                                      
	    Uint32 dpos;
	    Uint32 dlen;
	};

	Soundset();

	~Soundset();
	
	void toggle();
	
	void play( SoundId id );
		
private:
	int amount;
	SDL_AudioSpec format;
	SDL_AudioCVT cvt[_SOUNDSETNAMES];
	static Sample sounds[];
	static bool soundOn;
		
	void start();

	void end();
	
	void loadAudio( char *filename, int id );

	static void mixAudio( void*, Uint8 *stream, int length );
};
#endif

