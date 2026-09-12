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
#include "client.hh"

#include "log.hh"
#include "debug.hh"
#include "screen.hh"
#include "interprenter.hh"
#include "ConsoleSource/CON_console.h"
#include "game.hh"
#include "display.hh"

#include "menu.hh"
#include "highscore.hh"

#include "motion.hh"
#include "texteffects.hh"
#include "ConsoleSource/DT_drawtext.h"
#include "soundmanager.hh"

#include "entity.hh"
#include "pixmap_entity.hh"
#include "more_entities.hh"

/* **********************************************************************
 * A method to play a sound from scripts
 * *********************************************************************/
static PyObject * PlaySound(PyObject * self, PyObject * args) {
  char * soundname;
  if (!PyArg_ParseTuple(args, "s", &soundname)) {
    return NULL;
  }
  SoundManager->PlaySound(soundname);
  return Py_BuildValue("");
}

/* **********************************************************************
 * A method to load (cache) a sound
 * *********************************************************************/
static PyObject * LoadSound(PyObject * self, PyObject * args) {
  char * soundname;
  if (!PyArg_ParseTuple(args, "s", &soundname)) {
    return NULL;
  }
  SoundManager->LoadSound(soundname);
  return Py_BuildValue("");
}


/* **********************************************************************
 * The client method table
 * *********************************************************************/
static PyMethodDef client_methods[] = {
  {"PlaySound", PlaySound, METH_VARARGS},
  {"LoadSound", LoadSound, METH_VARARGS},
  {NULL, NULL}
};

/* **********************************************************************
 * The global client
 * *********************************************************************/
TClient * Client;

/* Setup for max deltaticks */ 
static const Uint32 max_deltaticks = 10;

/* **********************************************************************
 * Constructor, destructor
 * *********************************************************************/
TClient::TClient() : Game(NULL), paused(0) {};

TClient::~TClient() {
  if (Game) {
    delete Game;
  }
}

/* **********************************************************************
 * The pause stuff
 * *********************************************************************/
void TClient::PauseGame() {
  if (0 == paused) {
    pausetime = SDL_GetTicks();
  }
  paused++;
}

void TClient::ContinueGame() {
  paused--;
  if (0 == paused) {
    pausetime = SDL_GetTicks() - pausetime;
    game_start += pausetime;
  }
}
/* **********************************************************************
 * The Stuff to handle modules
 * *********************************************************************/
bool TClient::ModuleAdded = false;

bool TClient::AddModule() {
  if (!ModuleAdded) {
    if (Interprenter->AddModule("yanoid_client", client_methods)) {
      ModuleAdded = true;
    }
  }    
  return ModuleAdded;
}

/* **********************************************************************
 * The next map method loads a map, initializes the game, and 
 * does some other minor things.
 * *********************************************************************/
bool TClient::NextMap() {
  if (!Game) {
    return false;
  }
  fonthandle_t * font 
    = FontManager->RequireRessource("graphics/fonts/LargeFont.png");
  if (!font) {
    return false;
  }
  
  Game->GetState()->MapState->ballbirth = 0;
  game_start      = SDL_GetTicks();
  game_lastupdate = 0;
  LogLine(LOG_VERBOSE, "Game->Update(0)");
  Game->Update(0);
  /* No more shooting */
  Game->GetState()->shot_time_left = 0;
  Game->GetState()->current_shot_time_left = 0;
  if (Game->LoadNextMap()) {
    {
      PauseGame();
      Render();
      TTextEffects tfx(Game->GetState()->MapState->mapname.c_str(), 
		       Screen, font, 
		       TTextEffects::CHARACTER_SPACED_ANIM);
      tfx.setLocation(TPoint((Screen->w -  
			      Game->GetState()->MapState->mapname.size()
			      * DT_FontWidth(*font))/2, 
			     Screen->h / 2));
      tfx.setDuration(1500);
      tfx.start();
      while(!tfx.isStopped()) {
	tfx.update(SDL_GetTicks());
	SDL_Flip(Screen);
      }
      ContinueGame();
    }
    
    
    Game->GetState()->status = TGameState::PLAYING;
    FontManager->ReleaseRessource(font);
    return true;
  } else {
    FontManager->ReleaseRessource(font);
    return false;
  }
}
/* **********************************************************************
 * The Run method
 * Keeps running, until the player exits the client
 * Will (for now) create a default game, if none is present
 * Will load a sample map
 * *********************************************************************/
