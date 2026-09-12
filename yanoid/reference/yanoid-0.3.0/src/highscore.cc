/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
    Copyright (C) 2001 Jonas Christian Drewsen <jcd@xspect.dk>
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

#include "highscore.hh"
#include "log.hh"
#include "debug.hh"
#include "ressourcemanager.hh"
#include "soundmanager.hh"
#include "fontmanager.hh"
#include "ConsoleSource/DT_drawtext.h"
#include "screen.hh"
#include <iomanip.h>

/* **********************************************************************
 * The global highscore
 * *********************************************************************/

THighscore * Highscore;

/* **********************************************************************
 * The constructor
 * *********************************************************************/

THighscore::THighscore(int x_, int y_): 
  TEntity(x_,y_), DisplayMode(NONE), NumRankings(10),
  close(false), cursorpos_x(0), cursorpos_y(0)
{
  LogLine(LOG_TODO, "Clean up THighscore contructor");
  Rankings.push_back(make_pair(string("BS"),3940)); 
  Rankings.push_back(make_pair(string("JCD"),2370)); 
  Rankings.push_back(make_pair(string("MBD"),1940)); 
  Score s = 42;
  for (int i = 3 ; i < 10 ; ++i) {
    Rankings.push_back(make_pair(string("yaNOID"),s--)); 
  }
  // load font transparent 1, or solid 0
  fontHandle 
    = FontManager->RequireRessource("graphics/fonts/LargeFont.png");
  if (!fontHandle) {
    LogFatal("Unable to load highscore font graphics/fonts/LargeFont.png");
    exit(-1);
  }
  name[0] = '_';
  name[1] = '_';
  name[2] = '_';
  name[3] = 0x00;
}

/* **********************************************************************
 * Destructor, clean up... 
 * *********************************************************************/
THighscore::~THighscore()
{
  FontManager->ReleaseRessource(fontHandle);
  LogLine(LOG_TODO, "Clean up THighscore destructor");
}

/* **********************************************************************
 * Update calculates difference.
 * *********************************************************************/
void THighscore::Update(Uint32 currenttime) {
  static Uint32 lastupdate = 0;
  //  Uint32 deltatime = currenttime - lastupdate;
  lastupdate = currenttime;
}

/* **********************************************************************
 * Run - checks for events, renders the menu, decide it is time to leave.
 * *********************************************************************/
bool THighscore::Run() {
  close = false;
  start_time = SDL_GetTicks();

  LogLine(LOG_VERBOSE, "Capturing the screen");
  /* Copy the screen - make it a background */
  if (DisplayMode == INPUT) {
    background = SDL_CreateRGBSurface(SDL_SRCALPHA, Screen->w, Screen->h, 
				      Screen->format->BitsPerPixel,
				      Screen->format->Rmask,
				      Screen->format->Gmask,
				      Screen->format->Bmask,
				      Screen->format->Amask);
    if (background == NULL) {
      LogLine(LOG_ERROR, "TInGameMenu::Run - unable to create background");
    } else {
      SDL_Rect d;
      d.x = 0; d.y = 0; 
      d.w = background->w;
      d.h = background->h;
      SDL_BlitSurface(Screen, &d, background, &d);
      SDL_SetAlpha(background, SDL_SRCALPHA, 64);
    }
  }else if (DisplayMode == HIGHSCORE) {
    SDL_FillRect(Screen, 0, SDL_MapRGB(Screen->format, 0, 0, 0));
  }

  /* While until the menu is done */
  while(!close) {
    RenderBackground();
    if (DisplayMode != INPUT)
      RenderSplash();
    Render(Screen);
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
      HandleEvent(&event);
    }
    /* Let the system be a little idle, sleep for 10 ms */
    //    SDL_Delay(10);
  }

  return !close;
}


/* **********************************************************************
 * RenderSplash - renders the splash screen
 * *********************************************************************/
void THighscore::RenderSplash() {
    /* Put on the splash screen */
    SDL_Rect src, dest;
    src.x = 0; src.y = 0; src.w = Splash->w; src.h = Splash->h;
    dest.x = (Screen->w-src.w)/2; dest.y = 50; dest.w = src.w; dest.h = src.h;
    SDL_BlitSurface(Splash, &src, Screen, &dest);
}

/* **********************************************************************
 * RenderBackground - renders the background
 * *********************************************************************/
void THighscore::RenderBackground() {
  if (DisplayMode == INPUT) {
    if (background) {
      SDL_FillRect(Screen, NULL, 
		   SDL_MapRGBA(Screen->format, 16, 16, 16, SDL_ALPHA_OPAQUE));
      SDL_Rect d;
      d.x = 0; d.y = 0; 
      d.w = background->w;
      d.h = background->h;
      SDL_BlitSurface(background, &d, Screen, &d);
    } else {
      SDL_FillRect(Screen, NULL, SDL_MapRGB(Screen->format, 0, 0, 0));
    }
  }else if (DisplayMode == HIGHSCORE) {
    SDL_FillRect(Screen, 0, SDL_MapRGB(Screen->format, 0, 0, 0));
  }
}

