    #include <stdio.h>
    #include <stdlib.h>
    #include <unistd.h>
    #include <SDL.h>
    #include <SDL_keysym.h>
    #include "cube.h"
    #include "font.h"
    #include "soundDev.h"
    #include "controller.h"
    #include "view.h"
    #include "mainmenuView.h"
    #include "mainmenuController.h"
    #include "flipflopView.h"
    #include "flipflop.h"
    #include "flipflopController.h"
    #include "bombView.h"
    #include "bomb.h"
    #include "bombController.h"
    #include "mazeView.h"
    #include "maze.h"
    #include "mazeController.h"
    #include "pegView.h"
    #include "peg.h"
    #include "pegController.h"
    #include "tileView.h"
    #include "tile.h"
    #include "tileController.h"
    #include "lifeView.h"
    #include "life.h"
    #include "lifeController.h"
        extern "C" int
        SDL_main( int argc, char** argv )
        {
                unsigned int initFlags = 0;
                initFlags |= SDL_INIT_VIDEO;
                initFlags |= SDL_INIT_AUDIO;
                if ( ::SDL_Init( initFlags ) < 0 ) {
                    fprintf( stdout, "Failed to init SDL: %s\n", ::SDL_GetError() );
                    return __LINE__;
                }
                unsigned int videoFlags = 0;

                videoFlags |= SDL_SWSURFACE;
                if ( argc <= 1 ) {
                    videoFlags |= SDL_FULLSCREEN;
                }

                SDL_Surface* screen = ::SDL_SetVideoMode(
                        800, 600, 24, videoFlags
                    );

                if ( screen == 0 ) {
                    fprintf( stdout, "Failed to set video mode: %s\n",
                            ::SDL_GetError()
                        );
                    return __LINE__;
                }
                ::SDL_WM_SetCaption( "54321 v1.0.2001.11.16", "54321" );
                ::SDL_SetGamma( 1.6, 1.6, 1.6 );
                NKlein_54321::SoundDev* soundDev = new NKlein_54321::SoundDev;

                if ( ! soundDev->isOpened() ) {
                    delete soundDev;
                    soundDev = 0;
                }

                ::srandom( getpid() ^ ::SDL_GetTicks() );

            NKlein_54321::Cube cube;
            NKlein_54321::Controller* controller = 0;

            SDL_Event change;
            change.type = SDL_USEREVENT;
            change.user.code = -1;
            ::SDL_PushEvent( &change );

                bool done = false;

                SDL_Event event;

                while ( ! done && ::SDL_WaitEvent( &event ) ) {
                    switch ( event.type ) {
                    case SDL_MOUSEBUTTONDOWN:
                    case SDL_MOUSEBUTTONUP:
                            if ( controller != 0 ) {
                                bool isMouseUp = ( event.type == SDL_MOUSEBUTTONUP );
                                unsigned int xx = event.button.x;
                                unsigned int yy = event.button.y;
                                unsigned int buttonNumber = event.button.button;
                                unsigned int mask = KMOD_META | KMOD_SHIFT;

                                if ( ( ::SDL_GetModState() & mask ) != 0 ) {
                                    ++buttonNumber;
                                }

                                controller->handleMouseClick(
                                        isMouseUp, xx, yy, buttonNumber
                                    );
                            }
                        break;
                    case SDL_USEREVENT:
                        delete controller;
                        switch ( event.user.code ) {
                                case NKlein_54321::MainMenuView::MAX_GAME:
                                    controller = new NKlein_54321::LifeController(
                                                screen, soundDev, &cube
                                            );
                                    break;
                                case NKlein_54321::MainMenuView::FLIPFLOP:
                                    controller = new NKlein_54321::FlipFlopController(
                                                screen, soundDev, &cube
                                            );
                                    break;
                                case NKlein_54321::MainMenuView::BOMBSQUAD:
                                    controller = new NKlein_54321::BombSquadController(
                                                screen, soundDev, &cube
                                            );
                                    break;
                                case NKlein_54321::MainMenuView::MAZERUNNER:
                                    controller = new NKlein_54321::MazeController(
                                                screen, soundDev, &cube
                                            );
                                    break;
                                case NKlein_54321::MainMenuView::PEGJUMPER:
                                    controller = new NKlein_54321::PegController(
                                                screen, soundDev, &cube
                                            );
                                    break;
                                case NKlein_54321::MainMenuView::TILESLIDER:
                                    controller = new NKlein_54321::TileController(
                                                screen, soundDev, &cube
                                            );
                                    break;
                                default:
                                    controller = new NKlein_54321::MainMenuController(
                                                screen, &cube
                                            );
                                    break;
                        }
                        break;
                #ifndef NDEBUG
                    case SDL_KEYUP:
                            if ( event.key.keysym.sym == SDLK_COMMA ) {
                                SDL_SaveBMP( screen, "../../screengrab.bmp" );
                            }
                        break;
                #endif
                    case SDL_QUIT:
                        done = true;
                        break;
                    }
                }

            delete controller;
            delete soundDev;

                ::SDL_Quit();
            return 0;
        }
