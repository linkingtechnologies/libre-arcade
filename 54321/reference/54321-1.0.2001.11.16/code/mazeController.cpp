    #include <SDL.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "controller.h"
    #include "view.h"
    #include "mazeView.h"
    #include "maze.h"
    #include "mazeController.h"
        NKlein_54321::MazeController::MazeController(
                SDL_Surface* _screen,
                SoundDev* _sound,
                Cube* _cube,
                unsigned int _dims,
                unsigned int _skillLevel,
                bool _wrap
            ) : Controller( _cube, _dims, _skillLevel, _wrap ),
                view( _screen, _sound, _cube, _dims, _skillLevel, _wrap ),
                model( 0 )
        {
            this->view.backgroundMusic();
            this->reset();
        }
        NKlein_54321::MazeController::~MazeController( void )
        {
            this->view.backgroundMusic( true );
            delete this->model;
        }
        void
        NKlein_54321::MazeController::reset( void )
        {
            delete this->model;
            this->model = new Maze(
                    this->cube,
                    this->dims,
                    this->skillLevel,
                    this->wrap,
                    &this->view
                );
        }
        void
        NKlein_54321::MazeController::setDimension(
                unsigned int _dims
            )
        {
            if ( _dims != this->dims ) {
                this->dims = _dims;
                this->reset();
            }
        }
        void
        NKlein_54321::MazeController::setSkillLevel(
                unsigned int _skillLevel
            )
        {
            if ( _skillLevel != this->skillLevel ) {
                this->skillLevel = _skillLevel;
                this->reset();
            }
        }
        void
        NKlein_54321::MazeController::setWrap(
                bool _wrap
            )
        {
            if ( _wrap != this->wrap ) {
                this->wrap = _wrap;
                this->reset();
            }
        }
        void
        NKlein_54321::MazeController::newGame( void )
        {
            this->reset();
        }
        void
        NKlein_54321::MazeController::handleMouseClick(
                bool isMouseUp,
                unsigned int xx,
                unsigned int yy,
                unsigned int buttonNumber
            )
        {
            unsigned int index;
            bool hit;

            hit = this->view.handleMouseClick(
                        this, isMouseUp, xx, yy, buttonNumber
                    );

            if ( !hit ) {
                hit = NKlein_54321::View::screenToCell(
                        xx, yy, this->dims, &index
                    );

                if ( hit && ! isMouseUp ) {
                    this->model->move( index );
                }
            }
        }
