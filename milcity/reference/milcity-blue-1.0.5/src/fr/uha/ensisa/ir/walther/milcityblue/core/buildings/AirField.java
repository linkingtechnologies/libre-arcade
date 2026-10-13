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

package fr.uha.ensisa.ir.walther.milcityblue.core.buildings;

import fr.uha.ensisa.ir.walther.milcityblue.core.Building;
import fr.uha.ensisa.ir.walther.milcityblue.core.Cell;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.Weapon;

public class AirField extends Building
{
	public AirField(int x, int y, int r)
	{
		super();
		this.cells.push(new Cell(Cell.CELL_AIRFIELD_1, x, y));
		this.cells.push(new Cell(Cell.CELL_AIRFIELD_2, x, y + 1));
		this.cells.push(new Cell(Cell.CELL_AIRFIELD_3, x, y + 2));
	}
	
	public int getConstructionCost()
	{
		return Config.CONSTRUCTION_COST_AIRFIELD;
	}

	public int getConstructionTime()
	{
		return Config.CONSTRUCTION_TIME_AIRFIELD;
	}

	public int getEnergy()
	{
		return Config.ENERGY_AIRFIELD;
	}

	public int getProductionTime()
	{
		return Config.PRODUCTION_TIME_AIRCRAFT;
	}

	public int getProductionType()
	{
		return Weapon.WEAPON_AIRCRAFT;
	}

	public Size getSize()
	{
		return new Size(Building.SIZE_AIRFIELD_X, Building.SIZE_AIRFIELD_Y);
	}

	public int getType()
	{
		return Building.BUILDING_AIRFIELD;
	}
}
