    #include <assert.h>
    #include <stdlib.h>
    #include <SDL.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "view.h"
    #include "bombView.h"
    #include "bomb.h"
        NKlein_54321::BombSquad::BombSquad(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap,
                BombSquadView* _view
            ) : cube( _cube ),
                dims( _dims ),
                skillLevel( _skillLevel ),
                wrap( _wrap ),
                view( _view )
        {
            assert( cube != 0 );
            assert( dims > 1 );
            assert( dims <= NKlein_54321::Cube::DIMENSIONS );
            assert( NKlein_54321::Cube::DIMENSIONS <= 4 );
            assert( skillLevel < 3 );
            this->reset();
        }
        void
        NKlein_54321::BombSquad::reset( void )
        {
            *this->cube = 0;

                unsigned int table[ Cube::DIMENSIONS+1 ][ 3 ] = {
                    {   0,   0,   0 },
                    {   1,   2,   3 },
                    {   2,   4,   8 },
                    {   4,   8,  16 },
                    {  16,  32,  64 },
                };
            unsigned int bombs = table[ this->dims ][ this->skillLevel ];
            unsigned int len
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

                unsigned int* lut = new unsigned int[ bombs ];
                unsigned int lutLen = 0;

                for ( unsigned int ii=0; ii < bombs; ++ii ) {
                        unsigned int index = random() % len--;
                        for ( unsigned int jj=0; jj < lutLen; ++jj ) {
                            if ( index >= lut[ jj ] ) {
                                ++index;
                            }
                        }

                        (*this->cube)[ index ] |= BOMB;
                            unsigned int nn[ 2 * NKlein_54321::Cube::DIMENSIONS ];
                            unsigned int nc;

                            nc = NKlein_54321::Cube::getNeighbors(
                                    nn, index, this->dims, this->wrap
                                );
                            for ( unsigned int jj=0; jj < nc; ++jj ) {
                                ++(*this->cube)[ nn[ jj ] ];
                            }

                            unsigned int spot = lutLen;
                            while ( spot > 0 && lut[ spot-1 ] > index ) {
                                lut[ spot ] = lut[ spot-1 ];
                                --spot;
                            }
                            lut[ spot ] = index;
                            ++lutLen;
                }

                delete[] lut;
                this->bombCount = bombs;
                this->flagCount = 0;
                this->coveredCount
                    = NKlein_54321::Cube::arrayLengths[ this->dims ];
                this->gameOver = false;

            if ( this->view != 0 ) {
                this->view->reset();
                this->view->redraw();
            }
        }
        void
        NKlein_54321::BombSquad::uncover(
                unsigned int index, bool click
            )
        {
            unsigned int cell = (*this->cube)[ index ];
            if ( ( cell & ( UNCOVERED | FLAG ) ) == 0 ) {
                    --this->coveredCount;
                    if ( click && this->view != 0 ) {
                        this->view->moveNoise();
                    }
                    (*this->cube)[ index ] |= UNCOVERED;
                    if ( this->view != 0 ) {
                        this->view->redraw( index );
                    }

                if ( ( cell & BOMB ) != 0 ) {
                        if ( ! this->gameOver ) {
                            this->gameOver = true;
                            if ( this->view != 0 ) {
                                this->view->showLosing();
                            }
                        }
                } else if ( ( cell & 0x0FFF ) == 0 ) {
                        unsigned int nn[ 2 * NKlein_54321::Cube::DIMENSIONS ];
                        unsigned int nc = this->cube->getNeighbors(
                                nn, index, this->dims, this->wrap
                            );

                        for ( unsigned int ii=0; ii < nc; ++ii ) {
                            this->uncover( nn[ ii ], false );
                        }
                }

                if ( click ) {
                    this->checkWinningCondition();
                }
            }
        }
        void
        NKlein_54321::BombSquad::toggleFlag(
                unsigned int index
            )
        {
            if ( ( (*this->cube)[ index ] & UNCOVERED ) == 0 ) {
                (*this->cube)[ index ] ^= FLAG;

                    if ( ( (*this->cube)[ index ] & FLAG ) == 0 ) {
                        --this->flagCount;
                    } else {
                        ++this->flagCount;
                    }

                if ( this->view != 0 ) {
                    this->view->moveNoise();
                    this->view->redraw( index );
                }

                this->checkWinningCondition();
            }
        }
        void
        NKlein_54321::BombSquad::checkWinningCondition( void ) {
            if ( ! this->gameOver
            && this->flagCount == this->bombCount
            && this->coveredCount == this->bombCount ) {
                this->gameOver = true;
                if ( this->view != 0 ) {
                    this->view->showWinning(
                            this->flagCount, this->bombCount
                        );
                }
            }
        };
