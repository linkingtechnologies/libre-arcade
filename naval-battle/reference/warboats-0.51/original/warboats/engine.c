/*
 *      warboats - A clone of the Battleship(R) board game
 * 
 * 		engine.c
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

void initBoards(void)		/*Initialize player and computer grids*/
{
	int i, j;
	space sp;
	
	sp.status=UNKNOWN;		/*initialize space data*/
	sp.contents=EMPTY;
	for (i=0; i<10; i++)
		for (j=0; j<10; j++)	/*loop over each space*/
		{
			playerBoard[i][j] = sp;
			opponentBoard[i][j] = sp;	/*copy empty space into each board*/
		}
}

void initPlayer(void)		/*initialize player data*/
{
	int i;
	
	for (i=0; i<5; i++)		/*initialize ships*/
	{
		local.floating[i] = true;
		local.ships[i].name = (contents)(i+1);
		local.ships[i].health =  5-i;
		if (i>=3)
			local.ships[i].health++;
	}
}

int placeShip(ship * sh, int x, int y, direction dir)	/*place ship on the board*/
{
	int i, j, test_x=x, test_y=y;
	space (*board)[10];
	
	if (isLocalTurn)
		board=playerBoard;
	else
		board=opponentBoard;
	
	/*First, validate the proposed ship placement*/
	for (i=0; i<sh->health; i++)
	{
		if (test_x<0 || test_x>=10 || test_y<0 || test_y>=10)	/*ship is off-map*/
			return 1;
		
		if (board[test_x][test_y].contents!=EMPTY)	/*ship overlaps another*/
			return 1;
		
		switch (dir) {
			case NORTH:
				test_y--;
				break;
			case SOUTH:
				test_y++;
				break;
			case EAST:
				test_x++;
				break;
			case WEST:
				test_x--;
				break;
		}
	}
	
	sh->location[0]=x;
	sh->location[1]=y;
	sh->direction=dir;
	
	for (j=0; j<sh->health; j++)	/*set the board to show occupancy*/
	{
		board[x][y].contents=sh->name;
		switch (dir) {
			case NORTH:
				y--;
				break;
			case SOUTH:
				y++;
				break;
			case EAST:
				x++;
				break;
			case WEST:
				x--;
				break;
		}
	}
	
	return 0;					/*success!*/
}

int checkHit(int x, int y)		/*Fire! Is it a hit?*/
{
	space (*board)[10];
	player * pl;
	bool hit, sunk;
	
	if (isLocalTurn)
	{
		board=opponentBoard;
		pl=opponent;
	} else
	{
		board=playerBoard;
		pl=&local;
	}
	
	if (board[x][y].contents!=EMPTY)
	{							/*it's a hit!*/
		pl->ships[board[x][y].contents-1].health--;
		hit = true;
		if (pl->ships[board[x][y].contents-1].health==0)
		{
			sunk = true;
			pl->floating[board[x][y].contents-1]=false;
		} else
			sunk = false;
	} else						/*it's a miss*/
		hit = sunk = false;
	
	board[x][y].status=KNOWN;	/*now we know with certainty what's there*/
	return (int)hit+(int)sunk;
}

int RNG(int low, int high)		/*generate a pseudo-random number*/
{
	int z=low + (int) (0.5 + (high-low+1) * (double)rand() / ((double)(RAND_MAX) + 1.0));
	/*adding 0.5 then casting as int implements an approximation of rounding*/
	if (z>high) /*this statement adds uniformity that was destroyed*/
		z=low;	/*by the rounding implementation*/
	return z;
}
