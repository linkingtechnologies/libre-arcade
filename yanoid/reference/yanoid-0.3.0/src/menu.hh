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

/* This unit declares to very simple menus, a pre game menu, and an in game menu 
   These are very simpleminded things. */

#include <SDL/SDL.h>
#include <vector>
#include "fontmanager.hh"

class TMenu {
protected:
  fonthandle_t * font;
  /* Used for animating */
  Uint32 start_time;
  /* Wheter or not we capture the background */
  bool cap_back;
  SDL_Surface * background;
  /* Wheter or not to display the splash screen */
  bool dis_splash;
  /* The menu items */
  typedef vector<string> TItems;
  typedef vector<string>::iterator TItemsIterator;
  TItems items;
  unsigned int focused;  /* The item that is currently focused */
  bool cancel;  /* Set to true, if the user cancelled this menu */
  bool close;   /* Set to true, if some action has been selected, that
		   should close the menu */
  virtual bool HandleEvent(SDL_Event * event);
  /* Called when the user selects the current entry */
  virtual void SelectFocused() = 0;
  /* Called when Run decides it is time to render the menu */
  virtual void Render();
  /* Called to render the splash menu */
  void RenderSplash();
  /* Called to render a background */
  void RenderBackground();
  /* Called when the items should be rendered */
  void RenderItems(int xlow, int ylow, int xhigh, int yhigh);
public:
  TMenu(bool capture_background = false, bool display_splash = true); 
  virtual ~TMenu();
  virtual bool Run();
};


/* TPreGameMenu, returns true if the player wants to start
   a new game, false if exit has been choosen */
class THelpMenu;
class TAboutMenu;
class TExitMenu;
class TPreGameMenu : public TMenu {
protected:
  THelpMenu * HelpMenu;
  TAboutMenu * AboutMenu;
  TExitMenu * ExitMenu;
  void SelectFocused();
public:
  TPreGameMenu();
  ~TPreGameMenu();
};

/* TInGameMenu returns false if the player wants to continue a game,
   true if we wants to exit (current game) */
class TClient;
class TInGameMenu : public TMenu{
protected:
  TClient * Client;
  SDL_Surface * background;
  virtual void SelectFocused();
public:
  TInGameMenu(TClient * client);
};

/* TDialogMenu only contains a single menu item, 
   that is a string, and cancels when enter is
   pressed */
class TDialogMenu : public TMenu {
protected:
  TItems lines;
  /* This method formats the string passed to it into lines */
  void AddLines(string _lines);
  void RenderLines(int xlow, int ylow, int xhigh, int yhigh);
  void SelectFocused();
  void Render();
public:
  TDialogMenu(string caption, 
	      bool capture_background = false, bool display_splash = true);
};


class TGameOverMenu : public TDialogMenu {
public:
  TGameOverMenu() : TDialogMenu("OK", true, false) {
    AddLines("Game Over");
  };
};

