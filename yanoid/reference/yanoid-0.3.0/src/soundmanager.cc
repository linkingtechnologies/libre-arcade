/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
    Copyright (C) 2001 Jonas Christian Drewsen <jcd@xspect.dk>
    Copyright (C) 2001 contributers of the yanoid project
    Please see the file "AUTHORS" for a list of contributers

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/
#include "soundmanager.hh"
#include "log.hh"

/* **********************************************************************
 * The sound manager
 * *********************************************************************/
TSoundManager * SoundManager = NULL;

/* **********************************************************************
 * Load and realease
 * **********************************************************************/
Mix_Chunk * TSoundManager::LoadRessource(string filename) {
  Mix_Chunk * tmp1 = Mix_LoadWAV(filename.c_str()); 
  if (!tmp1) {
    LogLine(LOG_ERROR, "Error loading ressource");
    return NULL;
  }
  return tmp1;
}

void TSoundManager::UnloadRessource(Mix_Chunk * sound) {
  if (sound)
    Mix_FreeChunk(sound);
  else
    LogLine(LOG_ERROR, "Error. Tried to Unload NULL sound");
}

/* **********************************************************************
 * Play Sound - a convenience function
 * *********************************************************************/
void TSoundManager::PlaySound(string name) {
  Mix_Chunk * tmp = RequireRessource(name);
  if (tmp) {
    Mix_PlayChannel(-1, tmp, 0);
    ReleaseRessource(tmp);
  }
}

/* **********************************************************************
 * Load Sound - loads a sound (caches)
 * *********************************************************************/
void TSoundManager::LoadSound(string name) {
  Mix_Chunk * tmp = RequireRessource(name);
  if (tmp) {
    ReleaseRessource(tmp);
  }
}
