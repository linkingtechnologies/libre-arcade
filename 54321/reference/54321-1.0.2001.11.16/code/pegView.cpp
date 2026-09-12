    #include <assert.h>
    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "view.h"
    #include "pegView.h"
    #include "peg.h"
        NKlein_54321::PegView::PegView(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : View( _screen, _sound, _cube, _dims, _skillLevel, _wrap )
        {
            assert( this->screen != 0 );
            assert( this->dims <= 4 );

            this->peg = ::IMG_Load( "../../data/peg.png" );
            this->hole = ::IMG_Load( "../../data/hole.png" );
            this->empty = ::IMG_Load( "../../data/empty.png" );
            this->selected = ::IMG_Load( "../../data/selected.png" );

            this->font = new Font();
        }
        NKlein_54321::PegView::~PegView( void )
        {
            delete this->font;

            ::SDL_FreeSurface( this->selected );
            ::SDL_FreeSurface( this->empty );
            ::SDL_FreeSurface( this->hole );
            ::SDL_FreeSurface( this->peg );
        }
        void
        NKlein_54321::PegView::redraw( void )
        {
            this->View::redraw();

            unsigned int maxIndex
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

            for ( unsigned int index=0; index < maxIndex; ++index ) {
                this->drawCell( index, false );
            }

                this->font->centerMessage(
                        this->screen, false,
                        700, 384,
                        "Remove a peg to start."
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 434,
                        "Click the peg to jump with."
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 474,
                        "Then, click the peg"
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 498,
                        "to jump over."
                    );

            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );
        }
        void
        NKlein_54321::PegView::redraw( unsigned int index )
        {
            this->drawCell( index );
        }
        void
        NKlein_54321::PegView::drawCell(
                unsigned int index, bool update
            )
        {
            unsigned int xx;
            unsigned int yy;

            View::cellToScreen( index, this->dims, &xx, &yy );

                SDL_Rect dst;
                dst.x = xx;
                dst.y = yy;
                dst.w = SQUARE;
                dst.h = SQUARE;

            unsigned int value = (*this->cube)[ index ];

            if ( ( value & NKlein_54321::Peg::PEG ) != 0 ) {
                ::SDL_BlitSurface( this->peg, 0, this->screen, &dst );
            } else if ( ( value & NKlein_54321::Peg::HOLE ) != 0 ) {
                ::SDL_BlitSurface( this->hole, 0, this->screen, &dst );
            } else {
                ::SDL_BlitSurface( this->empty, 0, this->screen, &dst );
            }

            if ( ( value & NKlein_54321::Peg::SELECTED ) != 0 ) {
                ::SDL_BlitSurface( this->selected, 0, this->screen, &dst );
            }

            if ( update ) {
                ::SDL_UpdateRect( this->screen, xx, yy, SQUARE, SQUARE );
            }
        }