/* **********************************************************************
 * Handle keypresses (no mouse)
 * *********************************************************************/
bool THighscore::HandleEvent(SDL_Event * event) {
  static int curchar = 0;
  if (SDL_KEYDOWN == event->type) {
    switch (event->key.keysym.sym) {
    case SDLK_DOWN: 
      SoundManager->PlaySound("sounds/menu_move.wav");
      cursorpos_y = (cursorpos_y < 2) ? cursorpos_y+1 : cursorpos_y;
      break;
    case SDLK_UP: 
      SoundManager->PlaySound("sounds/menu_move.wav");
      cursorpos_y = (cursorpos_y > 0) ? cursorpos_y-1 : cursorpos_y;
      break;
    case SDLK_RIGHT: 
      // take special care of End and Del
      SoundManager->PlaySound("sounds/menu_move.wav");
      if (cursorpos_y == 2) {
	if (cursorpos_x == 6 || cursorpos_x == 7) {
	  cursorpos_x = 8;
	  break;
	}
      }
      cursorpos_x = (cursorpos_x < 9) ? cursorpos_x+1 : cursorpos_x;
      break;
    case SDLK_LEFT: 
      // take special care of End and Del
      SoundManager->PlaySound("sounds/menu_move.wav");
      if (cursorpos_y == 2) {
	if (cursorpos_x == 6 || cursorpos_x == 7) {
	  cursorpos_x = 5;
	  break;
	}
	if (cursorpos_x == 8 || cursorpos_x == 9) {
	  cursorpos_x = 7;
	  break;
	}
      }
      cursorpos_x = (cursorpos_x > 0) ? cursorpos_x-1 : cursorpos_x;
      break;
    case SDLK_SPACE:
    case SDLK_RETURN: {
      if (DisplayMode == HIGHSCORE) {
	SoundManager->PlaySound("sounds/menu_choose.wav");
	close = true;
	name[0] = '_';
	name[1] = '_';
	name[2] = '_';
	curchar = 0;
	return false;
      }
      if (cursorpos_y == 2) {
	if (cursorpos_x == 6 || cursorpos_x == 7) {
	  name[curchar] = '_';
	  curchar = (curchar > 0) ? curchar-1 : curchar;
	  name[curchar] = '_';
	  break;
	}
	if (cursorpos_x == 8 || cursorpos_x == 9) {
	  if (name[0] != '_') {
	    name[3] = 0x00;
	    if (name[2] == '_')
	      name[2] = ' ';
	    if (name[1] == '_')
	      name[1] = ' ';
	    if (name[0] != '_')
	      update(name,curscore);
	  }
	  close = true;
	  name[0] = '_';
	  name[1] = '_';
	  name[2] = '_';
	  name[3] = 0x00;
	  curchar = 0;
	  return false;
	}
      }
      name[curchar] = static_cast<int>('A') + cursorpos_y * 10 + cursorpos_x;
      curchar = (curchar < 3) ? curchar+1 : curchar;
    }
    break;
    case SDLK_ESCAPE: {
      close = true;
      name[0] = '_';
      name[1] = '_';
      name[2] = '_';
      curchar = 0;
    }
    }
  }
  return false;
};

/* **********************************************************************
 * Render will render the highscore according to the current
 * state of the highscore
 * *********************************************************************/
