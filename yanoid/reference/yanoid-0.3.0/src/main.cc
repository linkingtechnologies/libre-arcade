/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
    Copyright (C) 2001 contributers of the yanoid project
    Please see the file "AUTHORS" for a list of contributers

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/
/* This is the main file for yanoid. It performs the following:

-3) Initialize the log system
-2) Print version information
-1) Initialize ressource management systems
0) Initialize SDL (and, potentially other libs)
1) Initialize video
2) Initialize audio
3) 
4) Perform the main menu/game loop
5) Shutdown (Delete ressources) */

#undef NO_MUSIC_THREAD

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <iostream>
#include <signal.h>

#include <SDL/SDL.h>

#include "debug.hh"
#include "log.hh"
#include "screen.hh"
#include "ressourcemanager.hh"
#include "surfacemanager.hh"
#include "musicmanager.hh"
#include "soundmanager.hh"
#include "fontmanager.hh"
#include "ConsoleSource/CON_console.h"
#include "game.hh"
#include "display.hh"
#include "client.hh"
#include "highscore.hh"
#include "interprenter.hh"
#include "entity.hh"
#include "pixmap_entity.hh"
#include "more_entities.hh"

/* **********************************************************************
 * A handler for segmentation errors 
 * *********************************************************************/
void SignalHandler(int signal) {
  cerr << "Received signal " << signal << endl; 
  BackTrace();
  exit(-1);
}

/* **********************************************************************
 * Various commands for the console
 * *********************************************************************/

/* Calls the python interprenter */
void Python(char * String) {
  Assert(String != NULL, "Python - NULL string");
  Interprenter->RunSimpleString(String);
}


/* Load a map */
void LoadMap(char * map) {
  if (!Client || !(Client->GetGame())) { 
    CON_ConOut("Hmm - no client, or no game...");
  };
  if (Client->GetGame()->LoadMap(map)) {
    CON_ConOut("Map %s succesfully loaded", map);
  } else {
    CON_ConOut("Error loading map %s", map);
  }
}

/* Prints the string you pass it into the console */
void PrintMe(char *String)
{
  CON_ConOut("%s", String);
}

/* Lets the user change the alpha level */
void AlphaChange(char *alpha)
{
  if (strlen(alpha) > 0) {
    CON_ConsoleAlpha(atoi(alpha));
    CON_ConOut("Alpha set to %s.", alpha);
  } else {
    CON_ConOut("Usage: alpha <value> - where 0 <= value < 255");
  }
}

/* Toogle cheating */
void Help(char * arg) {

  CON_ConOut("--------------------------------------------------------");
  CON_ConOut("Available commands:");
  CON_ConOut("");
  CON_ConOut("help               :  show help");
  CON_ConOut("highscore [show]   :  show/hide(no arg) highscore");
  CON_ConOut("loadmap <map path> :  load the map");
  CON_ConOut("                      ex. loadmap maps/map1.py");
  CON_ConOut("i <python command> :  run a python command");
  CON_ConOut("alpha <value>      :  set the alpha value of the console");
  CON_ConOut("printme <string>   :  print a string to console");
#ifdef DEBUG
  CON_ConOut("togglecheat        :  ball can not be lost");
  CON_ConOut("duplogtoconsole    :  print all log to console");
#endif
  CON_ConOut("--------------------------------------------------------");
}

#ifdef DEBUG
/* Toogle cheating */
void ToggleCheat(char * arg) {
  hole_bounces = !hole_bounces;
  if (hole_bounces) {
    CON_ConOut("Cheat mode enabled");
  } else {
    CON_ConOut("Cheat mode disabled");
  }
}

/* Dup to console or not */
void DupLogToConsole(char * arg) {
  duptoconsole = !duptoconsole;
  if (duptoconsole) {
    CON_ConOut("Logging information dupped to console");
  } else {
    CON_ConOut("Logging information not dupped to console");
  }
}
#endif

/* Show/hide highscore */
void DisplayHighscore(char *arg)
{
string _arg(arg);
  if (_arg == "show")
    Highscore->displayRankings();
  else
    Highscore->displayNone();

  CON_ConOut("Highscore %s",arg);
}


/* **********************************************************************
 * The main program. Yuhu.
 * *********************************************************************/

