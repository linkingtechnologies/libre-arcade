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

#ifndef KEYBOARD_H
#define KEYBOARD_H 1

#define KEYBOARD_OFFSET 256

/* game keys */
#define KEY_F1      (GLUT_KEY_F1 + KEYBOARD_OFFSET)
#define KEY_F2      (GLUT_KEY_F2 + KEYBOARD_OFFSET)

#define KEY_UP      (GLUT_KEY_UP + KEYBOARD_OFFSET)
#define KEY_DOWN    (GLUT_KEY_DOWN + KEYBOARD_OFFSET)

#define KEY_SPACE   ' '
#define KEY_ESCAPE  27

typedef struct __KEYBOARD KEYBOARD;

/* keyboard callback function */
typedef void (*keyboard_func) (int, int, int);

/* create a new keyboard object and return pointer */
extern KEYBOARD *keyboard_new(keyboard_func, keyboard_func);

/* free keyboard resources */
extern void keyboard_free(KEYBOARD *);

/* return true if a specific key has been pressed */
extern int keyboard_key_pressed(KEYBOARD *, int);

#endif /* KEYBOARD_H */
