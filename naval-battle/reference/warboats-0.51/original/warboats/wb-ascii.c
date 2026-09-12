/*
 *      warboats - A clone of the Battleship(R) board game
 * 		wb-ascii.c     
 * 
 *      Copyright 2009 Trevor Chart <trevor.chart@gmail.com>
 *      
 *      This program is free software; you can redistribute it and/or modify
 *      it under the terms of the GNU General Public License as published by
 *      the Free Software Foundation; either version 2 of the License, or
 *      (at your option) any later version.
 *      
 *      This program is distributed in the hope that it will be useful,
 *      but WITHOUT ANY WARRANTY; without even the implied warranty of
 *      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *      GNU General Public License for more details.
 *      
 *      You should have received a copy of the GNU General Public License
 *      along with this program; if not, write to the Free Software
 *      Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 *      MA 02110-1301, USA.
 */

#define ENABLE_AI_PLAYER		/*comment to remove computer player*/

#include <stdio.h>
#include "engine.h"
#ifdef ENABLE_AI_PLAYER
#include "AI.h"
#endif

#define CLEAR_INPUT_BUFFER {char ch; while((ch=getchar()) != '\n' && ch != EOF);}

/**Function Prototypes**/
void initOpponent(void);
void placeLocalShips(void);
void getShipPlacement(int * x, int * y, direction * dir);
void takeTurn();
void opponentFire(int * x, int * y);
int translate(char row);
char backTranslate(int row);
void drawBoard(bool showHidden);
/**End Prototypes**/

int main(void)
{
	int i;
	bool localAlive, opponentAlive;
	
	/*seed the RNG so that it's closer to random*/
	srand(time(NULL));
	
	printf("Welcome to Warboats!\n\n");
	
	/*initialize lots of stuff*/
	initBoards();
	initPlayer();
	placeLocalShips();
	initOpponent();
	
	/*randomly choose a player to start*/
	isLocalTurn=RNG(0,1);
	printf("You will go ");
	if (isLocalTurn)
		printf("first\n");
	else
		printf("second\n");
	do {				/*loops while both players have at least one ship*/
		localAlive=opponentAlive=false;
		takeTurn();
		isLocalTurn=(isLocalTurn+1)%2;
		for (i=0; i<5; i++)
		{
			if (local.floating[i])
				localAlive=true;
			if (opponent->floating[i])
				opponentAlive=true;
		}
	} while (localAlive && opponentAlive);
	
	drawBoard(true);	/*draw end-of-game board*/
	
	if (localAlive)
		printf("You won!\n");
	else
		printf("You lost.\n");
	return 0;
}

void initOpponent(void)
{
	int level;

	isLocalTurn=false;
#ifdef ENABLE_AI_PLAYER
	do {
		printf("Please input a skill level for the computer player [1-%i]", MAX_AI_SKILL);
		scanf("%i", &level);	/*with increasing level, AI acts more methodically*/
		CLEAR_INPUT_BUFFER;
	} while (level < 1 || level > MAX_AI_SKILL);
	initAI(level);
	opponent=&AI;
#endif
	printf("Your opponent is ready\n");
	return;
}

void placeLocalShips(void)
{
	int x, y;
	direction dir;
	bool err;
	
	printf("for each ship, input a location (row, column) and a direction\n (North, South, East, or West\n");
	isLocalTurn=true;
	do {
		drawBoard(false);
		printf("Please place your carrier\n");
		getShipPlacement(&x, &y, &dir);
		err=placeShip(&local.ships[CARRIER-1], x, y, dir);
	} while (err);
	do {
		drawBoard(false);
		printf("Please place your battleship\n");
		getShipPlacement(&x, &y, &dir);
		err=placeShip(&local.ships[BATTLESHIP-1], x, y, dir);
	} while (err);
	do {
		drawBoard(false);
		printf("Please place your destroyer\n");
		getShipPlacement(&x, &y, &dir);
		err=placeShip(&local.ships[DESTROYER-1], x, y, dir);
	} while (err);
	do {
		drawBoard(false);
		printf("Please place your submarine\n");
		getShipPlacement(&x, &y, &dir);
		err=placeShip(&local.ships[SUBMARINE-1], x, y, dir);
	} while (err);
	do {
		drawBoard(false);
		printf("Please place your PT boat\n");
		getShipPlacement(&x, &y, &dir);
		err=placeShip(&local.ships[PT_BOAT-1], x, y, dir);
	} while (err);
	return;
}

void getShipPlacement(int * x, int * y, direction * dir)
{
	char y_char, dir_char;
	bool err;
	
	do {
		err=false;
		printf("Row [A-J]:");
		scanf("%c", &y_char);
		*y=translate(y_char);
		if (*y < 0 || *y > 9)
		{
			err=true;
			printf("Bad row value\n");
		}
	} while (err);
	do {
		err=false;
		printf("Column [1-10]:");
		scanf("%i", x);
		(*x)--;
		if (*x < 0 || *x > 9)
		{
			err=true;
			printf("Bad column value\n");
		}
	} while (err);
	do {
		err=false;
		printf("Direction [NSEW]:");
		scanf("%c", &dir_char);
		CLEAR_INPUT_BUFFER;
		switch (dir_char) {
			case 'N':
			case 'n':
				*dir=NORTH;
				break;
			case 'S':
			case 's':
				*dir=SOUTH;
				break;
			case 'E':
			case 'e':
				*dir=EAST;
				break;
			case 'W':
			case 'w':
				*dir=WEST;
				break;
			default:
				err=true;
				printf("Bad direction value\n");
				break;
		}
	} while (err);
	return;
}

