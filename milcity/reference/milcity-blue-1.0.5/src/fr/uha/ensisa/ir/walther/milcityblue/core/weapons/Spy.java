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

package fr.uha.ensisa.ir.walther.milcityblue.core.weapons;

import fr.uha.ensisa.ir.walther.milcityblue.core.Cell;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.Weapon;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Commands;

public class Spy extends Weapon
{

	public Spy(int x, int y, int r)
	{
		super(x, y, r);
	}

	public Size getSize()
	{
		return new Size(Weapon.SIZE_SPY_X, Weapon.SIZE_SPY_Y);
	}
	
	public Commands makeEffect(PlayerAbstract player, int playerSenderIndex)
	{
		Commands commands = new Commands();
		for(int y = y0; y < (y0 + getSize().getSizeY()); ++y)
			for(int x = x0; x < (x0 + getSize().getSizeX()); ++x)
			{
				int type = player.getGrid().getCell(x, y);
				if(type < Cell.CELL_EMPTY)
					type = Cell.CELL_SHIELDED;
				int[] params = {type, x, y};
				commands.push(new Command(player.getPlayerIndex(), playerSenderIndex, Command.COMMAND_DISCOVER, params));
			}
		return commands;
	}
}
