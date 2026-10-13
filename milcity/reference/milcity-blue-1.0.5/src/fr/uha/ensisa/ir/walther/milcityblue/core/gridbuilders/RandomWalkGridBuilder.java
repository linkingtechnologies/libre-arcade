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

import java.util.Vector;

import fr.uha.ensisa.ir.walther.milcityblue.core.Cell;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.GridBuilder;

public class RandomWalkGridBuilder extends GridBuilder
{
	public Grid build(int x, int y, double water)
	{
		Grid grid = new Grid(x, y, Cell.CELL_WATER);
		Vector randomWalkers = new Vector(10);
		for(int i = 0; i < 10; ++i)
			randomWalkers.addElement(new RandomWalker(grid, Cell.CELL_GRASS));
		while (getWaterPercent(grid) > water)
		{
			System.out.println(getWaterPercent(grid));
			for(int i = 0; i < 10; ++i)
				((RandomWalker) randomWalkers.elementAt(i)).next();
		}
		return grid;
	}
}