int main(int argc, char ** argv) {
  /* **********************************************************************
   * Initialize the logging stuff, if present
   * *********************************************************************/
#ifdef DEBUG
  Log = new TLog();
  Assert(Log != NULL, "Unable to create Log object");
  LogLine(LOG_VERBOSE, "Log object created");
  LogLineExt(LOG_INFO, ("Created object %i", 34));
#endif

  /* **********************************************************************
   * Hangle signals *
   * *********************************************************************/
  signal(SIGSEGV, SignalHandler);


  /* **********************************************************************
   * Print our version, and so on.
   * *********************************************************************/
  cout << "Yet Another Arkanoid (yanoid) version " << VERSION << endl
       << "Copyright (C) 2001 Mads Bondo Dydensborg "
       << "<mads@dydensborg.dk>" << endl 
       << "Copyright (C) 2001 Jonas Christian Drewsen "
       << "<jcd@xspect.dk>" << endl 
       << "Copyright (C) 2001 Bjarke Soerensen "
       << "<bs@wasd.dk" << endl 
       << "Yet Another Arkanoid comes with ABSOLUTLY NO WARRANTY." << endl
       << "This is free software, and you are welcome to "
       << "redistribute it" << endl 
       << "under certain conditions. See the file COPYING for details." 
       << endl;

  /* **********************************************************************
   * Initialize the ressource management system
   * *********************************************************************/
  PathManager = new TPathManager();
  Assert(PathManager != NULL, "Unable to create pathmanager");
  LogLine(LOG_VERBOSE, "PathManager created");

  /* Add default datapaths */
  PathManager->AddPath(YANOID_DATADIR);
  PathManager->AddPath("data");
  
  /* **********************************************************************
   * Initialize the interprenter (uses the pathmanager)
   * Note, the default scripts and other related stuff, is not
   * run, until we have initialized the console
   * *********************************************************************/
  Interprenter = new TInterprenter();
  LogLine(LOG_VERBOSE, "Interprenter created");

  /* **********************************************************************
   * Initialize SDL
   * *********************************************************************/
#ifdef NO_MUSIC_THREAD
  if (SDL_Init(SDL_INIT_VIDEO) != 0) {
#else 
  if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) != 0) {
#endif
    LogFatal("Unable to initialize SDL: " << SDL_GetError());
    return -1;
  }
  /* Make sure it is shutdown, when we exit */
  Assert(0 == atexit(SDL_Quit), 
	 "Unable to register SDL_Quit with atexit");
  LogLine(LOG_VERBOSE, "SDL initialized");
  /* Set a caption */
  SDL_WM_SetCaption("-- Yanoid --", 0);

  /* **********************************************************************
   * Setup the screen. Resolution is fixed at the moment.
   * Colourdepth is 0 == use current
   * *********************************************************************/
  Screen = SDL_SetVideoMode(800, 600, 0, 
			    SDL_HWSURFACE | SDL_DOUBLEBUF
			    // SDL_HWSURFACE | SDL_DOUBLEBUF | SDL_FULLSCREEN
			    // SDL_SWSURFACE | SDL_DOUBLEBUF | SDL_FULLSCREEN
			    );
  // | SDL_FULLSCREEN);
  Assert(Screen != NULL, "Unable to set video mode");

#ifdef DEBUG
  string tmp = "";
  if (SDL_FULLSCREEN & Screen->flags) {
    tmp += "SDL_FULLSCREEN ";
  }
  if (SDL_HWSURFACE & (Screen->flags)) {
    tmp += "SDL_HWSURFACE ";
  }
  if (SDL_SWSURFACE & (Screen->flags)) {
    tmp += "SDL_SWSURFACE ";
  }
  if (SDL_DOUBLEBUF & Screen->flags) {
    tmp += "SDL_DOUBLEBUF ";
  }
  LogLineExt(LOG_VERBOSE, ("Videomode set (%ix%i - %s)", 
			   Screen->w, Screen->h, tmp.c_str()));
#endif

  /* Hide the mouse */
  SDL_ShowCursor(SDL_DISABLE);

  /* **********************************************************************
   * Setup the audio. wave configuration is fixed at the moment.
   * *********************************************************************/

  // open 11025 Hz, 8-bit, 1 channel, 512 chunksize
#ifndef NO_MUSIC_THREAD
  Assert( Mix_OpenAudio(11025, AUDIO_U8, 1, 256) >= 0 , 
	  "Unable to set audio mode");
  LogLine(LOG_VERBOSE, 
	  "Audiomode set (11025 Hz, 8-bit, 1 ch, 256 byte chunks)");
#endif
  /* **********************************************************************
   * Initialize the surface manager (requires SDL to be initialized and 
   * the video mode to be set!)
   * *********************************************************************/

  SurfaceManager = new TSurfaceManager();
  Assert(PathManager != NULL, "Unable to create SurfaceManager");
  LogLine(LOG_VERBOSE, "SurfaceManager Initialized");

  /* **********************************************************************
   * Initialize the music manager (requires SDL to be initialized and 
   * the audio mode to be set!)
   * *********************************************************************/

#ifndef NO_MUSIC_THREAD
  MusicManager = new TMusicManager();
  Assert(MusicManager != NULL, "Unable to create MusicManager");
  LogLine(LOG_VERBOSE, "MusicManager Initialized");

  /* A small MOD test */
  Mix_Music * modmusic
    = MusicManager->RequireRessource("music/yanoid.xm");
  Assert(NULL != modmusic, "Error getting Mix_Music *");

