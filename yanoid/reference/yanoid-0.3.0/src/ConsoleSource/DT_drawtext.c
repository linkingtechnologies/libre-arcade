/*  DT_drawtext.c
 *  Written By: Garrett Banuk <mongoose@wpi.edu>
 *  This is free, just be sure to give me credit when using it
 *  in any of your programs.
 */

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "SDL/SDL.h"
#include "SDL/SDL_image.h"
#include "DT_drawtext.h"


static BitFont *BitFonts = NULL;	/* Linked list of fonts */

/*
 * Return the pixel value at (x, y)
 * NOTE: The surface must be locked before calling this!
 */
Uint32 DT_GetPixel(SDL_Surface *surface, int x, int y)
{
  int bpp = surface->format->BytesPerPixel;
  /* Here p is the address to the pixel we want to retrieve */
  Uint8 *p = (Uint8 *)surface->pixels + y * surface->pitch + x * bpp;
  
  switch(bpp)
    {
    case 1:
      return *p;
      break;
    case 2:
      return *(Uint16 *)p;
      break;
    case 3:
      if(SDL_BYTEORDER == SDL_BIG_ENDIAN)
	return p[0] << 16 | p[1] << 8 | p[2];
      else
	return p[0] | p[1] << 8 | p[2] << 16;
      break;
    case 4:
      return  *(Uint32 *)p;
      break;
    default:
      return  0;       /* shouldn't happen, but avoids warnings */
    }
}

/*
 * Set the pixel at (x, y) to the given value
 * NOTE: The surface must be locked before calling this!
 */
void DT_PutPixel(SDL_Surface *surface, int x, int y, Uint32 pixel)
{
  int bpp = surface->format->BytesPerPixel;
  /* Here p is the address to the pixel we want to set */
  Uint8 *p = (Uint8 *)surface->pixels + y * surface->pitch + x * bpp;

  switch(bpp)
    {
    case 1:
      *p = pixel;
      break;
    case 2:
      *(Uint16 *)p = pixel;
      break;
    case 3:
      if(SDL_BYTEORDER == SDL_BIG_ENDIAN) {
	p[0] = (pixel >> 16) & 0xff;
	p[1] = (pixel >> 8) & 0xff;
	p[2] = pixel & 0xff;
      } else {
	p[0] = pixel & 0xff;
	p[1] = (pixel >> 8) & 0xff;
	p[2] = (pixel >> 16) & 0xff;
      }
      break;
    case 4:
      *(Uint32 *)p = pixel;
      break;
    default:
      break;
    }
}

/* sets the transparency value for the font in question.  assumes that
 * we're in an OpenGL context.  */
void DT_SetFontAlphaGL(int FontNumber, int a)
{
	unsigned char val;
	BitFont		*CurrentFont;
	unsigned char r_targ, g_targ, b_targ;
	int i, imax;
	unsigned char *pix;

	/* get pointer to font */
	CurrentFont = DT_FontPointer(FontNumber);
	if (CurrentFont == NULL)
	  {
	    fprintf(stderr, "ERROR: setting font alpha for non-existent font!\n");
	    return;
	  }
	if (CurrentFont->FontSurface->format->BytesPerPixel == 2)
	  {
	    fprintf(stderr, "ERROR: 16-bit SDL surfaces do not support alpha-blending under OpenGL\n");
	    return;
	  }
	if (a < SDL_ALPHA_TRANSPARENT) val = SDL_ALPHA_TRANSPARENT;
	else if (a > SDL_ALPHA_OPAQUE) val = SDL_ALPHA_OPAQUE;
	else val = a;

	/* iterate over all pixels in the font surface.  For each
	 * pixel that is (255,0,255), set its alpha channel
	 * appropriately.  */
	imax = CurrentFont->FontSurface->h *
	  (CurrentFont->FontSurface->w << 2);
	pix = (unsigned char *)(CurrentFont->FontSurface->pixels);
	r_targ = 255;/*pix[0];*/
	g_targ = 0;/*pix[1];*/
	b_targ = 255;/*pix[2];*/
	for(i=3; i<imax; i+=4)
	  if (pix[i-3] == r_targ && pix[i-2] == g_targ && pix[i-1] == b_targ)
	    pix[i] = val;
	/* also make sure that alpha blending is disabled for the font
           surface. */
	SDL_SetAlpha(CurrentFont->FontSurface, 0, SDL_ALPHA_OPAQUE);
}

/* Loads the font into a new struct 
 * returns -1 as an error else it returns the number
 * of the font for the user to use
 */
