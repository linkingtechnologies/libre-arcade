/*
 *      warboats - A clone of the Battleship(R) board game
 *      AI.c
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

#include "engine.h"
#include "AI.h"

typedef enum state {PRISTINE=0, HIT, SUNK} state;
typedef enum orientation {UNDETERMINED=0, VERTICAL, HORIZONTAL} orientation;

typedef struct storage			/*AI variables*/
{
	int skill;					/*AI skill level*/
	state state[5];				/*state of player ships*/
	int endpoints[5][4];		/*locations of player ships (once found)*/
	orientation orientation[5];
	bool patternLikeParity;		/*which diagonals do we select?*/
} storage;

/**Global Variable**/
storage memory;

/**Function Prototype**/
void placeAIShips(void);

void initAI(int level)			/*initialize AI player*/
{
	int i;
	
	for (i=0; i<5; i++)			/*initialize ships and game state*/
	{
		AI.floating[i] = true;
		AI.ships[i].name = (contents)(i+1);
		AI.ships[i].health =  5-i;
		if (i>=3)
			AI.ships[i].health++;
		memory.state[i]=PRISTINE;
		memory.orientation[i]=UNDETERMINED;
	}
	
	placeAIShips();
	
	memory.skill=level;
	if (level > 3)
		memory.patternLikeParity=RNG(0,1);
}

void placeAIShips(void)			/*randomly place AI ships on the board*/
{
	int i, x, y;
	direction dir;
	bool err;
	
	for (i=0; i<5; i++)
	{
		do {
			x=RNG(0, 9);		/*select an endpoint...*/
			y=RNG(0, 9);
			dir=RNG(0,3);	/*...and a direction*/
			err=placeShip(&AI.ships[i], x, y, dir);	/*then place the ship*/
		} while (err==true);	/*on the board in the chosen location*/
	}

	return;
}

void AIFire(int * x, int * y)	/*select a point to shoot*/
{
	int i, j;
	direction dir;
	bool targeted=false;
	
	do {
		if (memory.skill>1)		/*skill 1 just fires randomly*/
		{
			for (i=4; i>=0; i--)	/*prioritize smaller ships*/
				if (memory.state[i]==HIT)
				{
					j=2*RNG(0,1);	/*select an endpoint on target ship*/
					if (memory.orientation[i]!=UNDETERMINED && memory.skill > 2)
					/*level 3 and up take direction of ships into account*/
					{
						dir=(2*RNG(0,1)+memory.orientation[i])%4;
							/*choose a direction fitting to the known orientation*/
					} else {
						dir=RNG(0,3);	/*choose one of the 4 adjacent points at random*/
					}
					switch (dir) {	/*use the chosen point and direction to fire!*/
						case NORTH:
							*x=memory.endpoints[i][j];
							*y=memory.endpoints[i][1+j]-1;
							break;
						case SOUTH:
							*x=memory.endpoints[i][j];
							*y=memory.endpoints[i][1+j]+1;
							break;
						case WEST:
							*x=memory.endpoints[i][j]-1;
							*y=memory.endpoints[i][1+j];
							break;
						case EAST:
							*x=memory.endpoints[i][j]+1;
							*y=memory.endpoints[i][1+j];
							break;
					}
					targeted=true;
					break;
				}
		}
		if (targeted==false)	/*no previously hit ships to pick on*/
		{
			*x=RNG(0,9);
			*y=RNG(0,9);
			if (memory.skill > 3 && (*x+*y)%2==memory.patternLikeParity)
			{					/*point misses pattern grid (if extant)*/
				*x=*y=-1;		/*set values that will cause another loop*/
			}
		}
	} while (playerBoard[*x][*y].status!=UNKNOWN || *y>9 || *y<0 || *x>9 || *x<0);
	/*shoot only at legal points which have not previously been fired at*/
}

void AIStore(int x, int y, int shipState)
{
	int hitShip, distance;
	
	hitShip=playerBoard[x][y].contents-1;	/*get identity of hit ship*/
	if (memory.state[hitShip]==PRISTINE)	/*it's the first hit on the ship*/
	{
		memory.endpoints[hitShip][0]=x;	/*save the location as both endpoints*/ 
		memory.endpoints[hitShip][1]=y;
		memory.endpoints[hitShip][2]=x;
		memory.endpoints[hitShip][3]=y;
	} else 	if (shipState==HIT)	/*the ship wasn't sunk*/
	{							/*save the new location as an endpoint*/
		distance=memory.endpoints[hitShip][0]-x+memory.endpoints[hitShip][1]-y;
		if (distance==1 || distance==-1)
		{
			memory.endpoints[hitShip][0]=x;
			memory.endpoints[hitShip][1]=y;
		} else
		{
			memory.endpoints[hitShip][2]=x;
			memory.endpoints[hitShip][3]=y;
		}
	}
	if (memory.skill>2 && memory.orientation[hitShip]==UNDETERMINED && memory.state[hitShip]==HIT)
	/*skill is high enough, direction was unknown, and ship is previously hit*/
	{
		if (memory.endpoints[hitShip][0]==memory.endpoints[hitShip][2])
			memory.orientation[hitShip]=VERTICAL;
		else
			memory.orientation[hitShip]=HORIZONTAL;
	}
	memory.state[hitShip]=shipState;		/*store the ship as hit/sunk*/

	return;
}
