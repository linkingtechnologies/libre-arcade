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

import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.AirField;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.Commercial;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.Factory;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.House;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.Laboratory;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.MissileSilo;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.NukeSilo;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.PowerPlant;
import fr.uha.ensisa.ir.walther.milcityblue.core.buildings.ShieldGenerator;

public class BuildingFactory
{
	private Grid grid;
	
	public BuildingFactory(Grid grid)
	{
		this.grid = grid;
	}
	
	public boolean canCreateBuilding(int type, int x, int y, int r)
	{
		Building building = typeToBuilding(type, x, y, r);
		return canCreateBuilding(building, x, y, r);
	}
	
	public boolean canCreateBuilding(Building building, int x, int y, int r)
	{
		return building.getSize().isFreeAt(this.grid, x, y, r);
	}
	
	public Building createBuilding(int type, int x, int y, int r)
	{
		Building building = typeToBuilding(type, x, y, r);
		if(building == null)
		{
			System.out.println("Unreconized building #"+type);
			return null;
		}
		if(!canCreateBuilding(building, x, y, r))
		{
			System.out.println("Cannot create here");
			return null;
		}
		return building;
	}
	
	private Building typeToBuilding(int type, int x, int y, int r)
	{
		switch(type)
		{
		case Building.BUILDING_MISSILESILO		: return new MissileSilo(x, y, r);
		case Building.BUILDING_SHIELDGENERATOR	: return new ShieldGenerator(x, y, r);
		case Building.BUILDING_POWERPLANT		: return new PowerPlant(x, y, r);
		case Building.BUILDING_AIRFIELD			: return new AirField(x, y, r);
		case Building.BUILDING_LABORATORY		: return new Laboratory(x, y, r);
		case Building.BUILDING_FACTORY			: return new Factory(x, y, r);
		case Building.BUILDING_HOUSE			: return new House(x, y, r);
		case Building.BUILDING_COMMERCIAL		: return new Commercial(x, y, r);
		case Building.BUILDING_NUKESILO			: return new NukeSilo(x, y, r);
		}
		System.out.println("Unreconized building #"+type);
		return null;
	}
	
	public Size getSizeOfBuilding(int type)
	{
		return typeToBuilding(type, 0, 0, 0).getSize();
	}
	
	public int getCostOfBuilding(int type)
	{
		return typeToBuilding(type, 0, 0, 0).getConstructionCost();
	}
	
	public int getEnergyOfBuilding(int type)
	{
		return typeToBuilding(type, 0, 0, 0).getEnergy();
	}
}
