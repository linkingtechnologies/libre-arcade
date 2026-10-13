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

package fr.uha.ensisa.ir.walther.milcityblue.gui;

import javax.microedition.lcdui.game.GameCanvas;

import fr.uha.ensisa.ir.walther.milcityblue.core.Building;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Game;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.Weapon;
import fr.uha.ensisa.ir.walther.milcityblue.core.WeaponFactory;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;

public class MilCityModel implements GameModel
{
	private int x, y, w, h, s;
	private Size size;
	private int lastKeys;
	private Game game;
	private int actionSelected, previousActionSelected;
	private String actionSelectedName;
	private int actionSelectedCost, actionSelectedEnergy;
	private int modeSelected, previousModeSelected;
	private String modeSelectedName;
	private boolean hasFired;
	
	public static final int MODE_CITY = -1;
	public static final int MODE_ATTACK_P1 = 0;
	public static final int MODE_ATTACK_P2 = 1;
	public static final int MODE_ATTACK_P3 = 2;
	public static final int MODE_ATTACK_P4 = 3;
	public static final int MODE_ATTACK_P5 = 4;
	public static final int MODE_ATTACK_P6 = 5;
	public static final int MODE_ATTACK_P7 = 6;
	public static final int MODE_ATTACK_P8 = 7;
	
	public static final int ACTION_PLACE_POWERPLANT = 0;
	public static final int ACTION_PLACE_REFINERY = 1;
	public static final int ACTION_PLACE_HOUSE = 2;
	public static final int ACTION_PLACE_MISSILESILO = 3;
	public static final int ACTION_PLACE_FACTORY = 4;
	public static final int ACTION_PLACE_AIRFIELD = 5;
	public static final int ACTION_PLACE_LABORATORY = 6;
	public static final int ACTION_PLACE_SHIELDGENERATOR = 7;
	public static final int ACTION_PLACE_NUKESILO = 8;
	public static final int ACTION_PLACE_SHIELD = 9;
	
	public static final int ACTION_USE_MISSILE = 0;
	public static final int ACTION_USE_ARTILLERY = 1;
	public static final int ACTION_USE_AIRCRAFT = 2;
	public static final int ACTION_USE_NUKE = 3;
	public static final int ACTION_USE_SPY = 4;
	
	public MilCityModel(Game game, int x, int y, int w, int h, int s, Size size)
	{
		super();
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.s = s;
		this.size = size;
		this.lastKeys = 0;
		this.game = game;
		this.actionSelected = ACTION_PLACE_POWERPLANT;
		this.previousActionSelected = ACTION_PLACE_POWERPLANT;
		this.actionSelectedName = "Powerplant";
		this.actionSelectedCost = Config.CONSTRUCTION_COST_POWERPLANT;
		this.actionSelectedEnergy = Config.ENERGY_POWERPLANT;
		this.modeSelected = MODE_CITY;
		this.modeSelectedName = "City";
		this.previousModeSelected = MODE_CITY;
		this.hasFired = false;
	}

