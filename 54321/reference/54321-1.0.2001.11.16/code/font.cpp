    #include <SDL.h>
    #include <SDL_image.h>
    #include <assert.h>
    #include <stdarg.h>
    #include "font.h"
        NKlein_54321::Font::Font( void )
        {
            this->image = ::IMG_Load( "../../data/font.png" );
            for ( unsigned int ii=0; ii < START_CHAR; ++ii ) {
                this->widths[ ii ] = 0;
            }
            for ( unsigned int ii=START_CHAR; ii < END_CHAR; ++ii ) {
                this->widths[ ii ] = 8;
            }

                this->widths[ ' ' ] = 4;
                this->widths[ ',' ] = 4;
                this->widths[ 't' ] = 6;

                this->widths[ '!' ] = 5;
                this->widths[ '-' ] = 7;
                this->widths[ 'E' ] = 7;
                this->widths[ ']' ] = 6;
                this->widths[ 'i' ] = 4;

                this->widths[ '"' ] = 7;
                this->widths[ '.' ] = 4;
                this->widths[ ':' ] = 4;
                this->widths[ 'F' ] = 7;
                this->widths[ 'j' ] = 6;

                this->widths[ '#' ] = 12;
                this->widths[ ';' ] = 4;
                this->widths[ 'G' ] = 7;
                this->widths[ '_' ] = 12;
                this->widths[ 'w' ] = 13;

                this->widths[ '$' ] = 7;
                this->widths[ '<' ] = 10;
                this->widths[ 'T' ] = 7;
                this->widths[ '`' ] = 5;
                this->widths[ 'l' ] = 4;
                this->widths[ 'x' ] = 9;

                this->widths[ '%' ] = 11;
                this->widths[ '1' ] = 5;
                this->widths[ 'I' ] = 5;
                this->widths[ 'a' ] = 7;
                this->widths[ 'm' ] = 11;

                this->widths[ '>' ] = 10;
                this->widths[ 'V' ] = 9;
                this->widths[ 'n' ] = 7;

                this->widths[ '\'' ] = 3;
                this->widths[ 'W' ] = 14;
                this->widths[ 'c' ] = 7;
                this->widths[ '{' ] = 6;

                this->widths[ '(' ] = 5;
                this->widths[ '@' ] = 16;
                this->widths[ 'L' ] = 7;
                this->widths[ 'X' ] = 9;
                this->widths[ '|' ] = 4;

                this->widths[ ')' ] = 5;
                this->widths[ '5' ] = 7;
                this->widths[ 'A' ] = 7;
                this->widths[ 'M' ] = 12;
                this->widths[ 'q' ] = 7;
                this->widths[ '}' ] = 6;

                this->widths[ '*' ] = 7;
                this->widths[ '6' ] = 7;
                this->widths[ 'B' ] = 7;
                this->widths[ 'Z' ] = 6;
                this->widths[ 'f' ] = 5;
                this->widths[ 'r' ] = 7;

                this->widths[ '7' ] = 7;
                this->widths[ 'C' ] = 7;
                this->widths[ 'O' ] = 7;
                this->widths[ '[' ] = 4;
                this->widths[ 'g' ] = 7;
                this->widths[ 's' ] = 7;
        }
        NKlein_54321::Font::~Font( void )
        {
            if ( this->image != 0 ) {
                ::SDL_FreeSurface( this->image );
            }
        }
        void
        NKlein_54321::Font::centerMessage(
                SDL_Surface* screen,
                bool refresh,
                int xx, int yy,
                const char* fmt,
                ...
            )
        {
                char buf[ 256 ];
                va_list ap;
                va_start( ap, fmt );
                vsnprintf( buf, sizeof(buf), fmt, ap );
                va_end( ap );
                unsigned int width = 0;
                for ( const char* ptr = buf; *ptr != 0; ++ptr ) {
                    assert( (unsigned int)*ptr <= END_CHAR );
                    width += this->widths[ *ptr ];
                }
                xx -= (int)width / 2 + 1;
                yy -= 16;
                SDL_Rect dst;
                dst.x = xx;
                dst.y = yy;

                for ( const char* ptr = buf; *ptr != 0; ++ptr ) {
                    if ( *ptr >= START_CHAR ) {
                        unsigned int cc = *ptr - START_CHAR;
                        unsigned int row = cc / 12;
                        unsigned int col = cc - row * 12;
                        SDL_Rect src;
                        src.x = col * 21;
                        src.y = row * 32;
                        src.w = this->widths[ *ptr ];
                        src.h = 32;
                        ::SDL_BlitSurface( this->image, &src, screen, &dst );
                        dst.x += src.w;
                    }
                }

                if ( refresh ) {
                    ::SDL_UpdateRect( screen, xx, yy, width+32, 32 );
                }
        }
