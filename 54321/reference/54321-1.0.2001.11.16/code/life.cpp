    #include <assert.h>
    #include <stdlib.h>
    #include <SDL.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "view.h"
    #include "lifeView.h"
    #include "life.h"
        NKlein_54321::Life::Life(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap,
                LifeView* _view
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
        NKlein_54321::Life::reset( void )
        {
            *this->cube = 0;

                struct LifeInfo {
                    unsigned int lonelyHigh;
                    unsigned int smotherLow;
                    unsigned int birthLow;
                    unsigned int birthHigh;
                } table[ NKlein_54321::Cube::DIMENSIONS+1 ][ 3 ] = {
                    {
                        { 0, 0, 0, 0 }, { 0, 0, 0, 0 }, { 0, 0, 0, 0 }
                    },
                    {
                        { 0, 3, 1, 2 }, { 0, 2, 1, 1 }, { 1, 2, 1, 1 }
                    },
                    {
                        { 0, 3, 1, 2 }, { 0, 2, 1, 1 }, { 1, 2, 1, 1 }
                    },
                    {
                        { 0, 4, 1, 2 }, { 0, 3, 2, 2 }, { 1, 3, 2, 2 }
                    },
                    {
                        { 0, 6, 2, 3 }, { 1, 4, 3, 3 }, { 2, 4, 3, 3 }
                    }
                };
            struct LifeInfo* tptr
                = &table[ this->dims ][ this->skillLevel ];

            this->lonelyHigh = tptr->lonelyHigh;
            this->smotherLow = tptr->smotherLow;
            this->birthLow = tptr->birthLow;
            this->birthHigh = tptr->birthHigh;

            if ( this->view != 0 ) {
                this->view->reset();
                this->view->redraw();
            }
        }
        void
        NKlein_54321::Life::flip(
                unsigned int index, bool update
            )
        {
            (*this->cube)[ index ] ^= 1;

            if ( update && this->view != 0 ) {
                this->view->redraw( index );
            }
        }
        void
        NKlein_54321::Life::generation( void )
        {
            bool update = false;

                Cube cc;
                unsigned int len
                    = NKlein_54321::Cube::arrayLengths[ this->dims ];
                for ( unsigned int ii=0; ii < len; ++ii ) {
                    cc[ ii ] = (*this->cube)[ ii ];
                }

            for ( unsigned int ii=0; ii < len; ++ii ) {
                    unsigned int nn[ 2 * NKlein_54321::Cube::DIMENSIONS ];
                    unsigned int nc = this->cube->getNeighbors(
                            nn, ii, this->dims, this->wrap
                        );

                    unsigned int livingCount = 0;
                    for ( unsigned int jj=0; jj < nc; ++jj ) {
                        livingCount += cc[ nn[ jj ] ];
                    }
                    bool changed = false;

                    if ( cc[ii] != 0 ) {
                        if ( livingCount <= this->lonelyHigh
                        || livingCount >= this->smotherLow ) {
                            (*this->cube)[ ii ] = 0;
                            changed = true;
                        }
                    } else {
                        if ( livingCount >= this->birthLow
                        && livingCount <= this->birthHigh ) {
                            (*this->cube)[ ii ] = 1;
                            changed = true;
                        }
                    }

                    if ( changed && this->view != 0 ) {
                        this->view->redraw( ii );
                    }
            }
        }
