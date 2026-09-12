    #include <assert.h>
    #include <stdlib.h>
    #include <SDL.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "font.h"
    #include "pegView.h"
    #include "peg.h"
        NKlein_54321::Peg::Peg(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap,
                PegView* _view
            ) : cube( _cube ),
                dims( _dims ),
                skillLevel( _skillLevel ),
                wrap( _wrap ),
                view( _view )
        {
            assert( cube != 0 );
            assert( dims >= 2 );
            assert( dims <= 4 );
            assert( skillLevel < 3 );
            this->reset();
        }
        void
        NKlein_54321::Peg::reset( void )
        {
                char buf[ 512 ];
                ::sprintf( buf, "../../data/b%d-%d%c.peg",
                        this->dims, this->skillLevel,
                        ( this->wrap ) ? 'w' : 'n'
                    );
                this->pegsRemaining = 0;

                FILE* fp = ::fopen( buf, "r" );
                if ( fp != 0 ) {
                    for ( unsigned int ii=0; /**/; /**/ ) {
                        char ch;
                        if ( ::fscanf( fp, "%c", &ch ) == 1 ) {
                            if ( ch == '-' ) {
                                (*this->cube)[ ii ] = EMPTY;
                                ++ii;
                            } else if ( ch == 'o' ) {
                                (*this->cube)[ ii ] = HOLE;
                                ++ii;
                            } else if ( ch == 'x' ) {
                                (*this->cube)[ ii ] = PEG;
                                ++this->pegsRemaining;
                                ++ii;
                            }
                        } else {
                            break;
                        }
                    }

                    ::fclose( fp );
                }
                this->hasWon = false;
                this->firstMove = true;

                unsigned int len = NKlein_54321::Cube::arrayLengths[ this->dims ];
                this->selectedSpot = len;

            if ( this->view != 0 ) {
                this->view->reset();
                this->view->redraw();
            }
        }
        bool
        NKlein_54321::Peg::isSelected( void ) const
        {
            unsigned int len = NKlein_54321::Cube::arrayLengths[ this->dims ];
            return ( this->selectedSpot < len );
        }
        void
        NKlein_54321::Peg::select( unsigned int cell )
        {
            unsigned int len = NKlein_54321::Cube::arrayLengths[ this->dims ];

            if ( ( (*this->cube)[ cell ] & PEG ) != 0 ) {

                    if ( this->firstMove == true ) {
                        (*this->cube)[ cell ] = HOLE;
                        if ( this->view != 0 ) {
                            this->view->moveNoise();
                            this->view->redraw( cell );
                        }
                        this->firstMove = false;
                        --this->pegsRemaining;
                        return;
                    }

                if ( this->selectedSpot < len ) {
                    (*this->cube)[ this->selectedSpot ] &= ~SELECTED;
                    if ( this->view != 0 ) {
                        this->view->redraw( this->selectedSpot );
                    }
                }

                (*this->cube)[ cell ] |= SELECTED;
                if ( this->view != 0 ) {
                    this->view->moveNoise();
                    this->view->redraw( cell );
                }

                this->selectedSpot = cell;
            }
        }
        void
        NKlein_54321::Peg::jump( unsigned int cell )
        {
            unsigned int len = NKlein_54321::Cube::arrayLengths[ this->dims ];
            unsigned int srcSpot = this->selectedSpot;

                (*this->cube)[ this->selectedSpot ] &= ~SELECTED;
                if ( this->view != 0 ) {
                    this->view->redraw( this->selectedSpot );
                }
                this->selectedSpot = len;

                if ( cell == srcSpot ) {
                    return;
                }
                if ( ( (*this->cube)[ cell ] & PEG ) == 0 ) {
                    return;
                }
                unsigned int nn[ 2 * NKlein_54321::Cube::DIMENSIONS ];
                unsigned int nc = this->cube->getNeighbors(
                        nn, cell, this->dims, this->wrap
                    );

                bool found = false;

                for ( unsigned int ii=0; !found && ii < nc; ++ii ) {
                    found = ( nn[ ii ] == srcSpot );
                }

                if ( !found ) {
                    return;
                }
                unsigned int src[ NKlein_54321::Cube::DIMENSIONS ];
                unsigned int cur[ NKlein_54321::Cube::DIMENSIONS ];

                NKlein_54321::Cube::indexToVector( srcSpot, src );
                NKlein_54321::Cube::indexToVector( cell, cur );

                unsigned int dst[ NKlein_54321::Cube::DIMENSIONS ];

                for ( unsigned int ii=0; ii < NKlein_54321::Cube::DIMENSIONS; ++ii ) {
                    dst[ ii ] = ( cur[ ii ]
                            + ( NKlein_54321::Cube::SIDE_LENGTH 
                                + cur[ ii ] - src[ ii ]
                            )
                        ) % NKlein_54321::Cube::SIDE_LENGTH;
                }

                unsigned int index;
                NKlein_54321::Cube::vectorToIndex( dst, &index );

                if ( ( (*this->cube)[ index ] & HOLE ) == 0 ) {
                    return;
                }
                found = false;

                for ( unsigned int ii=0; !found && ii < nc; ++ii ) {
                    found = ( nn[ ii ] == index );
                }

                if ( !found ) {
                    return;
                }
                (*this->cube)[ srcSpot ] = HOLE;
                (*this->cube)[ cell ] = HOLE;
                (*this->cube)[ index ] = PEG;

                if ( this->view != 0 ) {
                    this->view->moveNoise();
                    this->view->redraw( srcSpot );
                    this->view->redraw( cell );
                    this->view->redraw( index );
                }

                --this->pegsRemaining;
                ++this->stepsTaken;
                if ( !this->hasWon ) {
                    this->hasWon = ( this->pegsRemaining == 1 );

                    if ( this->hasWon && this->view != 0 ) {
                            this->view->showWinning(
                                    this->stepsTaken,
                                    this->stepsTaken
                                );
                        {
                            extern int __wonCount;
                            if ( this->skillLevel == 2 ) {
                                ++__wonCount;
                            }
                        }
                    }
                }
        }
