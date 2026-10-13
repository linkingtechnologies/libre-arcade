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

public class Cell
{
	public static final int CELL_EMPTY = 0;
	public static final int CELL_WATER = 1;
	public static final int CELL_GRASS = 2;
	public static final int CELL_CONSTRUCTION = 3;
	public static final int CELL_MISSILESILO = 4;
	public static final int CELL_SHIELDGENERATOR = 5;
	public static final int CELL_POWERPLANT_1 = 6;
	public static final int CELL_POWERPLANT_2 = 7;
	public static final int CELL_AIRFIELD_1 = 8;
	public static final int CELL_AIRFIELD_2 = 9;
	public static final int CELL_AIRFIELD_3 = 10;
	public static final int CELL_LABORATORY_1 = 11;
	public static final int CELL_LABORATORY_2 = 12;
	public static final int CELL_FACTORY_1 = 13;
	public static final int CELL_FACTORY_2 = 14;
	public static final int CELL_FACTORY_3 = 15;
	public static final int CELL_FACTORY_4 = 16;
	public static final int CELL_HOUSE = 17;
	public static final int CELL_NUKESILO_1 = 18;
	public static final int CELL_NUKESILO_2 = 19;
	public static final int CELL_NUKESILO_3 = 20;
	public static final int CELL_NUKESILO_4 = 21;
	public static final int CELL_NUKESILO_5 = 22;
	public static final int CELL_NUKESILO_6 = 23;
	public static final int CELL_NUKESILO_7 = 24;
	public static final int CELL_NUKESILO_8 = 25;
	public static final int CELL_NUKESILO_9 = 26;
	public static final int CELL_COMMERCIAL = 27;
	public static final int CELL_DESTROYED = 28;
	public static final int CELL_BURNING = 29;
	public static final int CELL_EXPLOSION_1 = 30;
	public static final int CELL_EXPLOSION_2 = 31;
	public static final int CELL_EXPLOSION_3 = 32;
	public static final int CELL_EXPLOSION_4 = 33;
	public static final int CELL_EXPLOSION_5 = 34;
	public static final int CELL_SHIELDED = 255; // this is only for fucking bluetooth ...
	
	private int type;
	private int x;
	private int y;
	
	public Cell(int type, int x, int y)
	{
		this.type = type;
		this.x = x;
		this.y = y;
	}
	
	public boolean isHit(int x, int y)
	{
		if((this.x == x) && (this.y == y))
			return this.hit(x, y);
		return false;
	}
	
	public boolean isDestroyed()
	{
		return (this.type >= Cell.CELL_DESTROYED);
	}
	
	public boolean hit(int x, int y)
	{
		if(isDestroyed())
			return true;
		if((this.x == x) && (this.y == y))
		{
			this.type = Cell.CELL_BURNING;
			return true;
		}
		return false;
	}

	public int getType()
	{
		return type;
	}

	public void setType(int type)
	{
		this.type = type;
	}

	public int getX()
	{
		return x;
	}

	public void setX(int x)
	{
		this.x = x;
	}

	public int getY()
	{
		return y;
	}

	public void setY(int y)
	{
		this.y = y;
	}
}
