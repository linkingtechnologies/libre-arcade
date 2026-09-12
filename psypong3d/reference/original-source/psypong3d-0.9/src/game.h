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

#ifndef GAME_H
#define GAME_H 1

/* default game configuration values */
#define GAME_TITLE "PSY PONG 3D"
#define GAME_VERSION "0.9"
#define GAME_YEAR "2008-2009"
#define GAME_AUTHOR "Quetzy Garcia"
#define GAME_FULLSCREEN 1
#define GAME_WINDOW_X 800
#define GAME_WINDOW_Y 600
#define GAME_WINDOW_Z 2048
#define GAME_RESOLUTION_X_MIN 320
#define GAME_RESOLUTION_X_MAX 3840
#define GAME_RESOLUTION_Y_MIN 240
#define GAME_RESOLUTION_Y_MAX 2400
#define GAME_LEVEL_START 1
#define GAME_LEVEL_INCREASE 1
#define GAME_LEVEL_INCREASE_VALUE 2
#define GAME_LEVEL_MIN 1
#define GAME_LEVEL_MAX 256
#define GAME_FPS_SHOW 0
#define GAME_FPS_SAMPLES 50
#define GAME_SCORE_LIMIT 5
#define GAME_SCORE_LIMIT_MIN 1
#define GAME_SCORE_LIMIT_MAX 32
#define GAME_MENU_TIMEOUT 5
#define GAME_TIMER 25
#define GAME_SLEEP_U 5000
#define GAME_SLEEP_S 3
#define GAME_TEXTURE_MENU "textures/menu.bmp"
#define GAME_TEXTURE_BACKGROUND "textures/background.bmp"
#define GAME_TEXTURE_FLOOR "textures/spiral.bmp"
#define GAME_FLOOR_WIDTH 128.0f
#define GAME_FLOOR_DEPTH 64.0f
#define GAME_FLOOR_SIZE_MIN 16.0f
#define GAME_FLOOR_SIZE_MAX 1024.0f
#define GAME_PLAYER_SIZE 3.0f
#define GAME_PLAYER_SIZE_MIN 1.0f
#define GAME_PLAYER_SIZE_MAX 16.0f
#define GAME_PLAYER_WARP 1
#define GAME_PLAYER_SWAP 1
#define GAME_BALL_RADIUS 1.5f
#define GAME_BALL_RADIUS_MIN 1.0f
#define GAME_BALL_RADIUS_MAX 16.0f
#define GAME_BALL_DRAW_VECTORS 0
#define GAME_CAMERA_FOVY 60.0f
#define GAME_CAMERA_ROTATE 1
#define GAME_CAMERA_RESET 1

typedef struct __GAME GAME;

typedef enum
{
  GAME_MODE_MENU,
  GAME_MODE_SINGLE,
  GAME_MODE_DUAL,
  GAME_MODE_DEMO,
  GAME_MODE_PAUSE
} GAME_MODE;

typedef enum
{
  GAME_ERROR_BMP,
  GAME_ERROR_MEMORY
} GAME_ERROR;

/* allocate resources for a new game */
extern GAME *game_new(int, char **);

/* free game resources */
extern void game_free(int, GAME *);

/* start the game */
extern void game_start(GAME *);

#endif /* GAME_H */
