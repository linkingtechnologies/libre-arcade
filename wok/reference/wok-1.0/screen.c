/*
 * $Id: screen.c,v 1.3 2001/11/10 01:49:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * SDL screen handler.
 *
 * @version $Revision: 1.3 $
 */
#include <math.h>
#include <stdio.h>
#include "SDL.h"
#include "SDL_image.h"

#include "screen.h"

#define SPRITE_NUM_RED_BACK 3
#define SPRITE_NUM_BLUE_BACK (6+10+1+8+4+2+6+8)
#define SPRITE_NUM (SPRITE_NUM_RED_BACK+SPRITE_NUM_BLUE_BACK)

int windowMode = 0;

static SDL_Surface *video;
static SDL_Surface *sprite[SPRITE_NUM];
static SDL_Rect screenRect;

static char *spriteFile[SPRITE_NUM] = {
  "ball_b7.png", "ball_b10.png", "ball_b15.png",
  "ball_g7.png", "ball_g10.png", "ball_g15.png",
  "ball_r7.png", "ball_r10.png", "ball_r15.png",

  "0s.png", "1s.png",  "2s.png",  "3s.png",  "4s.png", 
  "5s.png", "6s.png",  "7s.png",  "8s.png",  "9s.png", 
  "xs.png",
  "pp0s.png", "pp1s.png", "pp2s.png", "pp3s.png",
  "pp4s.png", "pp5s.png", "pp6s.png", "pp7s.png",
  "pr0.png", "pr2.png", "pr4.png", "pr6.png",
  "panh.png", "panv.png", 
  "fire.png", "vlcn.png", "tree.png", "vcnt.png", "clud.png", "watg.png",

  "bar0.png", "bar1.png", "bar2.png", "bar3.png",
  "start.png", "quit.png", "hiscore.png",
  "cursor.png"
};

static void loadSprites() {
  SDL_Color color[1];
  SDL_Surface *img;
  int i;
  char name[32];
  color[0].r = 255; color[0].g = 0; color[0].b = 0;
  SDL_SetColors(video, color, 0, 1);
  for ( i=0 ; i<SPRITE_NUM_RED_BACK ; i++ ) {
    strcpy(name, "images/");
    strcat(name, spriteFile[i]);
    img = IMG_Load(name);
    if ( img == NULL ) {
      fprintf(stderr, "Unable to load: %s\n", name);
      SDL_Quit();
      exit(1);
    }
    sprite[i] = SDL_ConvertSurface(img,
				   video->format, 
				   SDL_HWSURFACE | SDL_SRCCOLORKEY);
    SDL_SetColorKey(sprite[i], SDL_SRCCOLORKEY | SDL_RLEACCEL, 0);
  }
  color[0].r = 0; color[0].g = 0; color[0].b = 255;
  SDL_SetColors(video, color, 0, 1);
  for ( ; i<SPRITE_NUM ; i++ ) {
    strcpy(name, "images/");
    strcat(name, spriteFile[i]);
    img = IMG_Load(name);
    if ( img == NULL ) {
      fprintf(stderr, "Unable to load: %s\n", name);
      SDL_Quit();
      exit(1);
    }
    sprite[i] = SDL_ConvertSurface(img, 
				   video->format, 
				   SDL_HWSURFACE | SDL_SRCCOLORKEY);
    SDL_SetColorKey(sprite[i], SDL_SRCCOLORKEY | SDL_RLEACCEL, 0);
  }
  color[0].r = 255; color[0].g = 255; color[0].b = 255;
  SDL_SetColors(video, color, 0, 1);
}

void drawSprite(int n, int x, int y) {
  SDL_Rect pos;
  pos.x = x; pos.y = y;
  SDL_BlitSurface(sprite[n], NULL, video, &pos);
}

// Draw the numbers and the crumpled papaers.

int drawNum(int n, int x ,int y) {
  int d, nd, drawn = 0;
  for ( d = 100000000 ; d > 0 ; d /= 10 ) {
    nd = (int)(n/d);
    if ( nd > 0 || drawn ) {
      n -= d*nd;
      drawSprite(nd+NUM_SPRITE_IDX, x, y);
      x += 50;
      drawn = 1;
    }
  }
  if ( !drawn ) {
    drawSprite(NUM_SPRITE_IDX, x, y);
    x += 52;
  }
  return x;
}

int drawNumPaper(int n, int x ,int y, int pc) {
  int d, nd, drawn = 0, ofs;
  ofs = pc*6;
  pc += PPS_SPRITE_IDX;
  for ( d = 1000000 ; d > 0 ; d /= 10 ) {
    nd = (int)(n/d);
    if ( nd > 0 || drawn ) {
      n -= d*nd;
      drawSprite(pc, x, y);
      x += ofs;
      drawn = 1;
    }
  }
  return x;
}

