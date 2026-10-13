/*
 *	MilCity - Blue
 *	Copyright (C) 2010, 2011, Jeremy WALTHER (jeremy.walther@gmail.com)
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.

 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see http://www.gnu.org/licenses/gpl-3.0.html.
 */

package fr.uha.ensisa.ir.walther.milcityblue.core.gridbuilders;

import java.util.Random;

import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;

public class RandomWalker
{
	private int x, y, cellType;
	private Grid grid;
	private Random rand;
	
	public RandomWalker(Grid grid, int cellType)
	{
		this.grid = grid;
		this.cellType = cellType;
		this.rand = new Random();
		//this.x = this.rand.nextInt(grid.getMaxX() / 2) + (grid.getMaxX() / 4);
		//this.y = this.rand.nextInt(grid.getMaxY() / 2) + (grid.getMaxY() / 4);
		this.x = this.rand.nextInt(grid.getMaxX());
		this.y = this.rand.nextInt(grid.getMaxY());
		this.grid.setCell(this.cellType, this.x, this.y);
	}
	
	public void next()
	{
		if(isBlocked())
		{
			boolean shouldRepeat = true;
			int count = 0;
			while(shouldRepeat)
			{
				++count;
				this.x = this.rand.nextInt(grid.getMaxX());
				this.y = this.rand.nextInt(grid.getMaxY());
				shouldRepeat = (this.grid.getCell(this.x, this.y) == this.cellType);
				if(count>10)
					System.out.println("RND:"+count);
			}
		}
		else
		{
			boolean shouldRepeat = true;
			int rnd = 0;
			int lx = this.x, ly = this.y;
			int count = 0;
			while(shouldRepeat)
			{
				++count;
				rnd =  this.rand.nextInt(4);
				switch(rnd)
				{
				case 0	:	if(this.x > 0)
							{
								--this.x;
								shouldRepeat = false;
							}
							break;
				case 1	:	if(this.x < (this.grid.getMaxX() - 1))
							{
								++this.x;
								shouldRepeat = false;
							}
							break;
				case 2	:	if(this.y > 0)
							{
								--this.y;
								shouldRepeat = false;
							}
							break;
				case 3	:	if(this.y < (this.grid.getMaxY() - 1))
							{
								++this.y;
								shouldRepeat = false;
							}
							break;
				}
				if(this.grid.getCell(this.x, this.y) == this.cellType)
				{
					shouldRepeat = true;
					this.x = lx;
					this.y = ly;
					if(count>10)
						System.out.println("SWITCH:"+count+":"+isBlocked()+":"+this.x+":"+this.y+"::"+grid.getCell(x-1,y)+":"+grid.getCell(x+1,y)+":"+grid.getCell(x,y-1)+":"+grid.getCell(x,y+1));
				}
			}
		}
		this.grid.setCell(this.cellType, this.x, this.y);
	}
	
	public boolean isBlocked()
	{
		int count = 0;
		
		if(this.x == 0)
			++count;
		else
			if(this.grid.getCell(this.x - 1, this.y) == this.cellType)
				++count;
		
		if(this.y == 0)
			++count;
		else
			if(this.grid.getCell(this.x, this.y - 1) == this.cellType)
				++count;
		
		if(this.x == (this.grid.getMaxX() - 1))
			++count;
		else
			if(this.grid.getCell(this.x + 1, this.y) == this.cellType)
				++count;
		
		if(this.y == (this.grid.getMaxY() - 1))
			++count;
		else
			if(this.grid.getCell(this.x, this.y + 1) == this.cellType)
				++count;
		
		return (count == 4);
	}
}
