    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "flipflopView.h"
        NKlein_54321::FlipFlopView::FlipFlopView(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : View( _screen, _sound, _cube, _dims, _skillLevel, _wrap )
        {
            this->on = ::IMG_Load( "../../data/on.png" );
            this->off = ::IMG_Load( "../../data/off.png" );
        }
        NKlein_54321::FlipFlopView::~FlipFlopView( void )
        {
            ::SDL_FreeSurface( this->off );
            ::SDL_FreeSurface( this->on );
        }
        void
        NKlein_54321::FlipFlopView::redraw( void )
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
        NKlein_54321::FlipFlopView::redraw( unsigned int index )
        {
            this->drawCell( index );
        }
        void
        NKlein_54321::FlipFlopView::drawCell(
                unsigned int index, bool update
            )
        {
            unsigned int xx;
            unsigned int yy;

            View::cellToScreen( index, this->dims, &xx, &yy );

                SDL_Rect rect;
                rect.x = xx;
                rect.y = yy;
                rect.w = SQUARE-1;
                rect.h = SQUARE-1;

            if ( (*this->cube)[ index ] == 0 ) {
                ::SDL_BlitSurface( this->off, 0, this->screen, &rect );
            } else {
                ::SDL_BlitSurface( this->on, 0, this->screen, &rect );
            }
            if ( update ) {
                ::SDL_UpdateRect( this->screen, xx, yy, SQUARE, SQUARE );
            }
        }
