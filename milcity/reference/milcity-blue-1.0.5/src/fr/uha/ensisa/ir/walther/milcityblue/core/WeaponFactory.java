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

import fr.uha.ensisa.ir.walther.milcityblue.core.weapons.Aircraft;
import fr.uha.ensisa.ir.walther.milcityblue.core.weapons.Missile;
import fr.uha.ensisa.ir.walther.milcityblue.core.weapons.Mortar;
import fr.uha.ensisa.ir.walther.milcityblue.core.weapons.Nuke;
import fr.uha.ensisa.ir.walther.milcityblue.core.weapons.Shield;
import fr.uha.ensisa.ir.walther.milcityblue.core.weapons.Spy;

public class WeaponFactory
{
	private Grid grid;

	public WeaponFactory(Grid grid)
	{
		super();
		this.grid = grid;
	}
	
	public boolean canCreateWeapon(int type, int x, int y, int r)
	{
		Weapon weapon = typeToWeapon(type, x, y, r);
		return canCreateWeapon(weapon, x, y, r);
	}
	
	public boolean canCreateWeapon(Weapon weapon, int x, int y, int r)
	{
		return weapon.getSize().isInGridAt(grid, x, y, r);
	}
	
	public static boolean canCreateWeapon(int type, int x, int y, int r, int maxX, int maxY)
	{
		Weapon weapon = typeToWeapon(type, x, y, r);
		return weapon.getSize().isInGridAt(maxX, maxY, x, y, r);
	}
	
	public Weapon createWeapon(int type, int x, int y, int r)
	{
		Weapon weapon = typeToWeapon(type, x, y, r);
		if(weapon == null)
		{
			System.out.println("Unreconized weapon #"+type);
			return null;
		}
		if(!canCreateWeapon(weapon, x, y, r))
		{
			System.out.println("Cannot create here");
			return null;
		}
		return weapon;
	}
	
	public static Weapon typeToWeapon(int type, int x, int y, int r)
	{
		switch(type)
		{
		case Weapon.WEAPON_AIRCRAFT		: return new Aircraft(x, y, r);
		case Weapon.WEAPON_MISSILE		: return new Missile(x, y, r);
		case Weapon.WEAPON_MORTAR		: return new Mortar(x, y, r);
		case Weapon.WEAPON_NUKE			: return new Nuke(x, y, r);
		case Weapon.WEAPON_SHIELD		: return new Shield(x, y, r);
		case Weapon.WEAPON_SPY			: return new Spy(x, y, r);
		}
		System.out.println("Unreconized weapon #"+type);
		return null;
	}
	
	public static Size getSizeOfWeapon(int type)
	{
		return typeToWeapon(type, 0, 0, 0).getSize();
	}
}