int DT_LoadFont(const char *BitmapName, int flags)
{
	int		FontNumber = 0;
	BitFont	**CurrentFont = &BitFonts;
	SDL_Surface	*Temp;

	
	while(*CurrentFont)
	{
		CurrentFont = &((*CurrentFont)->NextFont);
		FontNumber++;
	}
	
	/* load the font bitmap */
	if(NULL ==  (Temp = IMG_Load(BitmapName)))
	{
		printf("Error Cannot load file %s\n", BitmapName );
		return -1;
	}

	/* Add a font to the list */
	*CurrentFont = (BitFont*)malloc(sizeof(BitFont));

	(*CurrentFont)->FontSurface = SDL_DisplayFormat(Temp);
	SDL_FreeSurface(Temp);

	(*CurrentFont)->CharWidth = (*CurrentFont)->FontSurface->w/256;
	(*CurrentFont)->CharHeight = (*CurrentFont)->FontSurface->h;
	(*CurrentFont)->FontNumber = FontNumber;
	(*CurrentFont)->NextFont = NULL;


	/* Set font as transparent if the flag is set.  The assumption we'll go on
	 * is that the first pixel of the font image will be the color we should treat
	 * as transparent.
	 */
	if(flags & TRANS_FONT)
	{
		if (SDL_GetVideoSurface()->flags & SDL_OPENGLBLIT)
		{
			DT_SetFontAlphaGL(FontNumber, SDL_ALPHA_TRANSPARENT);
		} else {
		  //Uint32 *pix = (Uint32 *)((*CurrentFont)->FontSurface->pixels);
			SDL_SetColorKey( (*CurrentFont)->FontSurface, SDL_SRCCOLORKEY|SDL_RLEACCEL, //*pix);
				SDL_MapRGB((*CurrentFont)->FontSurface->format, 0, 0, 0) );
				//(*CurrentFont)->FontSurface->format->Rmask |
				//(*CurrentFont)->FontSurface->format->Bmask);
			//printf("mine = %x, theirs = %x\n", *pix, (*CurrentFont)->FontSurface->format->Rmask |
			//	(*CurrentFont)->FontSurface->format->Bmask);
			//printf("bpp of FontSurface is %d\n", (*CurrentFont)->FontSurface->format->BytesPerPixel);
		}
	} else if (SDL_GetVideoSurface()->flags & SDL_OPENGLBLIT) {
		DT_SetFontAlphaGL(FontNumber, SDL_ALPHA_OPAQUE);
	}
	
	// printf("Loaded font \"%s\". Width:%d, Height:%d\n", BitmapName, (*CurrentFont)->CharWidth, (*CurrentFont)->CharHeight );
	return FontNumber;
}

/* Takes the font type, coords, and text to draw to the surface*/
void DT_DrawText(const char *string, SDL_Surface *surface, int FontType, int x, int y )
{
	int			loop;
	int			characters;
	SDL_Rect	SourceRect, DestRect;
	BitFont		*CurrentFont;

	CurrentFont = DT_FontPointer(FontType);

	/* see how many characters can fit on the screen */
	if(x>surface->w || y>surface->h) return;

	if(strlen(string) < (surface->w-x)/CurrentFont->CharWidth)
		characters = strlen(string);
	else
		characters = (surface->w-x)/CurrentFont->CharWidth;

	DestRect.x = x;
	DestRect.y = y;
	DestRect.w = CurrentFont->CharWidth;
	DestRect.h = CurrentFont->CharHeight;

	SourceRect.y = 0;
	SourceRect.w = CurrentFont->CharWidth;
	SourceRect.h = CurrentFont->CharHeight;

	/* Now draw it */
	for(loop=0; loop<characters; loop++)
	{
		SourceRect.x = string[loop] * CurrentFont->CharWidth;
		SDL_BlitSurface(CurrentFont->FontSurface, &SourceRect, surface, &DestRect);
		DestRect.x += CurrentFont->CharWidth;
	}
	/* if we're in OpenGL-mode, we need to manually update after blitting. */
	if (surface->flags & SDL_OPENGLBLIT)
	{
		DestRect.x = x;
		DestRect.w = characters*CurrentFont->CharWidth;
		SDL_UpdateRects(surface, 1, &DestRect);
	}
}


/* Returns the height of the font numbers character
 * returns 0 if the fontnumber was invalid */
int DT_FontHeight( int FontNumber )
{
	BitFont		*CurrentFont;

	CurrentFont = DT_FontPointer(FontNumber);
	if(CurrentFont)
		return CurrentFont->CharHeight;
	else
		return 0;
}

/* Returns the width of the font numbers charcter */
int DT_FontWidth( int FontNumber )
{
	BitFont		*CurrentFont;

	CurrentFont = DT_FontPointer(FontNumber);
	if(CurrentFont)
		return CurrentFont->CharWidth;
	else
		return 0;
}

/* Returns a pointer to the font struct of the number
 * returns NULL if theres an error
 */
BitFont* DT_FontPointer(int FontNumber)
{
	BitFont	*CurrentFont = BitFonts;
	BitFont *temp;

	while(CurrentFont)
		if(CurrentFont->FontNumber == FontNumber)
			return CurrentFont;
		else
		{
			temp = CurrentFont;
			CurrentFont = CurrentFont->NextFont;
		}
	
	return NULL;

}

/* removes all the fonts currently loaded */
void DT_DestroyDrawText()
{
	BitFont	*CurrentFont = BitFonts;
	BitFont *temp;

	while(CurrentFont)
	{
		temp = CurrentFont;
		CurrentFont = CurrentFont->NextFont;
		
		SDL_FreeSurface(temp->FontSurface);
		free(temp);
	}

	BitFonts = NULL;
}
