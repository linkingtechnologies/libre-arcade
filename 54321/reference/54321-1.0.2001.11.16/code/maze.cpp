    #include <assert.h>
    #include <stdlib.h>
    #include <SDL.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "mazeView.h"
    #include "maze.h"
        NKlein_54321::Maze::Maze(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap,
                MazeView* _view
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
        NKlein_54321::Maze::reset( void )
        {
            *this->cube = ALL_WALLS;

                unsigned int table[ Cube::DIMENSIONS+1 ][ 3 ] = {
                    {  0,  0,  0 },
                    { 20, 10,  0 },
                    { 20, 10,  0 },
                    { 20, 10,  0 },
                    { 20, 10,  0 },
                };
            unsigned int extraWallPercent
                = table[ this->dims ][ this->skillLevel ];
            unsigned int len
                = NKlein_54321::Cube::arrayLengths[ this->dims ];

            unsigned int distinctSets = len;
                struct WallInfo {
                    unsigned int from;
                    unsigned int to;
                };
                struct WallInfo* walls = new struct WallInfo[
                        len * this->dims
                    ];
                unsigned int wallCount = 0;

                for ( unsigned int ii=0; ii < len; ++ii ) {
                    unsigned int nn[ 2 * NKlein_54321::Cube::DIMENSIONS ];
                    unsigned int nc = this->cube->getNeighbors(
                            nn, ii, this->dims, this->wrap
                        );
                    for ( unsigned int jj=0; jj < nc; ++jj ) {
                            if ( nn[ jj ] < ii ) {
                                assert( wallCount < len * this->dims );
                                walls[ wallCount ].from = ii;
                                walls[ wallCount ].to = nn[ jj ];
                                ++wallCount;
                            }
                    }
                }

            while ( wallCount > 0 ) {
                unsigned int nn = random() % wallCount;
                    unsigned int setFrom = this->set( walls[ nn ].from );
                    unsigned int setTo = this->set( walls[ nn ].to );

                    if ( setFrom != setTo || ( random() % 100 ) < extraWallPercent ) {
                                unsigned int vf[ NKlein_54321::Cube::DIMENSIONS ];
                                NKlein_54321::Cube::indexToVector( walls[ nn ].from, vf );

                                unsigned int vt[ NKlein_54321::Cube::DIMENSIONS ];
                                NKlein_54321::Cube::indexToVector( walls[ nn ].to, vt );
                                bool positive;
                                unsigned int axis;

                                NKlein_54321::Cube::determineAxis(
                                    vf, vt, this->wrap, &axis, &positive
                                );
                                unsigned int fw = LEFT << ( 2 * axis );
                                unsigned int tw = LEFT << ( 2 * axis );

                                if ( positive ) {
                                    fw <<= 1;
                                } else {
                                    tw <<= 1;
                                }

                                (*this->cube)[ walls[ nn ].from ] &= ~fw;
                                (*this->cube)[ walls[ nn ].to ]   &= ~tw;
                        this->join( setFrom, setTo );
                    }
                walls[ nn ] = walls[ wallCount-1 ];
                --wallCount;
            }

                this->stepsTaken = 0;
                this->repeatsTaken = 0;
                this->hasWon = false;
                this->curIndex = 0;
                (*this->cube)[ this->curIndex ] |= AM_HERE;
                unsigned int vec[ NKlein_54321::Cube::DIMENSIONS ];
                for ( unsigned int ii=0; ii < NKlein_54321::Cube::DIMENSIONS; ++ii ) {
                    vec[ ii ] = 0;
                }

                if ( this->wrap ) {
                    for ( unsigned int ii=0; ii < this->dims; ++ii ) {
                        vec[ ii ] = NKlein_54321::Cube::SIDE_LENGTH / 2;
                    }
                } else {
                    for ( unsigned int ii=0; ii < this->dims; ++ii ) {
                        vec[ ii ] = NKlein_54321::Cube::SIDE_LENGTH - 1;
                    }
                }

                NKlein_54321::Cube::vectorToIndex( vec, &this->finishIndex );
                (*this->cube)[ this->finishIndex ] |= FINISH_HERE;

            if ( this->view != 0 ) {
                this->view->reset();
                this->view->redraw();
            }
        }
        void
        NKlein_54321::Maze::move( unsigned int toIndex )
        {
            unsigned int fromIndex = this->curIndex;
                unsigned int vf[ NKlein_54321::Cube::DIMENSIONS ];
                NKlein_54321::Cube::indexToVector( fromIndex, vf );

                unsigned int vt[ NKlein_54321::Cube::DIMENSIONS ];
                NKlein_54321::Cube::indexToVector( toIndex, vt );
                bool positive;
                unsigned int axis;

                if ( NKlein_54321::Cube::determineAxis(
                    vf, vt, this->wrap, &axis, &positive
                ) == false ) {
                    return;
                }
                unsigned int vc[ NKlein_54321::Cube::DIMENSIONS ];

                for ( unsigned int ii=0; ii < NKlein_54321::Cube::DIMENSIONS; ++ii ) {
                    vc[ ii ] = vf[ ii ];
                }
                bool hit = false;

                unsigned int wall = RIGHT << ( 2 * axis );
                unsigned int positiveDist = 0;

                while ( !hit && vc[ axis ] != vt[ axis ] ) {
                    hit = ( (*this->cube)[ vc ] & wall ) != 0;
                        vc[ axis ] = ( vc[ axis ] + 1 ) % NKlein_54321::Cube::SIDE_LENGTH;
                    ++positiveDist;
                }

                if ( hit ) {
                    positiveDist = 0;
                }

                vc[ axis ] = vf[ axis ];
                unsigned int negativeDist = 0;

                wall = LEFT << ( 2 * axis );

                hit = false;

                while ( !hit && vc[ axis ] != vt[ axis ] ) {
                    hit = ( (*this->cube)[ vc ] & wall ) != 0;
                        vc[ axis ] = (
                                vc[ axis ] + NKlein_54321::Cube::SIDE_LENGTH - 1
                            ) % NKlein_54321::Cube::SIDE_LENGTH;
                    ++negativeDist;
                }

                if ( hit ) {
                    negativeDist = 0;
                }

                vc[ axis ] = vf[ axis ];
                if ( positiveDist == 0 && negativeDist == 0 ) {
                    return;
                }

                if ( positiveDist == 0 ) {
                    positive = false;
                } else if ( negativeDist == 0 ) {
                    positive = true;
                } else {
                    positive = ( positiveDist <= negativeDist );
                }
                (*this->cube)[ this->curIndex ] &= ~AM_HERE;
                this->curIndex = toIndex;
                (*this->cube)[ this->curIndex ] |= AM_HERE;

                while ( vc[ axis ] != vt[ axis ] ) {
                    unsigned int index;
                    NKlein_54321::Cube::vectorToIndex( vc, &index );

                        ++this->stepsTaken;
                        if ( ( (*this->cube)[ index ] & BEEN_HERE ) != 0 ) {
                            ++this->repeatsTaken;
                        }
                    (*this->cube)[ index ] |= BEEN_HERE;

                    if ( this->view != 0 ) {
                        this->view->redraw( index );
                    }

                    if ( positive ) {
                            vc[ axis ] = ( vc[ axis ] + 1 ) % NKlein_54321::Cube::SIDE_LENGTH;
                    } else {
                            vc[ axis ] = (
                                    vc[ axis ] + NKlein_54321::Cube::SIDE_LENGTH - 1
                                ) % NKlein_54321::Cube::SIDE_LENGTH;
                    }
                }

                if ( this->view != 0 ) {
                    this->view->redraw( this->curIndex );
                    this->view->moveNoise();
                }

                    if ( !hasWon ) {
                        hasWon = ( this->curIndex == this->finishIndex );

                        if ( hasWon && this->view != 0 ) {
                            this->view->showWinning(
                                    this->repeatsTaken,
                                    this->stepsTaken - this->repeatsTaken
                                );
                        }
                    }
        }
        unsigned int
        NKlein_54321::Maze::set( unsigned int index )
        {
            unsigned int value = (*this->cube)[ index ];

            if ( ( value & SET_REFERENCE ) != 0 ) {
                unsigned int ss = this->set( value & SET_MASK );
                    assert( ss <= SET_MASK );
                    value &= ~SET_MASK;
                    value |= ss;
                    (*this->cube)[ index ] = value;
                return ss;
            } else {
                return index;
            }
        }
        void
        NKlein_54321::Maze::join( unsigned int aa, unsigned int bb )
        {
            unsigned int ss = this->set( aa );
            unsigned int index = this->set( bb );

            if ( ss != index ) {
                unsigned int value = (*this->cube)[ index ];
                value |= SET_REFERENCE;
                    assert( ss <= SET_MASK );
                    value &= ~SET_MASK;
                    value |= ss;
                    (*this->cube)[ index ] = value;
            }
        }
