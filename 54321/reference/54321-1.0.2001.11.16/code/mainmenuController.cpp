    #include <SDL.h>
    #include "cube.h"
    #include "soundDev.h"
    #include "view.h"
    #include "controller.h"
    #include "mainmenuView.h"
    #include "mainmenuController.h"
        NKlein_54321::MainMenuController::MainMenuController(
                SDL_Surface* _screen,
                Cube* _cube
            ) : Controller( _cube ),
                view( _screen )
        {
            this->view.redraw();
        }
        NKlein_54321::MainMenuController::~MainMenuController( void )
        {
        }
        void
        NKlein_54321::MainMenuController::setDimension(
                unsigned int _dims
            )
        {
        }
        void
        NKlein_54321::MainMenuController::setSkillLevel(
                unsigned int _skillLevel
            )
        {
        }
        void
        NKlein_54321::MainMenuController::setWrap(
                bool _wrap
            )
        {
        }
        void
        NKlein_54321::MainMenuController::newGame( void )
        {
        }
        void
        NKlein_54321::MainMenuController::handleMouseClick(
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
                    unsigned int maxGame = NKlein_54321::MainMenuView::MAX_GAME;
                    unsigned int chosen;
                    for ( unsigned int ii=0; !hit && ii < maxGame; ++ii ) {
                        if ( this->view.pointInBox( xx, yy, ii ) ) {
                            chosen = ii;
                            hit = true;
                        }
                    }
                    {
                        extern int __counter;
                        extern int __wonCount;

                        if ( !hit && xx < NKlein_54321::View::SIDEBAR_X
                        && __counter == 76 && __wonCount == 1 ) {
                            chosen = maxGame;
                            hit = true;
                            __wonCount = 2;
                        }
                    }
                if ( hit ) {
                        SDL_Event change;
                        change.type = SDL_USEREVENT;
                        change.user.code = chosen;
                        ::SDL_PushEvent( &change );
                }
            }
        }
