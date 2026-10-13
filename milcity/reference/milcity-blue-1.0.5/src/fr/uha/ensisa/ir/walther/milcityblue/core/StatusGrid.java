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
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.CommandsIterator;

public class StatusGrid
{
	public static final byte STATUS_WATER = 0;
	public static final byte STATUS_GROUND = 1;
	public static final byte STATUS_BUILDINGHIT = 2;
	public static final byte STATUS_BUILDINGDESTROYED = 3;
	public static final byte STATUS_BUILDINGDISCOVERED = 4;
	public static final byte STATUS_CELLHIT_MAX = -1;
	public static final byte STATUS_CELLHIT_MIN = -128;
	
	private byte[][] grid;
	private int playerIndex;
	private Game game;
	private int maxX, maxY;
	
	public StatusGrid(int playerIndex, Grid grid, Game game)
	{
		this.playerIndex = playerIndex;
		this.grid = new byte[grid.getMaxX()][grid.getMaxY()];
		this.game = game;
		this.maxX = grid.getMaxX();
		this.maxY = grid.getMaxY();
		this.update(grid);
	}
	
	public void update(Grid grid)
	{
		if((maxX == grid.getMaxX()) && (maxY == grid.getMaxY()))
			for (int y = 0; y < maxY; ++y)
				for (int x = 0; x < maxX; ++x)
					if (grid.getCell(x, y) == Cell.CELL_WATER)
						this.grid[x][y] = StatusGrid.STATUS_WATER;
					else
						this.grid[x][y] = StatusGrid.STATUS_GROUND;
	}
	
	public void update(Commands commands)
	{
		CommandsIterator it = new CommandsIterator(commands);
		while (it.hasNext())
			update(it.next());
	}
	
	public void update(Command command)
	{
		if(playerIndex == command.getPlayerSender())
		{
			System.out.println("StatusGrid of player number " + playerIndex + " updated");
			switch(command.getCommandType())
			{
			case Command.COMMAND_HIT		:	if(command.getParameter(1) == Building.BUILDING_NULL)
													this.grid[command.getParameter(2)][command.getParameter(3)] = StatusGrid.STATUS_CELLHIT_MAX;
												else
													if(this.grid[command.getParameter(2)][command.getParameter(3)] != StatusGrid.STATUS_BUILDINGHIT)
													{
														this.grid[command.getParameter(2)][command.getParameter(3)] = StatusGrid.STATUS_BUILDINGHIT;
														int[] params = { Config.SCORE_PER_BUILDING_HIT_CELL };
														// TODO This part is 2-players limited !!
														this.game.execute(new Command(playerIndex, game.getOtherPlayerIndex(playerIndex), Command.COMMAND_ADDSCORE, params));
													}
												break;
			case Command.COMMAND_DESTROYED	:	if(this.grid[command.getParameter(2)][command.getParameter(3)] != StatusGrid.STATUS_BUILDINGDESTROYED)
												{
													this.grid[command.getParameter(2)][command.getParameter(3)] = StatusGrid.STATUS_BUILDINGDESTROYED;
													int[] params = { Config.SCORE_PER_BUILDING_DESTROYED_CELL };
													// TODO This part is 2-players limited !!
													this.game.execute(new Command(playerIndex, game.getOtherPlayerIndex(playerIndex), Command.COMMAND_ADDSCORE, params));
												}
												break;
			case Command.COMMAND_DISCOVER	:	if(((command.getParameter(0) >= Cell.CELL_CONSTRUCTION) && (command.getParameter(0) < Cell.CELL_DESTROYED)) || (command.getParameter(0) == Cell.CELL_SHIELDED))
													if((this.grid[command.getParameter(1)][command.getParameter(2)] != StatusGrid.STATUS_BUILDINGHIT) && (this.grid[command.getParameter(1)][command.getParameter(2)] != StatusGrid.STATUS_BUILDINGDESTROYED))
														this.grid[command.getParameter(1)][command.getParameter(2)] = StatusGrid.STATUS_BUILDINGDISCOVERED;
												break;
			}
		}
		else
			System.out.println("StatusGrid of player number " + playerIndex + " not updating because command is addressed to player number " + command.getPlayerSender());
	}
	
	public byte[][] getStatusGrid()
	{
		return grid;
	}
	
	public int getMaxX()
	{
		return maxX;
	}
	
	public int getMaxY()
	{
		return maxY;
	}
	
	public byte getCellStatusAt(int x, int y)
	{
		if((x >= 0) && (x < maxX) && (y >= 0) && (y < maxY))
			return grid[x][y];
		return StatusGrid.STATUS_WATER;
	}
	
	public void decrementCellHitAt(int x, int y)
	{
		if((x >= 0) && (x < maxX) && (y >= 0) && (y < maxY))
			if(grid[x][y] > StatusGrid.STATUS_CELLHIT_MIN)
				--grid[x][y];
	}

	public int getPlayerIndex()
	{
		return playerIndex;
	}

	public void setPlayerIndex(int playerIndex)
	{
		this.playerIndex = playerIndex;
	}
	
	public String toString()
	{
		StringBuffer tmp = new StringBuffer();
		for(int y = 0; y < maxY; ++y)
		{
			for(int x = 0; x < maxX; ++x)
				tmp.append(grid[x][y]);
			tmp.append('\n');
		}
		return tmp.toString();
	}
}
