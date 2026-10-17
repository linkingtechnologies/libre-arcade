// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The oracle's glue: it runs the original Ri-li 2.0.1 (its own loco.cc, jeux.cc, ecran.cc, sprite.cc, menu.cc, tableau.cc, utils.cc and main.cc,
// compiled unchanged by build.sh) on a virtual clock with scripted input and a software video surface, and prints what the original does after
// every frame of the game as one line of JSON.
//
// What is the original's and what is not:
//   * The game, its rules, its random numbers (the C library's rand), its drawing code and its data files are the original's.
//   * Time is virtual. SDL_GetTicks returns a counter that only moves when the game sleeps (Sleeping() in menu.cc waits for 1000/60 ms) or when
//     the scenario says a frame lasted longer ("dt"). Input is scripted: SDL_PollEvent hands out the scenario's events in the frame they are
//     for. The real SDL 1.2 does the pixels (SDL_CreateRGBSurface, SDL_BlitSurface and the rest) on its "dummy" video driver.
//   * The video surface is double buffered, as the original's SDL_DOUBLEBUF asks and as its erase lists (Ec[0] and Ec[1], each cleared two
//     frames after it was drawn) need: SDL_Flip swaps two pixel buffers. A driver that ignores SDL_DOUBLEBUF would show the previous frame's sprites
//     as well; that is not what the code means, and is not reproduced.
//   * main() is not run (main.cc is compiled with main renamed): its start-up is repeated here with the same calls, except for the sound
//     (audio_stub.cc), the video mode (the dummy driver reports 8 bits, the game wants 32) and the window title.
//
// The scenario file is plain text, one directive per line (see tools/oracle.mjs, which writes them):
//   mode game|quiz    level N (1-based)    difficulty easy|normal|hard    seed N    language it|en    frames N
//   dt MS             frame length (default 16, the shortest the game's loop allows)
//   dt-at FRAME MS    from this frame on, frames last MS
//   keydown FRAME SYM / keyup FRAME SYM / click FRAME      SYM is up|down|left|right|escape|return|space|a number (an SDL key code)
//   dump FRAME PATH   write that frame's 800x600 pixels (RGBA, row by row) to PATH
//   dumpall DIR EVERY write every EVERY-th frame's pixels to DIR/frame-N.rgba
// Output: one JSON object per frame on stdout, then {"end":...}.

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <unistd.h>
#include <algorithm>
#include <string>
#include <vector>
#include <map>
#include <fstream>
#include <sstream>

#include <SDL/SDL.h>
#include "preference.h"
#include "jeux.h"
#include "audio.h"
#include "sprite.h"
#include "ecran.h"
#include "mouse.h"
#include "menu.h"
#include "tableau.h"
#include "editeur.h"
#include "utils.h"

// the original's globals (main.cc, sprite.cc, jeux.cc)
extern SDL_Surface *sdlVideo;
extern SDL_VideoInfo *sdlVideoInfo;
extern Uint32 FontColor;
extern Sprite *Sprites;
extern int NSprites;
extern Ecran Ec[2];
extern sPreference Pref;
extern Jeux Jeu;
extern Menu MenuPrincipale;
extern Tableau Niveau;
extern Audio Sons;
extern Mouse Sourie;
extern int Horloge;
extern int HorlogeAvant;
extern int MasqueK;
extern char Langue[31][16];
void InitPref(void);

extern std::vector<std::string> g_sound_log;  // audio_stub.cc

// ---- the scenario -------------------------------------------------------------------------------------------------------------------------

