/*
 * $Id: vector.h,v 1.1.1.1 2001/11/03 02:48:59 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Vector data.
 *
 * @version $Revision: 1.1.1.1 $
 */

#ifndef DEF_VECTOR
typedef struct {
  float x, y;
} Vector;
#define DEF_VECTOR
#endif

float vctInnerProduct(Vector *v1, Vector *v2); 
Vector vctGetElement(Vector *v1, Vector *v2);
void vctAdd(Vector *v1, Vector *v2);
void vctSub(Vector *v1, Vector *v2);
void vctMul(Vector *v1, float a);
void vctDiv(Vector *v1, float a);
float vctCheckSide(Vector *checkPos, Vector *pos1, Vector *pos2);
float vctSize(Vector *v);
