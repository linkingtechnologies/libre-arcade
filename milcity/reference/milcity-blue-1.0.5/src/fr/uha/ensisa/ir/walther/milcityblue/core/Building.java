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

public abstract class Building
{
	public static final int BUILDING_NULL = 100;
	public static final int BUILDING_MISSILESILO = 101;
	public static final int BUILDING_SHIELDGENERATOR = 102;
	public static final int BUILDING_POWERPLANT = 103;
	public static final int BUILDING_AIRFIELD = 104;
	public static final int BUILDING_LABORATORY = 105;
	public static final int BUILDING_FACTORY = 106;
	public static final int BUILDING_HOUSE = 107;
	public static final int BUILDING_COMMERCIAL = 108;
	public static final int BUILDING_NUKESILO = 109;
	
	public static final int ANGLE_0 = 0;
	public static final int ANGLE_90 = 90;
	public static final int ANGLE_180 = 180;
	public static final int ANGLE_270 = 270;
	
	public static final int STATE_CONSTRUCTION = 0;
	public static final int STATE_OPERATIONAL = 1;
	public static final int STATE_DESTROYED = 2;
	
	public static final int SIZE_MISSILESILO_X = 1;
	public static final int SIZE_MISSILESILO_Y = 1;
	public static final int SIZE_SHIELDGENERATOR_X = 1;
	public static final int SIZE_SHIELDGENERATOR_Y = 1;
	public static final int SIZE_POWERPLANT_X = 2;
	public static final int SIZE_POWERPLANT_Y = 1;
	public static final int SIZE_AIRFIELD_X = 1;
	public static final int SIZE_AIRFIELD_Y = 3;
	public static final int SIZE_LABORATORY_X = 2;
	public static final int SIZE_LABORATORY_Y = 1;
	public static final int SIZE_FACTORY_X = 2;
	public static final int SIZE_FACTORY_Y = 2;
	public static final int SIZE_HOUSE_X = 1;
	public static final int SIZE_HOUSE_Y = 1;
	public static final int SIZE_COMMERCIAL_X = 1;
	public static final int SIZE_COMMERCIAL_Y = 1;
	public static final int SIZE_NUKESILO_X = 3;
	public static final int SIZE_NUKESILO_Y = 3;
	
	protected Cells cells;
	protected int state;
	protected long createdOn, updatedOn;
	
	public Building()
	{
		this.cells = new Cells();
		this.state = Building.STATE_CONSTRUCTION;
		this.createdOn = System.currentTimeMillis();
		this.updatedOn = System.currentTimeMillis();
	}
	
	public void update(PlayerAbstract player)
	{
		if(this.state != Building.STATE_DESTROYED)
		{
			long currentTime = System.currentTimeMillis();
			if((currentTime - this.updatedOn) >= ((1000 * getProductionTime()) - (10 * getProductionTime() * player.getAccelerationFactor())))
			{
				this.updatedOn = currentTime;
				if(this.state == Building.STATE_OPERATIONAL)
					player.updateProduction(this);
			}
			if(this.state == Building.STATE_CONSTRUCTION)
				if((currentTime - this.createdOn) >= ((1000 * getConstructionTime()) - (10 * getConstructionTime() * player.getAccelerationFactor())))
				{
					this.state = Building.STATE_OPERATIONAL;
					player.updateConstruction(this);
				}
		}
	}
	
	public boolean isHit(int x, int y)
	{
		return this.cells.isHit(x, y);
	}
	
	public boolean isDestroyed()
	{
		if(this.cells.isDestroyed())
		{
			this.state = Building.STATE_DESTROYED;
			return true;
		}
		return false;
	}
	
	public Grid draw(Grid grid)
	{
		CellsIterator it = new CellsIterator(this.cells);
		while(it.hasNext())
		{
			Cell cell = it.next();
			grid.setCell(cell.getType(), cell.getX(), cell.getY());
		}
		return grid;
	}
	
	public Cells getCells()
	{
		return this.cells;
	}
	
	public int getState()
	{
		if(this.state != Building.STATE_DESTROYED)
			isDestroyed();
		return this.state;
	}
	
	public void setState(int state)
	{
		this.state = state;
	}
	
	public long getCreatedOn()
	{
		return createdOn;
	}

	public void setCreatedOn(long createdOn)
	{
		this.createdOn = createdOn;
	}

	public long getUpdatedOn()
	{
		return updatedOn;
	}

	public void setUpdatedOn(long updatedOn)
	{
		this.updatedOn = updatedOn;
	}

	public abstract int getType();
	public abstract int getEnergy();
	public abstract int getConstructionTime();
	public abstract int getConstructionCost();
	public abstract int getProductionType();
	public abstract int getProductionTime();
	public abstract Size getSize();
}