void TClient::Run() {
  /* The client is a wrapper around the total game. 
     But, there are two types of "games". The whole "session", 
     and a single "game".
     The client represents the session. As long as it is running, 
     something will go onto the screen, input will be handled, etc.
     However, when the client is exicted, the game ends. */
  TPreGameMenu * MyPre = new TPreGameMenu();
  bool QuitClient = !MyPre->Run();

  /* This font is used for the text effects */
  fonthandle_t * font 
    = FontManager->RequireRessource("graphics/fonts/LargeFont.png");
  if (!font) {
    LogFatal("Unable to load highscore font graphics/fonts/LargeFont.png");
    exit(-1);
  }
  
  /* Main loop - never quit the client */
  while(!QuitClient) {
    /* Make sure the console is not down and the game is not paused */
    ConsoleDown = false;
    SDL_EnableUNICODE(0);
    paused = 0;

    /* A new game was started */
    Game = new TGame();
    Assert(Game != NULL, "Could not create a default game");
    /* Load map names from maplist file */
    Interprenter->RunSimpleFile("maps/maplist.py");

    QuitCurrentGame = false; /* May be changed by the in game menu */
    if (!NextMap()) {
      LogLine(LOG_ERROR, "Unable to load any valid map");
      CON_ConOut("Unable to load any valid map");
      QuitCurrentGame = true;
    }
    
    Game->GetState()->MapState->ballbirth = 0;

    /* **********************************************************************
     * Main game loop.
     * *********************************************************************/
    while(!QuitCurrentGame) {
      /* **********************************************************************
       * Update the game state
       * *********************************************************************/
      UpdateGame();

      /* **********************************************************************
       * Display the game state
       * *********************************************************************/
      Render();

      /* **********************************************************************
       * If the console is down, sleep a little
       * *********************************************************************/
      if (ConsoleDown) {
	SDL_Delay(10); /* 10 ms */
      }
      
      /* **********************************************************************
       *  Handle SDL events
       * *********************************************************************/
      HandleEvents();

      switch(Game->GetState()->status) {
      /* **********************************************************************
       * Game Over, display menu (DEAD)
       * *********************************************************************/
      case TGameState::DEAD: {
	/* Uh oh, game is over */
	LogLine(LOG_TODO, "Display some info, update highscore?");
	const char* str = "Game Over";
	TTextEffects tfx(str, Screen, font, TTextEffects::CHARACTER_JUMPING_ANIM);
	tfx.setLocation(TPoint((Screen->w - strlen(str) * DT_FontWidth(*font))/2, Screen->h / 2));
	tfx.setDuration(1500);
	tfx.start();
	while(!tfx.isStopped()) {
	  tfx.update(SDL_GetTicks());
	  SDL_Flip(Screen);
	}
	if (Highscore->isCandidate(Game->GetState()->score)) {
	  Highscore->displayNameInput(Game->GetState()->score);
	  Highscore->Run();
	  Highscore->displayNone();
	}
	//	TGameOverMenu * GameOverMenu = new TGameOverMenu();
	//	GameOverMenu->Run();
	//	delete GameOverMenu;
	QuitCurrentGame = true;
	Game->GetState()->MapState->ballbirth = 0;
	break;
      }
      /* **********************************************************************
       * Ball lost (CUT)
       * *********************************************************************/
      case TGameState::CUT: {
	PauseGame();
	//	TRoundOverMenu * RoundOverMenu = new TRoundOverMenu();
	//	RoundOverMenu->Run();
	//	delete RoundOverMenu;
	const char* str = "You lost the ball..";
	TTextEffects tfx(str, Screen, font, TTextEffects::CHARACTER_SWIRLING_ANIM);
	tfx.setLocation(TPoint((Screen->w - strlen(str) * DT_FontWidth(*font))/2, Screen->h / 2));
	tfx.setDuration(1500);
	tfx.start();
	while(!tfx.isStopped()) {
	  tfx.update(SDL_GetTicks());
	  SDL_Flip(Screen);
	}
	Game->GetState()->MapState->ballbirth = 0;
	/* No more shooting */
	Game->GetState()->shot_time_left = 0;
	Game->GetState()->current_shot_time_left = 0;
	ContinueGame();
	/* Adding a ball is done by calling the RoundStart function */
	if (!Interprenter->RunSimpleString("RoundStart()")) {
	  LogLine(LOG_ERROR, "Error running interprenter -RoundStart()-");
	}
	/* This is a hack to reset the paddle, when a map is done */
	{
	  TEntity * paddle = Game->GetState()->MapState->GetPaddle();
	  if (paddle) {
	    paddle->setX(380.0);
	    paddle->getMotion()->setVelocity( 0.0 );
	    paddle->getMotion()->setAccel( 0.0 );
	  }
	}
	/* Set the game status ... hmm. may not be appropiate */
	LogLine(LOG_VERBOSE, "Setting game to PLAYING state");
	Game->GetState()->status = TGameState::PLAYING;
	break;
      }
      /* **********************************************************************
       * All bricks gone (MAPDONE)
       * *********************************************************************/
      case TGameState::MAPDONE: {
	/* **********************************************************************
	 * Do a text effect that says the level is complete.
	 * *********************************************************************/
	const char* str = "Level complete!";
	TTextEffects tfx(str, Screen, font, 
			 TTextEffects::CHARACTER_SPACED_ANIM);
	tfx.setLocation(TPoint((Screen->w - strlen(str) 
				* DT_FontWidth(*font))/2, 
			       Screen->h / 2 - 40));
	tfx.setDuration(1500);
	tfx.start();
	while(!tfx.isStopped()) {
	  tfx.update(SDL_GetTicks());
	  SDL_Flip(Screen);
	}
	
	/* **********************************************************************
	 * Times below 3 minutes gives a bonus for each second
	 * *********************************************************************/
	int below_par = Game->GetState()->gametime/1000 - 180;
	char msg[25];
	if (below_par < 0) {
	  /* Bonus! */
	  Game->GetState()->score -= 5*below_par;
	  sprintf(msg, "Time bonus %i points", -5*below_par);
	} else {
	  /* No bonus */
	  sprintf(msg, "No time bonus");
	}
	TTextEffects tfx2(msg, Screen, font, 
			  TTextEffects::CHARACTER_SPACED_ANIM);
	tfx2.setLocation(TPoint((Screen->w - strlen(msg) 
				* DT_FontWidth(*font))/2, 
				Screen->h / 2 + 40));
	tfx2.setDuration(1500);
	tfx2.start();
	while(!tfx2.isStopped()) {
	  tfx2.update(SDL_GetTicks());
	  SDL_Flip(Screen);
	}

	/* **********************************************************************
	 * Change maps
	 * *********************************************************************/
	if (!NextMap()) {
	  LogLine(LOG_ERROR, "Unable to load any valid map");
	  CON_ConOut("Unable to load any valid map");
	  QuitCurrentGame = true;
	}
	break;
      }
      case TGameState::PLAYING: ;
      }
    } /* While !QuitCurrentGame */
    delete Game;
    Game = NULL;
    
    QuitClient = !MyPre->Run();    
  } /* While !QuitCurrentClient */

  /* Delete the font */
  FontManager->ReleaseRessource(font);
  
  /* Delete the pre menu */
  delete MyPre;
}

