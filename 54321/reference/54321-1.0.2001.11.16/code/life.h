    namespace NKlein_54321 {
            class Life {
                    public:
                            Life(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true,
                                    LifeView* _view = 0
                                );
                    public:
                            void reset( void );
                    public:
                            void flip( unsigned int index, bool update = true );
                            void generation( void );
                    private:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                            unsigned int lonelyHigh;
                            unsigned int smotherLow;
                            unsigned int birthLow;
                            unsigned int birthHigh;
                            LifeView* view;
            };
    };
