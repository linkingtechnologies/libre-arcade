    #include <assert.h>
    #include "cube.h"
    #include "controller.h"

        NKlein_54321::Controller::Controller(
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : cube( _cube ),
                dims( _dims ),
                skillLevel( _skillLevel ),
                wrap( _wrap )
        {
            assert( cube != 0 );
            assert( dims > 1 );
            assert( dims <= NKlein_54321::Cube::DIMENSIONS );
            assert( skillLevel < 3 );
        }
        NKlein_54321::Controller::~Controller( void )
        {
        }
