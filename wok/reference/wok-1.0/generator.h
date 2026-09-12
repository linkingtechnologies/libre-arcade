/*
 * $Id: generator.h,v 1.1.1.1 2001/11/03 02:48:59 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * Ball generators data.
 *
 * @version $Revision: 1.1.1.1 $
 */

typedef struct {
  int x, y;
  int cnt, apCnt;
  int spc;
} Generator;

void initGenerators();
void addGenerator(int spc);
void moveGeneraots();
void drawGenerators();