struct Ev { int frame; int type; int sym; int time; };  // type: 0 key down, 1 key up, 2 mouse button down; time is the virtual clock for the scenarios that are written in time
struct Scenario {
  std::string mode = "game";
  int level = 1, seed = 1, frames = 100;
  e_Difficulte difficulty = Normal;
  std::string language = "en";
  std::vector<Ev> events;
  bool timed = false;                      // the events and the pictures are given by the clock, not by the frame (the menus: their loops do not all count frames alike)
  int until = 0;                           // a timed scenario ends at this clock
  int niveauMax = 0;                       // the highest level reached, which the menu of levels offers
  std::vector<std::pair<int, int>> dt;     // (from frame, ms), sorted
  std::map<int, std::string> dumps;
  std::map<int, std::string> tdumps;       // clock -> file
  std::string dumpDir; int dumpEvery = 0;
} S;

static int keysym(const std::string &s) {
  if (s == "up") return SDLK_UP;
  if (s == "down") return SDLK_DOWN;
  if (s == "left") return SDLK_LEFT;
  if (s == "right") return SDLK_RIGHT;
  if (s == "escape") return SDLK_ESCAPE;
  if (s == "return") return SDLK_RETURN;
  if (s == "space") return SDLK_SPACE;
  if (s.size() == 1) return (unsigned char)s[0];
  return atoi(s.c_str());
}

static void load_scenario(const char *path) {
  std::ifstream in(path);
  if (!in) { fprintf(stderr, "cannot read the scenario %s\n", path); exit(2); }
  std::string line;
  while (std::getline(in, line)) {
    if (line.empty() || line[0] == '#') continue;
    std::istringstream ls(line);
    std::string key; ls >> key;
    if (key == "mode") ls >> S.mode;
    else if (key == "level") ls >> S.level;
    else if (key == "seed") ls >> S.seed;
    else if (key == "frames") ls >> S.frames;
    else if (key == "language") ls >> S.language;
    else if (key == "difficulty") { std::string d; ls >> d; S.difficulty = d == "easy" ? Easy : d == "hard" ? Hard : Normal; }
    else if (key == "dt") { int ms; ls >> ms; S.dt.push_back({0, ms}); }
    else if (key == "dt-at") { int f, ms; ls >> f >> ms; S.dt.push_back({f, ms}); }
    else if (key == "keydown" || key == "keyup") { int f; std::string s; ls >> f >> s; S.events.push_back({f, key == "keydown" ? 0 : 1, keysym(s), -1}); }
    else if (key == "click") { int f; ls >> f; S.events.push_back({f, 2, 0, -1}); }
    else if (key == "tdown" || key == "tup") { int t; std::string s; ls >> t >> s; S.timed = true; S.events.push_back({0, key == "tdown" ? 0 : 1, keysym(s), t}); }
    else if (key == "tclick") { int t; ls >> t; S.timed = true; S.events.push_back({0, 2, 0, t}); }
    else if (key == "tdump") { int t; std::string p; ls >> t >> p; S.tdumps[t] = p; }
    else if (key == "until") ls >> S.until;
    else if (key == "niveaumax") ls >> S.niveauMax;
    else if (key == "dump") { int f; std::string p; ls >> f >> p; S.dumps[f] = p; }
    else if (key == "dumpall") { ls >> S.dumpDir >> S.dumpEvery; }
    else { fprintf(stderr, "unknown directive: %s\n", line.c_str()); exit(2); }
  }
  std::stable_sort(S.events.begin(), S.events.end(), [](const Ev &a, const Ev &b) { return S.timed ? a.time < b.time : a.frame < b.frame; });
  std::stable_sort(S.dt.begin(), S.dt.end(), [](const std::pair<int,int> &a, const std::pair<int,int> &b) { return a.first < b.first; });
}

static int dt_for(int frame) {
  int ms = 16;
  for (auto &d : S.dt) if (d.first <= frame) ms = d.second;
  return ms;
}

// ---- virtual time, scripted events, logged random numbers -------------------------------------------------------------------------------

static Uint32 g_ticks = 1000;   // the virtual SDL_GetTicks
static int g_frame = 0;          // frames recorded so far
static size_t g_next_event = 0;
static bool g_running = false;   // false while the program is loading
static std::vector<int> g_rand_log;

