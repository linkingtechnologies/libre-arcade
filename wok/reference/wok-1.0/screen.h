/*
 * $Id: screen.h,v 1.2 2001/11/10 01:49:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * SDL screen functions header file.
 *
 * @version $Revision: 1.2 $
 */
#define SCREEN_WIDTH 640
#define SCREEN_HEIGHT 480

#define BPP 8

#define DEFAULT_MOUSE_ACCEL 1
#define MOUSE_ACCEL_IN_FULL_SCREEN 3

#define NUM_SPRITE_IDX 9
#define PPS_SPRITE_IDX 20
#define PPL_SPRITE_IDX 28
#define PAN_SPRITE_IDX 32
#define GEN_SPRITE_IDX 34
#define BAR_SPRITE_IDX 40
#define TITLE_SPRITE_IDX 44

extern int windowMode;
extern float mouseAccel;

void initSDL(int window);
void closeSDL();
void initMouse();
void drawSprite(int n, int x, int y);
int drawNum(int n, int x ,int y);
int drawNumPaper(int n, int x ,int y, int pc);
void fillRect(int x, int y, int w, int h);
void drawDangerRect(int x, int w, int h);
void drawThrownZone();
void flipScreen();
void clearScreen();
int getMouseState(int *x, int *y);
