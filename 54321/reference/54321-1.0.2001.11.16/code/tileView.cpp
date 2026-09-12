    #include <assert.h>
    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "view.h"
    #include "tileView.h"
        NKlein_54321::TileView::TileView(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : View( _screen, _sound, _cube, _dims, _skillLevel, _wrap ),
                showGoal( false )
        {
            assert( this->screen != 0 );
            assert( this->dims <= 4 );

            this->centers = ::IMG_Load( "../../data/centers.png" );
            this->borders = ::IMG_Load( "../../data/borders.png" );
            this->blank = ::SDL_MapRGB( this->screen->format, 0, 0, 0 );

            this->font = new Font();
        }
        NKlein_54321::TileView::~TileView( void )
        {
            delete this->font;

            ::SDL_FreeSurface( this->borders );
            ::SDL_FreeSurface( this->centers );
        }
        void
        NKlein_54321::TileView::redraw( void )
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
                        "Click on a tile to slide it."
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 474,
                        "Right-click or Shift-click"
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 498,
                        "to see the winning state."
                    );

            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );
        }
        void
        NKlein_54321::TileView::redraw( unsigned int index )
        {
            this->drawCell( index );
        }
        void
        NKlein_54321::TileView::drawCell(
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
                unsigned int value;
                if ( this->showGoal ) {
                    value = index;
                } else {
                    value = (*this->cube)[ index ];
                }

            unsigned int blankCell
                = NKlein_54321::Cube::arrayLengths[ this->dims ] - 1;

            if ( value != blankCell ) {
                unsigned int coords[ NKlein_54321::Cube::DIMENSIONS ];
                NKlein_54321::Cube::indexToVector( value, coords );
                SDL_Rect src;

                    src.x = coords[ 2 ] * SQUARE;
                    src.y = coords[ 3 ] * SQUARE;
                    src.w = SQUARE;
                    src.h = SQUARE;

                    ::SDL_BlitSurface( this->borders, &src, this->screen, &dst );
                    src.x = coords[ 0 ] * SQUARE;
                    src.y = coords[ 1 ] * SQUARE;
                    src.w = SQUARE;
                    src.h = SQUARE;

                    ::SDL_BlitSurface( this->centers, &src, this->screen, &dst );
            } else {
                    ::SDL_FillRect( this->screen, &dst, this->blank );
            }

            if ( update ) {
                ::SDL_UpdateRect( this->screen, xx, yy, SQUARE, SQUARE );
            }
        }
        bool
        NKlein_54321::TileView::isShowingGoalState( void ) const
        {
            return this->showGoal;
        }
        void
        NKlein_54321::TileView::showGoalState( bool _state )
        {
            if ( _state != this->showGoal ) {
                this->showGoal = _state;
                this->redraw();
            }
        }
