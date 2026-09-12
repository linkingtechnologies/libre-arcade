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

#include "motion.hh"
#include <math.h>
#include "debug.hh"

/* **********************************************************************
 * Rewind, taken a step back in time for in the motion
 * *********************************************************************/
void TMotion::rewind(TEntity& e) {
  _current_time = _last_time;
}


/* **********************************************************************
 * Rewind, taken a step back in time for in the motion
 * *********************************************************************/
void TFreeMotion::rewind(TEntity& e) {
  double subx = _last_time * cos(motion_dir) * _cur_vel; 
  double suby = _last_time * sin(-motion_dir) * _cur_vel; 
  e.setX(e.x() - subx);
  e.setY(e.y() - suby);
}

/* **********************************************************************
 * Update - updates the position and angle of the entity e.
 * *********************************************************************/
void TFreeMotion::Update(Uint32 deltatime, TEntity& e)
{
  //  cerr << "Updateting " << e.getName() << " " << e.x() << ", " << e.y();
  _last_time = deltatime;

  /* update the velocity, from the acceleration */
  _cur_vel += deltatime * _acc;

  _cur_vel = (_cur_vel >= _vel && _acc >= 0) ? _vel : _cur_vel;
  _cur_vel = (_cur_vel <= _vel && _acc <= 0) ? _vel : _cur_vel;
  //  cerr << "curvel : " << _cur_vel << " vel: " << _vel << " acc: " << _acc << endl;
  /* hmm. maybe this is too slow. we'll see */
  double addx = deltatime * cos(motion_dir) * _cur_vel; 
  double addy = deltatime * sin(-motion_dir) * _cur_vel; 
  double oldx = e.x();
  double oldy = e.y();
  e.setX(addx + e.x());
  e.setY(addy + e.y());

  if (e.x() != oldx || e.y() != oldy)
    e.changed = true;

  //  if (e.getEntityType() == TEntity::PADDLE)
  //    cerr << "CURVEL: " << _cur_vel << " TARGETVEL: " << _vel << endl;
  //  cerr << " " << e.x() << ", " << e.y() << endl;
}

/* **********************************************************************
 * Constructor
 * *********************************************************************/
TPathMotion::TPathMotion(TPath* p, double vel) : _max(0.0)
{
  _current_time = 0;
  _cur_vel = vel;
  _vel = vel;
  if (p) {
    _paths.push_back(p);
    _max = p->getMax();
  }
}

/* **********************************************************************
 * Desctructor
 * *********************************************************************/
TPathMotion::~TPathMotion()
{
  for(std::vector<TPath*>::iterator i = _paths.begin() ;
      i != _paths.end() ; ++i) {
    delete *i;
  }
}

/* **********************************************************************
 * AddPath - adds a path to the collection of path in the motion
 * *********************************************************************/
void TPathMotion::addPath(TPath* p)
{
  _paths.push_back(p);
  _max += p->getMax();
}

/* **********************************************************************
 * Update -  is called every timestep, to change the associated
 * entitys position and angle. The real motion processing 
 * takes place in here.
 * *********************************************************************/
void TPathMotion::Update(Uint32 deltatime, TEntity& e)
{
  // This function should really be rewritten to
  // be much more efficient than now!!
  // That's why it's so poorly commented...!
  if (! _paths.size() )
    return;

  e.changed = true;

  _last_time = _current_time;

  _current_pos += (static_cast<double>(deltatime)*_vel)/10.0;

  TPath* p = 0;
  double ppos = 0.0;
  if (_current_pos >= _max) {
    _current_pos = _max;
    p = _paths.back();
    ppos = p->getMax();
  }else{
    double curMax = 0.0;
    double oldMax = 0.0;
    std::vector<TPath*>::iterator i = _paths.begin();
    for ( ; i != _paths.end() ; ++i) {
      oldMax = curMax;
      curMax += (*i)->getMax();
      if (curMax >= _current_pos) 
	break;
    }
    p = *i;
    ppos = _current_pos - oldMax;
  }
  
  Assert(p != 0, "Path in TPathMotion was NULL."); 

  e.position = p->getPoint(static_cast<int>(ppos));
}


