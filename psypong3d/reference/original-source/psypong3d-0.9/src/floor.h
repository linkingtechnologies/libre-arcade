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

#ifndef FLOOR_H
#define FLOOR_H 1

typedef struct __FLOOR FLOOR;

/* create a new game floor */
extern FLOOR *floor_new(float, float, float, float, float, GLfloat [4], const char *);

/* free floor object */
extern void floor_free(FLOOR *);

/* get floor width */
extern float floor_get_width(FLOOR *);

/* get floor depth */
extern float floor_get_depth(FLOOR *);

/* get floor X value */
extern float floor_get_x(FLOOR *);

/* get floor Z value */
extern float floor_get_z(FLOOR *);

/* draw floor model */
extern void floor_draw_model(FLOOR *);

#endif /* FLOOR_H */
