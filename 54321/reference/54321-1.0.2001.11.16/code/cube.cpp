    #include <assert.h>
    #include "cube.h"
        const unsigned int NKlein_54321::Cube::arrayLengths[] = {
            1,
            SIDE_LENGTH, 
            SIDE_LENGTH * SIDE_LENGTH, 
            SIDE_LENGTH * SIDE_LENGTH * SIDE_LENGTH,
            SIDE_LENGTH * SIDE_LENGTH * SIDE_LENGTH * SIDE_LENGTH
        };
    NKlein_54321::Cube::Cube( void )
    {
        assert( DIMENSIONS == 4 );
        CellType zero = (CellType)0;
        *this = zero;
    }
        void
        NKlein_54321::Cube::operator = (
                const NKlein_54321::Cube::CellType& value
            )
        {
                assert( &value != 0 );
            for ( unsigned int ii=0; ii < ARRAY_LEN; ++ii ) {
                this->array[ ii ] = value;
            }
        }
        void
        NKlein_54321::Cube::vectorToIndex(
                const unsigned int vec[ NKlein_54321::Cube::DIMENSIONS ],
                unsigned int* index
            )
        {
                assert( index != 0 );
                assert( vec[ 0 ] < SIDE_LENGTH );
                assert( vec[ 1 ] < SIDE_LENGTH );
                assert( vec[ 2 ] < SIDE_LENGTH );
                assert( vec[ 3 ] < SIDE_LENGTH );
                *index = 0;

                for ( unsigned int ii=0; ii < DIMENSIONS; ++ii ) {
                    *index *= SIDE_LENGTH;
                    *index += vec[ ( DIMENSIONS - 1 ) - ii ];
                }
        }
        void
        NKlein_54321::Cube::indexToVector(
                unsigned int index,
                unsigned int vec[ NKlein_54321::Cube::DIMENSIONS ]
            )
        {
                assert( index < ARRAY_LEN );
                assert( vec != 0 );
                for ( unsigned int ii=0; ii < DIMENSIONS; ++ii ) {
                    vec[ ii ] = index % SIDE_LENGTH;
                    index /= SIDE_LENGTH;
                }
        }
        bool
        NKlein_54321::Cube::determineAxis(
                unsigned int vf[ DIMENSIONS ],
                unsigned int vt[ DIMENSIONS ],
                bool wrapping,
                unsigned int* axis,
                bool* positive
            )
        {
            assert( axis != 0 );
            assert( positive != 0 );

            *positive = true;

            unsigned int diffCount = 0;
                for ( unsigned int ii=0; ii < DIMENSIONS; ++ii ) {
                    int diff = ( (int)vt[ ii ] - (int)vf[ ii ] );

                    if ( diff != 0 ) {
                        if ( wrapping ) {
                            unsigned int udiff = ( SIDE_LENGTH + diff ) % SIDE_LENGTH;
                            if ( udiff >= SIDE_LENGTH/2 ) {
                                *positive = false;
                            }
                        } else {
                            if ( diff < 0 ) {
                                *positive = false;
                            }
                        }
                        *axis = ii;
                        ++diffCount;
                    }
                }
            return ( diffCount == 1 );
        }
        NKlein_54321::Cube::CellType&
        NKlein_54321::Cube::operator [] (
                const unsigned int vec[ NKlein_54321::Cube::DIMENSIONS ]
            )
        {
            unsigned int index;
            this->vectorToIndex( vec, &index );

            return this->array[ index ];
        }
        NKlein_54321::Cube::CellType&
        NKlein_54321::Cube::operator [] (
                const unsigned int index
            )
        {
            assert( index < ARRAY_LEN );
            return this->array[ index ];
        }
        unsigned int
        NKlein_54321::Cube::getNeighbors(
                unsigned int nn[
                        2 * NKlein_54321::Cube::DIMENSIONS
                    ],
                unsigned int index,
                unsigned int dims,
                bool wrap
            )
        {
            unsigned int vec[ DIMENSIONS ];
            NKlein_54321::Cube::indexToVector( index, vec );

            unsigned int ii=0;

            if ( wrap ) {
                for ( unsigned int jj=0; jj < dims; ++jj ) {
                        unsigned int coord = vec[ jj ];
                        vec[ jj ] = ( coord + 1 ) % SIDE_LENGTH;
                        NKlein_54321::Cube::vectorToIndex( vec, &nn[ ii++ ] );
                        vec[ jj ] = ( coord + SIDE_LENGTH - 1 ) % SIDE_LENGTH;
                        NKlein_54321::Cube::vectorToIndex( vec, &nn[ ii++ ] );
                        vec[ jj ] = coord;
                }
            } else {
                for ( unsigned int jj=0; jj < dims; ++jj ) {
                        unsigned int coord = vec[ jj ];
                        if ( coord + 1 < SIDE_LENGTH ) {
                            vec[ jj ] = ( coord + 1 );
                            NKlein_54321::Cube::vectorToIndex( vec, &nn[ ii++ ] );
                        }
                        if ( coord >= 1 ) {
                            vec[ jj ] = ( coord - 1 );
                            NKlein_54321::Cube::vectorToIndex( vec, &nn[ ii++ ] );
                        }
                        vec[ jj ] = coord;
                }
            }

            return ii;
        }