/* **********************************************************************
 * GameUpdate updates the time in the game
 * *********************************************************************/
void TClient::UpdateGame() {

  if (paused > 0) { return; };
  /* Update the deltatick */
  Uint32 deltaticks = SDL_GetTicks() - game_start - game_lastupdate;
  
  /* Update the game state in max_deltaticks ms at a time */
  while (deltaticks > max_deltaticks) {
    game_lastupdate += max_deltaticks;
    Game->Update(game_lastupdate);
    deltaticks -= max_deltaticks;
  }
  if (deltaticks != 0) {
    game_lastupdate += deltaticks;
    Game->Update(game_lastupdate);
  }
}

/* **********************************************************************
 * Render calls the appropiate modules for rendering
 * *********************************************************************/
void TClient::Render() {
  SDL_FillRect(Screen, NULL, SDL_MapRGB(Screen->format, 0, 0, 0));
  Display->Render(Screen);
  SDL_Flip(Screen);
}

/* **********************************************************************
 * HandleEvents handles SDL events.
 * *********************************************************************/
bool TClient::HandleGlobalKeys(SDL_Event * event) {
  switch (event->type) {
  case SDL_KEYDOWN:
    switch (event->key.keysym.sym) {
      /* The in game menu is bound to escape */
    case SDLK_ESCAPE: {	
      TInGameMenu * InGameMenu = new TInGameMenu(this);
      PauseGame();
      QuitCurrentGame = InGameMenu->Run();
      ContinueGame();
      delete InGameMenu;
      return true;
    }
    /* The console is bound to a number of keys */
    case SDLK_BACKQUOTE:
    case SDLK_F1:
    case SDLK_F3:
      ToggleConsole();
      return true;
      /* FullScreenToggle is bound to F11 */
    case SDLK_F11:
      SDL_WM_ToggleFullScreen(Screen);
      return true;
    /* A very non fancy screenshot function */
    case SDLK_F12:
      SDL_LockSurface(Screen);
      SDL_SaveBMP(Screen, "screenshot.bmp");
      SDL_UnlockSurface(Screen);
      return true;
    }
  }
  /* Falling true - unhandled */
  return false;
}

