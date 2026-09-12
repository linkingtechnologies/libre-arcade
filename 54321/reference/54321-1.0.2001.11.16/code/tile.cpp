    #include <assert.h>
    #include <stdlib.h>
    #include <SDL.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "font.h"
    #include "tileView.h"
    #include "tile.h"
        NKlein_54321::Tile::Tile(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap,
                TileView* _view
            ) : cube( _cube ),
                dims( _dims ),
                skillLevel( _skillLevel ),
                wrap( _wrap ),
                view( _view )
        {
            assert( cube != 0 );
            assert( dims >= 1 );
            assert( dims <= 4 );
            assert( skillLevel < 3 );
            this->reset();
        }
        void
        NKlein_54321::Tile::reset( void )
        {
            unsigned int len
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

            for ( unsigned int ii=0; ii < len; ++ii ) {
                (*this->cube)[ ii ] = ii;
            }

                    unsigned int table[ Cube::DIMENSIONS+1 ][ 3 ] = {
                        {   0,   0,   0 },
                        {   2,   4,   8 },
                        {   2,   4,   8 },
                        {   2,   4,   8 },
                        {   2,   4,   8 },
                    };
                unsigned int swaps = table[ this->dims ][ this->skillLevel ];

                for ( unsigned int ii=0; ii < swaps; ++ii ) {
                    unsigned int sa = random() % ( len - 1 );
                    unsigned int sb = random() % ( len - 2 );

                    if ( sb >= sa ) {
                        ++sb;
                    }

                    unsigned int tmp = (*this->cube)[ sa ];
                    (*this->cube)[ sa ] = (*this->cube)[ sb ];
                    (*this->cube)[ sb ] = tmp;
                }

                if ( this->view != 0 ) {
                    this->view->redraw();
                }
                this->hasWon = false;
                this->stepsTaken = 0;
                this->blankSpot = len-1;

            if ( this->view != 0 ) {
                this->view->reset();
                this->view->redraw();
            }
        }
        void
        NKlein_54321::Tile::move( unsigned int toIndex )
        {
            unsigned int len = NKlein_54321::Cube::arrayLengths[ this->dims ];

                unsigned int vt[ NKlein_54321::Cube::DIMENSIONS ];
                NKlein_54321::Cube::indexToVector( toIndex, vt );

                unsigned int vc[ NKlein_54321::Cube::DIMENSIONS ];
                NKlein_54321::Cube::indexToVector( this->blankSpot, vc );
                bool positive;
                unsigned int axis;

                if ( NKlein_54321::Cube::determineAxis(
                    vc, vt, this->wrap, &axis, &positive
                ) == false ) {
                    return;
                }
                do {
                    if ( positive ) {
                            vc[ axis ] = ( vc[ axis ] + 1 ) % NKlein_54321::Cube::SIDE_LENGTH;
                    } else {
                            vc[ axis ] = (
                                    vc[ axis ] + NKlein_54321::Cube::SIDE_LENGTH - 1
                                ) % NKlein_54321::Cube::SIDE_LENGTH;
                    }

                    unsigned int newSpot;
                    NKlein_54321::Cube::vectorToIndex( vc, &newSpot );

                    (*this->cube)[ this->blankSpot ] = (*this->cube)[ newSpot ];
                    if ( this->view != 0 ) {
                        this->view->redraw( this->blankSpot );
                    }

                    this->blankSpot = newSpot;
                    (*this->cube)[ this->blankSpot ] = len - 1;

                    ++this->stepsTaken;

                } while ( vt[ axis ] != vc[ axis ] );

                if ( this->view != 0 ) {
                    this->view->redraw( this->blankSpot );
                    this->view->moveNoise();
                }
                if ( !this->hasWon ) {
                    this->hasWon = ( this->blankSpot == len-1 );

                    for ( unsigned int ii=0; this->hasWon && ii < len; ++ii ) {
                        hasWon = ( (*this->cube)[ ii ] == ii );
                    }

                    if ( this->hasWon && this->view != 0 ) {
                        this->view->showWinning(
                                this->stepsTaken,
                                this->stepsTaken
                            );
                    }
                }
        }
