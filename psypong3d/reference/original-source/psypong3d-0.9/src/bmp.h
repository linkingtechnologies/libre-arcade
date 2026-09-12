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

#ifndef BMP_H
#define BMP_H 1

#define BMP_DEFAULT_FONT GLUT_BITMAP_HELVETICA_18

typedef struct __BMP BMP;

/* load a bmp file to a data structure */
extern BMP *bmp_new(const char *);

/* free bmp data structure */
extern void bmp_free(BMP *);

/* convert bmp to texture and return the ID */
extern GLuint bmp_to_texture(BMP *);

/* render a texture */
extern void bmp_render_texture(GLuint, float, float, GLfloat [4]);

/* render a string */
extern void bmp_render_string(const char *, float, float);

#endif /* BMP_H */
