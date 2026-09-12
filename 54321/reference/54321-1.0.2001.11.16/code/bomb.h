    namespace NKlein_54321 {
            class BombSquad {
                    public:
                            enum {
                                UNCOVERED = 0x1000,
                                BOMB = 0x2000,
                                FLAG = 0x4000
                            };
                    public:
                            BombSquad(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true,
                                    BombSquadView* _view = 0
                                );
                    public:
                            void reset( void );
                    public:
                            void uncover( unsigned int index, bool click = true );
                            void toggleFlag( unsigned int index );
                    private:
                            void checkWinningCondition( void );
                    private:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                            unsigned int bombCount;
                            unsigned int flagCount;
                            unsigned int coveredCount;
                            bool gameOver;
                            BombSquadView* view;
            };
    };
