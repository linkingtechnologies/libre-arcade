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
  PLEASE IGNORE THIS CLASS FOR NOW. It was a too hasty 
  decision to add this file, but i won't remove it right now.
 */

#ifndef __VELOCITY_HH__
#define __VELOCITY_HH__

#include <iostream>

class TVelocity;

std::ostream& operator<<(std::ostream& o, const TVelocity& v);

class TVelocity {
protected:
  int _x;
  int _y;
public:
  TVelocity(int x_, int y_) : _x(x_), _y(y_) {}
  inline int x() const { return _x; }
  inline int y() const { return _y; }
  inline void setX(int x_) { _x = x_; }
  inline void setY(int y_) { _y = y_; }
  friend std::ostream& operator <<(std::ostream& o, const TVelocity& v);
};

#endif
