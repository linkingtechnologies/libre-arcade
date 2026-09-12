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

#include "texteffects.hh"
#include "ConsoleSource/DT_drawtext.h"
#include "debug.hh"
#include "screen.hh"
#include <math.h>

TTextEffects::TTextEffects(const char *str_, SDL_Surface *surface_, 
			  fonthandle_t * Font, EffectType et) :
  type(et), surface(surface_), str(str_), font(Font)
{
  /* Create a 32-bit surface with the bytes of each pixel in R,G,B,A order,
     as expected by OpenGL for textures */
  Uint32 rmask, gmask, bmask, amask;
  
  /* SDL interprets each pixel as a 32-bit number, so our masks must depend
     on the endianness (byte order) of the machine */
  
#if SDL_BYTEORDER == SDL_BIG_ENDIAN
  rmask = 0xff000000;
  gmask = 0x00ff0000;
  bmask = 0x0000ff00;
  amask = 0x000000ff;
#else
  rmask = 0x000000ff;
  gmask = 0x0000ff00;
  bmask = 0x00ff0000;
  amask = 0xff000000;
#endif
  
  int slen = strlen(str_);
  int cw = DT_FontWidth(*font) * slen;
  int ch = DT_FontHeight(*font);
  background = SDL_CreateRGBSurface(SDL_HWSURFACE, cw,
				    ch, 32,
				    rmask, gmask, bmask, amask);
  if(background == NULL) {
    fprintf(stderr, "CreateRGBSurface failed: %s\n", SDL_GetError());
    exit(1);
  }
  
  char_points = vector<TPoint>(slen);
}

TTextEffects::~TTextEffects() 
{
  if (background)
    SDL_FreeSurface(background);
}

void
TTextEffects::update(Uint32 currenttime)
{
  switch (type) {
  case SIMPLE_DISPLAY:
    simpleDisplay(currenttime);
    break;
  case CHARACTER_SPACED_ANIM:
    characterSpacedAnim(currenttime);
    break;
  case CHARACTER_JUMPING_ANIM:
    characterJumpingAnim(currenttime);
    break;
  case CHARACTER_SWIRLING_ANIM:
    characterSwirlingAnim(currenttime);
    break;
  default:
    Assert(0,"Tried to make a texteffect that doesn't exist");
  }
  
}

void
TTextEffects::simpleDisplay(Uint32 currenttime) {

  static Uint32 begin_time = 0;

  if (!begin_time)
    begin_time = currenttime;

  if ( (currenttime - begin_time) > Duration) {
    stop();
    begin_time = 0;
    return;
  }

  if (!surface || !str || !font)
    return;


  DT_DrawText(str , surface, *font, 
	      static_cast<int>(Location.x()), 
	      static_cast<int>(Location.y()));
}

void 
TTextEffects::characterSpacedAnim(Uint32 currenttime)
{
  if (!begin_time)
    begin_time = currenttime;

  if ( (currenttime - begin_time) > Duration) {
    stop();
    begin_time = 0;
    return;
  }

  if ( (currenttime - begin_time) > Duration-500)
    return;

  if (!surface || !str || !font)
    return;

  if (!no_erase) {
    blitCharsBackground();
  }else{
    begin_time = currenttime;
    no_erase=false;
  }

  int fontwidth = DT_FontWidth(*font);
  double timepct = static_cast<double>(currenttime-begin_time)/static_cast<double>(Duration-1000);
  int characters = strlen(str);
  
  /* Now draw it */
  int count=0;
  for (std::vector<TPoint>::iterator i = char_points.begin();
       i != char_points.end() ; i++) {
    double candtp = timepct - static_cast<double>(characters-count) * 
      (1.0/static_cast<double>(characters));
    double newtp = (candtp >= 1) ? 1 : candtp; 
    double _x = sin(newtp*M_PI_2) * Location.x();
    i->setX(_x + count * fontwidth);
    i->setY(Location.y());
    count++;
  }
  saveCharsBackground();
  blitChars();
}

