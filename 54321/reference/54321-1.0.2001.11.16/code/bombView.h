    namespace NKlein_54321 {
            class BombSquadView : public View {
                    public:
                            BombSquadView(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            ~BombSquadView( void );
                            virtual void redraw( void );
                            virtual void redraw( unsigned int index );
                            inline void reset( void ) {
                                this->gameOver = false;
                                this->View::reset();
                            };
                    private:
                            void drawCell( unsigned int index, bool update = true );
                    public:
                            virtual void showWinning(
                                    unsigned int actualMoves,
                                    unsigned int expectedMoves
                                );
                            virtual void showLosing( void );
                    private:
                            SDL_Surface* covered;
                            SDL_Surface* uncovered;
                            SDL_Surface* flagged;
                            SDL_Surface* bomb;
                            Font* font;
                            bool gameOver;
            };
    };
