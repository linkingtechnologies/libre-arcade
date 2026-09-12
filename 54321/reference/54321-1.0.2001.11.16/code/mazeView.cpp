    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "mazeView.h"
    #include "maze.h"
        NKlein_54321::MazeView::MazeView(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : View( _screen, _sound, _cube, _dims, _skillLevel, _wrap )
        {
            this->base[ 0 ] = ::IMG_Load( "../../data/unmarked.png" );
            this->base[ 1 ] = ::IMG_Load( "../../data/marked.png" );

            this->finishHere = ::IMG_Load( "../../data/goal.png" );
            this->amHere = ::IMG_Load( "../../data/me.png" );

                for ( unsigned int ii=0; ii < 2 * NKlein_54321::Cube::DIMENSIONS; ++ii ) {
                    char buf[ 64 ];
                    sprintf( buf, "../../data/wall%1x.png", ii );
                    this->walls[ ii ] = ::IMG_Load( buf );
                }
        }
        NKlein_54321::MazeView::~MazeView( void )
        {
                for ( unsigned int ii=2*NKlein_54321::Cube::DIMENSIONS; ii > 0 ; --ii ) {
                    ::SDL_FreeSurface( this->walls[ ii-1 ] );
                }

            ::SDL_FreeSurface( this->amHere );
            ::SDL_FreeSurface( this->finishHere );

            ::SDL_FreeSurface( this->base[ 1 ] );
            ::SDL_FreeSurface( this->base[ 0 ] );
        }
        void
        NKlein_54321::MazeView::redraw( void )
        {
            this->View::redraw();

            unsigned int maxIndex
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

            for ( unsigned int index=0; index < maxIndex; ++index ) {
                this->drawCell( index, false );
            }

            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );
        }
        void
        NKlein_54321::MazeView::redraw( unsigned int index )
        {
            this->drawCell( index );
        }
        void
        NKlein_54321::MazeView::drawCell(
                unsigned int index, bool update
            )
        {
            unsigned int xx;
            unsigned int yy;

            View::cellToScreen( index, this->dims, &xx, &yy );

                SDL_Rect rect;
                rect.x = xx;
                rect.y = yy;
                rect.w = SQUARE;
                rect.h = SQUARE;

            unsigned int value = (*this->cube)[ index ];

            if ( ( value & NKlein_54321::Maze::BEEN_HERE ) != 0 ) {
                ::SDL_BlitSurface( this->base[ 1 ], 0, this->screen, &rect );
            } else {
                ::SDL_BlitSurface( this->base[ 0 ], 0, this->screen, &rect );
            }

            if ( ( value & NKlein_54321::Maze::FINISH_HERE ) != 0 ) {
                ::SDL_BlitSurface( this->finishHere, 0, this->screen, &rect );
            }

                for ( unsigned int ii=0; ii < 2 * NKlein_54321::Cube::DIMENSIONS; ++ii ) {
                    unsigned int wall = NKlein_54321::Maze::LEFT << ii;
                    if ( ( value & wall ) != 0 ) {
                        ::SDL_BlitSurface( this->walls[ ii ], 0, this->screen, &rect );
                    }
                }

            if ( ( value & NKlein_54321::Maze::AM_HERE ) != 0 ) {
                ::SDL_BlitSurface( this->amHere, 0, this->screen, &rect );
            }

            if ( update ) {
                ::SDL_UpdateRect( this->screen, xx, yy, SQUARE, SQUARE );
            }
        }
