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
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.TimedCell;
import fr.uha.ensisa.ir.walther.milcityblue.core.Weapon;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Commands;

public class Shield extends Weapon
{
	public Shield(int x, int y, int r)
	{
		super(x, y, r);
	}

	public Size getSize()
	{
		return new Size(Weapon.SIZE_SHIELD_X, Weapon.SIZE_SHIELD_Y);
	}
	
	public Commands makeEffect(PlayerAbstract player, int playerSenderIndex)
	{
		int type = 0;
		for(int y = y0; y < (y0 + getSize().getSizeY()); ++y)
			for(int x = x0; x < (x0 + getSize().getSizeX()); ++x)
				if((type = player.getGrid().getCell(x, y)) > 0)
					if(type != Cell.CELL_SHIELDGENERATOR && type != Cell.CELL_WATER)
					{
						player.getGrid().setCell(-type , x, y);
						player.getGrid().getShieldedCells().push(new TimedCell(type, x, y, Config.PRODUCTION_TIME_SHIELD));
					}
		return new Commands();
	}
}
