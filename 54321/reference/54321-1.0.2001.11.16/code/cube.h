    namespace NKlein_54321 {
            class Cube {
                    public:
                            typedef int CellType;
                            enum { SIDE_LENGTH = 4 };
                            enum { DIMENSIONS = 4 };
                            enum {
                                ARRAY_LEN = SIDE_LENGTH * SIDE_LENGTH * SIDE_LENGTH * SIDE_LENGTH
                            };
                    public:
                            Cube( void );
                    public:
                            void operator = ( const CellType& value );
                    public:
                            static void indexToVector(
                                    unsigned int index,
                                    unsigned int vec[ DIMENSIONS ]
                                );
                            static void vectorToIndex(
                                    const unsigned int vec[ DIMENSIONS ],
                                    unsigned int* index
                                );
                            static bool determineAxis(
                                    unsigned int vf[ DIMENSIONS ],
                                    unsigned int vt[ DIMENSIONS ],
                                    bool wrapping,
                                    unsigned int* axis,
                                    bool* positive
                                );
                    public:
                            CellType& operator [] ( const unsigned int vec[ DIMENSIONS ] );
                            CellType& operator [] ( const unsigned int index );
                            static unsigned int getNeighbors(
                                    unsigned int nn[ 2 * DIMENSIONS ],
                                    unsigned int index,
                                    unsigned int dimensions,
                                    bool wrap = true
                                );
                    private:
                            CellType array[ ARRAY_LEN ];
                    public:
                            static const unsigned int arrayLengths[];
            };
    };
