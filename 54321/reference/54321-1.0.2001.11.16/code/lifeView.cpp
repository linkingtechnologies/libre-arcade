    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "view.h"
    #include "lifeView.h"
        NKlein_54321::LifeView::LifeView(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : View( _screen, _sound, _cube, _dims, _skillLevel, _wrap )
        {
            this->alive = ::IMG_Load( "../../data/on.png" );
            this->dead = ::IMG_Load( "../../data/off.png" );

            this->font = new Font;
        }
        NKlein_54321::LifeView::~LifeView( void )
        {
            delete font;

            ::SDL_FreeSurface( this->dead );
            ::SDL_FreeSurface( this->alive );
        }
        void
        NKlein_54321::LifeView::redraw( void )
        {
            this->View::redraw();

            unsigned int maxIndex
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

            for ( unsigned int index=0; index < maxIndex; ++index ) {
                this->drawCell( index, false );
            }

                this->font->centerMessage(
                        this->screen, false,
                        700, 434,
                        "Click a cell to toggle it."
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 474,
                        "Right-click or Shift-click"
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 498,
                        "anywhere to pass time."
                    );

            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );
        }
        void
        NKlein_54321::LifeView::redraw( unsigned int index )
        {
            this->drawCell( index );
        }
        void
        NKlein_54321::LifeView::drawCell(
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

            if ( (*this->cube)[ index ] == 0 ) {
                ::SDL_BlitSurface( this->dead, 0, this->screen, &rect );
            } else {
                ::SDL_BlitSurface( this->alive, 0, this->screen, &rect );
            }
            if ( update ) {
                ::SDL_UpdateRect( this->screen, xx, yy, SQUARE, SQUARE );
            }
        }
