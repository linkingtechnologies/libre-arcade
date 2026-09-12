#ifndef AI_H
#define AI_H

/*
 *      AI.h
 *      Header to include in all warboats source files where AI 
 * 		functionality is desired. Contains all world-visible AI
 * 		functions and variables.
 */

#define MAX_AI_SKILL 4		/*highest implemented difficulty level*/

/**Global Variable**/
player AI;

/**Function Prototypes**/
void initAI(int level);
void AIFire(int * x, int * y);
void AIStore(int x, int y, int shipState);
/**End Prototypes**/

#endif
