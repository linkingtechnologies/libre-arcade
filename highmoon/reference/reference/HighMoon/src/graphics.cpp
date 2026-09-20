/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "graphics.cpp"
 * 
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 ******************************************************************************************/

#include <iostream>
#include <stdio.h>
#include <cmath>

#include <SDL/SDL_image.h>

#include "graphics.hpp"

/******************************************************************************************
 *
 * Font
 *
 ******************************************************************************************/
Font::Font()
{
	verbose( "Initializing Font" );
	
	if ( ( font_image=IMG_Load( "gfx/font.gif" ) ) == NULL ) {
		std::cout << "Error in Font: " << SDL_GetError() << std::endl;
		exit(1);
	}
	
	if ( SCREENFACTOR != 1 ) 
		font_image = Sprite::zoom(font_image, SCREENFACTOR);

	SDL_SetColorKey( font_image, 
		SDL_RLEACCEL | SDL_SRCCOLORKEY, 
		SDL_MapRGB( font_image->format, 255, 0, 255 ) );
	font_image = SDL_DisplayFormat(font_image);
	
	// From SPACE 
	int font_sizes[] = {
		3, 2, 4, 0, 6, 0, 0, 2, 3, 3, 0, 6, 2, 5, 2, 0,
		6, 3, 6, 5, 6, 6, 6, 6, 6, 6, 2, 2, 0, 0, 0, 5,
		6, 6, 6, 6, 6, 6, 5, 6, 6, 2, 5, 6, 5, 8, 6, 6,
		6, 6, 5, 6, 6, 6, 6, 8, 6, 6, 6, 0, 0, 0, 0, 0,
		0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 6, 6, 6, 7,
		6, 6, 6, 6, 6, 8, 8, 5, 6, 6, 6, 5, 6, 5, 0, 0
	};
	double p = 0;
	
	// Create Width- and Position-Table
	for ( int i=0; i < 96; i++ ) {
		font_pos[i] = (int)p;
		font_width[i] = (int)( font_sizes[i] * 4 * SCREENFACTOR );
		p += ( i==0 ) ? 0 : font_sizes[i] * 4 * SCREENFACTOR;
	}
}

Font::~Font() 
{
	verbose( "Deleting Font" );

	SDL_FreeSurface(font_image);
}

int Font::getLineHeight() const 
{
	return font_image->h + 4;
}

void Font::print( int x, int y, std::string txt, int alpha ) 
{
	src.y = 0;
	src.h = dst.h = font_image->h;
	dst.y = y;
	dst.x = x;
	
	SDL_SetAlpha( font_image, SDL_SRCALPHA, alpha );

	for ( int i=0; i < (int)txt.length(); i++ ) {
		int srcp = (int)txt[i]-32;
	
		if ( srcp != 0 ) {
			src.x = font_pos[srcp];
			src.w = dst.w = font_width[srcp];

			if ( dst.x > SCREENWIDTH || dst.y > SCREENHEIGHT ) 
				break;

			if ( dst.x + dst.w >= 0 && dst.y + dst.h >= 0 && src.w > 0 )
				SDL_BlitSurface( font_image, &src, MYSDLSCREEN, &dst );

		}	
		x += font_width[srcp];
		dst.x = x;
	}	
}

int Font::getWidth( std::string txt )
{
	int s = 0;
	
	for ( int i=0; i < (int)txt.length(); i++ ) {
		int t = (int)txt[i]-32;
		
		s += font_width[t];
	}	

	return s;
}

/******************************************************************************************
 *
 * Sprite
 *
 ******************************************************************************************/
Sprite::Sprite( char* filename, int frames ) :
	x(0), 
	y(0),
	alpha(255),
	repeat_mode(true),
	frames(frames), 
	actual_frame(0),
	frame_delay(ANIMFRAME),
	frame_rate(ANIMFRAME)
{
	verbose( "Initializing Sprite: " + std::string(filename) );

	if ( ( sprite_image = IMG_Load( filename ) ) == NULL ) {
		std::cout << "Error in Sprite: " << SDL_GetError() << std::endl;
		exit(1);
	}

	if ( SCREENFACTOR != 1 ) 
		sprite_image = Sprite::zoom(sprite_image, SCREENFACTOR);

	SDL_SetColorKey( sprite_image, 
		SDL_RLEACCEL | SDL_SRCCOLORKEY, 
		SDL_MapRGB( sprite_image->format, 255, 0, 255 ) );
	sprite_image = SDL_DisplayFormat(sprite_image);

	width = sprite_image->w / frames;
	height = sprite_image->h;
}

