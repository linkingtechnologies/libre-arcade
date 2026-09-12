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

#ifndef __TEXTEFFECTS__
#define __TEXTEFFECTS__

#include <SDL/SDL.h>
#include "point.hh"
#include "fontmanager.hh"

class TEffect {
protected:
  TPoint Location;
  Uint32 last_update;
  Uint32 begin_time;
  typedef enum State { RUNNING, PAUSED, STOPPED } State;
  State state;
  Uint32 Duration;
  bool no_erase;
  SDL_Surface * background;
public:
  TEffect() : Location(0,0), last_update(0),begin_time(0),Duration(1000),no_erase(true) {}
  void start() { state = RUNNING; } 
  void pause() { state = PAUSED; }
  void stop() { state = STOPPED; }
  bool isStopped() { return state == STOPPED; } 
  void setLocation(const TPoint& location) { Location = location; }
  TPoint getLocation() { return Location; }
  void setDuration(Uint32 dur) { Duration = dur; }
  Uint32 getDuration() { return Duration; }
  void update(Uint32 currenttime) { };
};

class TTextEffects : public TEffect {
public:
  typedef enum EffectType { SIMPLE_DISPLAY, 
			    CHARACTER_SPACED_ANIM,
			    CHARACTER_JUMPING_ANIM,
			    CHARACTER_SWIRLING_ANIM
  } EffectType;
protected:
  std::vector<TPoint> char_points;
  EffectType type;
  SDL_Surface * surface;
  const char* str;
  fonthandle_t * font;
public:
  TTextEffects(const char *str, SDL_Surface *surface, fonthandle_t * Font, EffectType et);
  ~TTextEffects();
  void update(Uint32 currenttime);

private:
  //
  // All the effects
  //
  void simpleDisplay(Uint32 currenttime);
  void characterSpacedAnim(Uint32 currenttime);
  void characterJumpingAnim(Uint32 currenttime);
  void characterSwirlingAnim(Uint32 currenttime);

  //
  // Helper functions
  //
  void blitChars();
  void saveCharsBackground();
  void blitCharsBackground();
};


#endif







