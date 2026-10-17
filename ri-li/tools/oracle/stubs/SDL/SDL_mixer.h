// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Just enough of SDL_mixer for the original's headers to compile. The oracle has no sound: audio_stub.cc replaces audio.cc and only records what the game asks to play.
#ifndef RILI_STUB_SDL_MIXER_H
#define RILI_STUB_SDL_MIXER_H
#include <SDL/SDL.h>
#define SDL_MIX_MAXVOLUME 128
struct Mix_Chunk;
struct Mix_Music;
typedef struct Mix_Chunk Mix_Chunk;
typedef struct Mix_Music Mix_Music;
// main.cc ends with these two; main() is never run here, but the file has to compile (audio_stub.cc defines them)
extern "C" int Mix_HaltMusic(void);
extern "C" void Mix_FreeMusic(Mix_Music *);
#endif
