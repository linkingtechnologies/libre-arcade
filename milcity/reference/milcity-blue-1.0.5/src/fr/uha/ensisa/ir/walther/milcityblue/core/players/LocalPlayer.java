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

package fr.uha.ensisa.ir.walther.milcityblue.core.players;

import fr.uha.ensisa.ir.walther.milcityblue.core.BuildingsIterator;
import fr.uha.ensisa.ir.walther.milcityblue.core.Game;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerInterface;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.WeaponFactory;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;

public class LocalPlayer extends PlayerAbstract implements PlayerInterface
{
	public LocalPlayer() {}

	public void run()
	{
		while(game.getStatus() == Game.STATUS_PLAY)
		{
			try
			{
				this.computeEnergy(this.grid.getBuildings());
				this.computeAccelerationFactor(this.grid.getBuildings());
				this.computeMoney(this.grid.getBuildings());
				this.updateShields();
				BuildingsIterator it = new BuildingsIterator(this.grid.getBuildings());
				while(it.hasNext())
					it.next().update(this);
				this.hasLoose(this.grid.getBuildings());
				this.hasWon();
				Thread.sleep(1000);
			} 
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}
	
	public void fireOnAnotherPlayer(Command commandFire)
	{
		vibrateOnWeaponExplosion(commandFire.getParameter(0));
		super.fireOnAnotherPlayer(commandFire);
	}
	
	public void fire(Command commandFire)
	{
		vibrateOnWeaponExplosion(commandFire.getParameter(0));
		super.fire(commandFire);
	}
	
	private void vibrateOnWeaponExplosion(int weaponType)
	{
		grid.getWeaponFactory();
		Size size = WeaponFactory.getSizeOfWeapon(weaponType);
		game.vibrate(size.getSizeX() * size.getSizeY() * 100);
	}
}
