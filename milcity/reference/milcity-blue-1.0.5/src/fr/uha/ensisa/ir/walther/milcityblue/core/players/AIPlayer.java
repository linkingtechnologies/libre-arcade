package fr.uha.ensisa.ir.walther.milcityblue.core.players;

import java.util.Random;

import fr.uha.ensisa.ir.walther.milcityblue.core.Building;
import fr.uha.ensisa.ir.walther.milcityblue.core.BuildingsIterator;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Game;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;
import fr.uha.ensisa.ir.walther.milcityblue.core.StatusGrid;
import fr.uha.ensisa.ir.walther.milcityblue.core.Weapon;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;

public class AIPlayer extends PlayerAbstract
{
	public static final byte LEVEL_EASY = 0;
	public static final byte LEVEL_MEDIUM = 1;
	public static final byte LEVEL_HARD = 2;
	public static final byte LEVEL_MADNESS = 3;
	
	private byte level, turn;
	
	public AIPlayer(byte level)
	{
		this.level = level;
		turn = 0;
	}
	
	private void play()
	{
		++turn;
		int powerplantCount = 0, commercialCount = 0, missilesiloCount = 0, buildingCount = 0,
			factoryCount = 0, airfieldCount = 0, nukesiloCount = 0;
		int currentBuildingType = 0;
		Building currentBuilding;
		BuildingsIterator it = new BuildingsIterator(this.grid.getBuildings());
		while(it.hasNext())
		{
			currentBuilding = it.next();
			if(!currentBuilding.isDestroyed())
			{
				currentBuildingType = currentBuilding.getType();
				switch(currentBuildingType)
				{
				case Building.BUILDING_POWERPLANT	:	++powerplantCount; break;
				case Building.BUILDING_COMMERCIAL	:	++commercialCount; break;
				case Building.BUILDING_MISSILESILO	:	++missilesiloCount; break;
				case Building.BUILDING_FACTORY		:	++factoryCount; break;
				case Building.BUILDING_AIRFIELD		:	++airfieldCount; break;
				case Building.BUILDING_NUKESILO		:	++nukesiloCount; break;
				}
				++buildingCount;
			}
		}
		if(turn == 1)
		{
			/*System.out.println("IA-" + playerIndex + ":\tEnergy = " + energy + "\tMoney = " + money);
			System.out.println("IA-" + playerIndex + ":\tBuildings = " + buildingCount + ", PowerPlants = " + powerplantCount + ", Refinery = " + commercialCount);
			System.out.println("IA-" + playerIndex + ":\tMissileSilos = " + missilesiloCount + ", Factories = " + factoryCount + ", AirFiels = " + airfieldCount);*/
			
			if(money > (Config.CONSTRUCTION_COST_POWERPLANT * (buildingCount - powerplantCount + 1)) && energy > 6)
			{
				if(commercialCount < (level * 2))
					build(Building.BUILDING_COMMERCIAL);
				else if(level == LEVEL_EASY)
					build(Building.BUILDING_MISSILESILO);
				else if(level == LEVEL_MEDIUM)
					build(Building.BUILDING_FACTORY);
				else if(level == LEVEL_HARD)
					build(Building.BUILDING_AIRFIELD);
				else if(level == LEVEL_MADNESS)
					build(Building.BUILDING_NUKESILO);
			}
			else if(money > Config.CONSTRUCTION_COST_POWERPLANT + Config.CONSTRUCTION_COST_COMMERCIAL && commercialCount < 2)
				build(Building.BUILDING_COMMERCIAL);
			else if(energy <= 6 && money > Config.CONSTRUCTION_COST_POWERPLANT && commercialCount > 1)
				build(Building.BUILDING_POWERPLANT);
			else if(energy <= 0 && (powerplantCount * 10) - buildingCount <= 0)
				build(Building.BUILDING_POWERPLANT);
		}
		else if(turn >= 5)
			turn = 0;
		if(System.currentTimeMillis() >= this.cannotFireBefore)
		{
			if(ammoMissiles > 0)
				fire(Weapon.WEAPON_MISSILE);
			if(ammoMortars > 0)
				fire(Weapon.WEAPON_MORTAR);
			if(ammoAirCrafts > 0)
				fire(Weapon.WEAPON_AIRCRAFT);
			if(ammoNukes > 0)
				fire(Weapon.WEAPON_NUKE);
		}
	}
	
	private void build(int buildingType)
	{
		Random rnd = new Random();
		int tries = 0, x = rnd.nextInt(Config.DEFAULT_GRID_SIZE_X), y = rnd.nextInt(Config.DEFAULT_GRID_SIZE_Y);
		while(!grid.getBuildingFactory().canCreateBuilding(buildingType, x, y, Building.ANGLE_0) && tries < 10)
		{
			x = rnd.nextInt(Config.DEFAULT_GRID_SIZE_X);
			y = rnd.nextInt(Config.DEFAULT_GRID_SIZE_Y);
			++tries;
		}
		System.out.println("IA-" + playerIndex + ":\tBuilding a " + buildingType + " at (" + x + ", " + y + ")");
		constructBuilding(buildingType, x, y, Building.ANGLE_0);
	}
	
	private void fire(int weaponType)
	{
		Random rnd = new Random();
		int tries = 0, x = rnd.nextInt(Config.DEFAULT_GRID_SIZE_X), y = rnd.nextInt(Config.DEFAULT_GRID_SIZE_Y), target = getRandomPlayerIndexButNotSelf();
		// TODO improve targeting ...
		while(game.getPlayerAt(target).getStatusGrid().getCellStatusAt(x, y) == StatusGrid.STATUS_WATER && tries < 10)
		{
			x = rnd.nextInt(Config.DEFAULT_GRID_SIZE_X);
			y = rnd.nextInt(Config.DEFAULT_GRID_SIZE_Y);
			++tries;
		}
		System.out.println("IA-" + playerIndex + ":\tFiring a " + weaponType + " at (" + x + ", " + y + ")");
		int[] params = {weaponType, x, y, Building.ANGLE_0};
		Command command = new Command(playerIndex, target, Command.COMMAND_FIRE, params);
		fireOnAnotherPlayer(command);
	}
	
	private int getRandomPlayerIndexButNotSelf()
	{
		Random rnd = new Random();
		int result = 0;
		if(game.getNumberOfPlayers() > 1)
		{
			result = rnd.nextInt(game.getNumberOfPlayers());
			while(result == playerIndex)
				result = rnd.nextInt(game.getNumberOfPlayers());
		}
		return result;
	}
	
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
				play();
				Thread.sleep(1000);
			} 
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}

	public byte getLevel()
	{
		return level;
	}

	public void setLevel(byte level)
	{
		this.level = level;
	}
}