// The game's calls to SDL_GetTicks and SDL_Delay are renamed to these by build.sh (-DSDL_GetTicks=rili_GetTicks ...); SDL's own calls to them, from
// its timer thread, keep the real ones. The others are wrapped at link time (-Wl,--wrap), which nothing inside SDL calls.
extern "C" {
Uint32 rili_GetTicks(void) { return g_ticks; }
void rili_Delay(Uint32 ms) { g_ticks += ms; }
int __real_rand(void);
int __wrap_rand(void) { int v = __real_rand(); g_rand_log.push_back(v); return v; }

int __real_SDL_PollEvent(SDL_Event *event);
int __wrap_SDL_PollEvent(SDL_Event *event) {
  if (!g_running || g_next_event >= S.events.size()) return 0;
  if (S.timed ? S.events[g_next_event].time > (int)g_ticks : S.events[g_next_event].frame > g_frame) return 0;
  const Ev &e = S.events[g_next_event++];
  memset(event, 0, sizeof(*event));
  if (e.type == 2) {
    event->type = SDL_MOUSEBUTTONDOWN; event->button.state = SDL_PRESSED; event->button.button = SDL_BUTTON_LEFT;
  } else {
    event->type = e.type == 0 ? SDL_KEYDOWN : SDL_KEYUP;
    event->key.state = e.type == 0 ? SDL_PRESSED : SDL_RELEASED;
    event->key.keysym.sym = (SDLKey)e.sym;
    event->key.keysym.unicode = (e.sym >= 32 && e.sym < 127) ? e.sym : 0;
  }
  return 1;
}

// The dummy video driver says 8 bits; the game refuses that. It is given a 32-bit surface and the information to match.
SDL_VideoInfo *g_info = NULL;
const SDL_VideoInfo *__real_SDL_GetVideoInfo(void);
const SDL_VideoInfo *__wrap_SDL_GetVideoInfo(void) {
  if (!g_info) {
    g_info = (SDL_VideoInfo *)calloc(1, sizeof(SDL_VideoInfo));
    const SDL_VideoInfo *real = __real_SDL_GetVideoInfo();
    if (real) *g_info = *real;
    g_info->vfmt = SDL_GetVideoSurface()->format;
    g_info->blit_hw_A = 0;
  }
  return g_info;
}
SDL_Surface *__real_SDL_SetVideoMode(int width, int height, int bpp, Uint32 flags);
SDL_Surface *__wrap_SDL_SetVideoMode(int width, int height, int, Uint32) { return __real_SDL_SetVideoMode(width, height, 32, SDL_SWSURFACE); }
}

// ---- the frame: state, drawing list, pixels --------------------------------------------------------------------------------------------

static uint64_t fnv(const uint8_t *p, size_t n, uint64_t h = 14695981039346656037ULL) {
  for (size_t i = 0; i < n; i++) { h ^= p[i]; h *= 1099511628211ULL; }
  return h;
}
static uint32_t fbits(float f) { uint32_t u; memcpy(&u, &f, 4); return u; }

static std::vector<uint8_t> rgba_of(SDL_Surface *s) {
  std::vector<uint8_t> out((size_t)s->w * s->h * 4);
  SDL_LockSurface(s);
  for (int y = 0; y < s->h; y++) {
    const uint8_t *row = (const uint8_t *)s->pixels + (size_t)y * s->pitch;
    for (int x = 0; x < s->w; x++) {
      uint32_t px; memcpy(&px, row + x * s->format->BytesPerPixel, 4);
      uint8_t r, g, b; SDL_GetRGB(px, s->format, &r, &g, &b);
      uint8_t *o = &out[((size_t)y * s->w + x) * 4];
      o[0] = r; o[1] = g; o[2] = b; o[3] = 255;
    }
  }
  SDL_UnlockSurface(s);
  return out;
}

