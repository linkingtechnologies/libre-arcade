    namespace NKlein_54321 {
            class PegView : public View {
                    public:
                            PegView(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            ~PegView( void );
                            virtual void redraw( void );
                            virtual void redraw( unsigned int index );
                    private:
                            void drawCell( unsigned int index, bool update = true );
                    private:
                            SDL_Surface* peg;
                            SDL_Surface* hole;
                            SDL_Surface* empty;
                            SDL_Surface* selected;
                            Font* font;
            };
    };
