    namespace NKlein_54321 {
            class Font {
                    public:
                            Font( void );
                            ~Font( void );
                            virtual void centerMessage(
                                    SDL_Surface* screen,
                                    bool refresh,
                                    int xx, int yy,
                                    const char* fmt,
                                    ...
                                );
                    private:
                            SDL_Surface* image;
                            enum {
                                START_CHAR = 32,
                                END_CHAR = 127
                            };
                            unsigned int widths[ END_CHAR+1 ];
            };
    };
