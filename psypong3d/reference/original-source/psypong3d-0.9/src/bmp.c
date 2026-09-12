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

struct __BMP
{
  unsigned int width;
  unsigned int height;
  char *data;
};

/* load a bmp file to a data structure */
BMP *bmp_new(const char *file)
{
  FILE *stream = NULL;
  BMP *bmp = NULL;
  unsigned long int i;
  char ch;

  if ((stream = fopen(file, "r")) == NULL)
    return NULL;

  if ((bmp = (BMP *) malloc(sizeof(BMP))) == NULL)
  {
    fclose(stream);
    return NULL;
  }

  fseek(stream, 18, SEEK_CUR);
  fread(&bmp->width, sizeof(int), 1, stream);
  fread(&bmp->height, sizeof(int), 1, stream);

  if (!(bmp->data = (char *) malloc(bmp->width * bmp->height * 3)))
  {
    fclose(stream);
    free(bmp);
    return NULL;
  }

  fread(bmp->data, bmp->width * bmp->height * 3, 1, stream);

  /* swap from BGR to RGB */
  for (i = 0; i < bmp->width * bmp->height * 3; i += 3)
  {
    ch = bmp->data[i-1];
    bmp->data[i-1] = bmp->data[i+1];
    bmp->data[i+1] = ch;
  }

  fclose(stream);

  return bmp;
}

/* free bmp data structure */
void bmp_free(BMP *bmp)
{
  if (bmp != NULL)
    free(bmp->data);

  free(bmp);
}

/* convert bmp object to texture and return it's ID */
GLuint bmp_to_texture(BMP *bmp)
{
  GLuint texture;

  glGenTextures(1, &texture);
  glBindTexture(GL_TEXTURE_2D, texture);

  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

  glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);

  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, bmp->width, bmp->height, 0, GL_RGB, GL_UNSIGNED_BYTE, bmp->data);

  return texture;
}

/* render a texture */
void bmp_render_texture(GLuint texture, float w, float h, GLfloat rgba[4])
{
  glEnable(GL_TEXTURE_2D);
  glBindTexture(GL_TEXTURE_2D, texture);

  glPushMatrix();
  glColor4fv(rgba);

  glBegin(GL_QUADS);
    glTexCoord2f(0.0f, 1.0f);
    glVertex3f(0.0f,  h, 0.0f); /* lower left */

    glTexCoord2f(0.0f, 0.0f);
    glVertex3f(0.0f, 0.0f, 0.0f); /* lower right */

    glTexCoord2f(1.0f, 0.0f);
    glVertex3f(w, 0.0f, 0.0f); /* upper right */

    glTexCoord2f(1.0f, 1.0f);
    glVertex3f(w,  h, 0.0f); /* upper left */
  glEnd();
  glPopMatrix();

  glDisable(GL_TEXTURE_2D);
}

/* render a string */
void bmp_render_string(const char *s, float x, float y)
{
  glPushMatrix();
    glRasterPos2f(x, y);

    while (*s)
      glutBitmapCharacter(BMP_DEFAULT_FONT, *s++);
  glPopMatrix();
}
