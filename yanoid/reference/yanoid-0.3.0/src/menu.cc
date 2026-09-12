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
#include <SDL/SDL.h>
#include <SDL/SDL_mixer.h>
#include "menu.hh"
#include "screen.hh"
#include "client.hh"
#include "fontmanager.hh"
#include "soundmanager.hh"
#include "highscore.hh"
#include "ConsoleSource/DT_drawtext.h"

/* **********************************************************************
 * The Base TMenu class
 * *********************************************************************/

/* **********************************************************************
 * Constructor and destructor
 * *********************************************************************/

TMenu::TMenu(bool capture_background, bool display_splash) {
  font = FontManager->RequireRessource("graphics/fonts/LargeFont.png");
  if (!font) {
    LogFatal("Unable to load highscore font graphics/fonts/LargeFont.png");
    exit(-1);
  }
  cap_back   = capture_background;
  background = NULL;
  dis_splash = display_splash;
  focused    = 0;
  cancel     = false;
  close      = false;
}

TMenu::~TMenu() {
  if (font) FontManager->ReleaseRessource(font);
}

/* **********************************************************************
 * Run - checks for events, renders the menu, decide it is time to leave.
 * *********************************************************************/
bool TMenu::Run() {
  cancel = false; close = false;
  start_time = SDL_GetTicks();
  /* Copy the background, if neccesary */
  /* This simply does not work on my system */
#ifdef IEVERFIGUREOUTWHATISWRONG
  if (cap_back) {
    // LogLine(LOG_VERBOSE, "Capturing the screen");
    /* Copy the screen - make it a background */
    SDL_LockSurface(Schreen);
    background = SDL_CreateRGBSurface(SDL_SRCALPHA, Screen->w, Screen->h, 
				      Screen->format->BitsPerPixel,
				      Screen->format->Rmask,
				      Screen->format->Gmask,
				      Screen->format->Bmask,
				      0); /* 0 == Pr. surface alpha */
    SDL_UnlockSurface(Screen);
    // LogLine(LOG_VERBOSE, "background created");
    if (background == NULL) {
      LogLine(LOG_ERROR, "TInGameMenu::Run - unable to create background");
    } else {
      SDL_Rect d;
      d.x = 0; d.y = 0; 
      d.w = background->w;
      d.h = background->h;
      
      /* Note, on my system (mads) blitting before setting the
	 alpha is a no-no - it crashes... 
	 Forget that. It just plain crashes on my system. Damn. */
      // LogLine(LOG_VERBOSE, "Setting alpha");
      SDL_SetAlpha(background, SDL_SRCALPHA, 64);
      // LogLine(LOG_VERBOSE, "Alpha set");
      // LogLine(LOG_VERBOSE, "Blitting screen onto background");
      SDL_BlitSurface(Screen, &d, background, &d);
      // LogLine(LOG_VERBOSE, "Screen blitted");
    }
  }
#endif
  /* While until the menu is done */
  while(!cancel && !close) {
    Render();
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
      HandleEvent(&event);
    }
    /* Let the system be a little idle, sleep for 10 ms */
    SDL_Delay(10);
  }
  /* If cancelled, return false, if not, return true */
  return !cancel;
}

/* **********************************************************************
 * Render - renders the menu
 * *********************************************************************/
void TMenu::Render() {
  RenderBackground();
  RenderSplash();
  RenderItems(0, 0, Screen->w, Screen->h);
  SDL_Flip(Screen);
}

/* **********************************************************************
 * RenderSplash - renders the splash screen
 * *********************************************************************/
void TMenu::RenderSplash() {
  if (dis_splash) {
    /* Put on the splash screen */
    SDL_Rect src, dest;
    src.x = 0; src.y = 0; src.w = Splash->w; src.h = Splash->h;
    dest.x = (Screen->w-src.w)/2; dest.y = 50; dest.w = src.w; dest.h = src.h;
    SDL_BlitSurface(Splash, &src, Screen, &dest);
  }
}
/* **********************************************************************
 * RenderBackground - renders the background
 * *********************************************************************/
void TMenu::RenderBackground() {
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
}

/* **********************************************************************
 * RenderItems - draw the lines. Put a + in front of the selected one... 
 * *********************************************************************/
