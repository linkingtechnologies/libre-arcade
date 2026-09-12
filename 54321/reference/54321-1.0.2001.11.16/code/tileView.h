    namespace NKlein_54321 {
            class TileView : public View {
                    public:
                            TileView(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            ~TileView( void );
                            virtual void redraw( void );
                            virtual void redraw( unsigned int index );
                            bool isShowingGoalState( void ) const;
                            void showGoalState( bool _state );
                    private:
                            void drawCell( unsigned int index, bool update = true );
                    private:
                            SDL_Surface* centers;
                            SDL_Surface* borders;
                            unsigned int blank;
                            bool showGoal;
                            Font* font;
            };
    };
