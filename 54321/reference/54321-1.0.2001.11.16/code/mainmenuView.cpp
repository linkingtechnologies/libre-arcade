    #include <assert.h>
    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "mainmenuView.h"
        NKlein_54321::MainMenuView::MainMenuView(
                SDL_Surface* _screen
            ) : quitPressed( false ), screen( _screen )
        {
                this->sidebar = ::IMG_Load( "../../data/panel.png" );
                this->backdrop = ::IMG_Load( "../../data/backdrop.png" );
                this->overlay = ::IMG_Load( "../../data/moverlay.png" );
                this->quitButton[ 0 ] = ::IMG_Load( "../../data/helpOff.png" );
                this->quitButton[ 1 ] = ::IMG_Load( "../../data/helpOn.png" );
                this->logos[ FLIPFLOP ]
                    = ::IMG_Load( "../../data/flogo.png" );
                this->logos[ BOMBSQUAD ]
                    = ::IMG_Load( "../../data/blogo.png" );
                this->logos[ MAZERUNNER ]
                    = ::IMG_Load( "../../data/mlogo.png" );
                this->logos[ PEGJUMPER ]
                    = ::IMG_Load( "../../data/plogo.png" );
                this->logos[ TILESLIDER ]
                    = ::IMG_Load( "../../data/tlogo.png" );
        }
        NKlein_54321::MainMenuView::~MainMenuView( void )
        {
                for ( unsigned int ii=0; ii < MAX_GAME; ++ii ) {
                    ::SDL_FreeSurface( this->logos[ ii ] );
                }
                ::SDL_FreeSurface( this->quitButton[ 1 ] );
                ::SDL_FreeSurface( this->quitButton[ 0 ] );
                ::SDL_FreeSurface( this->overlay );
                ::SDL_FreeSurface( this->backdrop );
                ::SDL_FreeSurface( this->sidebar );
        }
        void
        NKlein_54321::MainMenuView::redraw( void ) const
        {
            SDL_Rect rr;
                ::SDL_BlitSurface( this->backdrop, 0, this->screen, 0 );
                for ( unsigned int ii=0; ii < MAX_GAME; ++ii ) {
                    rr = boxes[ ii ];
                    ::SDL_BlitSurface( this->logos[ ii ], 0, this->screen, &rr );
                }
                rr.x = NKlein_54321::View::SIDEBAR_X;
                rr.y = NKlein_54321::View::SIDEBAR_Y;
                ::SDL_BlitSurface( this->sidebar, 0, this->screen, &rr );
                rr.x = NKlein_54321::View::SIDEBAR_X;
                rr.y = NKlein_54321::View::SIDEBAR_Y;
                ::SDL_BlitSurface( this->overlay, 0, this->screen, &rr );
                this->redrawQuit( false );
            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );
        }
        void
        NKlein_54321::MainMenuView::redrawQuit( bool refresh ) const
        {
            unsigned int index = ( ! this->quitPressed ) ? 0 : 1 ;
            SDL_Surface* button = this->quitButton[ index ];
            ::SDL_BlitSurface( button, 0, this->screen, &quitBox );

                SDL_Rect rr = quitBox;
                rr.x -= NKlein_54321::View::SIDEBAR_X;
                rr.y -= NKlein_54321::View::SIDEBAR_Y;
                ::SDL_BlitSurface( this->overlay, &rr, this->screen, &quitBox );

            if ( refresh ) {
                ::SDL_UpdateRect(
                        this->screen,
                        quitBox.x, quitBox.y,
                        quitBox.w, quitBox.h
                    );
            }
        }
        bool
        NKlein_54321::MainMenuView::pointInBox(
                unsigned int xx, unsigned int yy,
                unsigned int game
            ) const
        {
            assert( game < MAX_GAME );
            return xx >= boxes[ game ].x
                && xx <  boxes[ game ].x + boxes[ game ].w
                && yy >= boxes[ game ].y
                && yy <  boxes[ game ].y + boxes[ game ].h;
        }
        bool
        NKlein_54321::MainMenuView::handleMouseClick(
                Controller* control,
                bool isMouseUp,
                unsigned int xx,
                unsigned int yy,
                unsigned int buttonNumber
            )
        {
                bool hitQuit = (
                           xx >= quitBox.x && xx < quitBox.x + quitBox.w
                        && yy >= quitBox.y && yy < quitBox.y + quitBox.h
                    );

            if ( hitQuit && ! isMouseUp ) {
                    this->quitPressed = true;
                    this->redrawQuit();
            } else if ( this->quitPressed )  {
                if ( isMouseUp ) {
                        this->quitPressed = false;
                        this->redrawQuit();
                }
                if ( hitQuit ) {
                        SDL_Event quit;
                        quit.type = SDL_QUIT;
                        ::SDL_PushEvent( &quit );
                }
            }

            return hitQuit;
        }
        SDL_Rect NKlein_54321::MainMenuView::quitBox = {
            NKlein_54321::View::SIDEBAR_X + 2,
            NKlein_54321::View::SIDEBAR_Y + 534,
            196, 64
        };
        SDL_Rect NKlein_54321::MainMenuView::boxes[ MAX_GAME ] = {
            {   0,   0, 300, 200 },
            { 300,   0, 300, 200 },
            { 150, 200, 300, 200 },
            {   0, 400, 300, 200 },
            { 300, 400, 300, 200 },
        };