static void write_file(const std::string &path, const std::vector<uint8_t> &bytes) {
  FILE *f = fopen(path.c_str(), "wb");
  if (!f) { fprintf(stderr, "cannot write %s\n", path.c_str()); exit(2); }
  fwrite(bytes.data(), 1, bytes.size(), f);
  fclose(f);
}

static void record_frame() {
  std::string j;
  char b[256];
  Loco &L = Jeu.Lo;
  int rem = 0;
  for (int i = 0; i < LT * HT; i++) if (Jeu.T[i] == C_Wagon) rem++;
  snprintf(b, sizeof b, "{\"k\":\"g\",\"f\":%d,\"t\":%u,\"hor\":%d,\"dg\":%ld,\"D\":%u,\"cell\":%d,\"exit\":%d,\"ploco\":%d,\"nw\":%d,\"rem\":%d,", g_frame, g_ticks, Horloge, Jeu.DureeJeu,
           fbits(L.D), L.T[L.PLoco].P, L.T[L.PLoco].Sortie, L.PLoco, L.NWagon, rem);
  j += b;
  snprintf(b, sizeof b, "\"score\":%d,\"lives\":%d,\"spacing\":%u,\"speed\":%.17g,\"vit\":%.17g,", Pref.Score, Pref.NVie, fbits(Pref.EcartWagon), Pref.VitesseMoy, Pref.Vitesse);
  j += b;
  snprintf(b, sizeof b, "\"mort\":%d,\"won\":%d,\"keys\":[%d,%d,%d,%d],\"pinter\":%d,\"pentree\":%d,\"pause\":%d,\"help\":%d,\"key\":%d,\"masque\":%d,", L.Mort, L.Gagne ? 1 : 0,
           Jeu.Touche[0], Jeu.Touche[1], Jeu.Touche[2], Jeu.Touche[3], L.PInter, L.PEntree, Jeu.Pause ? 1 : 0, Jeu.Help ? 1 : 0, Jeu.Key, MasqueK);
  j += b;
  snprintf(b, sizeof b, "\"alonge\":%ld,\"reduit\":%ld,\"vitesse\":%ld,\"memo\":%u,", L.Alonge, L.Reduit, L.Vitesse, fbits(L.MemoDuree));
  j += b;
  j += "\"types\":[";
  for (int i = 0; i < L.NWagon; i++) { snprintf(b, sizeof b, "%s%d", i ? "," : "", (int)L.Wagon[i]); j += b; }
  j += "],\"pw\":[";
  for (int i = 0; i < L.NWagon; i++) { snprintf(b, sizeof b, "%s[%d,%d,%d,%d]", i ? "," : "", L.PosWagon[i].dx, L.PosWagon[i].dy, L.PosWagon[i].fx, L.PosWagon[i].fy); j += b; }
  j += "],";
  std::vector<uint8_t> board(LT * HT);
  for (int i = 0; i < LT * HT; i++) board[i] = (uint8_t)Jeu.T[i];
  snprintf(b, sizeof b, "\"board\":\"%016llx\",", (unsigned long long)fnv(board.data(), board.size()));
  j += b;
  if (getenv("RILI_BOARD")) { j += "\"boardhex\":\""; for (int i = 0; i < LT * HT; i++) { snprintf(b, sizeof b, "%02x", board[i]); j += b; } j += "\","; }
  j += "\"rand\":[";
  for (size_t i = 0; i < g_rand_log.size(); i++) { snprintf(b, sizeof b, "%s%d", i ? "," : "", g_rand_log[i]); j += b; }
  j += "],\"snd\":[";
  for (size_t i = 0; i < g_sound_log.size(); i++) { j += (i ? ",\"" : "\"") + g_sound_log[i] + "\""; }
  j += "],\"draws\":[";
  Ecran &E = Ec[Jeu.NumVideo];
  for (int i = 0; i < E.N; i++) {
    const s_Ecran &d = E.B[i];
    if (d.NumSpr == corde) snprintf(b, sizeof b, "%s[%d,%d,%d,%d,%d,%d]", i ? "," : "", (int)d.NumSpr, d.Num, d.x, d.y, d.fx, d.fy);
    else snprintf(b, sizeof b, "%s[%d,%d,%d,%d]", i ? "," : "", (int)d.NumSpr, d.Num, d.x, d.y);
    j += b;
  }
  j += "]";
  std::vector<uint8_t> px = rgba_of(sdlVideo);
  snprintf(b, sizeof b, ",\"px\":\"%016llx\"", (unsigned long long)fnv(px.data(), px.size()));
  j += b;
  j += "}\n";
  fputs(j.c_str(), stdout);

  if (S.dumps.count(g_frame)) write_file(S.dumps[g_frame], px);
  if (S.tdumps.count((int)g_ticks)) write_file(S.tdumps[(int)g_ticks], px);
  if (S.dumpEvery > 0 && g_frame % S.dumpEvery == 0) write_file(S.dumpDir + "/frame-" + std::to_string(g_frame) + ".rgba", px);

  g_rand_log.clear();
  g_sound_log.clear();
}

