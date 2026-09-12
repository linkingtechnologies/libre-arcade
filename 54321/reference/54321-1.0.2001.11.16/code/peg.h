    namespace NKlein_54321 {
            class Peg {
                    public:
                            enum {
                                EMPTY = 0,
                                HOLE = 1,
                                PEG = 2,
                                SELECTED = 4
                            };
                    public:
                            Peg(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true,
                                    PegView* _view = 0
                                );
                    public:
                            void reset( void );
                            bool isSelected( void ) const;
                            void select( unsigned int cell );
                            void jump( unsigned int cell );
                    private:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                            unsigned int selectedSpot;
                            unsigned int pegsRemaining;
                            unsigned int stepsTaken;
                            bool firstMove;
                            bool hasWon;
                            PegView* view;
            };
    };
