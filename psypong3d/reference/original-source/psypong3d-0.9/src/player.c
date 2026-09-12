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

struct __PLAYER
{
  point position;
  point reset;
  int score;
  float radius;
  float width;
  GLuint model;
  GLfloat rgba[4];
  GLUquadricObj *quadric;
};

/* create a new player */
PLAYER *player_new(float x, float y, float z, short size, GLfloat rgba[4])
{
  PLAYER *player = NULL;

  if ((player = (PLAYER *) malloc(sizeof(PLAYER))) == NULL)
    return NULL;

  point_new(&player->position, x, y, z);
  point_copy(&player->reset, &player->position);

  player->score = 0;
  player->radius = size/2;
  player->width = size*4;

  if ((player->quadric = gluNewQuadric()) == NULL)
  {
    free(player);
    return NULL;
  }

  gluQuadricDrawStyle(player->quadric, GLU_FILL);
  gluQuadricNormals(player->quadric, GLU_SMOOTH);
  gluQuadricOrientation(player->quadric, GLU_OUTSIDE);

  /* create player model list */
  player->model = glGenLists(1);

  glNewList(player->model, GL_COMPILE);
    glPushMatrix();
      glutSolidSphere(player->radius, 16, 16);

      gluCylinder(player->quadric, player->radius, player->radius, player->width, 16, 1);

      glTranslatef(0.0f, 0.0f, player->width);
      glutSolidSphere(player->radius, 16, 16);
    glPopMatrix();
  glEndList();

  /* set player color */
  player->rgba[0] = rgba[0];
  player->rgba[1] = rgba[1];
  player->rgba[2] = rgba[2];
  player->rgba[3] = rgba[3];

  return player;
}

/* free player resources */
void player_free(PLAYER *player)
{
  if (player != NULL)
  {
    gluDeleteQuadric(player->quadric);
    glDeleteLists(player->model, 1);
  }

  free(player);
}

/* get player score */
int player_get_score(PLAYER *player)
{
  return player->score;
}

/* add player score */
void player_add_score(PLAYER *player)
{
  player->score++;
}

/* get player X value */
float player_get_x(PLAYER *player)
{
  return player->position.X;
}

/* get player Z value */
float player_get_z(PLAYER *player)
{
  return player->position.Z;
}

/* add value to player Z */
void player_add_z(PLAYER *player, float z)
{
  player->position.Z += z;
}

/* get player width */
float player_get_width(PLAYER *player)
{
  return player->width;
}

/* get player radius */
float player_get_radius(PLAYER *player)
{
  return player->radius;
}

/* get player center */
float player_get_center(PLAYER *player)
{
  return player->position.Z + (player->width / 2);
}

/* get player rgba */
GLfloat *player_get_rgba(PLAYER *player)
{
  return player->rgba;
}

/* draw player model */
void player_draw_model(PLAYER *player)
{
  glPushMatrix();
    glColor4fv(player->rgba);
    glTranslatef(player->position.X, player->position.Y, player->position.Z);
    glCallList(player->model);
  glPopMatrix();
}

/* see if player won */
int player_won(PLAYER *player, short score_limit)
{
  return (player->score == score_limit);
}

/* reset player */
void player_reset(PLAYER *player)
{
  player->score = 0;
  point_copy(&player->position, &player->reset);
}

/* warp players */
void player_warp(PLAYER *player[], FLOOR *floor, short n, short warp)
{
  short i;
  float c_pos;
  float c_gap;

  if (warp)
    for (i = 0; i < n; ++i)
    {
      /* center position + center gap */
      c_gap = player[i]->width / 2;
      c_pos = player[i]->position.Z + c_gap;

      if (c_pos < floor_get_z(floor) - player[i]->width)
        player[i]->position.Z =  (floor_get_z(floor) + floor_get_depth(floor) + player[i]->width - c_gap);

      if (c_pos > floor_get_z(floor) + floor_get_depth(floor) + player[i]->width)
        player[i]->position.Z = (floor_get_z(floor) - player[i]->width - c_gap);
    }
}

/* swap players from place */
void player_swap(PLAYER *player[], short n, short swap)
{
  short i = 0;
  float firstX = player[i]->position.X;

  if (swap)
  {
    for (; i < n-1; ++i)
      player[i]->position.X = player[(i+1)%n]->position.X;

    player[i]->position.X = firstX;
  }
}
