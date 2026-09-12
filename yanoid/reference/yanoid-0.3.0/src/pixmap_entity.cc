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
#include "pixmap_entity.hh"

#include "debug.hh"
#include "surfacemanager.hh"

/*
*  Bit flags
*/
#define SGE_FLAG0 0x00
#define SGE_FLAG1 0x01
#define SGE_FLAG2 0x02
#define SGE_FLAG3 0x04
#define SGE_FLAG4 0x08
#define SGE_FLAG5 0x10
#define SGE_FLAG6 0x20
#define SGE_FLAG7 0x40
#define SGE_FLAG8 0x80

unsigned char sge_mask[8]={SGE_FLAG1,SGE_FLAG2,SGE_FLAG3,SGE_FLAG4,SGE_FLAG5,
			   SGE_FLAG6,SGE_FLAG7,SGE_FLAG8};

Uint32 GetPixel(SDL_Surface *surface, Sint16 x, Sint16 y);

/* **********************************************************************
 * The constructor pt. loads a surface to blit around.
 * *********************************************************************/
TPixmapEntity::TPixmapEntity(int x_, int y_, Angle a_, 
			     const std::string& path,
			     EntityType e, 
			     MoveType m, 
			     CollisionGranularity c):
  TEntity(x_, y_, a_, e, m, c)
{
  init(path, *this);
}

TPixmapEntity::TPixmapEntity(const TOrientedPoint& p, 
			     const std::string& path,
			     EntityType e, 
			     MoveType m, 
			     CollisionGranularity c):
  TEntity(p, e, m, c) {
  init(path, *this);
}

void TPixmapEntity::init(const std::string& path, 
			 TPixmapEntity& e) {
  e.currentsurface
    = SurfaceManager->RequireRessource(path);
  Assert(NULL != e.currentsurface, "Error loading graphics for entity");
  e._h = e.currentsurface->h;
  e._w = e.currentsurface->w;
  e.MakeMask();
}

/* **********************************************************************
 * The destructor just clears the surface
 * *********************************************************************/
TPixmapEntity::~TPixmapEntity() {
  SurfaceManager->ReleaseRessource(currentsurface);
}


/* **********************************************************************
 * SetPixmap changes the pixmap of the entity
 * *********************************************************************/
void TPixmapEntity::setPixmap(const std::string& path) {
  if (currentsurface)
    SurfaceManager->ReleaseRessource(currentsurface);

  currentsurface
    = SurfaceManager->RequireRessource(path);
  Assert(NULL != currentsurface, "Error loading graphics for entity");
  _h = currentsurface->h;
  _w = currentsurface->w;

  MakeMask();
}

/* **********************************************************************
 * Change the pixmap, if different
 * *********************************************************************/
void TPixmapEntity::setPixmap(SDL_Surface * pixmap) {
  if (currentsurface != pixmap) {
    SurfaceManager->ReleaseRessource(currentsurface);
    currentsurface = SurfaceManager->DuplicateRessource(pixmap);
    _h = currentsurface->h;
    _w = currentsurface->w;
    MakeMask();
  }
}

/* **********************************************************************
 * The render method simply blit the entity to the surface provided
 * (This will probably change)
 * *********************************************************************/
void TPixmapEntity::Render(SDL_Surface * surface) {
  SDL_Rect src, dest;

  //  if (!changed)
  //    return;

  src.x = 0; src.y = 0; 
  src.w = currentsurface->w; src.h = currentsurface->h;

  dest.x = static_cast<int>(x()); 
  dest.y = static_cast<int>(y());
  dest.w = src.w; dest.h = src.h;
  
  SDL_BlitSurface(currentsurface, &src, surface, &dest);
}


/* **********************************************************************
 * Makemask - costructs the mask that is used for pixel perfect 
 * collision test
 * *********************************************************************/
void TPixmapEntity::MakeMask() 
{
  return;
#ifdef SOMEDAYWEMAYFIXPIXELS
  if (!currentsurface)
    return;
  
  int x,y;
  int offs;
  int i;
  unsigned char* tmask = mask;
  offs=(currentsurface->w * currentsurface->h)/8;
  mask=new unsigned char[offs+2];
  if(!mask){
    SDL_SetError("SGE - Out of memory");
    return;
  }
  
  memset(mask, 0x00, offs+2);
  
  i=0;
  // Hmm. Dont really understand this
  tmask = mask;
  for(y=0; y < _h; y++){
    for(x=0; x < _w; x++){
      if(i>7){i=0;tmask++;}
      if(GetPixel(currentsurface, Sint16(x),Sint16(y)) != currentsurface->format->colorkey){
	*tmask=*tmask|sge_mask[i];	
      }
      i++;
    }	
  }
#endif
}

/* **********************************************************************
 * PixelCollision determines whether the TEntity obj, 
 * of obj collides with this TEntity using pixel perfection. 
 * Much of this code is taken from sgelib
 * *********************************************************************/
