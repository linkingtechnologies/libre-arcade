/*
 * $Id: pan.h,v 1.2 2001/11/03 03:45:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Pan data.
 *
 * @version $Revision: 1.2 $
 */

#include "vector.h"

typedef struct {
  Vector pos, prvPos, vel;
  float deg;
} Pan;

typedef struct {
  Vector p1, p2, p3, p4, pc1, pc2;
  Vector v1, v2;
  float v1l, v2l;
} PanPos;

#define PAN_WIDTH 48.0f
#define PAN_HEIGHT 16.0f
#define PAN_THICK 8.0f

extern Pan pan;
extern PanPos now1, now2, now3;
extern PanPos prv1, prv2, prv3;

void initPan();
void movePan();
void drawPan();
