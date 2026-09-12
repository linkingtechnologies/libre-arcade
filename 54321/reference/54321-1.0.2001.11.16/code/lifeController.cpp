namespace NKlein_54321 {
    int __counter = 0;
    int __wonCount = 0;
};
int __counter = 0;
int __wonCount = 0;
    #include <SDL.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "controller.h"
    #include "view.h"
    #include "lifeView.h"
    #include "life.h"
    #include "lifeController.h"
        NKlein_54321::LifeController::LifeController(
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
        NKlein_54321::LifeController::~LifeController( void )
        {
            this->view.backgroundMusic( true );
            delete this->model;
        }
        void
        NKlein_54321::LifeController::reset( void )
        {
            delete this->model;
            this->model = new Life(
                    this->cube,
                    this->dims,
                    this->skillLevel,
                    this->wrap,
                    &this->view
                );
        }
        void
        NKlein_54321::LifeController::setDimension(
                unsigned int _dims
            )
        {
            if ( _dims != this->dims ) {
                this->dims = _dims;
                this->reset();
            }
        }
        void
        NKlein_54321::LifeController::setSkillLevel(
                unsigned int _skillLevel
            )
        {
            if ( _skillLevel != this->skillLevel ) {
                this->skillLevel = _skillLevel;
                this->reset();
            }
        }
        void
        NKlein_54321::LifeController::setWrap(
                bool _wrap
            )
        {
            if ( _wrap != this->wrap ) {
                this->wrap = _wrap;
                this->reset();
            }
        }
        void
        NKlein_54321::LifeController::newGame( void )
        {
            this->reset();
        }
        void
        NKlein_54321::LifeController::handleMouseClick(
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
                if ( buttonNumber == 1 ) {
                    hit = NKlein_54321::View::screenToCell(
                            xx, yy, this->dims, &index
                        );

                    if ( hit && ! isMouseUp ) {
                        this->model->flip( index );
                    }
                } else if ( ! isMouseUp ) {
                    this->model->generation();
                }
            }
        }