void 
TTextEffects::characterJumpingAnim(Uint32 currenttime)
{

  if (!surface || !str || !font)
    return;

  if (!no_erase) {
    blitCharsBackground();
  }else{
    no_erase = false;
    begin_time = currenttime;
  }

  if ( (currenttime - begin_time) > Duration) {
    stop();
    begin_time = 0;
    return;
  }

  if ( (currenttime - begin_time) > Duration-500)
    return;

  int fontwidth = DT_FontWidth(*font);
  int fontheight = DT_FontHeight(*font);
  int characters = strlen(str);
  double timepct = static_cast<double>(currenttime-begin_time)/static_cast<double>(Duration-1000);
  int _i = static_cast<int>(timepct * static_cast<double>(characters));
  int _y = static_cast<int>(Location.y());
  int _x = (surface->w - fontwidth * characters) / 2;
  int count = 0;
  
  /* Now draw it */
  for (std::vector<TPoint>::iterator i = char_points.begin();
       i != char_points.end() ; i++) {
    if (count > 1 && count == (_i-2)) { 
      i->setY(_y + fontheight/4);
    } else if ( count > 0 && count == (_i-1)) { 
      i->setY(_y + fontheight/2);
    } else if (count == (_i)) { 
      i->setY(_y + fontheight);
    } else if (count != (characters-2) && count == (_i+1)) { 
      i->setY(_y + fontheight/2);
    } else if (count != (characters-3) && count == (_i+2)) { 
      i->setY(_y + fontheight/4);
    } else {
      i->setY(_y);
    }
    i->setX(_x - characters/2 + count * fontwidth);
    count++;
  }
  saveCharsBackground();
  blitChars();
}


void 
TTextEffects::characterSwirlingAnim(Uint32 currenttime)
{

  if (!surface || !str || !font)
    return;

  // now blit back the backgrounds for each charaters
  int count = 0;
  if (!no_erase) {
    blitCharsBackground();
  }else{
    no_erase = false;
    begin_time = currenttime;
  }

  if ( (currenttime - begin_time) > Duration) {
    stop();
    begin_time = 0;
    SDL_FreeSurface(background);
    background = 0;
    char_points.clear();
    return;
  }
  if ( (currenttime - begin_time) > Duration-500)
    return;

  int characters = strlen(str);
  double timepct = static_cast<double>(currenttime-begin_time)/static_cast<double>(Duration-1000);
  timepct = (timepct > 1.0) ? 1.0 : timepct;
  count = 0;
  for (std::vector<TPoint>::iterator i = char_points.begin();
       i != char_points.end() ; i++) {
    int scale = (count - characters/2) * DT_FontWidth(*font);
    i->setX( static_cast<double>(surface->w/2) + 
	     static_cast<double>(scale) * cos(timepct * 2.0 * M_PI) ); 
    i->setY( static_cast<double>(surface->w/2) + 
	     static_cast<double>(scale) * sin(timepct * 2.0 * M_PI) ); 
    count++;
  }

  saveCharsBackground();
  blitChars();
}

void TTextEffects::blitChars() 
{

  SDL_Rect SourceRect, DestRect;
  BitFont *CurrentFont;
  CurrentFont = DT_FontPointer(*font);
  int count = 0;
  int font_width = DT_FontWidth(*font);
  int font_height = DT_FontHeight(*font);

  // OK now blit the character to the right place on the screen
  for (std::vector<TPoint>::iterator i = char_points.begin();
       i != char_points.end() ; i++) {

    SourceRect.x = str[count] * font_width;
    SourceRect.y = 0;
    SourceRect.w = font_width;
    SourceRect.h = font_height;

    DestRect.x = static_cast<int>(i->x());
    DestRect.y = static_cast<int>(i->y());
    DestRect.w = SourceRect.w;
    DestRect.h = SourceRect.h;
    
    count++;
    /* draw the characters */
    SDL_BlitSurface(CurrentFont->FontSurface, &SourceRect, surface, &DestRect);
  }

}

void TTextEffects::saveCharsBackground()
{
  SDL_Rect SourceRect, DestRect;
  int count = 0;
  int font_width = DT_FontWidth(*font);
  int font_height = DT_FontHeight(*font);

  for (std::vector<TPoint>::iterator i = char_points.begin();
       i != char_points.end() ; i++) {

    SourceRect.x = static_cast<int>(i->x());
    SourceRect.y = static_cast<int>(i->y());
    SourceRect.w = font_width;
    SourceRect.h = font_height;
    
    DestRect.x = count * font_width;
    DestRect.y = 0;
    DestRect.w = SourceRect.w;
    DestRect.h = SourceRect.h;
 
   /* save the background */
    SDL_BlitSurface(surface, &SourceRect, background, &DestRect);
    count++;
  }

}

void TTextEffects::blitCharsBackground()
{
  SDL_Rect SourceRect, DestRect;
  int count = 0;
  int font_width = DT_FontWidth(*font);
  int font_height = DT_FontHeight(*font);

  // now blit back the backgrounds for each charaters
  for (std::vector<TPoint>::iterator i = char_points.begin();
       i != char_points.end() ; i++) {
    DestRect.x = static_cast<int>(i->x());
    DestRect.y = static_cast<int>(i->y());
    DestRect.w = font_width;
    DestRect.h = font_height;
    
    SourceRect.x = count * font_width;
    SourceRect.y = 0;
    SourceRect.w = DestRect.w;
    SourceRect.h = DestRect.h;
    count++;
    /* draw the background */
    SDL_BlitSurface(background, &SourceRect, surface, &DestRect);
  }
}





