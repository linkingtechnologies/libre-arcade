/*
 * $Id: sound.c,v 1.3 2001/11/10 01:49:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * BGM/SE manager(using SDL_mixer).
 *
 * @version $Revision: 1.3 $
 */
#include "SDL.h"
#include <stdlib.h>
#include <stdio.h>
#include <signal.h>

#include "SDL_mixer.h"
#include "sound.h"

// Include music_ogg.h and define _Mix_Music to rewind the ogg audio.
#include "music_ogg.h"
struct _Mix_Music {
	enum {
		MUS_CMD,
		MUS_WAV,
		MUS_MOD,
		MUS_MID,
		MUS_OGG,
		MUS_MP3
	} type;
	union {
#ifdef CMD_MUSIC
		MusicCMD *cmd;
#endif
#ifdef WAV_MUSIC
		WAVStream *wave;
#endif
#ifdef MOD_MUSIC
		UNIMOD *module;
#endif
#ifdef MID_MUSIC
		MidiSong *midi;
#endif
#ifdef OGG_MUSIC
		OGG_music *ogg;
#endif
#ifdef MP3_MUSIC
		SMPEG *mp3;
#endif
	} data;
	Mix_Fading fading;
	int fade_volume;
	int fade_step;
	int fade_steps;
	int error;
};

static int useAudio = 0;

#define MUSIC_NUM 2

static char *musicFileName[MUSIC_NUM] = {
  "wok1.ogg", "wok2.ogg"
};
static Mix_Music *music[MUSIC_NUM];
static int playingMusicIdx, nextMusicIdx;

#define CHUNK_NUM 3

static char *chunkFileName[CHUNK_NUM] = {
  "gen.wav", "score.wav", "miss.wav"
};
static Mix_Chunk *chunk[CHUNK_NUM];
static int chunkFlag[CHUNK_NUM];

void closeSound() {
  int i;
  if ( !useAudio ) return;
  if ( Mix_PlayingMusic() ) {
    Mix_HaltMusic();
  }
  for ( i=0 ; i<MUSIC_NUM ; i++ ) {
    if ( music[i] ) {
      Mix_FreeMusic(music[i]);
    }
  }
  for ( i=0 ; i<CHUNK_NUM ; i++ ) {
    if ( chunk[i] ) {
      Mix_FreeChunk(chunk[i]);
    }
  }
  Mix_CloseAudio();
}

static void playAllChunk() {
  int i;
  if ( !useAudio ) return;
  for ( i=0 ; i<CHUNK_NUM ; i++ ) {
    if ( chunkFlag[i] ) {
      //if ( Mix_Playing(i) ) Mix_HaltChannel(i);
      Mix_PlayChannel(i, chunk[i], 0);
      chunkFlag[i] = 0;
    }
  }
}

void musicFinished() {
  if ( !useAudio ) return;
  if ( nextMusicIdx == -1 ) return;

  // rewind the ogg audio
  ov_raw_seek(&(music[playingMusicIdx]->data.ogg->vf), 0);
  playingMusicIdx = nextMusicIdx;
  Mix_PlayMusic(music[playingMusicIdx], 1);
}

void checkMusic() {
  if ( !useAudio ) return;
  playAllChunk();
}

// Initialize the sound.

static void loadSounds() {
  int i;
  char name[32];

  for ( i=0 ; i<MUSIC_NUM ; i++ ) {
    strcpy(name, "sounds/");
    strcat(name, musicFileName[i]);
    if ( NULL == (music[i] = Mix_LoadMUS(name)) ) {
      fprintf(stderr, "Couldn't load: %s\n", name);
      useAudio = 0;
      return;
    }
  }
  for ( i=0 ; i<CHUNK_NUM ; i++ ) {
    strcpy(name, "sounds/");
    strcat(name, chunkFileName[i]);
    if ( NULL == (chunk[i] = Mix_LoadWAV(name)) ) {
      fprintf(stderr, "Couldn't load: %s\n", name);
      useAudio = 0;
      return;
    }
    chunkFlag[i] = 0;
  }
}

void initSound() {
  int audio_rate;
  Uint16 audio_format;
  int audio_channels;
  int audio_buffers;
  int interactive = 0;

  if ( SDL_InitSubSystem(SDL_INIT_AUDIO) < 0 ) {
    fprintf(stderr, "Unable to initialize SDL_AUDIO: %s\n", SDL_GetError());
    return;
  }

  audio_rate = 16000;
  audio_format = AUDIO_S16;
  audio_channels = 1;
  audio_buffers = 4096;
  
  if (Mix_OpenAudio(audio_rate, audio_format, audio_channels, audio_buffers) < 0) {
    fprintf(stderr, "Couldn't open audio: %s\n", SDL_GetError());
    return;
  } else {
    Mix_QuerySpec(&audio_rate, &audio_format, &audio_channels);
  }

  Mix_HookMusicFinished(musicFinished);

  useAudio = 1;
  loadSounds();
}

// Play/Stop the music/chunk.

void playMusic(int idx) {
  if ( !useAudio ) return;
  playingMusicIdx = nextMusicIdx = idx;
  Mix_PlayMusic(music[playingMusicIdx], 1);
}

void stopMusic() {
  if ( !useAudio ) return;
  if ( Mix_PlayingMusic() ) {
    Mix_HaltMusic();
  }
  ov_raw_seek(&(music[playingMusicIdx]->data.ogg->vf), 0);
  nextMusicIdx = -1;
}

void changeMusic(int idx) {
  nextMusicIdx = idx;
}

void nextMusic() {
  nextMusicIdx = playingMusicIdx+1;
  if ( nextMusicIdx >= MUSIC_NUM ) nextMusicIdx = 0;
}

void playChunk(int idx) {
  chunkFlag[idx] = 1;
}
