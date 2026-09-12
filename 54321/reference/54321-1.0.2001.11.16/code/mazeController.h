    namespace NKlein_54321 {
            class MazeController : public Controller {
                    public:
                            MazeController(
                                    SDL_Surface* _screen,
                                    SoundDev* _sound,
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                            virtual ~MazeController( void );
                    private:
                            void reset( void );
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
                            MazeView view;
                            Maze* model;
            };
    };
