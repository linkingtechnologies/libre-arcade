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

public class Config
{
	public static final String GAME_VERSION = "1.0.5";
	public static final String GAME_NAME = "MilCity Blue";
	
	public static boolean ENABLE_SOUND = false;
	public static boolean ENABLE_VIBRATION = true;
	
	public static int DEFAULT_GRID_SIZE_X = 30; // = 48;
	public static int DEFAULT_GRID_SIZE_Y = 30; // = 48;
	public static int DEFAULT_SCORE_TO_WIN = 1000;
	public static int DEFAULT_MONEY_AT_START = 100;
	public static int DEFAULT_PERCENT_OF_WATER = 50;
	
	public static int PRODUCTION_TIME_NULL = 0;
	public static int PRODUCTION_TIME_MISSILE = 30;
	public static int PRODUCTION_TIME_SHIELD = 60;
	public static int PRODUCTION_TIME_AIRCRAFT = 60;
	public static int PRODUCTION_TIME_MORTAR = 45;
	public static int PRODUCTION_TIME_NUKE = 60;
	public static int PRODUCTION_TIME_SPY = 30;
	
	public static int CONSTRUCTION_TIME_MISSILESILO = 10;
	public static int CONSTRUCTION_TIME_SHIELDGENERATOR = 20;
	public static int CONSTRUCTION_TIME_POWERPLANT = 20;
	public static int CONSTRUCTION_TIME_AIRFIELD = 30;
	public static int CONSTRUCTION_TIME_LABORATORY = 30;
	public static int CONSTRUCTION_TIME_FACTORY = 30;
	public static int CONSTRUCTION_TIME_HOUSE = 10;
	public static int CONSTRUCTION_TIME_COMMERCIAL = 20;
	public static int CONSTRUCTION_TIME_NUKESILO = 60;
	
	public static int CONSTRUCTION_COST_MISSILESILO = 10;
	public static int CONSTRUCTION_COST_SHIELDGENERATOR = 40;
	public static int CONSTRUCTION_COST_POWERPLANT = 20;
	public static int CONSTRUCTION_COST_AIRFIELD = 60;
	public static int CONSTRUCTION_COST_LABORATORY = 90;
	public static int CONSTRUCTION_COST_FACTORY = 40;
	public static int CONSTRUCTION_COST_HOUSE = 100;
	public static int CONSTRUCTION_COST_COMMERCIAL = 50;
	public static int CONSTRUCTION_COST_NUKESILO = 160;
	
	public static int ENERGY_MISSILESILO = -1;
	public static int ENERGY_SHIELDGENERATOR = -1;
	public static int ENERGY_POWERPLANT = 10;
	public static int ENERGY_AIRFIELD = -1;
	public static int ENERGY_LABORATORY = -1;
	public static int ENERGY_FACTORY = -1;
	public static int ENERGY_HOUSE = -1;
	public static int ENERGY_COMMERCIAL = -1;
	public static int ENERGY_NUKESILO = -5;
	
	public static int MONEY_EARNED_PER_SECOND = 1;
	public static int ACCELERATION_FACTOR_PER_HOUSE = 5;
	
	public static int SCORE_PER_BUILDING_HIT_CELL = 10;
	public static int SCORE_PER_BUILDING_DESTROYED_CELL = 10;
	
	public static int MAX_TIME_BELLOW_ZERO = 120;
	
	private static Config singleton;
	
	private Config()
	{
	}
	
	public static Config getInstance()
	{
		if (singleton == null)
			singleton = new Config();
		return singleton;
	}
}
