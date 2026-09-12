/*
 * $Id: sound.h,v 1.2 2001/11/03 03:45:26 kenta Exp $
 *
 * Copyright 2001 Kenta Cho. All rights reserved.
 */

/**
 * BGM/SE manager header file.
 *
 * @version $Revision: 1.2 $
 */
void closeSound();
void initSound();
void checkSound();
void playMusic(int idx);
void stopMusic();
void changeMusic(int idx);
void nextMusic();
void playChunk(int idx);
