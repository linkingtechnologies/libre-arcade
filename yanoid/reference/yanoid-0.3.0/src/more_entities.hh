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
#ifndef __MORE_ENTITIES_HH__
#define __MORE_ENTITIES_HH__

#include <string>
#include <SDL/SDL_mixer.h>

class TEntity;
class TPixmapEntity;

/* **********************************************************************
 * A brick is, well, a brick.
 * *********************************************************************/
class TBrick : public TPixmapEntity {
protected:
  int hitnum;
public:
  TBrick(int x_, int y_, string pixmap, string hitfunction, int _hitnum = 1);
  virtual ~TBrick();
  virtual void MarkDying();
  virtual void OnCollision(TEntity& other, Uint32 currenttime=0);
};

/* **********************************************************************
 * The paddle is the paddle
 * *********************************************************************/
class TPaddle : public TPixmapEntity {
protected:
  /* The hacks, the hacks */
  double minx, maxx;
  int milli_seconds_to_normal;
  SDL_Surface * normalsurface;
  SDL_Surface * widesurface;
  SDL_Surface * narrowsurface;
public:
  TPaddle(int x_, int y_, 
	  const std::string normal_pixmap_path,
	  const std::string wide_pixmap_path,
	  const std::string narrow_pixmap_path);
  virtual ~TPaddle();
  void Update(Uint32 deltatime);
  void GoNormal();
  void GoNarrow(int seconds);
  void GoWide(int seconds);
};


/* **********************************************************************
 * A powerup is a special kind of brick, that move slowly toward 
 * the bottom of the screen. It only reacts to collisions with
 * the paddle and possibly shots.
 * *********************************************************************/
class TPowerUp : public TPixmapEntity {
public:
  virtual ~TPowerUp() {};
  TPowerUp(int x, int y, string pixmap, string hitfunction);
  virtual void OnCollision(TEntity& other, Uint32 currenttime = 0);
};

/* **********************************************************************
 * A shot can kill bricks to various degrees
 * The type is not determined yet, but
 * "" - does nothing special
 * "REMOVEALL" - never dies, passes through and removes everything
 * 
 * *********************************************************************/
class TShot : public TPixmapEntity {
protected:
  string shot_type;
public:
  virtual ~TShot() {};
  TShot(int x, int y, string pixmap, string hitfunction, 
	string type);
  virtual void OnCollision(TEntity& other, Uint32 currenttime = 0);
};

/* **********************************************************************
 * A THole is an entity that "kills" other entities. It is not visible
 * *********************************************************************/

/* A THole is an entity that kills balls.
   It is not visible. */
class THole : public TEntity {
public:
  THole(double x_, double y_, int w_, int h_);
  virtual ~THole();
  virtual void OnCollision(TEntity& other, Uint32 currenttime=0);
  void Render(SDL_Surface * surface) {};
};

/* **********************************************************************
 * A powerup is an entity that is spawned from the middle of another 
 * entity, and falls down, off the screen
 * If it collides with a paddle, some action is performed. If
 * it collides with a THole (no way to check)
 * *********************************************************************/

/* Used for cheating */
extern bool hole_bounces;

#endif
