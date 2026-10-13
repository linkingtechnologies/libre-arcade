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

package fr.uha.ensisa.ir.walther.milcityblue.core;

public class Size
{
	private int sizeX, sizeY;

	public Size(int sizeX, int sizeY)
	{
		super();
		this.sizeX = sizeX;
		this.sizeY = sizeY;
	}

	public int getSizeX()
	{
		return sizeX;
	}

	public void setSizeX(int sizeX)
	{
		this.sizeX = sizeX;
	}

	public int getSizeY()
	{
		return sizeY;
	}

	public void setSizeY(int sizeY)
	{
		this.sizeY = sizeY;
	}
	
	public boolean isFreeAt(Grid grid, int x, int y, int r)
	{
		int count = 0;
		for(int i = x; i < (x+sizeX); ++i)
			for(int j = y; j < (y+sizeY); ++j)
				if(i >= 0 && i < grid.getMaxX() && j >= 0 && j < grid.getMaxY())
					if(grid.getCell(i, j) == Cell.CELL_GRASS)
						++count;
		return (count == (sizeX * sizeY));
	}
	
	public boolean isInGridAt(Grid grid, int x, int y, int r)
	{
		return isInGridAt(grid.getMaxX(), grid.getMaxY(), x, y, r);
	}
	
	public boolean isInGridAt(int maxX, int maxY, int x, int y, int r)
	{
		int count = 0;
		for(int i = x; i < (x+sizeX); ++i)
			for(int j = y; j < (y+sizeY); ++j)
				if(i >= 0 && i < maxX && j >= 0 && j < maxY)
					++count;
		return (count == (sizeX * sizeY));
	}
}
