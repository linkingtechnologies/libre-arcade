    namespace NKlein_54321 {
        class View;
            class Help {
                    public:
                            Help(
                                    View* _view,
                                    SDL_Surface* _screen,
                                    const char* fname = "top"
                                );
                            virtual ~Help( void );
                    public:
                            virtual bool handleMouseClick(
                                    bool isMouseUp,
                                    unsigned int xx,
                                    unsigned int yy,
                                    unsigned int buttonNumber
                                );
                    private:
                            bool checkHotSpot(
                                    unsigned int xx, unsigned int yy,
                                    unsigned int ii
                                );
                    private:
                            void load( const char* baseName );
                    private:
                            View* view;
                            enum { X_OFFSET = 20 };
                            enum { Y_OFFSET = 20 };
                            SDL_Surface* screen;
                            Font* font;
                            enum { MAX_HOTSPOT = 32 };
                            unsigned int hotSpotCount;
                            struct {
                                char fname[ 128 ];
                                unsigned int x;
                                unsigned int y;
                                unsigned int w;
                                unsigned int h;
                            } hotSpots[ MAX_HOTSPOT ];
                            unsigned int clickedHotSpot;
            };
    };
