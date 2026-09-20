/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "sound.hpp"
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

#include <iostream>

#include "sound.hpp"

Soundset::Sample Soundset::sounds[ NUMBEROFCHANNELS ];
bool Soundset::soundOn = true;

Soundset::Soundset()
{
	verbose( "Initializing Soundset" );

	char* SOUNDSETNAMES[] = { 
		"snd/explosion.wav",	// 0
		"snd/laser.wav",    	// 1
		"snd/applause.wav",	// 2
		"snd/curve.wav", 	// 3
		"snd/kling.wav", 	// 4
		"snd/pluck.wav", 	// 5
		"snd/strom.wav",	// 6
		"snd/click.wav" };	// 7

	for ( int i=0; i < _SOUNDSETNAMES; i++ ) {
		loadAudio( SOUNDSETNAMES[i], i );
	}

	soundOn = true;

	start();
}

Soundset::~Soundset()
{
	verbose( "Deleting Soundset" );

	SDL_CloseAudio();
	
	for ( int i=0; i < _SOUNDSETNAMES; i++ )
		free( cvt[i].buf ); 
}

void Soundset::toggle()
{
	verbose( "Toggling Sound" );

	soundOn = !soundOn;
}

void Soundset::play(SoundId id)
{
	if ( id >= 0 && id <= _SOUNDSETNAMES ) {
		int index;

		// einen leeren Audio-Slot suchen
		for ( index=0; index < NUMBEROFCHANNELS; ++index )
			if ( sounds[index].dpos == sounds[index].dlen )
				break;
		
		if ( index < NUMBEROFCHANNELS ) {
			
			SDL_LockAudio();
			sounds[index].data = cvt[id].buf;
			sounds[index].dlen = cvt[id].len_cvt;
			sounds[index].dpos = 0;
			SDL_UnlockAudio();
		}
	}
}

void Soundset::start()
{
	format.freq = 22050;
	format.format = AUDIO_S16;
	format.channels = 2;
	format.samples = 512;
	format.callback = &(Soundset::mixAudio);
	format.userdata = NULL;
	
	if ( SDL_OpenAudio(&format, NULL) < 0 ) {
		std::cout << "Error in Sound: " << SDL_GetError() << std::endl;
		exit(1);
	}

	SDL_PauseAudio(0);
}

void Soundset::loadAudio( char *filename, int id )
{
	SDL_AudioSpec wave;
	Uint8 *data;
	Uint32 dlen;

	// Audio-Datei laden und nach 16 Bit und 22KHz wandeln
	if ( SDL_LoadWAV(filename, &wave, &data, &dlen) == NULL ) {
		std::cout << "Error in Sound: " << SDL_GetError() << std::endl;
		exit(1);
	}

	SDL_BuildAudioCVT( &cvt[id], wave.format, wave.channels, wave.freq, AUDIO_S16, 2, 22050 );
	cvt[id].buf = (Uint8*)malloc( dlen*cvt[id].len_mult );
	memcpy( cvt[id].buf, data, dlen );
	
	cvt[id].len = dlen;
	SDL_ConvertAudio(&cvt[id]);
	SDL_FreeWAV(data);
}

void Soundset::mixAudio( void *, Uint8 *stream, int length )
{
	for ( int i=0; i < NUMBEROFCHANNELS; ++i ) {
		Uint32 size = (sounds[i].dlen-sounds[i].dpos);
	
		if ( size > (Uint32)length ) size = length;
		
		SDL_MixAudio( stream, &sounds[i].data[ sounds[i].dpos ], size,
			(soundOn) ? SDL_MIX_MAXVOLUME : 0 );
		sounds[i].dpos += size;
	}
}

