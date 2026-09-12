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
#include "fontmanager.hh"
#include "log.hh"
#include <SDL/SDL.h>
#include "ConsoleSource/DT_drawtext.h"

/* **********************************************************************
 * The font manager
 * *********************************************************************/
TFontManager * FontManager;

/* **********************************************************************
 * Load and realease
 * **********************************************************************/
fonthandle_t * TFontManager::LoadRessource(string filename) {
  fonthandle_t * tmp1 = new fonthandle_t;
  *tmp1 = DT_LoadFont(filename.c_str(),TRANS_FONT); 
  if (*tmp1 < 0) {
    LogLine(LOG_ERROR, "Error loading ressource");
    delete tmp1;
    return NULL;
  }
  return tmp1;
}

void TFontManager::UnloadRessource(fonthandle_t * font) {
  if (font)
    delete font;
  else
    LogLine(LOG_ERROR, "Error. Tried to Unload NULL font");
}
