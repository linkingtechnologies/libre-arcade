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

/* Points defines a point in the 2D space. */

#ifndef __POINT_HH__
#define __POINT_HH__

typedef double Angle;

/* Simple 2D point */
class TPoint {
protected:
  double _x, _y;
public:
  TPoint(double x_ = 0.0, double y_ = 0.0) : _x(x_), _y(y_) {}
  virtual ~TPoint() {}
  inline double x() const { return _x; }
  inline double y() const { return _y; }
  inline void setX(double x_) { _x = x_; }
  inline void setY(double y_) { _y = y_; }
};

/* As the TPoint, but with an orientation */
class TOrientedPoint : public TPoint {
protected:
  Angle _angle;
public:
  TOrientedPoint(double x_ = 0 , double y_ = 0, double angle_ = 0.0) : 
    TPoint(x_, y_), _angle(angle_) {}
  virtual ~TOrientedPoint() {}
  inline double getAngle() const { return _angle; }
  inline void setAngle(double a) { _angle = a; }
};

#endif
