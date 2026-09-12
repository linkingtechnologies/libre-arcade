/*
 * $Id: ball.h,v 1.2 2001/11/03 03:45:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Ball data.
 *
 * @version $Revision: 1.2 $
 */

#include "vector.h"

#define BALL_RADIUS 10.0f

typedef struct {
  Vector pos, vel;
  float radius;
  int color, size;
  int sprPtn;
} Ball;

void initBalls();
void addBall(int color, int size, float x, float y, float mx, float my);
void moveBalls();
void drawBalls();