// The other screens that the game goes through (the quiz after a won level, the table of the best scores) are loops of their own in menu.cc, each ending a pass with SDL_Flip.
// While one of them runs, g_phase says which, and every flip after the first (which clears the screen) is a frame of it.
static int g_phase = 0;        // 0 the game, 1 the quiz, 2 the scores, 3 the menus (a scenario of mode menu), 4 the menu inside the game
static int g_phase_flips = 0;
static bool g_in_game = false; // Jeux::SDLMain is running (in mode menu, whose flips are the menus' unless the game says otherwise)

// after a frame has been recorded: the clock moves on if the scenario says frames are longer, and the run ends when it has gone far enough
static void end_of_frame() {
  g_frame++;
  int next = dt_for(g_frame - 1);
  if (next > 16) g_ticks += next;
  if (S.until > 0 ? (int)g_ticks >= S.until : g_frame >= S.frames) {
    printf("{\"end\":true,\"frames\":%d,\"t\":%u}\n", g_frame, g_ticks);
    fflush(stdout);
    _exit(0);
  }
}
static void record_menu_frame() {
  std::string j;
  char b[256];
  snprintf(b, sizeof b, "{\"k\":\"%c\",\"f\":%d,\"t\":%u,\"hor\":%d,\"score\":%d,\"lives\":%d,\"pye\":%d,\"ne\":%d,", g_phase == 1 ? 'q' : g_phase == 3 ? 'm' : g_phase == 4 ? 'i' : 's', g_frame, g_ticks, Horloge, Pref.Score, Pref.NVie, MenuPrincipale.PyE, MenuPrincipale.NumEc);
  j += b;
  j += "\"sco\":[";
  for (int i = 0; i < 8; i++) { snprintf(b, sizeof b, "%s[%d,\"%s\"]", i ? "," : "", Pref.Sco[i].Score, Pref.Sco[i].Name); j += b; }
  j += "],\"rand\":[";
  for (size_t i = 0; i < g_rand_log.size(); i++) { snprintf(b, sizeof b, "%s%d", i ? "," : "", g_rand_log[i]); j += b; }
  j += "],\"snd\":[";
  for (size_t i = 0; i < g_sound_log.size(); i++) { j += (i ? ",\"" : "\"") + g_sound_log[i] + "\""; }
  j += "],\"draws\":[";
  Ecran &E = Ec[MenuPrincipale.NumEc];
  for (int i = 0; i < E.N; i++) {
    const s_Ecran &d = E.B[i];
    snprintf(b, sizeof b, "%s[%d,%d,%d,%d]", i ? "," : "", (int)d.NumSpr, d.Num, d.x, d.y);
    j += b;
  }
  j += "]";
  std::vector<uint8_t> px = rgba_of(sdlVideo);
  snprintf(b, sizeof b, ",\"px\":\"%016llx\"", (unsigned long long)fnv(px.data(), px.size()));
  j += b;
  j += "}\n";
  fputs(j.c_str(), stdout);
  if (S.dumps.count(g_frame)) write_file(S.dumps[g_frame], px);
  if (S.tdumps.count((int)g_ticks)) write_file(S.tdumps[(int)g_ticks], px);
  if (S.dumpEvery > 0 && g_frame % S.dumpEvery == 0) write_file(S.dumpDir + "/frame-" + std::to_string(g_frame) + ".rgba", px);
  g_rand_log.clear();
  g_sound_log.clear();
}

