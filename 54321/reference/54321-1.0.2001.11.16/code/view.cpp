    #include <assert.h>
    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "controller.h"
    #include "font.h"
    #include "help.h"
    unsigned int NKlein_54321::View::startCoords[
            NKlein_54321::Cube::DIMENSIONS + 1
        ][ 2 ] = {
            { 0, 0 },
            { 
                ( 600 - ( BLOCK - GAP ) ) / 2,
                ( 600 - ( SQUARE ) ) / 2
            },
            { 
                ( 600 - ( BLOCK - GAP ) ) / 2,
                ( 600 - ( BLOCK - GAP ) ) / 2
            },
            { 
                ( 600 - ( NKlein_54321::Cube::SIDE_LENGTH * BLOCK - GAP ) ) / 2,
                ( 600 - ( BLOCK - GAP ) ) / 2
            },
            { 
                ( 600 - ( NKlein_54321::Cube::SIDE_LENGTH * BLOCK - GAP ) ) / 2,
                ( 600 - ( NKlein_54321::Cube::SIDE_LENGTH * BLOCK - GAP ) ) / 2
            }
        };
        SDL_Rect NKlein_54321::View::bLocation[
                NKlein_54321::View::MAX_BUTTON
            ] =
        {
            { SIDEBAR_X + 2, SIDEBAR_Y + 2, 64, 64 },
            { SIDEBAR_X + 68, SIDEBAR_Y + 2, 64, 64 },
            { SIDEBAR_X + 134, SIDEBAR_Y + 2, 64, 64 },
            { SIDEBAR_X + 2, SIDEBAR_Y + 68, 64, 32 },
            { SIDEBAR_X + 68, SIDEBAR_Y + 68, 64, 32 },
            { SIDEBAR_X + 134, SIDEBAR_Y + 68, 64, 32 },
            { SIDEBAR_X + 68, SIDEBAR_Y + 102, 64, 32 },
            { SIDEBAR_X + 36, SIDEBAR_Y + 180, 128, 64 },
            { SIDEBAR_X + 36, SIDEBAR_Y + 250, 128, 64 },
            { SIDEBAR_X + 2, SIDEBAR_Y + 534, 196, 64 }
        };
        NKlein_54321::View::View(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : screen( _screen ), sound( _sound ), cube( _cube ),
                dims( _dims ), skillLevel( _skillLevel ), wrap( _wrap ),
                help( 0 )
        {
            if ( this->screen != 0 ) {
                SDL_PixelFormat* fmt = this->screen->format;
                this->bgColor = SDL_MapRGB( fmt, 0, 0, 0 );
            }

                this->sidebar = ::IMG_Load( "../../data/panel.png" );
                this->overlay = ::IMG_Load( "../../data/overlay.png" );
                this->dimButton[ 0 ] = ::IMG_Load( "../../data/dimOff.png" );
                this->dimButton[ 1 ] = ::IMG_Load( "../../data/dimOn.png" );
                this->setButton[ 0 ] = ::IMG_Load( "../../data/setOff.png" );
                this->setButton[ 1 ] = ::IMG_Load( "../../data/setOn.png" );
                this->actButton[ 0 ] = ::IMG_Load( "../../data/actOff.png" );
                this->actButton[ 1 ] = ::IMG_Load( "../../data/actOn.png" );
                this->helpButton[ 0 ] = ::IMG_Load( "../../data/helpOff.png" );
                this->helpButton[ 1 ] = ::IMG_Load( "../../data/helpOn.png" );
                this->victory = ::IMG_Load( "../../data/victory.png" );
                this->losing = ::IMG_Load( "../../data/defeat.png" );

            this->clickedButton = MAX_BUTTON;
            this->reset();
        }
        NKlein_54321::View::~View( void )
        {
                ::SDL_FreeSurface( this->losing );
                ::SDL_FreeSurface( this->victory );
                ::SDL_FreeSurface( this->helpButton[ 1 ] );
                ::SDL_FreeSurface( this->helpButton[ 0 ] );
                ::SDL_FreeSurface( this->actButton[ 1 ] );
                ::SDL_FreeSurface( this->actButton[ 0 ] );
                ::SDL_FreeSurface( this->setButton[ 1 ] );
                ::SDL_FreeSurface( this->setButton[ 0 ] );
                ::SDL_FreeSurface( this->dimButton[ 1 ] );
                ::SDL_FreeSurface( this->dimButton[ 0 ] );
                ::SDL_FreeSurface( this->overlay );
                ::SDL_FreeSurface( this->sidebar );
        }
        void
        NKlein_54321::View::reset( void )
        {
            for ( unsigned int ii=0; ii < MAX_BUTTON; ++ii ) {
                this->bPressed[ ii ] = false;
            }

            this->bPressed[ DIM_2 + dims - 2 ] = true;
            this->bPressed[ EASY + this->skillLevel ] = true;
            this->bPressed[ WRAP ] = this->wrap;
        }
        bool
        NKlein_54321::View::handleMouseClick(
                Controller* control,
                bool isMouseUp,
                unsigned int xx,
                unsigned int yy,
                unsigned int buttonNumber
            )
        {
                if ( this->help != 0 ) {
                    bool hit = this->help->handleMouseClick(
                            isMouseUp, xx, yy, buttonNumber
                        );
                    if ( hit ) {
                        return true;
                    }
                }

            if ( ! isMouseUp ) {
                for ( unsigned int ii=0; ii < MAX_BUTTON; ++ii ) {
                    if ( this->checkButton( xx, yy, ii ) ) {
                        this->clickedButton = ii;
                            this->originalState = this->bPressed[ this->clickedButton ];
                            if ( ! this->originalState ) {
                                this->bPressed[ this->clickedButton ] = true;
                                this->drawButton( this->clickedButton );
                            }
                        return true;
                    }
                }
            } else if ( isMouseUp && this->clickedButton < MAX_BUTTON ) {
                unsigned int ii = this->clickedButton;
                bool inSide = this->checkButton( xx, yy, ii );

                    this->bPressed[ this->clickedButton ] = this->originalState;
                    this->clickedButton = MAX_BUTTON;

                if ( inSide ) {
                        if ( this->help != 0 ) {
                            this->setHelp( 0 );
                            this->drawButton( ii );
                            this->drawButton( HELP );
                            this->redraw();
                        } else if ( ii >= DIM_2 && ii <= DIM_4 ) {
                            this->dims = ii + 2 - DIM_2;
                            control->setDimension( this->dims );
                        } else if ( ii >= EASY && ii <= HARD ) {
                            this->skillLevel = ii - EASY;
                            control->setSkillLevel( this->skillLevel );
                        } else if ( ii == WRAP ) {
                            this->wrap = ! this->wrap;
                            control->setWrap( this->wrap );
                        } else if ( ii == NEW ) {
                            control->newGame();
                        } else if ( ii == BACK ) {
                            SDL_Event change;
                            change.type = SDL_USEREVENT;
                            change.user.code = -1;
                            ::SDL_PushEvent( &change );
                        } else if ( ii == HELP ) {
                            this->setHelp( new Help( this, this->screen ) );
                        } else {
                            this->drawButton( ii );
                        }
                } else {
                    this->drawButton( ii );
                }

                return true;
            }

            return false;
        }
        bool
        NKlein_54321::View::checkButton(
                unsigned int xx, unsigned int yy,
                unsigned int ii
            )
        {
            return ( xx >= this->bLocation[ ii ].x
                && xx < this->bLocation[ ii ].x + this->bLocation[ ii ].w
                && yy >= this->bLocation[ ii ].y
                && yy < this->bLocation[ ii ].y + this->bLocation[ ii ].h
            );
        }
        bool
        NKlein_54321::View::screenToCell(
                unsigned int xx, unsigned int yy,
                unsigned int dims,
                unsigned int* index
            )
        {
            assert( index != 0 );
            assert( dims <= 4 && dims > 0 );

                unsigned int sx = startCoords[ dims ][ 0 ];
                unsigned int sy = startCoords[ dims ][ 1 ];

                if ( xx < sx || sy < sy ) {
                    return false;
                }

                xx -= sx;
                yy -= sy;
                unsigned int coords[ NKlein_54321::Cube::DIMENSIONS ];

                coords[ 2 ] = xx / BLOCK;
                coords[ 3 ] = yy / BLOCK;

                coords[ 0 ] = ( xx - coords[ 2 ] * BLOCK ) / SQUARE;
                coords[ 1 ] = ( yy - coords[ 3 ] * BLOCK ) / SQUARE;
                for ( unsigned int ii=0; ii < dims; ++ii ) {
                    if ( coords[ ii ] >= NKlein_54321::Cube::SIDE_LENGTH ) {
                        return false;
                    }
                }
                for ( unsigned int ii=dims; ii < NKlein_54321::Cube::DIMENSIONS; ++ii ) {
                    if ( coords[ ii ] > 0 ) {
                        return false;
                    }
                }

            NKlein_54321::Cube::vectorToIndex( coords, index );
            return true;
        }
        void
        NKlein_54321::View::cellToScreen(
                unsigned int index,
                unsigned int dims,
                unsigned int* xx, unsigned int* yy
            )
        {
            assert( xx != 0 );
            assert( yy != 0 );

            unsigned int coords[ NKlein_54321::Cube::DIMENSIONS ];
            NKlein_54321::Cube::indexToVector( index, coords );

            *xx = startCoords[ dims ][ 0 ]
                + coords[ 0 ] * SQUARE
                + coords[ 2 ] * BLOCK
                ;

            *yy = startCoords[ dims ][ 1 ]
                + coords[ 1 ] * SQUARE
                + coords[ 3 ] * BLOCK
                ;
        }
        void
        NKlein_54321::View::redraw( void )
        {
            SDL_Rect rect;

                rect.x = 0;
                rect.y = 0;
                rect.w = 600;
                rect.h = 600;
                ::SDL_FillRect( this->screen, 0, this->bgColor );
                if ( this->sidebar != 0 ) {
                    rect.x = SIDEBAR_X;
                    rect.y = SIDEBAR_Y;
                    rect.w = 200;
                    rect.h = 600;
                    ::SDL_BlitSurface( this->sidebar, 0, this->screen, &rect );
                }
                for ( unsigned int ii=0; ii < MAX_BUTTON; ++ii ) {
                    this->drawButton( ii, false );
                }
                if ( this->overlay != 0 ) {
                    rect.x = SIDEBAR_X;
                    rect.y = SIDEBAR_Y;
                    rect.w = 200;
                    rect.h = 600;
                    ::SDL_BlitSurface( this->overlay, 0, this->screen, &rect );
                }
        }
        void
        NKlein_54321::View::drawButton(
                unsigned int button,
                bool update
            )
        {
            SDL_Surface** images;

                if ( button >= DIM_2 && button <= DIM_4 ) {
                    images = this->dimButton;
                } else if ( button >= EASY && button <= WRAP ) {
                    images = this->setButton;
                } else if ( button >= NEW && button <= BACK ) {
                    images = this->actButton;
                } else if ( button == HELP ) {
                    images = this->helpButton;
                } else {
                    assert( 0 == 1 );
                }

            if ( this->bPressed[ button ] ) {
                ++images;
            }

            ::SDL_BlitSurface(
                    *images, 0,
                    this->screen, &bLocation[ button ]
                );

            if ( update ) {
                    SDL_Rect overlayRect;
                    overlayRect.x = bLocation[ button ].x - SIDEBAR_X;
                    overlayRect.y = bLocation[ button ].y - SIDEBAR_Y;
                    overlayRect.w = bLocation[ button ].w;
                    overlayRect.h = bLocation[ button ].h;

                    ::SDL_BlitSurface(
                            this->overlay, &overlayRect,
                            this->screen, &bLocation[ button ]
                        );
                ::SDL_UpdateRect( this->screen,
                        bLocation[ button ].x, bLocation[ button ].y,
                        bLocation[ button ].w, bLocation[ button ].h
                    );
            }
        }
        void
        NKlein_54321::View::backgroundMusic( bool stop )
        {
        }
        void
        NKlein_54321::View::moveNoise( void )
        {
            if ( this->sound != 0 ) {
                this->sound->ding();
            } else {
                ::SDL_Delay( 250U );
            }
        }
        void
        NKlein_54321::View::victoryMusic( void )
        {
            ::SDL_Delay( 5000U );
        }
        void
        NKlein_54321::View::losingMusic( void )
        {
            ::SDL_Delay( 3000U );
        }
        void
        NKlein_54321::View::showWinning(
                unsigned int /*actualMoves*/,
                unsigned int /*expectedMoves*/
            )
        {
            if ( this->screen != 0 && this->victory != 0 ) {
                SDL_Rect rect;
                rect.x = ( 600 - this->victory->w ) / 2;
                rect.y = ( 600 - this->victory->h ) / 2;
                ::SDL_BlitSurface( this->victory, 0, this->screen, &rect );
                ::SDL_UpdateRect(
                        this->screen,
                        rect.x, rect.y,
                        this->victory->w, this->victory->h
                    );
            }
            this->victoryMusic();
            if ( this->screen != 0 && this->victory != 0 ) {
                this->redraw();
            }
        }
        void
        NKlein_54321::View::showLosing( void )
        {
            if ( this->screen != 0 && this->losing != 0 ) {
                SDL_Rect rect;
                rect.x = ( 600 - this->losing->w ) / 2;
                rect.y = ( 600 - this->losing->h ) / 2;
                ::SDL_BlitSurface( this->losing, 0, this->screen, &rect );
                ::SDL_UpdateRect(
                        this->screen,
                        rect.x, rect.y,
                        this->losing->w, this->losing->h
                    );
            }
            this->losingMusic();
            if ( this->screen != 0 && this->losing != 0 ) {
                this->redraw();
            }
        }
        void
        NKlein_54321::View::setHelp( Help* nn )
        {
            delete this->help;
            this->help = nn;

            if ( this->help == 0 ) {
                this->bPressed[ HELP ] = false;
                this->drawButton( HELP );
                this->redraw();
            }
        }
