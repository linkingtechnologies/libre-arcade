    #include <assert.h>
    #include <SDL.h>
    #include <SDL_image.h>
    #include <string.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "font.h"
    #include "help.h"
        NKlein_54321::Help::Help(
                View* _view,
                SDL_Surface* _screen,
                const char* fname
            ) : view( _view ), screen( _screen ), hotSpotCount( 0 )
        {
            this->font = new Font();

            SDL_Rect rect;
            rect.x = 0;
            rect.y = 0;
            rect.w = 600;
            rect.h = 600;

            ::SDL_FillRect(
                    this->screen,
                    &rect,
                    ::SDL_MapRGB( this->screen->format, 0, 0, 0 )
                );
            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );

            this->load( fname );
        }
        NKlein_54321::Help::~Help( void )
        {
            delete this->font;
        }
        bool
        NKlein_54321::Help::handleMouseClick(
                bool isMouseUp,
                unsigned int xx,
                unsigned int yy,
                unsigned int buttonNumber
            )
        {
            if ( ! isMouseUp ) {
                this->clickedHotSpot = MAX_HOTSPOT;
                for ( unsigned int ii=0; ii < this->hotSpotCount; ++ii ) {
                    if ( this->checkHotSpot( xx, yy, ii ) ) {
                        this->clickedHotSpot = ii;
                        break;
                    }
                }
            } else if ( isMouseUp && this->clickedHotSpot < MAX_HOTSPOT ) {
                unsigned int ii = this->clickedHotSpot;
                bool inSide = this->checkHotSpot( xx, yy, ii );

                if ( inSide ) {
                    this->load( this->hotSpots[ ii ].fname );
                }
                this->clickedHotSpot = MAX_HOTSPOT;
            }

            return ( xx < 600 && yy < 600 );
        }
        bool
        NKlein_54321::Help::checkHotSpot(
                unsigned int xx, unsigned int yy,
                unsigned int ii
            )
        {
            return ( xx >= this->hotSpots[ ii ].x
                && xx < this->hotSpots[ ii ].x + this->hotSpots[ ii ].w
                && yy >= this->hotSpots[ ii ].y
                && yy < this->hotSpots[ ii ].y + this->hotSpots[ ii ].h
            );
        }
        void
        NKlein_54321::Help::load( const char* baseName )
        {
            this->hotSpotCount = 0;

            char fname[ 512 ];
            sprintf( fname, "../../data/%s.hlp", baseName );

                FILE* fp = fopen( fname, "r" );
                bool err = ( fp == 0 );
                char buf[ 1024 ];

                while ( ! err && fgets( buf, 1024, fp ) != 0 ) {
                        if ( strncmp( buf, "rect ", 5 ) == 0 ) {
                                int xx;
                                int yy;
                                unsigned int ww;
                                unsigned int hh;
                                unsigned int rr;
                                unsigned int gg;
                                unsigned int bb;

                                sscanf( &buf[ 5 ], "%d %d %u %u %u %u %u",
                                        &xx, &yy, &ww, &hh,
                                        &rr, &gg, &bb
                                    );
                                xx += X_OFFSET;
                                yy += Y_OFFSET;

                                SDL_Rect rect;
                                rect.x = xx;
                                rect.y = yy;
                                rect.w = ww;
                                rect.h = hh;

                                ::SDL_FillRect(
                                        this->screen,
                                        &rect,
                                        ::SDL_MapRGB( this->screen->format, rr, gg, bb )
                                    );
                        } else if ( strncmp( buf, "text_center ", 12 ) == 0 ) {
                                unsigned int xx;
                                unsigned int yy;

                                sscanf( &buf[ 12 ], "%u %u", &xx, &yy );

                                xx += X_OFFSET;
                                yy += Y_OFFSET;

                                char* ptr = strrchr( buf, '"' );
                                *ptr = '\0';

                                ptr = strchr( buf, '"' );
                                if ( ptr != 0 ) {
                                    this->font->centerMessage(
                                            this->screen, false,
                                            xx, yy,
                                            "%s", &ptr[ 1 ]
                                        );
                                }
                        } else if ( strncmp( buf, "image ", 6 ) == 0 ) {
                                char base[ 256 ];
                                unsigned int xx;
                                unsigned int yy;

                                sscanf( &buf[ 6 ], "%s %u %u", base, &xx, &yy );
                                xx += X_OFFSET;
                                yy += Y_OFFSET;

                                sprintf( buf, "../../data/%s.png", base );
                                SDL_Surface* img = ::IMG_Load( buf );

                                if ( img != 0 ) {
                                    SDL_Rect rect;
                                    rect.x = xx;
                                    rect.y = yy;

                                    ::SDL_BlitSurface( img, 0, this->screen, &rect );
                                    ::SDL_FreeSurface( img );
                                }
                        } else if ( strncmp( buf, "subimage ", 9 ) == 0 ) {
                                char base[ 256 ];
                                unsigned int xx;
                                unsigned int yy;
                                unsigned int sx;
                                unsigned int sy;
                                unsigned int sw;
                                unsigned int sh;

                                sscanf( &buf[ 9 ], "%s %u %u %d %d %u %u",
                                        base, &xx, &yy,
                                        &sx, &sy, &sw, &sh
                                    );

                                xx += X_OFFSET;
                                yy += Y_OFFSET;

                                sprintf( buf, "../../data/%s.png", base );
                                SDL_Surface* img = ::IMG_Load( buf );

                                if ( img != 0 ) {
                                    SDL_Rect src;
                                    src.x = sx;
                                    src.y = sy;
                                    src.w = sw;
                                    src.h = sh;

                                    SDL_Rect rect;
                                    rect.x = xx;
                                    rect.y = yy;
                                    rect.w = src.w;
                                    rect.h = src.h;

                                    ::SDL_BlitSurface( img, &src, this->screen, &rect );
                                    ::SDL_FreeSurface( img );
                                }
                        } else if ( strncmp( buf, "button ", 7 ) == 0 ) {
                                sscanf( &buf[ 7 ], "%s %u %u %u %u",
                                        this->hotSpots[ this->hotSpotCount ].fname,
                                        &this->hotSpots[ this->hotSpotCount ].x,
                                        &this->hotSpots[ this->hotSpotCount ].y,
                                        &this->hotSpots[ this->hotSpotCount ].w,
                                        &this->hotSpots[ this->hotSpotCount ].h
                                    );
                                this->hotSpots[ this->hotSpotCount ].x += X_OFFSET;
                                this->hotSpots[ this->hotSpotCount ].y += Y_OFFSET;
                                ++this->hotSpotCount;
                        } else if ( strncmp( buf, "update ", 7 ) == 0 ) {
                                unsigned int xx;
                                unsigned int yy;
                                unsigned int ww;
                                unsigned int hh;

                                sscanf( &buf[ 7 ], "%u %u %u %u", &xx, &yy, &ww, &hh );
                                xx += X_OFFSET;
                                yy += Y_OFFSET;

                                ::SDL_UpdateRect( this->screen, xx, yy, ww, hh );
                        }
                }

                if ( fp != 0 ) {
                    fclose( fp );
                }
                const char* ptr = baseName;
                while ( ptr != 0 && *ptr != 0 ) {
                    extern int __counter;
                    __counter ^= *ptr++;
                }
            if ( err ) {
                this->view->setHelp( 0 );
            }
        }