// A frame of the game is one pass of the loop of Jeux::SDLMain, which ends with AfficheEcran (draws the train, the objects and the board into Ec[NumVideo]) and
// SDL_Flip. AfficheEcran itself cannot be wrapped (SDLMain calls it inside jeux.cc, so the linker never sees the call), but it calls Ecran::AfficheOptions, once, and
// nothing else does: that marks the pass. The flips made while a level is set up, and those of the menus, do not follow it and are not frames.
static bool g_pending_frame = false;
extern "C" {
eMenu __real__ZN4Menu10SDLMain_HREv(Menu *self);
eMenu __wrap__ZN4Menu10SDLMain_HREv(Menu *self) {
  int old = g_phase;
  g_phase = 1; g_phase_flips = 0;
  eMenu r = __real__ZN4Menu10SDLMain_HREv(self);
  g_phase = old;
  return r;
}
// the menu that Escape opens in the middle of a game (Continue, Options, Exit game)
eMenu __real__ZN4Menu14SDLMain_InGameEv(Menu *self);
eMenu __wrap__ZN4Menu14SDLMain_InGameEv(Menu *self) {
  int old = g_phase;
  g_phase = 4; g_phase_flips = 0;
  eMenu r = __real__ZN4Menu14SDLMain_InGameEv(self);
  g_phase = old;
  return r;
}
void __real__ZN5Ecran14AfficheOptionsEii(Ecran *self, int vies, int score);
void __wrap__ZN5Ecran14AfficheOptionsEii(Ecran *self, int vies, int score) {
  g_pending_frame = true;
  __real__ZN5Ecran14AfficheOptionsEii(self, vies, score);
}

// The double-buffered surface: the buffer being drawn on holds what was on screen two flips ago.
static std::vector<uint8_t> g_other;
int __real_SDL_Flip(SDL_Surface *screen);
int __wrap_SDL_Flip(SDL_Surface *screen) {
  size_t n = (size_t)screen->pitch * screen->h;
  if (g_pending_frame) {
    g_pending_frame = false;
    if (g_running) { record_frame(); end_of_frame(); }
  }
  else if (g_phase == 3 && g_running && !g_in_game) { record_menu_frame(); end_of_frame(); }   // the menus' own loops: every flip is a frame
  else if (g_phase && g_phase != 3 && g_running && g_phase_flips++ > 0) { record_menu_frame(); end_of_frame(); }
  if (g_other.size() != n) g_other.assign(n, 0);
  std::vector<uint8_t> shown((uint8_t *)screen->pixels, (uint8_t *)screen->pixels + n);
  memcpy(screen->pixels, g_other.data(), n);
  g_other.swap(shown);
  return 0;
}
}

// ---- start-up, as main() does it ---------------------------------------------------------------------------------------------------------

static int language_index(const std::string &code) {
  // language.dat lists the file names ("language.En" ...) after a 6-byte header
  std::string want = std::string("language.") + (char)toupper(code[0]) + (char)tolower(code[1]);
  for (int i = 0; i < Pref.NLangues; i++) if (want == Langue[i]) return i;
  return -1;
}

#define TRACE(msg) do { if (getenv("RILI_TRACE")) fprintf(stderr, "[oracle] %s\n", msg); } while (0)

