/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
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
#include "screen.hh"
#include "surfacemanager.hh"
#include "log.hh"
#include <SDL/SDL_image.h>

/* **********************************************************************
 * The surface manager
 * *********************************************************************/
TSurfaceManager * SurfaceManager;

/* **********************************************************************
 * Construction
 * *********************************************************************/
TSurfaceManager::TSurfaceManager() : TRessourceManager<SDL_Surface>() {
  ColorKey = SDL_MapRGB(Screen->format, 0, 0, 0);
}


/* **********************************************************************
 * Load and realease
 * Load will convert the surface to the display format. 
 * *********************************************************************/
SDL_Surface * TSurfaceManager::LoadRessource(string filename) {
  SDL_Surface * tmp1 = IMG_Load(filename.c_str()); 
  if (!tmp1) {
    LogLineExt(LOG_ERROR, ("Error loading ressource %s", filename.c_str()));
    return NULL;
  } else {
    // LogLine(LOG_VERBOSE, "Converting display format");
    SDL_SetColorKey(tmp1, SDL_SRCCOLORKEY | SDL_RLEACCEL, ColorKey);
    SDL_Surface * res = SDL_DisplayFormat(tmp1);
    SDL_FreeSurface(tmp1);
    return res;
  }
}

void TSurfaceManager::UnloadRessource(SDL_Surface * surface) {
  SDL_FreeSurface(surface);
}
