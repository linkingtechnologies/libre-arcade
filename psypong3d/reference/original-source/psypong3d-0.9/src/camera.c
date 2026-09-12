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

struct __CAMERA
{
  point position;     /* camera position */
  point rotation;     /* camera view rotation */
  point reset_pos;    /* original position coordinates */
  point reset_rot;    /* original rotation coordinates */
};

/* create a new camera object and return pointer */
CAMERA *camera_new(float px, float py, float pz, float rx, float ry, float rz)
{
  CAMERA *camera = NULL;

  if ((camera = (CAMERA *) malloc(sizeof(CAMERA))) == NULL)
    return NULL;

  point_new(&camera->position, px, py, pz);
  point_new(&camera->rotation, rx, ry, rz);

  point_copy(&camera->reset_pos, &camera->position);
  point_copy(&camera->reset_rot, &camera->rotation);

  return camera;
}

/* free camera resources */
void camera_free(CAMERA *camera)
{
  free(camera);
}

/* rotate the camera */
void camera_rotate(CAMERA *camera, float x, float y, float z)
{
  camera->rotation.X = x;
  camera->rotation.Y = y;
  camera->rotation.Z = z;
}

/* rotate the camera in a random way */
void camera_rotate_random(CAMERA *camera, float angle)
{
  float n[3] = {-1.0f, 0.0f, 1.0f};

  srand(time(NULL));

  camera->rotation.X += drand48() * angle * n[rand()%3];
  camera->rotation.Y += drand48() * angle * n[rand()%3];
  camera->rotation.Z += drand48() * angle * n[rand()%3];
}

/* display changes in camera */
void camera_display(CAMERA *camera)
{
  glTranslatef(camera->position.X, camera->position.Y, camera->position.Z);
  glRotatef(camera->rotation.X, 1.0f, 0.0f, 0.0f);
  glRotatef(camera->rotation.Y, 0.0f, 1.0f, 0.0f);
  glRotatef(camera->rotation.Z, 0.0f, 0.0f, 1.0f);
}

/* reset camera to original coordinates */
void camera_reset(CAMERA *camera)
{
  point_copy(&camera->position, &camera->reset_pos);
  point_copy(&camera->rotation, &camera->reset_rot);
}
