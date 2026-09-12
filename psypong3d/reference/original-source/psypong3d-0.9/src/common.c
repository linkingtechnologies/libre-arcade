/*
 * This file is part of PSY PONG 3D.
 *
 * Copyright (C) 2008-2009 Quetzy Garcia, <quetzyg@users.sourceforge.net>
 * For news and updates, see <http://psypong3d.sourceforge.net/>
 *
 * PSY PONG 3D is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PSY PONG 3D is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PSY PONG 3D.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "common.h"


/* set a new point */
point *point_new(point *p, float x, float y, float z)
{
  p->X = x;
  p->Y = y;
  p->Z = z;

  return p;
}

/* copy a point to another point */
point *point_copy(point *p_dest, point *p_src)
{
  p_dest->X = p_src->X;
  p_dest->Y = p_src->Y;
  p_dest->Z = p_src->Z;

  return p_dest;
}
