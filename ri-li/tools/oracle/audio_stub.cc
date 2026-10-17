// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Stands in for the original's audio.cc, which needs SDL_mixer and a sound card. It keeps the original's own bookkeeping (which music is
// current, the 120 ms debounce of the click) and, instead of playing, appends what the game asked for to the list that harness.cc prints
// with each frame: "p<n>" for Play(eSon n), "m<n>" for LoadMusic(n) (NextMusic goes through it, as in audio.cc).

#include <string>
#include <vector>
#include "audio.h"
#include "preference.h"

extern sPreference Pref;
extern int Horloge;
std::vector<std::string> g_sound_log;

Audio::Audio(void) : N(0), NMus(0), MemoHorloge(0), Son(NULL), Music(NULL) { }
Audio::~Audio(void) { }

bool Audio::Init(void) { N = sFin; return true; }

void Audio::LoadMusic(int Num) {
  if (!N) return;
  NMus = Num;
  g_sound_log.push_back("m" + std::to_string(Num));
}

void Audio::NextMusic(void) {
  NMus++;
  if (NMus > 2) NMus = 1;
  LoadMusic(NMus);
}

void Audio::Play(eSon So) {
  if (!N) return;
  if (So == sClic) {
    if (Horloge - MemoHorloge <= 120) return;
    MemoHorloge = Horloge;
  }
  g_sound_log.push_back("p" + std::to_string((int)So));
}

void Audio::PlayMusic(void) { }
void Audio::Pause(bool) { }
void Audio::PauseMusic(bool) { }
void Audio::DoVolume(void) { }

// referenced by main.cc, whose main() is not run
extern "C" int Mix_HaltMusic(void) { return 0; }
extern "C" void Mix_FreeMusic(Mix_Music *) { }
