    namespace NKlein_54321 {
            class Tile {
                    public:
                            Tile(
                                    Cube* _cube,
                                    unsigned int _dims = 2,
                                    unsigned int _skillLevel = 0,
                                    bool _wrap = true,
                                    TileView* _view = 0
                                );
                    public:
                            void reset( void );
                            void move( unsigned int fromIndex );
                    private:
                            Cube* cube;
                            unsigned int dims;
                            unsigned int skillLevel;
                            bool wrap;
                            unsigned int blankSpot;
                            int stepsTaken;
                            bool hasWon;
                            TileView* view;
            };
    };