void takeTurn(void)		/*move through a single turn*/
{
	int x,y;
	char a;
	int result;
	space (*board)[10];
	
	drawBoard(false);

	if (isLocalTurn)
	{
		do {
			printf("Where would you  like to fire [Row][Column]?\n");
			scanf("%c%d", &a, &x);
			CLEAR_INPUT_BUFFER;
			x--;
			y=translate(a);
		} while (x<0 || x>9 || y<0 ||y>9);
	} else
	{
		opponentFire(&x, &y);
	}
	result=checkHit(x, y);
	printf("%i\n", result);
	if (result>0)
	{
		printf("Hit!\n");
#ifdef ENABLE_AI_PLAYER
		if (opponent==&AI && isLocalTurn==false)
			AIStore(x, y, result);
#endif
	}
	if (result>1)
	{
		if (isLocalTurn)
			board=opponentBoard;
		else
			board=playerBoard;
		switch (board[x][y].contents) {
			case CARRIER:
				printf("Carrier sunk!\n");
				break;
			case BATTLESHIP:
				printf("Battleship sunk!\n");
				break;
			case DESTROYER:
				printf("Destroyer sunk!\n");
				break;
			case SUBMARINE:
				printf("Submarine sunk!\n");
				break;
			case PT_BOAT:
				printf("PT boat sunk!\n");
				break;
			default:
				break;
		}
	}
	
	return;
}

void opponentFire(int * x, int * y)
{
#ifdef ENABLE_AI_PLAYER
	AIFire(x, y);
#endif
	printf("Your opponent fires at %c%i...\n", backTranslate(*y), 1+*x);
	return;
}

int translate(char row)				/*turn user input char into an int*/
{
	if (row <= 'J' && row >= 'A')
		return (row - 'A');		/*Uppercase A-J --> 0-9*/
	else if (row <= 'j' && row >= 'a')
		return (row - 'a');		/*Lowercase a-j --> 0-9*/
	else
		return -1;		/*bogus value that will result in asking for 'row' again*/
}

char backTranslate(int row)			/*turn int-format rows into letter format*/
{
	return (row + 'A'); 			/*0-9 --> Uppercase A-J*/
}

void drawBoard(bool showHidden)
{
	int i,j,k;
	printf("\n");
	if (showHidden)
		printf("       Opponent's Board           Your Board\n");
	else
		printf("       Your Grid                  Your Board\n");
	printf("   1 2 3 4 5 6 7 8 9 10      1 2 3 4 5 6 7 8 9 10\n");
	for (i=0; i<10; i++)
	{
		printf(" %c ", backTranslate(i));
		for (j=0; j<10; j++)	/*loop over all spaces*/
		{
			if (opponentBoard[j][i].status==KNOWN)
			{
				switch (opponentBoard[j][i].contents) {
					case EMPTY:
						printf("X ");
						break;
					case CARRIER:
						printf("c ");
						break;
					case BATTLESHIP:
						printf("b ");
						break;
					case DESTROYER:
						printf("d ");
						break;
					case SUBMARINE:
						printf("s ");
						break;
					case PT_BOAT:
						printf("p ");
						break;
				}
			} else 
			{
				if (showHidden)
				{
					switch (opponentBoard[j][i].contents) {
						case EMPTY:
							printf("~ ");
							break;
						case CARRIER:
							printf("C ");
							break;
						case BATTLESHIP:
							printf("B ");
							break;
						case DESTROYER:
							printf("D ");
							break;
						case SUBMARINE:
							printf("S ");
							break;
						case PT_BOAT:
							printf("P ");
							break;
					}
				} else
					printf("~ ");
			}
		}
		printf("    %c ", backTranslate(i));
		for (k=0; k<10; k++)
		{
			if (playerBoard[k][i].status==KNOWN)
			{
				switch (playerBoard[k][i].contents) {
					case EMPTY:
						printf("X ");
						break;
					case CARRIER:
						printf("c ");
						break;
					case BATTLESHIP:
						printf("b ");
						break;
					case DESTROYER:
						printf("d ");
						break;
					case SUBMARINE:
						printf("s ");
						break;
					case PT_BOAT:
						printf("p ");
						break;
				}
			} else
			{
				switch (playerBoard[k][i].contents) {
					case EMPTY:
						printf("~ ");
						break;
					case CARRIER:
						printf("C ");
						break;
					case BATTLESHIP:
						printf("B ");
						break;
					case DESTROYER:
						printf("D ");
						break;
					case SUBMARINE:
						printf("S ");
						break;
					case PT_BOAT:
						printf("P ");
						break;
				}
			}
		}
		printf("\n");
	}
	if (showHidden==false)
	{
		printf("\nC/c = Carrier    B/b = Battleship  D/d = Destroyer\n");
		printf("S/s = Submarine  P/p = PT Boat     X = Miss\n");
		printf("Lowercase indicates a \"hit\" portion of the ship\n");
	}
}
