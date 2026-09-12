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

struct __BALL
{
  point position;
  point reset;
  float radius;
  int right;      /* going right? (X) */
  int front;      /* going front? (Z) */
  GLuint model;
  GLfloat rgba[4];
};

/* create a new ball and return pointer */
BALL *ball_new(float x, float y, float z, float radius, GLfloat rgba[4])
{
  BALL *ball = NULL;

  if ((ball = (BALL *) malloc(sizeof(BALL))) == NULL)
    return NULL;

  point_new(&ball->position, x, y, z);
  point_copy(&ball->reset, &ball->position);

  ball->radius = radius;

  srand(time(NULL));

  /* bounce the ball into a random direction */
  ball->right = rand()%2;
  ball->front = rand()%2;

  /* create ball model */
  ball->model = glGenLists(1);

  glNewList(ball->model, GL_COMPILE);
    glPushMatrix();
      glutSolidSphere(ball->radius, 16, 16);
    glPopMatrix();
  glEndList();

  /* set ball color */
  ball->rgba[0] = rgba[0];
  ball->rgba[1] = rgba[1];
  ball->rgba[2] = rgba[2];
  ball->rgba[3] = rgba[3];

  return ball;
}

/* free ball resources */
void ball_free(BALL *ball)
{
  if (ball != NULL)
    glDeleteLists(ball->model, 1);

  free(ball);
}

/* get ball X value */
float ball_get_x(BALL *ball)
{
  return ball->position.X;
}

/* get ball Y value */
float ball_get_y(BALL *ball)
{
  return ball->position.Y;
}

/* get ball Z value */
float ball_get_z(BALL *ball)
{
  return ball->position.Z;
}

/* get ball rgba */
GLfloat *ball_get_rgba(BALL *ball)
{
  return ball->rgba;
}

/* draw ball model */
void ball_draw_model(BALL *ball)
{
  glPushMatrix();
    glColor4fv(ball->rgba);
    glTranslatef(ball->position.X, ball->position.Y, ball->position.Z);
    glCallList(ball->model);
  glPopMatrix();
}

/* draw ball vectors */
void ball_draw_vectors(BALL *ball, FLOOR *floor, GLfloat rgba[4])
{
  /* only draw if inside the floor */
  if (ball->position.X > floor_get_x(floor) && ball->position.X < (floor_get_x(floor) + floor_get_width(floor)))
  {
    glPushMatrix();
      glBegin(GL_LINES);
        glColor4fv(rgba);

        glVertex3f(floor_get_x(floor), 0.0f, ball->position.Z);
        glVertex3f(floor_get_x(floor) + floor_get_width(floor), 0.0f, ball->position.Z);

        glVertex3f(ball->position.X, (floor_get_width(floor) + floor_get_depth(floor))/-4, ball->position.Z);
        glVertex3f(ball->position.X, (floor_get_width(floor) + floor_get_depth(floor))/4, ball->position.Z);

        glVertex3f(ball->position.X, 0.0f, floor_get_z(floor));
        glVertex3f(ball->position.X, 0.0f, (floor_get_z(floor) + floor_get_depth(floor)));
      glEnd();
    glPopMatrix();
  }
}

/* move the ball */
void ball_move(BALL *ball, float speed)
{
  /* ball going right/left (X) */
  ball->position.X += (speed * ((ball->right) ? 1 : -1));

  /* ball going front/back (Z) */
  ball->position.Z += (speed * ((ball->front) ? 1 : -1));
}

/* reset the ball to it's starting position */
void ball_reset(BALL *ball)
{
  point_copy(&ball->position, &ball->reset);
}

/* detect collisions between the ball and other elements */
void ball_collisions(BALL *ball, FLOOR *floor, PLAYER *player[], int n)
{
  int i;
  /* add or subtract the ball radius according to the direction taken */
  float rad = (ball->radius * ((ball->right) ?  1 : -1));

  /* wall collisions */
  if (ball->position.Z < floor_get_z(floor) + ball->radius)
    ball->front = 1;

  if (ball->position.Z > floor_get_z(floor) + floor_get_depth(floor) - ball->radius)
    ball->front = 0;

  /* bounce when colliding with a player */
  for (i = 0; i < n; ++i)
    if (fabsf(ball->position.Z - player_get_center(player[i])) <= (player_get_width(player[i]) / 2) + player_get_radius(player[i]))
      if (fabsf(ball->position.X + rad - player_get_x(player[i])) <= player_get_radius(player[i]))
        ball->right = ((ball->right) ? 0 : 1);
}

/* check if the ball has left the floor */
int ball_left_floor(BALL *ball, FLOOR *floor, PLAYER *player[], int n)
{
  int i;
  int farthest;
  float distance = 0.0f;

  if (ball->position.X < floor_get_x(floor) - (8 * ball->radius) || ball->position.X > floor_get_x(floor) + floor_get_width(floor) + (8 * ball->radius))
  {
    /* find the farthest player to the ball */
    for (i = 0; i < n; ++i)
      if (distance < fabsf(ball->position.X - player_get_x(player[i])))
      {
        farthest = i;
        distance = fabsf(ball->position.X - player_get_x(player[i]));
      }

    player_add_score(player[farthest]);

    ball_reset(ball);

    return 1;
  }

  return 0;
}
