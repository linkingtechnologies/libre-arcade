    namespace NKlein_54321 {
            class LifeView : public View {
                    public:
                            LifeView(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            ~LifeView( void );
                            virtual void redraw( void );
                            virtual void redraw( unsigned int index );
                    private:
                            void drawCell( unsigned int index, bool update = true );
                    private:
                            SDL_Surface* alive;
                            SDL_Surface* dead;
                            Font* font;
            };
    };