bool TPixmapEntity::pixelCollision(TEntity& o) {
  return false;
#ifdef SOMEDAYWEMAYFIXPIXELS
  LogLine(LOG_TODO,"check o for NULL pointer also");
  if (!mask | !o.mask)
    return boundingBoxCollision(o);

  int x1 = static_cast<int>(position.x());
  int y1 = static_cast<int>(position.y());
  int x2 = static_cast<int>(o.position.x());
  int y2 = static_cast<int>(o.position.y());

  int w1=_w;
  int h1=_h;
  int w2=o._w;
  int h2=o._h;
	
  //masks
  
  int x1o=0, x2o=0, y1o=0, y2o=0, offs;  //offsets
  int i1=0, i2=0;
  
  unsigned char *map1 = mask;
  unsigned char *map2 = o.mask;
  int col_x = static_cast<int>(collidepoint.x());
  int col_y = static_cast<int>(collidepoint.y());

  //Calculate correct starting point
  if(col_x==x2 && col_y==y2){

    x1o=x2-x1;
    y1o=y2-y1;
    
    offs=w1*y1o+x1o;	
    map1+=offs/8;
    i1=offs%8;	

  } else if(col_x==x2 && col_y==y1){

    x1o=x2-x1;
    y2o=y1-y2;
    
    map1+=x1o/8;
    i1=x1o%8;
    
    offs=w2*y2o;
    map2+=offs/8;
    i2=offs%8;	

  } else if(col_x==x1 && col_y==y1){

    x2o=x1-x2;
    y2o=y1-y2;
    
    offs=w2*y2o+x2o;	
    map2+=offs/8;
    i2=offs%8;	

  } else if(col_x==x1 && col_y==y2){

    x2o=x1-x2;
    y1o=y2-y1;	
    
    offs=w1*y1o;
    map1+=offs/8;
    i1=offs%8;
    
    map2+=x2o/8;
    i2=x2o%8;	

  } else
    return false;
  
  int y;
  
  int length;
	
  if(x1+w1 < x2+w2)
    length = w1-x1o;	
  else
    length = w2-x2o;
  
  //AND(map1,map2)
  for(y=col_y; y<=y1+h1 && y<=y2+h2; y++){
    
    offs=memand(map1,map2,i1,i2,length);
    if(offs){
      collidepoint.setX(col_x+offs-1); 
      collidepoint.setY(y);
      return true;
    }
    
    //goto the new line
    offs=(y-y1)*w1+x1o;
    map1=mask; //reset pointer
    map1+=offs/8;
    i1=offs%8;
    
    offs=(y-y2)*w2+x2o;
    map2=o.mask; //reset pointer
    map2+=offs/8;
    i2=offs%8;
  }
  return false;
#endif
}

// pixelCollision helper
// AND N bits of s1 and s2. Returns the number of the bit or zero 
// Shamelessly stolen from sgelib
int TPixmapEntity::memand(unsigned char *s1, unsigned char *s2, 
			  int shift1, int shift2, int N)
{
  return 0;
#ifdef SOMEDAYWEMAYFIXPIXELS

  int b,i1=shift1,i2=shift2;

  for(b=0; b<N; b++){
  	if(i1>7){i1=0;s1++;}
  	if(i2>7){i2=0;s2++;}
  	if( (*s1 & sge_mask[i1]) && (*s2&sge_mask[i2]) ) 
	  return b+1;
  	i1++; i2++;	
  }
  return 0;
#endif
}


//==================================================================================
// Get pixel
//==================================================================================
Uint32 GetPixel(SDL_Surface *surface, Sint16 x, Sint16 y)
{
  return 0;
#ifdef SOMEDAYWEMAYFIXPIXELS
  
	switch (surface->format->BytesPerPixel) {
		case 1: { /* Assuming 8-bpp */
			return *((Uint8 *)surface->pixels + y*surface->pitch + x);
		}
		break;

		case 2: { /* Probably 15-bpp or 16-bpp */
			return *((Uint16 *)surface->pixels + y*surface->pitch/2 + x);
		}
		break;

		case 3: { /* Slow 24-bpp mode, usually not used */
			Uint8 *pix;
			int shift;
			Uint32 color=0;

			pix = (Uint8 *)surface->pixels + y * surface->pitch + x*3;
			shift = surface->format->Rshift;
			color = *(pix+shift/8)<<shift;
			shift = surface->format->Gshift;
			color|= *(pix+shift/8)<<shift;
			shift = surface->format->Bshift;
			color|= *(pix+shift/8)<<shift;
			shift = surface->format->Ashift;
			color|= *(pix+shift/8)<<shift;
			return color;
		}
		break;

		case 4: { /* Probably 32-bpp */
			return *((Uint32 *)surface->pixels + y*surface->pitch/4 + x);
		}
		break;
	}
	return 0;
#endif
}
