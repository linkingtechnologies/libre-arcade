    namespace NKlein_54321 {
            class MazeView : public View {
                    public:
                            MazeView(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            ~MazeView( void );
                            virtual void redraw( void );
                            virtual void redraw( unsigned int index );
                    private:
                            void drawCell( unsigned int index, bool update = true );
                    private:
                            SDL_Surface* base[ 2 ];
                            SDL_Surface* finishHere;
                            SDL_Surface* amHere;
                            SDL_Surface* walls[ 2 * NKlein_54321::Cube::DIMENSIONS ];
            };
    };
