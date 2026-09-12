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

#ifndef __HIGHSCORE_HH__
#define __HIGHSCORE_HH__

#include <string>
#include <SDL/SDL.h>
#include <list>
#include "entity.hh"
#include "fontmanager.hh"

const unsigned int MAX_RANKINGS = 100;

typedef int Score;

class THighscore : public TEntity {
protected:
  typedef enum HS_DisplayMode { INPUT, HIGHSCORE, NONE } HS_DisplayMode;
  HS_DisplayMode DisplayMode;
  std::list<pair<std::string, Score> > Rankings;
  unsigned int NumRankings;
  fonthandle_t * fontHandle;
  bool close;
  int cursorpos_x, cursorpos_y;
  char name[4];
  Score curscore;
  SDL_Surface * background;
  Uint32 start_time;
public:
  THighscore(int x_, int y_);
  virtual ~THighscore();

  bool isCandidate(const Score& s);

  bool update(const std::string& name, const Score& s);

  void displayNameInput(const Score& s);
  void displayRankings();
  void displayNone();
  
  bool HandleEvent(SDL_Event * event);
  bool Run();
  void RenderSplash();
  void RenderBackground();

  /* Num visible rankings */
  void setNumRankings(unsigned int n) { NumRankings = n; }

  virtual void Update(Uint32 currenttime);
  virtual void Render(SDL_Surface * surface);
};

/* The global highscore variable */
extern THighscore *Highscore;

#endif
