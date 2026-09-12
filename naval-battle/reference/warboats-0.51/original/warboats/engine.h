#ifndef ENGINE_H
#define ENGINE_H

/*
 *      engine.h
 *      Header to include in all warboats source files. Contains
 * 		all UI-independant game-driving functions.
 */

#include <stdlib.h>
#include <time.h>

typedef enum bool {false=0, true=1} bool;
typedef enum contents {EMPTY=0, CARRIER, BATTLESHIP, DESTROYER, SUBMARINE, PT_BOAT} contents;
typedef enum status {UNKNOWN=0, KNOWN} status;
typedef enum direction {EAST=0, NORTH, WEST, SOUTH} direction;

typedef struct ship {
	contents name;			/*type of ship*/
	int location[2];		/*space to store the ship's anchor point*/
	direction direction;	/*which way is the ship going?*/
	int health;				/*number of remaining hits - at 0 the ship sinks*/
} ship;

typedef struct player {
	ship ships[5];			/*space to hold player's ships*/
	bool floating[5];
} player;

typedef struct space {
	contents contents;
	status status;
} space;

/**Global Variables**/
space playerBoard[10][10];
space opponentBoard[10][10];
player local;
player * opponent;			/*dummy pointer to either AI or remote*/
bool isLocalTurn;			/*action token*/
/**End Globals**/

/**Function Prototypes**/
void initBoards(void);
void initPlayer(void);
int placeShip(ship * sh, int x, int y, direction dir);
int checkHit(int x, int y);
int RNG(int low, int high);
/**End Prototypes**/

#endif
