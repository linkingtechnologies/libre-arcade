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
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.Weapon;

public class Commercial extends Building
{
	public Commercial(int x, int y, int r)
	{
		super();
		this.cells.push(new Cell(Cell.CELL_COMMERCIAL, x, y));
	}
	
	public void update(PlayerAbstract player)
	{
		if(player.getAccelerationFactor() > 0)
		{
			if(this.state != Building.STATE_DESTROYED)
			{
				long currentTime = System.currentTimeMillis();
				if((currentTime - this.updatedOn) >= (1000 * getProductionTime()))
				{
					this.updatedOn = currentTime;
					if(this.state == Building.STATE_OPERATIONAL)
						player.updateProduction(this);
				}
				if(this.state == Building.STATE_CONSTRUCTION)
					if((currentTime - this.createdOn) >= (1000 * getConstructionTime()))
					{
						this.state = Building.STATE_OPERATIONAL;
						player.updateConstruction(this);
					}
			}
		}
		else
			super.update(player);
	}
	
	public int getConstructionCost()
	{
		return Config.CONSTRUCTION_COST_COMMERCIAL;
	}

	public int getConstructionTime()
	{
		return Config.CONSTRUCTION_TIME_COMMERCIAL;
	}

	public int getEnergy()
	{
		return Config.ENERGY_COMMERCIAL;
	}

	public int getProductionTime()
	{
		return Config.PRODUCTION_TIME_NULL;
	}

	public int getProductionType()
	{
		return Weapon.WEAPON_NULL;
	}

	public Size getSize()
	{
		return new Size(Building.SIZE_COMMERCIAL_X, Building.SIZE_COMMERCIAL_Y);
	}

	public int getType()
	{
		return Building.BUILDING_COMMERCIAL;
	}
}
