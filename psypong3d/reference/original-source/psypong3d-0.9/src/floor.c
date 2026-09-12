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

struct __FLOOR
{
  point position;
  float width;
  float depth;
  float wall;
  GLuint model;
  GLfloat rgba[4];
  GLuint texture;
  GLUquadricObj *quadric;
};

/* create a new game floor */
FLOOR *floor_new(float x, float y, float z, float w, float d, GLfloat rgba[4], const char *texture)
{
  FLOOR *floor = NULL;
  BMP *bmp = NULL;

  if ((floor = (FLOOR *) malloc(sizeof(FLOOR))) == NULL)
    return NULL;

  /* load texture file */
  if ((bmp = bmp_new(texture)) == NULL)
  {
    floor_free(floor);
    return NULL;
  }

  floor->texture = bmp_to_texture(bmp);
  bmp_free(bmp);

  point_new(&floor->position, x, y, z);
  floor->width = w;
  floor->depth = d;
  floor->wall = ((w + d) / 2) * 0.01f;

  if ((floor->quadric = gluNewQuadric()) == NULL)
  {
    floor_free(floor);
    return NULL;
  }

  gluQuadricDrawStyle(floor->quadric, GLU_FILL);
  gluQuadricNormals(floor->quadric, GLU_SMOOTH);
  gluQuadricOrientation(floor->quadric, GLU_OUTSIDE);

  /* create floor model */
  floor->model = glGenLists(1);

  glNewList(floor->model, GL_COMPILE);
    glPushMatrix();
      glTranslatef(0.0f, 0.0f, 0.0f - floor->wall);
      glRotatef(90.0f, 0.0f, 1.0f, 0.0f);
      gluCylinder(floor->quadric, floor->wall, floor->wall, floor->width, 16, 1);
    glPopMatrix();

    glPushMatrix();
      glTranslatef(0.0f, 0.0f, 0.0f + floor->depth + floor->wall);
      glRotatef(90.0f, 0.0f, 1.0f, 0.0f);
      gluCylinder(floor->quadric, floor->wall, floor->wall, floor->width, 16, 1);
    glPopMatrix();
  glEndList();

  /* set floor color */
  floor->rgba[0] = rgba[0];
  floor->rgba[1] = rgba[1];
  floor->rgba[2] = rgba[2];
  floor->rgba[3] = rgba[3];

  return floor;
}

/* free floor object */
void floor_free(FLOOR *floor)
{
  if (floor != NULL)
  {
    glDeleteTextures(1, &floor->texture);
    gluDeleteQuadric(floor->quadric);
    glDeleteLists(floor->model, 1);
  }

  free(floor);
}

/* get floor width */
float floor_get_width(FLOOR *floor)
{
  return floor->width;
}

/* get floor depth */
float floor_get_depth(FLOOR *floor)
{
  return floor->depth;
}

/* get floor X value */
float floor_get_x(FLOOR *floor)
{
  return floor->position.X;
}

/* get floor Z value */
float floor_get_z(FLOOR *floor)
{
  return floor->position.Z;
}

/* draw floor model */
void floor_draw_model(FLOOR *floor)
{
  glPushMatrix();
    glColor4fv(floor->rgba);
    glTranslatef(floor->position.X, floor->position.Y, floor->position.Z);

    glCallList(floor->model);

    glPushMatrix();
      glRotatef(90.0f, 1.0f, 0.0f, 0.0f);
      bmp_render_texture(floor->texture, floor->width, floor->depth, floor->rgba);
    glPopMatrix();
  glPopMatrix();
}