Sprite::~Sprite()
{
	verbose( "Deleting Sprite" );
	
	SDL_FreeSurface( sprite_image );
}	

void Sprite::setOffset( int x, int y )
{
	x_offset = x;
	y_offset = y; 
}

bool Sprite::is_onLastFrame()
{
	return ( actual_frame == frames-1 && frame_delay == 0 ) ? true : false;
}

int Sprite::getWidth()
{
	return width; 
}
	
void Sprite::setFramerate( int rate )
{	
	frame_rate = rate; 
	frame_delay = rate;
}

void Sprite::setRepeatmode( bool mode )
{
	repeat_mode = mode; 
}

void Sprite::resetFrames() 
{
	actual_frame = 0;
}

void Sprite::setPos( int x, int y )
{
	this->x = x;
	this->y = y;
} 

void Sprite::setAlpha( int alpha )
{
	this->alpha = alpha;
} 
	
void Sprite::draw()
{
	rect.x = x + x_offset - width/2;
	rect.y = y + y_offset - width/2;
	rect.w = width;
	rect.h = height;
	sprite_rect.x = actual_frame * width;
	sprite_rect.y = 0;
	sprite_rect.w = width;
	sprite_rect.h = height;

	SDL_SetAlpha( sprite_image, SDL_SRCALPHA, alpha);
	SDL_BlitSurface( sprite_image, &sprite_rect, MYSDLSCREEN, &rect );
		
	if ( frame_delay-- < 1 ) {
		frame_delay = frame_rate;

		if ( ++actual_frame >= frames ) {

			if (repeat_mode) 
				actual_frame = 0;
			else 
				actual_frame = frames-1;
		}	
	}
}

