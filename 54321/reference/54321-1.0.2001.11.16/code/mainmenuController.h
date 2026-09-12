    namespace NKlein_54321 {
            class MainMenuController : public Controller {
                    public:
                            MainMenuController(
                                    SDL_Surface* _screen, Cube* cube
                                );
                            virtual ~MainMenuController( void );
                    public:
                            virtual void setDimension( unsigned int _dims );
                            virtual void setSkillLevel( unsigned int _skillLevel );
                            virtual void setWrap( bool _wrap );
                            virtual void newGame( void );
                    public:
                            virtual void handleMouseClick(
                                    bool isMouseUp,
                                    unsigned int xx,
                                    unsigned int yy,
                                    unsigned int buttonNumber
                                );
                    private:
                            MainMenuView view;
            };
    };