#endif
  /* **********************************************************************
   * Initialize the sound manager
   * *********************************************************************/
  SoundManager = new TSoundManager();
  Assert(SoundManager != NULL, "Unable to create SoundManager");
  LogLine(LOG_VERBOSE, "SoundManager Initialized");
  

  /* **********************************************************************
   * Initialize the FontManager
   * *********************************************************************/
  FontManager = new TFontManager();
  Assert(FontManager != NULL, "Unable to create FontManager");
  LogLine(LOG_VERBOSE, "FontManager Initialized");
  
  /* **********************************************************************
   * Initialize the console (requires SDL to be initialized )
   * *********************************************************************/

  SDL_Rect Con_Init = { 0, 0, 800, 300 };
  
  /* Init the console */
  // hacky
  Assert(CON_ConsoleInit(PathManager->Resolve("graphics/fonts/ConsoleFont.png").c_str(), 
			 Screen, 100, Con_Init) == 0,
	 "Unable to initialize console");
  
  /* Add some commands to the console */
  CON_AddCommand(&Help,      "help");
  CON_AddCommand(&Help,      "?");
  CON_AddCommand(&AlphaChange,      "alpha");
#ifdef DEBUG
  CON_AddCommand(&DupLogToConsole,  "duplogtoconsole");
  CON_AddCommand(&ToggleCheat,      "togglecheat");
#endif
  CON_AddCommand(&DisplayHighscore, "highscore");
  CON_AddCommand(&Python,           "i");
  CON_AddCommand(&LoadMap,          "loadmap");
  CON_AddCommand(&PrintMe,          "printme");
  
  CON_ListCommands();
  
  CON_ConsoleAlpha(190);

  /* **********************************************************************
   * Add default modules, run default script
   * *********************************************************************/

  TMap::AddModule();
  TGame::AddModule();
  TClient::AddModule();
  Interprenter->LoadDefaultScripts();
  /* Dump the Interprenter help to the console */
  Interprenter->RunSimpleString("help()");
  
  /* **********************************************************************
   * Initialize Display and client;
   * *********************************************************************/
  Client    = new TClient();
  Display   = new TDisplay();
  Highscore = new THighscore(Screen->w / 2  - 160, Screen->h / 2 - 150);

  /* **********************************************************************
   * Load and display a splash screen.
   * *********************************************************************/
  Splash = SurfaceManager->RequireRessource("graphics/yanoid.png");
  Assert(NULL != Splash, "Error getting SDL_Surface for splash screen");
  SDL_Rect src, dest, erasedest;
  src.x = 0; src.y = 0; src.w = Splash->w; src.h = Splash->h;

  // scroll down splash
  for(int i=0 ; i < (Screen->h-src.h)/32; i++) {
    dest.y = (i*32)/2; 
    dest.x = (Screen->w-src.w)/2;
    dest.w = src.w; dest.h = src.h;
    erasedest = dest;
    erasedest.y = ((i-1)*32)/2;
    SDL_FillRect(Screen, &erasedest, 0x00000000);
    SDL_BlitSurface(Splash, &src, Screen, &dest);
    //    SDL_UpdateRect(Screen, 0, 0, 0, 0);
    SDL_Flip(Screen);
  }

  /* Start the music */
#ifndef NO_MUSIC_THREAD
  // Test the MOD music
  if ( ! Mix_PlayingMusic() ) {
    Mix_PlayMusic(modmusic, -1);
  }

  // Test the ogg vorbis music
  if ( ! Mix_PlayingMusic() ) {
    //    Mix_PlayMusic(oggmusic, 0);
  }
#endif 

  /* Let the impression sink in... ;-) */
  SDL_Delay(2000);

  // scroll up splash to make room for menu
  int endi = dest.y - 50;
  for(int i=0 ; i < endi/8; i++) {
    erasedest = dest;
    dest.y -= 8; 
    dest.x = (Screen->w-src.w)/2;
    dest.w = src.w; dest.h = src.h;
    SDL_FillRect(Screen, &erasedest, 0x00000000);
    SDL_BlitSurface(Splash, &src, Screen, &dest);
    //    SDL_UpdateRect(Screen, 0, 0, 0, 0);
    SDL_Flip(Screen);
  }

  /* Run the client */
  Client->Run();

  /* Delete various stuff */
  delete Display;
  delete Highscore;
  delete Client;
  
  // TODO: Freeing surface, etc.
  SurfaceManager->ReleaseRessource(Splash);
  MusicManager->ReleaseRessource(modmusic);
  /* **********************************************************************
   * Exit gracefully
   * *********************************************************************/
  LogLine(LOG_VERBOSE, "Deleting SoundManager");
  delete SoundManager;
  LogLine(LOG_VERBOSE, "Deleting MusicManager");
  delete MusicManager;
  LogLine(LOG_VERBOSE, "Deleting FontManager");
  delete FontManager;
  LogLine(LOG_VERBOSE, "Deleting SurfaceManager");
  delete SurfaceManager;
  LogLine(LOG_VERBOSE, "Deleting PathManager");
  delete PathManager;
  LogLine(LOG_VERBOSE, "Deleting Interprenter");
#ifdef DEBUG
  LogLine(LOG_VERBOSE, "Deleting Log object - Exiting gracefully");
  delete Log;
#endif

  /* Print bye */
  cout << "Thank you for playing Yanoid - see you soon!" << endl;
 
  return 0;
}
