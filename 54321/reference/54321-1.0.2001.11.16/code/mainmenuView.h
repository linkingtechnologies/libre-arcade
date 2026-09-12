    namespace NKlein_54321 {
            class MainMenuView {
                    public:
                            enum {
                                FLIPFLOP = 0,
                                BOMBSQUAD,
                                MAZERUNNER,
                                PEGJUMPER,
                                TILESLIDER,
                                MAX_GAME
                            };
                    public:
                            MainMenuView( SDL_Surface* _screen );
                            ~MainMenuView( void );
                            void redraw( void ) const;
                            void redrawQuit( bool refresh = true ) const;
                    public:
                            bool pointInBox(
                                    unsigned int xx, unsigned int yy,
                                    unsigned int game
                                ) const;
                            virtual bool handleMouseClick(
                                    Controller* controller,
                                    bool isMouseUp,
                                    unsigned int xx,
                                    unsigned int yy,
                                    unsigned int buttonNumber
                                );
                    private:
                            SDL_Surface* sidebar;
                            SDL_Surface* backdrop;
                            SDL_Surface* overlay;
                            SDL_Surface* logos[ MAX_GAME ];
                            SDL_Surface* quitButton[2];
                            SDL_Surface* screen;
                            bool quitPressed;
                            static SDL_Rect quitBox;
                            static SDL_Rect boxes[ MAX_GAME ];
            };
    };