void Sprite::putpixel( int x, int y, Uint32 pixel, SDL_Surface *screen )
{
	// NOTE: The surface must be locked before calling this!
	if ( x >= 0 && x < SCREENWIDTH && y >= 0 && y < SCREENHEIGHT) {
		
		int bpp = screen->format->BytesPerPixel;
		/* Here p is the address to the pixel we want to set */
		Uint8 *p = (Uint8 *)screen->pixels + y * screen->pitch + x * bpp;
	
		switch(bpp) {
			case 1:
				*p = pixel;
				break;
	
			case 2:
				*(Uint16 *)p = pixel;
				break;
	
			case 3:
				if( SDL_BYTEORDER == SDL_BIG_ENDIAN ) {
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
		}
	}
}

double get_distance( double x, double y )
{
	double xx=x-round(x);
	double yy=y-round(y);

	return sqrt( xx*xx + yy*yy );
}

void get_PixelColor( double x, double y, SDL_Surface *surface, SDL_Color &pixel_color )
{
	int bpp = surface->format->BytesPerPixel;
	int xxx = (int)x * bpp;
	int yyy = (int)y * surface->pitch;
	Uint8 index = *( (Uint8 *)surface->pixels + xxx + yyy );
	SDL_Color *pix_color = surface->format->palette->colors + index;

	// Check for Background-color
	if ( pix_color->r == 255 && pix_color->g == 0 && pix_color->b ==255 ) {
		pixel_color.r=0;
		pixel_color.g=0;
		pixel_color.b=30;	
	} else {
		pixel_color.r=pix_color->r;
		pixel_color.g=pix_color->g;
		pixel_color.b=pix_color->b;
	}
}

void bicubical( double x, double y, SDL_Surface *surface, SDL_Color &pixel_color ) 
{
	double cnt = 0;
	double r = 0, g = 0, b = 0;
	SDL_Color color;
	
	if ( y-1 >=0 ) {
		
		if ( x-1 >= 0 ) {
			cnt += 0.25;
			get_PixelColor( x-1, y-1, surface, color );
			r += color.r * 0.25;
			g += color.g * 0.25;
			b += color.b * 0.25;
		}

		cnt += 0.5;
		get_PixelColor( x, y-1, surface, color );
		r += color.r * 0.5;
		g += color.g * 0.5;
		b += color.b * 0.5;

		if ( x+1 < surface->w ) {
			cnt += 0.25;
			get_PixelColor( x+1, y-1, surface, color );
			r += color.r * 0.25;
			g += color.g * 0.25;
			b += color.b * 0.25;
		}
	}
	
	if ( x-1 >= 0 ) {
		cnt += 0.5;
		get_PixelColor( x-1, y, surface, color );
		r += color.r * 0.5;
		g += color.g * 0.5;
		b += color.b * 0.5;
	}

	cnt += 1;
	get_PixelColor( x, y, surface, color );
	r += color.r;
	g += color.g;
	b += color.b;

	if ( x+1 < surface->w ) {
		cnt += 0.5;
		get_PixelColor( x+1, y, surface, color );
		r += color.r * 0.5;
		g += color.g * 0.5;
		b += color.b * 0.5;
	}

	if ( y+1 < surface->w ) {
	
		if ( x-1 >= 0 ) {
			cnt += 0.25;
			get_PixelColor( x-1, y+1, surface, color );
			r += color.r * 0.25;
			g += color.g * 0.25;
			b += color.b * 0.25;
		}

		cnt += 0.5;
		get_PixelColor( x, y+1, surface, color );
		r += color.r * 0.5;
		g += color.g * 0.5;
		b += color.b * 0.5;

		if ( x+1 < surface->w ) {
			cnt += 0.25;
			get_PixelColor( x+1, y+1, surface, color );
			r += color.r * 0.25;
			g += color.g * 0.25;
			b += color.b * 0.25;
		}
	}
	
	// Restore Background-color
	r /= cnt;
	g /= cnt;
	b /= cnt;

	if ( r < 1 && g < 1 && b <= 30 ) {
		pixel_color.r = 255;
		pixel_color.g = 0;
		pixel_color.b = 255;
	} else {
		pixel_color.r = (int)r;
		pixel_color.g = (int)g;
		pixel_color.b = (int)b;
	}
}

SDL_Surface *Sprite::zoom( SDL_Surface *surface, double factor )
{
	int width = surface->w;
	int height = surface->h;
	
	#if SDL_BYTEORDER == SDL_BIG_ENDIAN
	Uint32 rmask = 0xff000000;
	Uint32 gmask = 0x00ff0000;
	Uint32 bmask = 0x0000ff00;
	Uint32 amask = 0x000000ff;
	#else
	Uint32 rmask = 0x000000ff;
	Uint32 gmask = 0x0000ff00;
	Uint32 bmask = 0x00ff0000;
	Uint32 amask = 0xff000000;
	#endif
	
	int z_width = (int)(width*factor);
	int z_height = (int)(height*factor);
	SDL_Surface *zoom_surface = SDL_CreateRGBSurface( SDL_HWSURFACE | SDL_SRCCOLORKEY, z_width, z_height, 32, rmask, gmask, bmask, amask );

	SDL_LockSurface(surface);
	SDL_LockSurface(zoom_surface);

	for ( int xx=0; xx < z_width; xx++ ) {

		for ( int yy=0; yy < z_height; yy++ ) {
			SDL_Color color;
			bicubical( (double)xx/factor, (double)yy/factor, surface, color );
			Sprite::putpixel( xx, yy, SDL_MapRGB( zoom_surface->format, color.r, color.g, color.b ), zoom_surface );
		}
	}

	SDL_UnlockSurface(surface);
	SDL_UnlockSurface(zoom_surface);
	
	return zoom_surface;
}

int Sprite::x_offset = 0;
int Sprite::y_offset = 0;

/******************************************************************************************
 *
 * Star
 *
 ******************************************************************************************/
Star::Star() 
:
	x(rx()),
	y(ry()),
	b(blink()),
	c(color())
{}

void Star::draw()
{
	if ( b-- == 0 ) b=blink();

	if ( b>5 ) {
		Sprite::putpixel( x, y, SDL_MapRGB( MYSDLSCREEN->format, c, c, c ));
		
		if ( c>200 ) {
			Sprite::putpixel( x+1, y, SDL_MapRGB( MYSDLSCREEN->format, c/2, c/2, c/2 ));
			Sprite::putpixel( x+1, y+1, SDL_MapRGB( MYSDLSCREEN->format, c/2, c/2, c/2 ));
			Sprite::putpixel( x, y+1, SDL_MapRGB( MYSDLSCREEN->format, c/2, c/2, c/2 ));
		}
	}
}

int Star::rx() 
{
	return (int)RANDOM( SCREENWIDTH-20, 20);
}

int Star::ry()
{
	return (int)RANDOM( SCREENHEIGHT-20, 20);
}

int Star::color() 
{
	return (int)RANDOM( 245,25 );
}

int Star::blink() 
{ 
	return (int)RANDOM( 2000,1 );
}

/******************************************************************************************
 *
 * Shooting-Star
 *
 ******************************************************************************************/
Shootingstar::Shootingstar()
:
	x(rx()),
	y(ry()),
	s(speed()),
	w(wait())
{}

void Shootingstar::draw()
{
	if ( w-- == 0 ) {
		w = wait();
		x = rx();
		y = ry();
		s = speed();
	}

	double as=( s < 0 )? -s : s;
	
	if ( w<40 ) {

		for ( int i=0; i < 10; i++ ) {
			int c = (int)(((double)w)/40*(i*25));
			if (i == 9) c +=10;
			int x = (int)(this->x + s * i);
			int y = (int)(this->y + as * i);
			Sprite::putpixel( x, y, SDL_MapRGB( MYSDLSCREEN->format, c, c, c + 20 ));
		}
		x += s * 4;
		y += as * 4;
	}
}

double Shootingstar::rx() 
{
	return (int)RANDOM( SCREENWIDTH-200, 200);
}

double Shootingstar::ry()
{
	return (int)RANDOM( SCREENHEIGHT-200, 100);
}

double Shootingstar::speed()
{
	return ( (int)RANDOM(2,0)==1 ) ? 1 : -1;
}

int Shootingstar::wait() 
{ 
	return (int)RANDOM(2000,1000);
}

/******************************************************************************************
 *
 * Goldrain
 *
 ******************************************************************************************/
Goldrain::Goldrain() 
:
	x((double)rx()), 
	y((double)ry()), 
	sp(speed()), 
	xoffset(0),
	yoffset(0),
	b(blink()),
	cr(0),
	cg(0),
	cb(0)
{
	switch ((int)RANDOM(4,0)) {

		case 0:
			cr = color();
			break;

		case 1:
			cg = color();
			break;

		case 2:
			cg = cr = color();
			break;

		default:
			cb = color();
	}
}
	
void Goldrain::setOffset(int x, int y) 
{
	xoffset = (double)x; 
	yoffset = (double)y; 
}

void Goldrain::draw()
{
	if ( (y += sp ) > 100 ) {
		y -= 100;
		x = (double)rx();
	}
	
	x += (int)( 4 * (rand()/(RAND_MAX+1.0) ) -2 );
	
	if ( b-- == 0 )
		b = blink();
	else if ( b > 1 && y >= 0 ) {
		int r = (int)( cr*y/110 ) + 40;
		int g = (int)( cg*y/110 ) + 40;
		int b = (int)( cb*y/110 ) + 40;
		
		Sprite::putpixel( (int)(x+xoffset), (int)(y+yoffset), SDL_MapRGB( MYSDLSCREEN->format, r, g, b ) );
		
		if ( r > 150 || g > 150 || b > 130 )
			Sprite::putpixel( (int)(x+xoffset+1), (int)(y + yoffset), SDL_MapRGB( MYSDLSCREEN->format, r/2, g/2, b/2 ) );

		if ( r > 170 || g > 170 || b > 150 )
			Sprite::putpixel( (int)(x+xoffset), (int)(y + yoffset + 1), SDL_MapRGB( MYSDLSCREEN->format, r/2, g/2, b/2 ) );

		if ( r > 200 || g > 200 || b > 180 )
			Sprite::putpixel( (int)(x+xoffset+1), (int)(y + yoffset + 1), SDL_MapRGB( MYSDLSCREEN->format, r/2, g/2, b/2 ) );		
	}	
}

double Goldrain::rx() 
{
	return RANDOM( 40,-40 );
}

double Goldrain::ry() 
{
	return RANDOM( 100,0 );
}

double Goldrain::speed()
{
	return RANDOM( 2,1 );
}

int Goldrain::color() 
{
	return (int)RANDOM( 255, 100 );
}

int Goldrain::blink()
{
	return (int)RANDOM( 10,0 );
}

