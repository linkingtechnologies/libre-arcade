    #include <SDL.h>
    #include <SDL_image.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "view.h"
    #include "bombView.h"
    #include "bomb.h"
        NKlein_54321::BombSquadView::BombSquadView(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : View( _screen, _sound, _cube, _dims, _skillLevel, _wrap ),
                gameOver( false )
        {
            this->covered = ::IMG_Load( "../../data/covered.png" );
            this->uncovered = ::IMG_Load( "../../data/uncovered.png" );
            this->flagged = ::IMG_Load( "../../data/flagged.png" );
            this->bomb = ::IMG_Load( "../../data/bomb.png" );

            this->font = new Font();
        }
        NKlein_54321::BombSquadView::~BombSquadView( void )
        {
            delete this->font;

            ::SDL_FreeSurface( this->bomb );
            ::SDL_FreeSurface( this->flagged );
            ::SDL_FreeSurface( this->uncovered );
            ::SDL_FreeSurface( this->covered );
        }
        void
        NKlein_54321::BombSquadView::redraw( void )
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
                        "Click on a tile to reveal it."
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 474,
                        "Right-click or Shift-click"
                    );
                this->font->centerMessage(
                        this->screen, false,
                        700, 498,
                        "on a tile to flag it."
                    );

            ::SDL_UpdateRect( this->screen, 0, 0, 0, 0 );
        }
        void
        NKlein_54321::BombSquadView::redraw( unsigned int index )
        {
            this->drawCell( index );
        }
        void
        NKlein_54321::BombSquadView::drawCell(
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

            unsigned int cell = (*this->cube)[ index ];
            bool showContents = this->gameOver;

            if ( ( cell & NKlein_54321::BombSquad::UNCOVERED ) != 0 ) {
                showContents = true;
                    ::SDL_BlitSurface( this->uncovered, 0, this->screen, &rect );
            } else {
                    ::SDL_BlitSurface( this->covered, 0, this->screen, &rect );
            }

            if ( showContents ) {
                    unsigned int count = cell & 0x0FFF;

                    if ( ( cell & NKlein_54321::BombSquad::BOMB ) != 0 ) {
                            ::SDL_BlitSurface( this->bomb, 0, this->screen, &rect );
                    } else if ( count > 0 ) {
                        this->font->centerMessage(
                                this->screen, false,
                                rect.x + rect.w / 2,
                                rect.y + rect.h / 2 + 8,
                                "%d", count
                            );
                    }
            }

            if ( ( cell & NKlein_54321::BombSquad::FLAG ) != 0 ) {
                    ::SDL_BlitSurface( this->flagged, 0, this->screen, &rect );
            }

            if ( update ) {
                ::SDL_UpdateRect( this->screen, xx, yy, SQUARE, SQUARE );
            }
        }
        void
        NKlein_54321::BombSquadView::showWinning(
                unsigned int actualMoves,
                unsigned int expectedMoves
            )
        {
            this->gameOver = true;
            this->redraw();
            this->View::showWinning( actualMoves, expectedMoves );
        }
        void
        NKlein_54321::BombSquadView::showLosing( void )
        {
            this->gameOver = true;
            this->redraw();
            this->View::showLosing();
        }