void THighscore::Render(SDL_Surface * surface)
{
  static int oldcursorpixpos_x = 0;
  static int oldcursorpixpos_y = 0;
  switch (DisplayMode) {
  case HIGHSCORE: {
    //    LogLine(LOG_VERBOSE, "Displaying highscore rankings");
    int drawx=static_cast<int>(x());
    int drawy=static_cast<int>(y());
    unsigned int count = 0;
    for(std::list<pair<std::string, Score> >::const_iterator i = 
	  Rankings.begin(); 
	i != Rankings.end() && count < NumRankings; ++i, ++count ) {
      /*
      std::string Rankline;
      Rankline = i->first;
      for(int j = (8 - i->first.size()) ; j > 0 ; --j) {
	Rankline += ' ';
      }

      for(int j = 12 - a ; j < 12 ; ++j) {
	Rankline += ' ';
      }
      */
      char score[50];
      score[29] = 0x00;
      sprintf(score,"%-8s %12i",i->first.c_str(),i->second);
      //      Rankline += score;
      DT_DrawText(score, surface, *fontHandle, drawx, drawy);
      drawy += 20;
    }
#ifdef OLD
    string tmp = ">>> Return <<<";
    /* Toogle x times pr second */
    int offset = ((SDL_GetTicks() - start_time) / 225) % 3;
    tmp[offset] = 0x1F;
    tmp[tmp.size()-1-offset] = 0x1E;
#endif
    string left  = "      ";
    string right = "      ";
    left[0]  = 0x1F;
    left[1]  = 0x1F;
    left[2]  = 0x1F;
    left[3]  = 0x1F;
    left[4]  = 0x1F;
    right[1] = 0x1E;
    right[2] = 0x1E;
    right[3] = 0x1E;
    right[4] = 0x1E;
    right[5] = 0x1E;
    string tmp = "Return";
    tmp = left + tmp + right;
    /* Toogle x times pr second */
    int offset = ((SDL_GetTicks() - start_time) / 225) % 5;
    tmp[offset] = '>';
    tmp[tmp.size()-1-offset] = '<';
    // tmp[offset] = 0x1F;
      // tmp[tmp.size()-1-offset] = 0x1E;
    
    DT_DrawText(tmp.c_str(), surface, *fontHandle, 
		400-9 * DT_FontWidth(*fontHandle), 450);
  }
  break;
  case INPUT: {
    char * s1 = "A B C D E F G H I J";
    char * s2 = "K L M N O P Q R S T";
    char * s3 = "U V W X Y Z Del End";

    int drawx=static_cast<int>(x());
    int drawy=static_cast<int>(y());
    SDL_Rect dest;
    // take special care of Del and End
    if (cursorpos_y == 2) {
      if (cursorpos_x == 6 || cursorpos_x == 7) {
	dest.x = drawx + DT_FontWidth(*fontHandle) * 13 ;
      }else if (cursorpos_x == 8 || cursorpos_x == 9) {
	dest.x = drawx + DT_FontWidth(*fontHandle) * 17 ;
      } else {
	dest.x = drawx + DT_FontWidth(*fontHandle) * 2 * cursorpos_x;
      }
    } else {
      dest.x = drawx + DT_FontWidth(*fontHandle) * 2 * cursorpos_x;
    }
    dest.y = drawy + 40 * cursorpos_y + 20;
    char pointer[2] = { static_cast<int>('y') + 6, 0 };
    DT_DrawText(" ", surface, *fontHandle, oldcursorpixpos_x, oldcursorpixpos_y);    
    oldcursorpixpos_x = dest.x;
    oldcursorpixpos_y = dest.y;
    DT_DrawText(pointer, surface, *fontHandle, dest.x, dest.y);    
    DT_DrawText(s1, surface, *fontHandle, drawx, drawy);    
    drawy += 40;
    DT_DrawText(s2, surface, *fontHandle, drawx, drawy);    
    drawy += 40;
    DT_DrawText(s3, surface, *fontHandle, drawx, drawy);    
    drawy += 40;
    name[3] = 0x00;
    DT_DrawText(name, surface, *fontHandle, 
		drawx + 7 * DT_FontWidth(*fontHandle), drawy);    

    //    LogLine(LOG_VERBOSE, "Displaying highscore input");
  }
  break;
  case NONE: {
    ;
  }
  break;
  default:
    LogLine(LOG_VERBOSE, "Got unknown display mode during display "
	    "of highscore");
  }
  SDL_Flip(Screen);
}

/* **********************************************************************
 * Tell whether a score of s, is enough to get on the highscore 
 * *********************************************************************/
bool THighscore::isCandidate(const Score& s)
{
  for(std::list<pair<std::string, Score> >::iterator i = Rankings.begin() ;
      i != Rankings.end() ; ++i) {
    if (i->second < s)
      return true;
  }  
  return false;
}

/* **********************************************************************
 * Update will insert the name and score into the correct position
 * in the rankings. Will return true on success;
 * *********************************************************************/
bool THighscore::update(const std::string& name, const Score& s)
{
  string realname = name;
  if (name.empty())
    realname = "John D.";

  bool success = false;
  unsigned int count = 0;
  for(std::list<pair<std::string, Score> >::iterator i = Rankings.begin() ;
      i != Rankings.end() ; ++i, ++count) {
    // cerr << i->first << ", " << i->second << endl;
    // Ensure that we have only MAX_RANKINGS rankings in list
    if (count == MAX_RANKINGS) {
      // cerr << "erasing" << endl;
      Rankings.erase(i, Rankings.end());
      break;
    }

    if (i->second < s && !success) {
      // cerr << "inserting" << endl;
      Rankings.insert(i,1,make_pair(realname,s));
      success = true;
    }
  }
  return success;
}

/* **********************************************************************
 * DisplayNameInput enables displaying of user interface for inputting
 * username. This will disable all other display modes set by THighscore
 * *********************************************************************/
void THighscore::displayNameInput(const Score& score)
{
  curscore = score;
  DisplayMode = INPUT;
}


/* **********************************************************************
 * DisplayRankings enables displaying of the highscore rankings.
 * This will disable all other display modes set by THighscore
 * *********************************************************************/
void THighscore::displayRankings()
{
  DisplayMode = HIGHSCORE; 
}

/* **********************************************************************
 * DisplayNone will disable all display modes set by THighscore
 * *********************************************************************/
void THighscore::displayNone()
{
  DisplayMode = NONE; 
}
