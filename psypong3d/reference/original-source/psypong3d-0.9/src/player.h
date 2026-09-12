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

#ifndef PLAYER_H
#define PLAYER_H 1

typedef struct __PLAYER PLAYER;

typedef enum
{
  PLAYER_1,
  PLAYER_2
} PLAYER_ID;

/* create a new player */
extern PLAYER *player_new(float, float, float, short, GLfloat [4]);

/* free player resources */
extern void player_free(PLAYER *);

/* get player score */
extern int player_get_score(PLAYER *);

/* add player score */
extern void player_add_score(PLAYER *);

/* get player X value */
extern float player_get_x(PLAYER *);

/* get player Z value */
extern float player_get_z(PLAYER *);

/* add value to player Z */
extern void player_add_z(PLAYER *, float);

/* get player width */
extern float player_get_width(PLAYER *);

/* get player radius */
extern float player_get_radius(PLAYER *);

/* get player center */
extern float player_get_center(PLAYER *);

/* get player rgba */
extern GLfloat *player_get_rgba(PLAYER *);

/* draw player model */
extern void player_draw_model(PLAYER *);

/* see if player won */
extern int player_won(PLAYER *, short);

/* reset player */
extern void player_reset(PLAYER *);

/* warp players */
extern void player_warp(PLAYER *[], FLOOR *, short, short);

/* swap players from place */
extern void player_swap(PLAYER *[], short, short);

#endif /* PLAYER_H */