void TMenu::RenderItems(int xlow, int ylow, int xhigh, int yhigh) {
  /* Render from the center of the area. We use a fixed font, so we can
     calculate where it is 
     20 is the height spacing of the font, 16 is the width */
  int h = yhigh - ylow;
  int w = xhigh - xlow;
  int drawy = (h - items.size()*20) / 2 + ylow;
  unsigned int count = 0;
  int drawx;
  string tmp;
  TItemsIterator End = items.end();
  for (TItemsIterator i = items.begin(); i != End; i++) {
    tmp = *i;
     /* Mark the focused one */
    if (count == focused) {
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
      tmp = left + tmp + right;
      /* Toogle x times pr second */
      int offset = ((SDL_GetTicks() - start_time) / 225) % 5;
      tmp[offset] = '>';
      tmp[tmp.size()-1-offset] = '<';
      // tmp[offset] = 0x1F;
      // tmp[tmp.size()-1-offset] = 0x1E;
    }
    drawx = (w - tmp.size()*16) / 2 + xlow;
    DT_DrawText(tmp.c_str(), Screen, *font, drawx, drawy);
    count++;
    drawy += 20;
  }
}
/* **********************************************************************
 * Handle keypresses (no mouse)
 * *********************************************************************/

bool TMenu::HandleEvent(SDL_Event * event) {
  if (SDL_KEYDOWN == event->type) {
    switch (event->key.keysym.sym) {
    case SDLK_DOWN: {
      unsigned int oldfocused = focused;
      focused += 1;
      if (focused >= items.size()) {
	focused = 0;
      }
      if (oldfocused != focused) {
	SoundManager->PlaySound("sounds/menu_move.wav");
      }
      return true;
    }
    case SDLK_UP: {
      unsigned int oldfocused = focused;
      if (focused == 0) {
	focused = items.size() - 1;
      } else {
	focused -= 1;
      }
      if (oldfocused != focused) {
	SoundManager->PlaySound("sounds/menu_move.wav");
      }
      return true;
    }
    case SDLK_SPACE:
    case SDLK_RETURN: {
      SoundManager->PlaySound("sounds/menu_choose.wav");
      SelectFocused();
      return true;
    }
    case SDLK_ESCAPE: {
      cancel = true;
    }
    }
  }
  return false;
};

/* **********************************************************************
 * The DialogMenu
 * *********************************************************************/
void TDialogMenu::Render() {
  RenderBackground();
  RenderSplash();
  RenderLines(0, 200, Screen->w, 400);
  RenderItems(0, 400, Screen->w, Screen->h);
  SDL_Flip(Screen);
};

void TDialogMenu::SelectFocused() {
  cancel = true;
};

TDialogMenu::TDialogMenu(string caption,
			 bool capture_background = false, 
			 bool display_splash = true) 
  : TMenu(capture_background, display_splash) {
  items.push_back(caption);
};

void TDialogMenu::AddLines(string _lines) {
  int width = 760;
  /* Scan through lines, build lines from _lines */
  string newline = "";
  unsigned int currentleft = width;
  string tmpstring = "";
  int ff = 0;
  while("" != _lines && ff != -1) {
    /* Get token */
    ff = _lines.find(' ');
    if (ff != -1) {
      tmpstring = _lines.substr(0, ff+1);
      _lines.erase(0, ff+1);
    } else {
      tmpstring = _lines;
      _lines = "";
	
    }
    if (currentleft >= tmpstring.size()*16) {
      /* Can be added to this line */
      newline += tmpstring;
      currentleft -= tmpstring.size()*16;
    } else {
      /* Uhoh, line is full, lets proceed */
      if (newline[newline.size()-1] == ' ') {
	newline.erase(newline.size()-1, 1);
      }
      lines.push_back(newline);
      newline = tmpstring;
      currentleft = width - newline.size()*16;
    }
    /* check if there is room in this line */
    /* Still using 16 as char width */
  }
  if (newline[newline.size()-1] == ' ') {
    newline.erase(newline.size()-1, 1);
  }
  if ("" != newline) {
    lines.push_back(newline);
  }

}

void TDialogMenu::RenderLines(int xlow, int ylow, int xhigh, int yhigh) {
  /* Render from the center of the area. We use a fixed font, so we can
     calculate where it is 
     20 is the height spacing of the font, 16 is the width */
  int h = yhigh - ylow;
  int w = xhigh - xlow;
  int drawy = (h - lines.size()*20) / 2 + ylow;
  unsigned int count = 0;
  int drawx;
  string tmp;
  TItemsIterator End = lines.end();
  for (TItemsIterator i = lines.begin(); i != End; i++) {
    tmp = *i;
    drawx = (w - tmp.size()*16) / 2 + xlow;
    DT_DrawText(tmp.c_str(), Screen, *font, drawx, drawy);
    count++;
    drawy += 20;
  }
}

/* **********************************************************************
 * These menus are used internally.
 * *********************************************************************/

/* **********************************************************************
 * The Help Menu
 * *********************************************************************/
