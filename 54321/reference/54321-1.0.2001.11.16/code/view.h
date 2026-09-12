    namespace NKlein_54321 {
            class Controller;
            class Help;
            class View {
                    public:
                            enum { SQUARE = 36 };
                            enum { GAP = 4 };
                            enum { BLOCK = ( NKlein_54321::Cube::SIDE_LENGTH * SQUARE ) + GAP };
                            enum {
                                DIM_2 = 0,
                                DIM_3,
                                DIM_4,
                                EASY,
                                MEDIUM,
                                HARD,
                                WRAP,
                                NEW,
                                BACK,
                                HELP,
                                MAX_BUTTON
                            };
                    protected:
                            View(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            virtual ~View( void );
                    public:
                            void reset( void );
                    public:
                            static bool screenToCell(
                                    unsigned int xx, unsigned int yy,
                                    unsigned int dims,
                                    unsigned int* index
                                );
                            static void cellToScreen(
                                    unsigned int index,
                                    unsigned int dims,
                                    unsigned int* xx, unsigned int* yy
                                );
                    public:
                            virtual void redraw( void );
                            virtual void redraw( unsigned int index ) = 0;
                    private:
                            void drawButton(
                                    unsigned int button,
                                    bool update = true
                                );
                    public:
                            virtual void showWinning(
                                    unsigned int actualMoves,
                                    unsigned int expectedMoves
                                );
                            virtual void showLosing( void );
                    public:
                            virtual void backgroundMusic( bool stop = false );
                            virtual void moveNoise( void );
                            virtual void victoryMusic( void );
                            virtual void losingMusic( void );
                    public:
                            virtual bool handleMouseClick(
                                    Controller* controller,
                                    bool isMouseUp,
                                    unsigned int xx,
                                    unsigned int yy,
                                    unsigned int buttonNumber
                                );
                    private:
                            bool checkButton(
                                    unsigned int xx, unsigned int yy,
                                    unsigned int ii
                                );
                    public:
                            void setHelp( Help* nn );
                    private:
                            static unsigned int startCoords[
                                    NKlein_54321::Cube::DIMENSIONS + 1
                                ][ 2 ];
                    public:
                            enum { SIDEBAR_X = 600, SIDEBAR_Y = 0 };
                    private:
                            static SDL_Rect bLocation[ MAX_BUTTON ];
                    protected:
                            SDL_Surface* screen;
                            SoundDev* sound;
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                    private:
                            unsigned int bgColor;
                            SDL_Surface* sidebar;
                            SDL_Surface* overlay;
                            SDL_Surface* dimButton[2];
                            SDL_Surface* setButton[2];
                            SDL_Surface* actButton[2];
                            SDL_Surface* helpButton[2];
                            SDL_Surface* victory;
                            SDL_Surface* losing;
                            bool bPressed[ MAX_BUTTON ];
                            unsigned int clickedButton;
                            bool originalState;
                            Help* help;
            };
    };
