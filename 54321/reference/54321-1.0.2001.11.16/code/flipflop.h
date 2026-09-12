    namespace NKlein_54321 {
            class FlipFlop {
                    public:
                            FlipFlop(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true,
                                    FlipFlopView* _view = 0
                                );
                    public:
                            void reset( void );
                    public:
                            void flip( unsigned int index, bool update = true );
                    private:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                            int onCount;
                            bool hasWon;
                            unsigned int actualMoves;
                            unsigned int expectedMoves;
                            FlipFlopView* view;
            };
    };