// Draw yellow rect.

static SDL_Rect zoneRect;
static Uint32 zoneColor;

static void initRects() {
  zoneRect.x = SCREEN_WIDTH*0.93f;
  zoneRect.y = 0;
  zoneRect.w = SCREEN_WIDTH*0.1f;
  zoneRect.h = SCREEN_HEIGHT;
  zoneColor = SDL_MapRGB(video->format, 240, 240, 128);
}

void fillRect(int x, int y, int w, int h) {
  SDL_Rect rect;
  rect.x = x; rect.y = y;
  rect.w = w; rect.h = h;
  SDL_FillRect(video, &rect, zoneColor);
}

void drawThrownZone() {
  SDL_FillRect(video, &zoneRect, zoneColor);
}

// Initialize palletes.

#define PALETTE_NUM 13

static SDL_Color palette[PALETTE_NUM] = {
  {0, 0, 0}, 
  {255, 0, 0}, {0, 255, 0}, {0, 0, 255},
  {255, 255, 0}, {0, 255, 255}, {255, 0, 255},
  {255, 127, 0}, {255, 0, 127}, 
  {127, 255, 0}, {0, 255, 127}, 
  {127, 0, 255}, {0, 127, 255},
};

static void initPalette() {
  int i, j, idx = 0;
  int sr, sg, sb;
  SDL_Color color[1];
  for ( i=0 ; i<PALETTE_NUM ; i++ ) {
    color[0].r = 255; color[0].g = 255; color[0].b = 255;
    sr = (255-palette[i].r)/16;
    sg = (255-palette[i].g)/16;
    sb = (255-palette[i].b)/16;
    for ( j=0 ; j<16 ; j++, idx++ ) {
      SDL_SetColors(video, color, idx, 1);
      color[0].r -= sr;
      color[0].g -= sg;
      color[0].b -= sb;
    }
  }
}

// Mouse handler.

static int mx, my;

void initMouse() {
  if ( windowMode ) {
    SDL_GetMouseState(&mx, &my);
  } else {
    mx = SCREEN_WIDTH/2; my = SCREEN_HEIGHT/2;
  }
}

float mouseAccel = DEFAULT_MOUSE_ACCEL;

int getMouseState(int *x, int *y) {
  int mvx, mvy, button;
  button = SDL_GetRelativeMouseState(&mvx, &mvy);
  //mx += mvx*MOUSE_ACCEL; my += mvy*MOUSE_ACCEL;
  mx += mvx*mouseAccel; my += mvy*mouseAccel;
  if ( mx < 0 ) mx = 0;
  else if ( mx > SCREEN_WIDTH ) mx = SCREEN_WIDTH-1;
  if ( my < 0 ) my = 0;
  else if ( my > SCREEN_HEIGHT ) my = SCREEN_HEIGHT-1;
  *x = mx; *y = my;
  return button;
}

void initSDL(int window) {
  Uint8 videoBpp;
  Uint32 videoFlags;

  if ( SDL_Init(SDL_INIT_VIDEO) < 0 ) {
    fprintf(stderr, "Unable to initialize SDL: %s\n", SDL_GetError());
    exit(1);
  }
  atexit(SDL_Quit);

  videoBpp = BPP;
  videoFlags = SDL_DOUBLEBUF | SDL_HWSURFACE | SDL_HWPALETTE;
  if ( !window ) videoFlags |= SDL_FULLSCREEN;

  if ( (video = SDL_SetVideoMode(SCREEN_WIDTH, SCREEN_HEIGHT, videoBpp, videoFlags)) == NULL ) {
    fprintf(stderr, "Unable to create SDL screen: %s\n", SDL_GetError());
    SDL_Quit();
    exit(1);
  }
  screenRect.x = screenRect.y = 0;
  screenRect.w = SCREEN_WIDTH; screenRect.h = SCREEN_HEIGHT;

  initPalette();

  SDL_WM_SetCaption("Wok", NULL);

  loadSprites();
  initRects();

  initMouse();
  SDL_ShowCursor(SDL_DISABLE);
  //SDL_WM_GrabInput(SDL_GRAB_ON);
}

void closeSDL() {
  SDL_ShowCursor(SDL_ENABLE);
}

void flipScreen() {
  SDL_Flip(video);
}

void clearScreen() {
  SDL_FillRect(video, &screenRect, 0);
}
