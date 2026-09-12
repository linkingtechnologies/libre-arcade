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

#define KEYBOARD_STATES 512

struct __KEYBOARD
{
  int *states;                /* key states */
  keyboard_func func_press;   /* key press callback function */
  keyboard_func func_release; /* key release callback function */
};

static KEYBOARD *k = NULL;  /* private keyboard pointer for callback access */

/* (private) press a normal key */
static void __keyboard_func_press_normal(unsigned char key, int x, int y)
{
  k->states[key] = 1; /* press the key */

  if (k->func_press)
    k->func_press(key, x, y);
}

/* (private) release a normal key */
static void __keyboard_func_release_normal(unsigned char key,int x,int y)
{
  k->states[key] = 0; /* release the key */

  if (k->func_release)
    k->func_release(key, x, y);
}

/* (private) press a special key */
static void __keyboard_func_press_special(int key, int x, int y)
{
  k->states[key + KEYBOARD_OFFSET] = 1; /* press the key */

  if (k->func_press)
    k->func_press(key + KEYBOARD_OFFSET, x, y);
}

/* (private) release a special key */
static void __keyboard_func_release_special(int key, int x, int y)
{
  k->states[key + KEYBOARD_OFFSET] = 0; /* release the key */

  if (k->func_release)
    k->func_release(key + KEYBOARD_OFFSET, x, y);
}

/* create a new keyboard object and return pointer */
KEYBOARD *keyboard_new(keyboard_func fp, keyboard_func fr)
{
  KEYBOARD *keyboard = NULL;

  if ((keyboard = (KEYBOARD *) malloc(sizeof(KEYBOARD))) == NULL)
    return NULL;

  if ((keyboard->states = (int *) calloc(KEYBOARD_STATES, sizeof(int))) == NULL)
  {
    free(keyboard);
    return NULL;
  }

  keyboard->func_press = fp;
  keyboard->func_release = fr;

  /* set glut callback functions */
  glutKeyboardFunc(__keyboard_func_press_normal);
  glutKeyboardUpFunc(__keyboard_func_release_normal);
  glutSpecialFunc(__keyboard_func_press_special);
  glutSpecialUpFunc(__keyboard_func_release_special);

  /* return keyboard pointer and set a private one for callback access */
  return (k = keyboard);
}

/* free keyboard resources */
void keyboard_free(KEYBOARD *keyboard)
{
  if (keyboard != NULL)
    free(keyboard->states);

  free(keyboard);
}

/* return true if a specific key has been pressed */
int keyboard_key_pressed(KEYBOARD *keyboard, int key)
{
  /* check if a key is valid */
  return ((key >= 0 && key < 512) ? keyboard->states[key] : 0);
}
