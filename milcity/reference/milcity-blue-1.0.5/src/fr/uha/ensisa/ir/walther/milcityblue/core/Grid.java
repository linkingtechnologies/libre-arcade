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

public class Grid
{
	private int[][] grid;
	private Buildings buildings;
	private int maxX, maxY;
	private BuildingFactory buildingFactory;
	private WeaponFactory weaponFactory;
	private Cells shieldedCells;
	
	public Grid(int x, int y, int cellType)
	{
		this.grid = new int[x][y];
		for(int i = 0; i < x; ++i)
			for(int j = 0; j < y; ++j)
				this.grid[i][j] = cellType;
		this.buildings = new Buildings();
		this.maxX = x;
		this.maxY = y;
		this.buildingFactory = new BuildingFactory(this);
		this.weaponFactory = new WeaponFactory(this);
		this.shieldedCells = new Cells();
	}
	
	public Grid(int x, int y, int[][] grid)
	{
		this.grid = new int[x][y];
		for(int i = 0; i < x; ++i)
			for(int j = 0; j < y; ++j)
				this.grid[i][j] = grid[i][j];
		this.buildings = new Buildings();
		this.maxX = x;
		this.maxY = y;
		this.buildingFactory = new BuildingFactory(this);
		this.weaponFactory = new WeaponFactory(this);
		this.shieldedCells = new Cells();
	}
	
	public void setCell(int type, int x, int y)
	{
		if(x >= 0 && x < maxX && y >= 0 && y < maxY)
			this.grid[x][y] = type;
	}
	
	public int getCell(int x, int y)
	{
		if(x >= 0 && x < maxX && y >= 0 && y < maxY)
			return this.grid[x][y];
		return Cell.CELL_EMPTY;
	}
	
	/*public boolean canConstruct(Building building)
	{
		if(building == null)
			return false;
		CellsIterator it = new CellsIterator(building.getCells());
		boolean canConstruct = true;
		while(it.hasNext() && canConstruct)
		{
			Cell cell = it.next();
			canConstruct = 	this.grid[cell.getX()][cell.getY()] != Cell.CELL_WATER
							&& this.grid[cell.getX()][cell.getY()] < Cell.CELL_MISSILESILO;
		}
		return canConstruct;
	}*/
	
	private boolean construct(Building building)
	{
		//if(this.canConstruct(building))
		this.buildings.push(building);
		CellsIterator it = new CellsIterator(building.getCells());
		while (it.hasNext())
		{
			Cell cell = it.next();
			setCell(Cell.CELL_CONSTRUCTION, cell.getX(), cell.getY());
		}
		return true;
	}
	
	public boolean construct(int type, int x, int y, int r)
	{
		Building building = this.buildingFactory.createBuilding(type, x, y, r);
		if(building == null)
			return false;
		return construct(building);
	}
	
	/*public boolean fire(int type, int x, int y, int r)
	{
		Weapon weapon = this.weaponFactory.createWeapon(type, x, y, r);
		if(weapon == null)
			return false;
		CellsIterator it = new CellsIterator(weapon.getCells());
		while (it.hasNext())
		{
			Cell cell = it.next();
			this.setCell(Cell.CELL_DESTROYED, x, y);
		}
		return true;
	}*/
	
	public boolean isHit(int x, int y)
	{
		if (this.grid[x][y] != Cell.CELL_WATER && this.grid[x][y] > 0
			&& this.grid[x][y] != Cell.CELL_DESTROYED && this.grid[x][y] != Cell.CELL_BURNING)
		{
			//this.grid[x][y] = Cell.CELL_DESTROYED;
			return this.buildings.isHit(x, y);
		}
		return false;
	}
	
	public int countBuildingsType(int type)
	{
		int count = 0;
		BuildingsIterator it = new BuildingsIterator(this.buildings);
		while(it.hasNext())
		{
			Building building = it.next();
			if(building.getType() == type && !building.isDestroyed())
				++count;
		}
		return count;
	}

	public int getMaxX()
	{
		return maxX;
	}

	public int getMaxY()
	{
		return maxY;
	}
	
	public String toWaterAndGrassMap()
	{
		StringBuffer tmp = new StringBuffer();
		for(int y = 0; y < maxY; ++y)
		{
			for(int x = 0; x <maxX; ++x)
			{
				switch(grid[x][y])
				{
				case Cell.CELL_WATER	:	tmp.append('~'); break;
				case Cell.CELL_GRASS	:	tmp.append('#'); break;
				default					:	tmp.append('?'); break;
				}
			}
			tmp.append("\n");
		}
		return tmp.toString();
	}

	public int[][] getGrid()
	{
		return grid;
	}

	public Buildings getBuildings()
	{
		return buildings;
	}

	public BuildingFactory getBuildingFactory()
	{
		return buildingFactory;
	}

	public WeaponFactory getWeaponFactory()
	{
		return weaponFactory;
	}

	public Cells getShieldedCells()
	{
		return shieldedCells;
	}

	public void setShieldedCells(Cells shieldedCells)
	{
		this.shieldedCells = shieldedCells;
	}
}
