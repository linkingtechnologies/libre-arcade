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

#include "path.hh"
#include <math.h>

/* **********************************************************************
 * getPoint returns the point and angle on the path.
 * the argument i, must be a number in the interval [0:1]
 * *********************************************************************/
TOrientedPoint TPath::getPoint(TPathPos i) const
{
  return getPoint(static_cast<int>(_max/i));
}

/* **********************************************************************
 * TOrientedPath constructor
 * *********************************************************************/
TOrientedLinePath::TOrientedLinePath(const TOrientedPoint& begin, 
		     const TOrientedPoint& end) : _begin(begin), _end(end) 
{
  /*
  _w = (begin.x() < end.x()) ? end.x() - begin.x() : begin.x() - end.x();
  _h = (begin.y() < end.y()) ? end.y() - begin.y() : begin.y() - end.y();
  */
  _w = static_cast<int>(end.x() - begin.x());
  _h = static_cast<int>(end.y() - begin.y());
  _max = sqrt(_w*_w + _h*_h);
}

/* **********************************************************************
 * getPoint returns the point and angle on the path.
 * the argument i, must be a number in the interval [0:max]
 * where max is found by using the getMax funtion;
 * *********************************************************************/
TOrientedPoint TOrientedLinePath::getPoint(int i) const {
  /* XXX: a fast hack */
  double pct = _max/static_cast<double>(i);
  double d_angle = _begin.getAngle() < _end.getAngle() ? 
    _end.getAngle() - _begin.getAngle() : _begin.getAngle() - _end.getAngle();
  return TOrientedPoint(static_cast<int>(static_cast<double>(_w) / pct + _begin.x()),
			static_cast<int>(static_cast<double>(_h) / pct + _begin.y()),
			static_cast<double>(d_angle) / pct + _begin.getAngle());
}

