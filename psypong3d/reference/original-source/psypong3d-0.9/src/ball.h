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

#ifndef BALL_H
#define BALL_H 1

typedef struct __BALL BALL;

/* create a new ball and return pointer */
extern BALL * ball_new(float, float, float, float, GLfloat [4]);

/* free ball resources */
extern void ball_free(BALL *);

/* get ball X value */
extern float ball_get_x(BALL *);

/* get ball Y value */
extern float ball_get_y(BALL *);

/* get ball Z value */
extern float ball_get_z(BALL *);

/* get ball rgba */
extern GLfloat *ball_get_rgba(BALL *);

/* ball model */
extern void ball_draw_model(BALL *);

/* draw ball vectors */
extern void ball_draw_vectors(BALL *, FLOOR *, GLfloat [4]);

/* move the ball */
extern void ball_move(BALL *, float);

/* reset the ball to it's starting position */
extern void ball_reset(BALL *);

/* detect collisions between the ball and other elements */
extern void ball_collisions(BALL *, FLOOR *, PLAYER *[], int);

/* check if the ball has left the floor */
extern int ball_left_floor(BALL *, FLOOR *, PLAYER *[], int);

#endif /* BALL_H */
