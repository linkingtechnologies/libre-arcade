    #include <assert.h>
    #include <stdlib.h>
    #include <SDL.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "flipflopView.h"
    #include "flipflop.h"
        NKlein_54321::FlipFlop::FlipFlop(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap,
                FlipFlopView* _view
            ) : cube( _cube ),
                dims( _dims ),
                skillLevel( _skillLevel ),
                wrap( _wrap ),
                view( _view )
        {
            assert( cube != 0 );
            assert( dims >= 1 );
            assert( dims <= NKlein_54321::Cube::DIMENSIONS );
            assert( skillLevel < 3 );
            this->reset();
        }
        void
        NKlein_54321::FlipFlop::reset( void )
        {
            *this->cube = 0;
            this->onCount = 0;

                unsigned int table[ Cube::DIMENSIONS+1 ][ 3 ] = {
                    {  0,  0,  0 },
                    {  1,  2,  3 },
                    {  3,  5,  8 },
                    {  5,  8, 12 },
                    {  8, 16, 32 },
                };
            unsigned int toggles = table[ this->dims ][ this->skillLevel ];
            unsigned int len
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

                unsigned int* lut = new unsigned int[ toggles ];
                unsigned int lutLen = 0;

                for ( unsigned int ii=0; ii < toggles; ++ii ) {
                        unsigned int index = random() % len--;
                        for ( unsigned int jj=0; jj < lutLen; ++jj ) {
                            if ( index >= lut[ jj ] ) {
                                ++index;
                            }
                        }

                        this->flip( index, false );

                            unsigned int spot = lutLen;
                            while ( spot > 0 && lut[ spot-1 ] > index ) {
                                lut[ spot ] = lut[ spot-1 ];
                                --spot;
                            }
                            lut[ spot ] = index;
                            ++lutLen;
                }

                delete[] lut;
                this->hasWon = false;
                this->actualMoves = 0;
                this->expectedMoves = toggles;

            if ( this->view != 0 ) {
                this->view->reset();
                this->view->redraw();
            }
        }
        void
        NKlein_54321::FlipFlop::flip(
                unsigned int index, bool update
            )
        {
            unsigned int nn[ 2 * NKlein_54321::Cube::DIMENSIONS ];
            unsigned int nc = this->cube->getNeighbors(
                    nn, index, this->dims, this->wrap
                );

                if ( ! this->hasWon ) {
                    ++this->actualMoves;
                }
                if ( update && this->view != 0 ) {
                    this->view->moveNoise();
                }
                if ( ( (*this->cube)[ index ] ^= 1 ) == 0 ) {
                    --this->onCount;
                } else {
                    ++this->onCount;
                }
                if ( update && this->view != 0 ) {
                    this->view->redraw( index );
                }

            for ( unsigned int ii=0; ii < nc; ++ii ) {
                index = nn[ ii ];
                    if ( ( (*this->cube)[ index ] ^= 1 ) == 0 ) {
                        --this->onCount;
                    } else {
                        ++this->onCount;
                    }
                    if ( update && this->view != 0 ) {
                        this->view->redraw( index );
                    }
            }

                if ( update && ! this->hasWon && this->onCount == 0 ) {
                    this->hasWon = true;
                    if ( this->view != 0 ) {
                        this->view->showWinning(
                                this->actualMoves, this->expectedMoves
                            );
                    }
                }
        }