int main(int argc, char **argv) {
  if (argc < 2) { fprintf(stderr, "usage: rili-oracle scenario.txt\n"); return 2; }
  load_scenario(argv[1]);

  TRACE("scenario read");
  InitPref();
  TRACE("InitPref");
  Pref.Langue = -1;
  if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER | SDL_INIT_NOPARACHUTE) < 0) { fprintf(stderr, "SDL_Init: %s\n", SDL_GetError()); return 2; }
  sdlVideo = SDL_SetVideoMode(800, 600, 32, SDL_SWSURFACE | SDL_DOUBLEBUF);
  if (!sdlVideo) { fprintf(stderr, "no video: %s\n", SDL_GetError()); return 2; }
  sdlVideoInfo = (SDL_VideoInfo *)SDL_GetVideoInfo();
  SDL_ShowCursor(0);
  SDL_EnableUNICODE(1);
  TRACE("video mode set");
  FontColor = SDL_MapRGB(sdlVideo->format, 128, 128, 128);

  // the language: LoadSprites loads the language file when Pref.Langue is set, but the names are only known once language.dat is read,
  // so read the names the same way LoadSprites does and set the choice first (a language chosen in the original's menu is stored the same way)
  {
    char path[512] = "language.dat";
    GetPath(path);
    unsigned char *Buf;
    long L = ChargeFichier(path, Buf);
    if (L <= 0) return 2;
    Pref.NLangues = (int)Buf[4] * 256 + Buf[5];
    long P = 6;
    for (int i = 0; i < Pref.NLangues; i++) { strcpy(Langue[i], (char *)(Buf + P)); P += strlen((char *)(Buf + P)) + 1; }
    delete[] Buf;
    Pref.Langue = language_index(S.language);
    if (Pref.Langue < 0) { fprintf(stderr, "no language %s\n", S.language.c_str()); return 2; }
  }

  TRACE("language chosen");
  Sons.Init();
  if (LoadSprites() == false) return 2;
  TRACE("sprites loaded");
  if (Niveau.Load() == false) return 2;
  TRACE("levels loaded");
  Sons.PlayMusic();
  Sourie.InitStart();

  HorlogeAvant = Horloge = (int)g_ticks;
  srand(S.seed);
  g_rand_log.clear();
  g_sound_log.clear();

  Pref.Difficulte = S.difficulty;
  Pref.Niveau = S.level - 1;
  Pref.NiveauMax = S.niveauMax;
  g_running = true;
  TRACE("starting the game");
  if (S.mode == "game") {
    Sons.LoadMusic(1);  // main() does this before Jeux::SDLMain
    g_sound_log.clear();
    eMenu r = Jeu.SDLMain();
    if (r == mScoreEdit) {
      g_phase = 2; g_phase_flips = 0;
      MenuPrincipale.SDLMain_Score(true);
      g_phase = 0;
    }
  } else if (S.mode == "menu") {
    // main.cc's loop over the menus and the game, from the main menu
    g_phase = 3;
    eMenu RetM, RetMenu = mMenu;
    do {
      switch (RetMenu) {
      case mMenu: RetM = MenuPrincipale.SDLMain(); break;
      case mOption: RetM = MenuPrincipale.SDLMain_Options(); break;
      case mScoreEdit: RetM = MenuPrincipale.SDLMain_Score(true); break;
      case mScore: RetM = MenuPrincipale.SDLMain_Score(); break;
      case mMenuSpeed: RetM = MenuPrincipale.SDLMain_Speed(); break;
      case mMenuNiveau: RetM = MenuPrincipale.SDLMain_Niveau(); break;
      case mJeux: Sons.LoadMusic(1); g_in_game = true; RetM = Jeu.SDLMain(); g_in_game = false; Sons.LoadMusic(0); break;
      default: RetM = mQuit;
      }
      RetMenu = RetM;
    } while (RetMenu != mQuit);
  } else {
    fprintf(stderr, "mode %s is not implemented\n", S.mode.c_str());
    return 2;
  }
  printf("{\"end\":true,\"returned\":true,\"frames\":%d}\n", g_frame);
  return 0;
}
