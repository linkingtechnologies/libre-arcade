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

/*
 * The purpose for TMotion is to define how an entity moves. A entity has a 
 * position, orientation, size and knows how to render itself on the screen. 
 * It also has a TMotion associated with it to determine how it should move. 
 * This TMotion updates the position and angle of the entity everytime
 * the entitys update function is called.
 */

#ifndef __MOTION_HH__
#define __MOTION_HH__

#include <SDL/SDL.h>
#include "path.hh"
#include <vector>
#include "entity.hh"
#include <math.h>

/* Base class */
class TMotion {
protected:
  double _cur_vel, _vel, _acc;
  Uint32 _current_time;
  Uint32 _last_time;
public:
  TMotion() : _cur_vel(0) {}
  virtual void setAccel(double acc) { _acc = acc; }
  virtual double getAccel() { return _acc; }
  virtual void setVelocity(double vel) { _vel = vel; _acc = _vel; }
  virtual double getVelocity() { return _vel; }
  virtual void setCurrentVelocity(double curvel) { _cur_vel = curvel; }
  virtual double getCurrentVelocity() { return _cur_vel; }
  virtual void Update(Uint32 deltatime, TEntity& e) = 0;
  void setDirection(bool forward) { _vel = (forward) ? fabs(_vel): -fabs(_vel); }
  bool getDirection() const { return (_cur_vel >= 0.0); }
  void reverseDirection() { _cur_vel = - _cur_vel; }
  virtual void rewind(TEntity&);
};

/* 
   FreeMotion for objects that should just flow around the scene
   and is dictated how to move. A ball sliding around is 
   an example 
*/
class TFreeMotion : public TMotion {
protected:
  Angle motion_dir;
public:
  TFreeMotion(const Angle dir = 0) : motion_dir(dir) {}
  virtual ~TFreeMotion() {}
  virtual void Update(Uint32 deltatime, TEntity& e);
  inline void setDir(const Angle a) { motion_dir = a; }
  Angle getDir() const { return motion_dir; }
  virtual void rewind(TEntity&);
};

/*
  PathMotion is a motion that is constrained to a path or
  several paths (see path.hh). The paths doesn't have to 
  be continous.
 */
class TPathMotion : public TMotion {
protected:
  std::vector<TPath*> _paths;
  TPathPos _max;
  TPathPos _current_pos;
public:
  TPathMotion(TPath* p = 0, double vel = 0 );
  virtual ~TPathMotion();
  void addPath(TPath* p);
  virtual void Update(Uint32 deltatime, TEntity& e);
};

#endif