void TClient::HandleEvents() {
  TEntity * paddle = Game->GetState()->MapState->GetPaddle();

  SDL_Event event;
  while (SDL_PollEvent(&event)) {
    /* Check for global events */
    if (HandleGlobalKeys(&event)) {
      break;
    }
    /* Unhandled */
    /* If the console is down send events to it */
    if (ConsoleDown) {
      CON_ConsoleEvents(&event);
    } else {
      /* Treat events */
      switch (event.type) {
      case SDL_KEYDOWN:
	switch (event.key.keysym.sym) {
	case SDLK_LEFT:
	  if (!paddle) break;
	  paddle->getMotion()->setVelocity( -0.4 );
	  paddle->getMotion()->setAccel( -0.002 );
	  if (paddle->getMotion()->getCurrentVelocity() > 0)
	    paddle->getMotion()->setCurrentVelocity(0);
	  // dynamic_cast<TFreeMotion*>(paddle->getMotion())->setDir( 0 );
	  break;
	case SDLK_RIGHT:
	  if (!paddle) break;
	  paddle->getMotion()->setVelocity( 0.4 );
	  paddle->getMotion()->setAccel( 0.002 );	 
	  if (paddle->getMotion()->getCurrentVelocity() < 0)
	    paddle->getMotion()->setCurrentVelocity(0);
	  // dynamic_cast<TFreeMotion*>(paddle->getMotion())->setDir( 0 );
	  break;
	case SDLK_UP:
	  if (!paddle) break;
	  //	  paddle->getMotion()->setVelocity( 0.5 );
	  //	  dynamic_cast<TFreeMotion*>(paddle->getMotion())->setDir( M_PI_2 );	
	  break;
	case SDLK_DOWN:
	  if (!paddle) break;
	  //	  paddle->getMotion()->setVelocity( 0.5 );
	  //	  dynamic_cast<TFreeMotion*>(paddle->getMotion())->setDir( -M_PI_2 );
	  break;
	  // Performing a shot.
	case SDLK_SPACE: {
	  if (!paddle) break;
	  if (!Game) break;
	  /* This is a great example of how _not_ to 
	     do things if you ever want to implement 
	     network support ... */
	  if (Game->GetState()->shot_time_left > 0
	      && Game->GetState()->current_shot_time_left == 0) {
	    /* Arh, the hacks upon hacks */
	    SoundManager->PlaySound("sounds/fire.wav");
	    TEntity * shot 
	      = new TShot(0, 
			  static_cast<int>(paddle->y()),
			  Game->GetState()->shot_pixmap,
			  Game->GetState()->shot_hitfunction,
			  Game->GetState()->shot_type);
	    shot->setX(paddle->x() + (paddle->w() - shot->w())/2.0);
	    Game->GetState()->MapState->Entities.push_back(shot);
	    Game->GetState()->current_shot_time_left = 
	      Game->GetState()->time_between_shots;
	  } 
	  break;}
	}
	break;
      case SDL_KEYUP:
	switch (event.key.keysym.sym) {
	case SDLK_LEFT:
	  if (!paddle) break;
	  // make sure we doesn't stop a movement to the right
	  if(paddle->getMotion()->getVelocity() < 0) {
	    paddle->getMotion()->setVelocity( 0.0 );
	    paddle->getMotion()->setAccel( 0.001 );
	  }
	  break;
	case SDLK_RIGHT:
	  if (!paddle) break;
	  // make sure we doesn't stop a movement to the left
	  if(paddle->getMotion()->getVelocity() > 0) {
	    paddle->getMotion()->setVelocity( 0.0 );
	    paddle->getMotion()->setAccel( -0.001 );
	  }
	  break;
	case SDLK_UP:
	  if (!paddle) break;
	  //	  paddle->getMotion()->setVelocity( 0.0 );
	  break;
	case SDLK_DOWN:
	  if (!paddle) break;
	  //	  paddle->getMotion()->setVelocity( 0.0 );
	  break;
	}
      default:
	break;
      }
    } /* Console up */
  }
}

/* **********************************************************************
 * ToggleConsole - pauses the game, when the console is displayed.
 * *********************************************************************/
void TClient::ToggleConsole() {
  ConsoleDown = !ConsoleDown;
  if (ConsoleDown){
    /* Was up, has been moved down */
    PauseGame();
    SDL_EnableUNICODE(1);
  } else {
    /* Was down, has been moved up */
    SDL_EnableUNICODE(0);
    ContinueGame();
  }
}

/* **********************************************************************
 * ToggleMusic - pauses/resumes the music
 * *********************************************************************/
void TClient::ToggleMusic() {
  if (Mix_PausedMusic()) {
    Mix_RewindMusic();
    Mix_ResumeMusic();
  } else {
    Mix_PauseMusic();
  }
}
