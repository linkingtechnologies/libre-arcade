    namespace NKlein_54321 {
            class Controller {
                    protected:
                            Controller(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true
                                );
                    public:
                            virtual ~Controller( void );
                    public:
                            virtual void handleMouseClick(
                                    bool isMouseUp,
                                    unsigned int xx,
                                    unsigned int yy,
                                    unsigned int buttonNumber
                                ) = 0;
                    public:
                            virtual void setDimension( unsigned int _dims ) = 0;
                            virtual void setSkillLevel( unsigned int _skillLevel ) = 0;
                            virtual void setWrap( bool _wrap ) = 0;
                            virtual void newGame( void ) = 0;
                    protected:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
            };
    };
