    namespace NKlein_54321 {
            class Maze {
                    public:
                            enum {
                                SET_MASK      = 0x000000FF,
                                SET_REFERENCE = 0x00000100
                            };
                            enum {
                                BEEN_HERE     = 0x00000200,
                                AM_HERE       = 0x00000400,
                                FINISH_HERE   = 0x00000800
                            };
                            enum {
                                LEFT          = 0x00010000,
                                RIGHT         = 0x00020000,
                                UP            = 0x00040000,
                                DOWN          = 0x00080000,
                                FORE          = 0x00100000,
                                AFT           = 0x00200000,
                                ANA           = 0x00400000,
                                KATA          = 0x00800000,
                                ALL_WALLS     = 0x00FF0000
                            };
                    public:
                            Maze(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true,
                                    MazeView* _view = 0
                                );
                    public:
                            void reset( void );
                            void move( unsigned int toIndex );
                    private:
                            unsigned int set( unsigned int index );
                            void join( unsigned int aa, unsigned int bb );
                    private:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                            unsigned int curIndex;
                            unsigned int finishIndex;
                            int stepsTaken;
                            int repeatsTaken;
                            bool hasWon;
                            MazeView* view;
            };
    };
