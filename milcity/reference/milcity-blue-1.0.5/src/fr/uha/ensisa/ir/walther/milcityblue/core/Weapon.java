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

import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Commands;

public abstract class Weapon
{
	public static final int WEAPON_NULL = 200;
	public static final int WEAPON_MISSILE = 201;
	public static final int WEAPON_SHIELD = 202;
	public static final int WEAPON_AIRCRAFT = 203;
	public static final int WEAPON_MORTAR = 204;
	public static final int WEAPON_NUKE = 205;
	public static final int WEAPON_SPY = 206;
	
	public static final int SIZE_MISSILE_X = 1;
	public static final int SIZE_MISSILE_Y = 1;
	public static final int SIZE_SHIELD_X = 2;
	public static final int SIZE_SHIELD_Y = 2;
	public static final int SIZE_AIRCRAFT_X = 2;
	public static final int SIZE_AIRCRAFT_Y = 3;
	public static final int SIZE_MORTAR_X = 2;
	public static final int SIZE_MORTAR_Y = 2;
	public static final int SIZE_NUKE_X = 4;
	public static final int SIZE_NUKE_Y = 4;
	public static final int SIZE_SPY_X = 3;
	public static final int SIZE_SPY_Y = 3;
	
	public static final int STATE_LAUNCHED = 0;
	public static final int STATE_EXPLOSION = 1;
	public static final int STATE_TERMINATED = 2;
	
	public static final int CELL_UNCHANGED = 0;
	public static final int CELL_GROUNDHIT = 1;
	public static final int CELL_BUILDINGHIT = 2;
	public static final int CELL_BUILDINGDESTROYED = 3;
	
	protected Cells cells;
	protected int state;
	protected long createdOn, updatedOn;
	protected int x0, y0, r0;
	
	public Weapon(int x, int y, int r)
	{
		this.cells = Cells.createCells(getSize(), Cell.CELL_BURNING, x, y, r);
		this.state = Weapon.STATE_LAUNCHED;
		this.createdOn = System.currentTimeMillis();
		this.updatedOn = System.currentTimeMillis();
		this.x0 = x;
		this.y0 = y;
		this.r0 = r;
	}
	
	public Cells getCells()
	{
		return this.cells;
	}
	
	public Commands makeEffect(PlayerAbstract player, int playerSenderIndex)
	{
		Commands commands = new Commands();
		int type = 0;
		BuildingsIterator itBuildings;
		CellsIterator itCells;
		Building building;
		Cell cell;
		boolean isMissed = true;
		for(int y = y0; y < (y0 + getSize().getSizeY()); ++y)
			for(int x = x0; x < (x0 + getSize().getSizeX()); ++x)
			{
				type = player.getGrid().getCell(x, y);
				if(type != Cell.CELL_WATER)
				{
					isMissed = true;
					if(type > 0)
					{
						//player.getGrid().setCell(Cell.CELL_DESTROYED, x, y);
						player.getGrid().setCell(Cell.CELL_EXPLOSION_1, x, y);
						itBuildings = new BuildingsIterator(player.getGrid().getBuildings());
						while(itBuildings.hasNext())
						{
							building = itBuildings.next();
							if(building.isHit(x, y))
							{
								int[] params = {playerSenderIndex, building.getType(), x, y};
								commands.push(new Command(player.getPlayerIndex(), Command.TARGET_ALL, Command.COMMAND_HIT, params));
								isMissed = false;
								if(building.isDestroyed())
								{
									itCells = new CellsIterator(building.getCells());
									while(itCells.hasNext())
									{
										cell = itCells.next();
										int[] params2 = {playerSenderIndex, building.getType(), cell.getX(), cell.getY()};
										commands.push(new Command(player.getPlayerIndex(), Command.TARGET_ALL, Command.COMMAND_DESTROYED, params2));
									}
									itCells = null;
									isMissed = false;
								}
							}
						}
						
					}
					if(isMissed)
					{
						int[] params = {playerSenderIndex, Building.BUILDING_NULL, x, y};
						commands.push(new Command(player.getPlayerIndex(), Command.TARGET_ALL, Command.COMMAND_HIT, params));
					}
				}
			}
		return commands;
	}
	
	public abstract Size getSize();
}
