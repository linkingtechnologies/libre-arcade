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

#ifndef CAMERA_H
#define CAMERA_H 1

typedef struct __CAMERA CAMERA;

/* create a new camera object and return pointer */
extern CAMERA *camera_new(float, float, float, float, float, float);

/* free camera resources */
extern void camera_free(CAMERA *);

/* rotate the camera */
extern void camera_rotate(CAMERA *, float, float, float);

/* rotate the camera in a random way */
extern void camera_rotate_random(CAMERA *, float);

/* display changes in camera */
extern void camera_display(CAMERA *);

/* reset camera to original coordinates */
extern void camera_reset(CAMERA *);

#endif /* CAMERA_H */