	public void Ai(int keys, int width, int height)
	{
		try
		{
			if(hasFired && ((keys & GameCanvas.FIRE_PRESSED) == 0))
				hasFired = false;
			
			if ((keys & GameCanvas.UP_PRESSED) != 0)
			{
				if(y > 0)
					y -= s;
			}
			if ((keys & GameCanvas.DOWN_PRESSED) != 0)
			{
				if(y + size.getSizeY() * s < h)
					y += s;
			}
			if ((keys & GameCanvas.LEFT_PRESSED) != 0)
			{
				if(x > 0)
					x -= s;
			}
			if ((keys & GameCanvas.RIGHT_PRESSED) != 0)
			{
				if(x + size.getSizeX() * s < w)
					x += s;
			}
			if ((keys & GameCanvas.GAME_A_PRESSED) != 0)
			{
				--actionSelected;
				checkActionSelected();
			}
			if ((keys & GameCanvas.GAME_B_PRESSED) != 0)
			{
				++actionSelected;
				checkActionSelected();
			}
			if ((keys & GameCanvas.GAME_C_PRESSED) != 0)
			{
				--modeSelected;
				if (modeSelected == game.getLocalPlayerIndex())
					--modeSelected;
				checkModeSelected();
			}
			if ((keys & GameCanvas.GAME_D_PRESSED) != 0)
			{
				++modeSelected;
				if (modeSelected == game.getLocalPlayerIndex())
					++modeSelected;
				checkModeSelected();
			}
			if ((keys & GameCanvas.FIRE_PRESSED) != 0)
			{
				if(!hasFired)
					performSelectedAction();
				hasFired = true;
			}
			
			if ((keys & GameCanvas.GAME_A_PRESSED) != 0 && (keys & GameCanvas.GAME_C_PRESSED) != 0 && (keys & GameCanvas.GAME_D_PRESSED) != 0)
			{
				Config.CONSTRUCTION_COST_AIRFIELD = 0;
				Config.CONSTRUCTION_COST_COMMERCIAL = 0;
				Config.CONSTRUCTION_COST_FACTORY = 0;
				Config.CONSTRUCTION_COST_HOUSE = 0;
				Config.CONSTRUCTION_COST_LABORATORY = 0;
				Config.CONSTRUCTION_COST_MISSILESILO = 0;
				Config.CONSTRUCTION_COST_NUKESILO = 0;
				Config.CONSTRUCTION_COST_POWERPLANT = 0;
				Config.CONSTRUCTION_COST_SHIELDGENERATOR = 0;
			}
			
			lastKeys = keys;
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
	}
	
	private void checkModeSelected()
	{
		if (modeSelected < MODE_CITY)
			modeSelected = game.getNumberOfPlayers() - 1;
		if (modeSelected >= game.getNumberOfPlayers())
			modeSelected = MODE_CITY;
		
		if (modeSelected == MODE_CITY && previousModeSelected > MODE_CITY)
		{
			int tmp = actionSelected;
			actionSelected = previousActionSelected;
			previousActionSelected = tmp;
		}
		else if (modeSelected > MODE_CITY && previousModeSelected == MODE_CITY)
		{
			int tmp = actionSelected;
			actionSelected = previousActionSelected;
			previousActionSelected = tmp;
		}
		previousModeSelected = modeSelected;
		modeSelectedName = modeToString();
		checkActionSelected();
		System.out.println("ModeToPlayerIndex: " + modeToPlayerIndex());
	}
	
	private void checkActionSelected()
	{
		if(modeSelected == MODE_CITY)
		{
			if(actionSelected < 0)
				actionSelected = 9;
			if(actionSelected > 9)
				actionSelected = 0;
			size = actionToSize();
			actionSelectedName = actionToString();
			actionSelectedCost = actionToCost();
			actionSelectedEnergy = actionToEnergy();
		}
		else
		{
			if(actionSelected < 0)
				actionSelected = 4;
			if(actionSelected > 4)
				actionSelected = 0;
			size = actionToSize();
			actionSelectedName = actionToString();
			actionSelectedCost = 0;
			actionSelectedEnergy = 0;
		}
	}
	
	private void performSelectedAction()
	{
		if(canPerformActionHere())
		{
			if (modeSelected == MODE_CITY)
			{
				if (actionSelected < 9)
				{
					game.getLocalPlayer().constructBuilding(actionToType(), x / s, y / s, Building.ANGLE_0);
				}
				if (actionSelected == ACTION_PLACE_SHIELD)
				{
					int[] args = {actionToType(), x / s, y / s, Building.ANGLE_0};
					game.getLocalPlayer().fire(new Command(game.getLocalPlayerIndex(), game.getLocalPlayerIndex(), Command.COMMAND_FIRE, args));	
				}
			}
			else
			{
				int[] args = {actionToType(), x / s, y / s, Building.ANGLE_0};
				game.getLocalPlayer().fireOnAnotherPlayer(new Command(game.getLocalPlayerIndex(), modeToPlayerIndex(), Command.COMMAND_FIRE, args));
			}
		}
	}
	
	public boolean canPerformActionHere()
	{
		if (modeSelected == MODE_CITY)
		{
			if (actionSelected < 9)
			{
				if (game.getLocalPlayer().hasEnoughMoneyToBuild(actionToType()))
					return game.getLocalPlayer().getGrid().getBuildingFactory().canCreateBuilding(actionToType(), x / s, y / s, Building.ANGLE_0);
				return false;
			}
			if (actionSelected == ACTION_PLACE_SHIELD)
			{
				return game.getLocalPlayer().hasEnoughAmmoToFire(Weapon.WEAPON_SHIELD);
			}
		}
		if (game.getLocalPlayer().hasEnoughAmmoToFire(actionToType()))
			return System.currentTimeMillis() >= game.getLocalPlayer().getCannotFireBefore();
		return false;
	}
	
	public String modeToString()
	{
		switch(modeSelected)
		{
		case MODE_CITY		:	return "City";
		case MODE_ATTACK_P1	:	return "Military(P1)";
		case MODE_ATTACK_P2	:	return "Military(P2)";
		case MODE_ATTACK_P3	:	return "Military(P3)";
		case MODE_ATTACK_P4	:	return "Military(P4)";
		case MODE_ATTACK_P5	:	return "Military(P5)";
		case MODE_ATTACK_P6	:	return "Military(P6)";
		case MODE_ATTACK_P7	:	return "Military(P7)";
		case MODE_ATTACK_P8	:	return "Military(P8)";
		}
		return "N/A";
	}
	
	public String actionToString()
	{
		if(modeSelected == MODE_CITY)
		{
			switch(actionSelected)
			{
			case ACTION_PLACE_POWERPLANT		:	return "Powerplant";
			case ACTION_PLACE_REFINERY			:	return "Refinery";
			case ACTION_PLACE_HOUSE				:	return "House";
			case ACTION_PLACE_MISSILESILO		:	return "Missile Silo";
			case ACTION_PLACE_FACTORY			:	return "Factory";
			case ACTION_PLACE_AIRFIELD			:	return "Airfield";
			case ACTION_PLACE_LABORATORY		:	return "Laboratory";
			case ACTION_PLACE_SHIELDGENERATOR	:	return "Shield Generator";
			case ACTION_PLACE_NUKESILO			:	return "Nuke Silo";
			case ACTION_PLACE_SHIELD			:	return "Shield";
			}
		}
		else
		{
			switch(actionSelected)
			{
			case ACTION_USE_MISSILE				:	return "Missile(é)";
			case ACTION_USE_ARTILLERY			:	return "Artillery(è)";
			case ACTION_USE_AIRCRAFT			:	return "Aircraft(ç)";
			case ACTION_USE_NUKE				:	return "Nuke(à)";
			case ACTION_USE_SPY					:	return "Spy(ê)";
			}
		}
		return "N/A";
	}
	
	public int actionToType()
	{
		if(modeSelected == MODE_CITY)
		{
			switch(actionSelected)
			{
			case ACTION_PLACE_POWERPLANT		:	return Building.BUILDING_POWERPLANT;
			case ACTION_PLACE_REFINERY			:	return Building.BUILDING_COMMERCIAL;
			case ACTION_PLACE_HOUSE				:	return Building.BUILDING_HOUSE;
			case ACTION_PLACE_MISSILESILO		:	return Building.BUILDING_MISSILESILO;
			case ACTION_PLACE_FACTORY			:	return Building.BUILDING_FACTORY;
			case ACTION_PLACE_AIRFIELD			:	return Building.BUILDING_AIRFIELD;
			case ACTION_PLACE_LABORATORY		:	return Building.BUILDING_LABORATORY;
			case ACTION_PLACE_SHIELDGENERATOR	:	return Building.BUILDING_SHIELDGENERATOR;
			case ACTION_PLACE_NUKESILO			:	return Building.BUILDING_NUKESILO;
			case ACTION_PLACE_SHIELD			:	return Weapon.WEAPON_SHIELD;
			}
			return Building.BUILDING_NULL;
		}
		else
		{
			switch(actionSelected)
			{
			case ACTION_USE_MISSILE				:	return Weapon.WEAPON_MISSILE;
			case ACTION_USE_ARTILLERY			:	return Weapon.WEAPON_MORTAR;
			case ACTION_USE_AIRCRAFT			:	return Weapon.WEAPON_AIRCRAFT;
			case ACTION_USE_NUKE				:	return Weapon.WEAPON_NUKE;
			case ACTION_USE_SPY					:	return Weapon.WEAPON_SPY;
			}
			return Weapon.WEAPON_NULL;
		}	
	}
	
	public int actionToCost()
	{
		if(modeSelected == MODE_CITY && actionSelected < 9)
			return game.getLocalPlayer().getGrid().getBuildingFactory().getCostOfBuilding(actionToType());
		return 0;
	}
	
	public int actionToEnergy()
	{
		if(modeSelected == MODE_CITY && actionSelected < 9)
			return game.getLocalPlayer().getGrid().getBuildingFactory().getEnergyOfBuilding(actionToType());
		return 0;
	}
	
	public Size actionToSize()
	{
		if(modeSelected == MODE_CITY)
			if(actionSelected < 9)
				return game.getLocalPlayer().getGrid().getBuildingFactory().getSizeOfBuilding(actionToType());
			else
			{
				game.getLocalPlayer().getGrid().getWeaponFactory();
				return WeaponFactory.getSizeOfWeapon(actionToType());
			}
		else
		{
			game.getLocalPlayer().getGrid().getWeaponFactory();
			return WeaponFactory.getSizeOfWeapon(actionToType());
		}
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

	public int getW()
	{
		return w;
	}

	public void setW(int w)
	{
		this.w = w;
	}

	public int getH()
	{
		return h;
	}

	public void setH(int h)
	{
		this.h = h;
	}

	public int getS()
	{
		return s;
	}

	public void setS(int s)
	{
		this.s = s;
	}

	public Size getSize()
	{
		return size;
	}

	public void setSize(Size size)
	{
		this.size = size;
	}
	
	public int getLastKeys()
	{
		return this.lastKeys;
	}

	public int getActionSelected()
	{
		return actionSelected;
	}

	public String getActionSelectedName()
	{
		return actionSelectedName;
	}

	public int getActionSelectedCost()
	{
		return actionSelectedCost;
	}

	public int getActionSelectedEnergy()
	{
		return actionSelectedEnergy;
	}
	
	public int getModeSelected()
	{
		return modeSelected;
	}
	
	public String getModeSelectedName()
	{
		return modeSelectedName;
	}
	
	public Game getGame()
	{
		return game;
	}
	
	public int modeToPlayerIndex()
	{
		if(modeSelected == MODE_CITY)
			return game.getLocalPlayerIndex();
		return modeSelected;
	}
}