class THelpMenu : public TDialogMenu {
public:
  THelpMenu() : TDialogMenu("Return") {
    AddLines("Welcome to Yet Another arkaNOID");
    AddLines("     ");
    AddLines("On each level, control your paddle, using the left and right keys "
	     "such that the ball don't fall out of the bottom of the "
	     "screen.");
    AddLines("     ");
    AddLines("Steer the ball by letting it hit the paddle on different "
	     "spots and with varying paddle speeds.");
    AddLines("     ");
    AddLines("Catch powerups with the paddle to gain shots, balls, etc. "
	     "Use the space key to fire.");
    AddLines("     ");
    AddLines("Remove all bricks to complete a level.");
    AddLines("     ");
    AddLines("Have fun!");
  };
};


/* **********************************************************************
 * The About Menu
 * *********************************************************************/
class TAboutMenu : public TDialogMenu {
public:
  TAboutMenu() : TDialogMenu("Return") {
    AddLines("Yanoid was created for the 2001 SDL contest by");
    AddLines("    ");
    AddLines("Jonas Christian Drewsen <jcd@xspect.dk>");
    AddLines("Programming & artist");
    AddLines("    ");
    AddLines("Bjarke Soerensen <bs@wasd.dk>");
    AddLines("Artist");
    AddLines("      ");
    AddLines("Mads Bondo Dydensborg <mads@dydensborg.dk>");
    AddLines("Programming");
    AddLines("    ");
    AddLines("Visit the project homepage at http://www.sf.net/projects/yanoid/");
  };
};


/* **********************************************************************
 * The exit menu
 * *********************************************************************/
class TExitMenu : public TDialogMenu {
public:
  TExitMenu() : TDialogMenu("OK") {
    AddLines("Thank you for playing Yanoid!");
    AddLines("     ");
    AddLines("Visit the project homepage at");
    AddLines("     ");
    AddLines(">>>>> http://www.sf.net/projects/yanoid/ <<<<<");
    AddLines("     ");
    AddLines("for updates to Yanoid, or if you want to join "
	     "in the development.");
  }
};

/* **********************************************************************
 * The PreGameMenu
 * *********************************************************************/

TPreGameMenu::TPreGameMenu() : TMenu(false) {
  HelpMenu = new THelpMenu();
  AboutMenu = new TAboutMenu();
  ExitMenu = new TExitMenu();
  items.push_back("Start Game");
  items.push_back("Highscore");
  items.push_back("Help");
  items.push_back("About");
  items.push_back("Toggle full screen");
  items.push_back("Toggle music");
  items.push_back("Exit yanoid");
}

TPreGameMenu::~TPreGameMenu() {
  delete HelpMenu;
  delete AboutMenu;
  delete ExitMenu;
}

void TPreGameMenu::SelectFocused() {
  // LogLineExt(LOG_VERBOSE, ("TPreGameMenu, selected %s", items[focused].c_str()));
  /* Yes, this stinks */
  switch (focused) {
  case 0: /* Start game */
    close = true;
    return;
  case 1: 
    Highscore->displayRankings();
    Highscore->Run();
    Highscore->displayNone();
    return;
  case 2: 
    HelpMenu->Run();
    return;
  case 3:
    AboutMenu->Run();
    return;
  case 4:
    SDL_WM_ToggleFullScreen(Screen);
    return;
  case 5:
    if (Client) {
      Client->ToggleMusic();
    }
    break;
  case 6: /* Exit */
    cancel = true;
    ExitMenu->Run();
    return;
  default:
    LogLineExt(LOG_ERROR, ("TPreGameMenu - focused out of range %i", focused));
  }  
}

/* **********************************************************************
 * The in game menu
 * *********************************************************************/
TInGameMenu::TInGameMenu(TClient * client) 
  : TMenu(true, false), Client(client) {
  items.push_back("Resume game");
  items.push_back("Toggle console");
  items.push_back("Toggle full screen");
  items.push_back("Toggle music");
  items.push_back("End game");
}

void TInGameMenu::SelectFocused() {
  switch(focused) {
  case 0: /* Resume game is the same as cancelling the menu */
    cancel = true;
    return;
  case 1: /* Toggle the console */
    Client->ToggleConsole();
    cancel = true;
    return;
  case 2:
    SDL_WM_ToggleFullScreen(Screen);
    return;
  case 3:
    if (Client) {
      Client->ToggleMusic();
    }
    return;
  case 4: /* Exit is close */
    close = true;
    return;
  default:
    LogLineExt(LOG_ERROR, ("TInGameMenu - focused out of range %i", focused));
  }
}



