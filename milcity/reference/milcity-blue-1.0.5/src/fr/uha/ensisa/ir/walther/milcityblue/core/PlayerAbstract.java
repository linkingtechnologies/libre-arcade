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

import java.util.Enumeration;

import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;

public abstract class PlayerAbstract implements PlayerInterface
{
	protected int playerIndex;
	protected int accelerationFactor;
	protected int destroyedBuildings, destroyedCells, score, scoreToWin;
	protected int energy, money;
	protected int ammoMissiles, ammoShields, ammoAirCrafts, ammoMortars, ammoSpies, ammoNukes;
	protected int constructedBuildings;
	protected long firstBuildingConstructedAt, cannotFireBefore, energyBellowZeroSince;
	
	protected Game game;
	protected Grid grid;
	protected StatusGrid statusGrid;
	
	protected boolean hasLoose, hasWon, energyBellowZero;
	
	public PlayerAbstract()
	{
		this.playerIndex = Command.TARGET_NULL;
		this.accelerationFactor = 0;
		this.destroyedBuildings = 0;
		this.destroyedCells = 0;
		this.score = 0;
		this.scoreToWin = Config.DEFAULT_SCORE_TO_WIN;
		this.energy = 0;
		this.money = Config.DEFAULT_MONEY_AT_START;
		this.ammoMissiles = 0;
		this.ammoShields = 0;
		this.ammoAirCrafts = 0;
		this.ammoMortars = 0;
		this.ammoSpies = 0;
		this.ammoNukes = 0;
		this.game = null;
		this.grid = null;
		this.constructedBuildings = 0;
		this.firstBuildingConstructedAt = 0;
		this.cannotFireBefore = 0;
		this.energyBellowZeroSince = System.currentTimeMillis();
		this.statusGrid = null;
		this.hasLoose = false;
		this.hasWon = false;
		this.energyBellowZero = true;
	}
	
	public void fire(Command commandFire)
	{
		if(commandFire.getPlayerTarget() == this.playerIndex)
			if(this.grid != null)
			{
				int weaponType = commandFire.getParameters()[0];
				int x = commandFire.getParameters()[1];
				int y = commandFire.getParameters()[2];
				int r = commandFire.getParameters()[3];
				
				if(this.grid.getWeaponFactory().canCreateWeapon(weaponType, x, y, r))
				{
					Weapon weapon = this.grid.getWeaponFactory().createWeapon(weaponType, x, y, r);
					if(weaponType == Weapon.WEAPON_SHIELD && commandFire.getPlayerSender() == this.playerIndex)
					{
						if(this.ammoShields > 0)
						{
							--this.ammoShields;
							game.execute(weapon.makeEffect(this, commandFire.getPlayerSender()));
						}
					}
					else
					{
						game.execute(weapon.makeEffect(this, commandFire.getPlayerSender()));
						System.out.println(playerIndex + " : I've got a fucking bullet in my fucking ass from " + commandFire.getPlayerSender() + " !");
					}
				}
			}
	}
	
	public void fireOnAnotherPlayer(Command commandFire)
	{
		if(commandFire.getPlayerSender() == this.playerIndex)
		{
			if(System.currentTimeMillis() >= this.cannotFireBefore)
			{
				int weaponType = commandFire.getParameters()[0];
				int x = commandFire.getParameters()[1];
				int y = commandFire.getParameters()[2];
				int r = commandFire.getParameters()[3];
				PlayerInterface anotherPlayer = this.game.getRemotePlayer(commandFire.getPlayerTarget());
				
				if(WeaponFactory.canCreateWeapon(weaponType, x, y, r, anotherPlayer.getStatusGrid().getMaxX(), anotherPlayer.getStatusGrid().getMaxY()))
					if(getAmmoForWeaponType(weaponType) > 0)
					{
						setAmmoForWeaponType(weaponType, getAmmoForWeaponType(weaponType) - 1);
						Size size = WeaponFactory.getSizeOfWeapon(weaponType);
						this.cannotFireBefore = System.currentTimeMillis() + (1000 * size.getSizeX() * size.getSizeY()) - accelerationFactor * (10 * size.getSizeX() * size.getSizeY());
						anotherPlayer.fire(commandFire);
						System.out.println(playerIndex + " : I've got a bullet ! Fired on " + anotherPlayer.getPlayerIndex());
					}
			}
		}
	}
	
	public void constructBuilding(int type, int x, int y, int r)
	{
		int cost = 0;
		if (this.money >= (cost = this.grid.getBuildingFactory().getCostOfBuilding(type)))
			if(this.grid.construct(type, x, y, r))
			{
				this.money -= cost;
				++this.constructedBuildings;
				if(this.constructedBuildings == 1)
				{
					this.firstBuildingConstructedAt = System.currentTimeMillis();
					this.energyBellowZeroSince = System.currentTimeMillis();
				}
			}
	}
	
	public boolean hasEnoughMoneyToBuild(int buildingType)
	{
		switch(buildingType)
		{
		case Building.BUILDING_AIRFIELD			:	return (money >= Config.CONSTRUCTION_COST_AIRFIELD);
		case Building.BUILDING_COMMERCIAL		:	return (money >= Config.CONSTRUCTION_COST_COMMERCIAL);
		case Building.BUILDING_FACTORY			:	return (money >= Config.CONSTRUCTION_COST_FACTORY);
		case Building.BUILDING_HOUSE			:	return (money >= Config.CONSTRUCTION_COST_HOUSE);
		case Building.BUILDING_LABORATORY		:	return (money >= Config.CONSTRUCTION_COST_LABORATORY);
		case Building.BUILDING_MISSILESILO		:	return (money >= Config.CONSTRUCTION_COST_MISSILESILO);
		case Building.BUILDING_NUKESILO			:	return (money >= Config.CONSTRUCTION_COST_NUKESILO);
		case Building.BUILDING_POWERPLANT		:	return (money >= Config.CONSTRUCTION_COST_POWERPLANT);
		case Building.BUILDING_SHIELDGENERATOR	:	return (money >= Config.CONSTRUCTION_COST_SHIELDGENERATOR);
		default									:	return false;
		}
	}
	
	public boolean hasEnoughAmmoToFire(int weaponType)
	{
		return (getAmmoForWeaponType(weaponType) > 0);
	}
	
	public boolean hasLoose(Buildings buildings)
	{
		if(hasLoose)
			return true;
		else
		{
			if(energyBellowZero && energy <= 0 && constructedBuildings > 0)
			{
				if(energyBellowZeroSince + (Config.MAX_TIME_BELLOW_ZERO * 1000) < System.currentTimeMillis())
				{
					hasLoose = true;
					System.out.println("Player loose because he spent to much time bellow zero energy level.");
				}
				else
				{
					/*BuildingsIterator it = new BuildingsIterator(buildings);
					Building building;
					int totalEnergy = 0;
					while(it.hasNext())
					{
						building = it.next();
						if(!building.isDestroyed())
						{
							totalEnergy += building.getEnergy();
						}
					}
					int neededPowerplants = (int) Math.ceil((double) (-totalEnergy) / (double) Config.ENERGY_POWERPLANT);*/
					int neededPowerplants = (int) Math.ceil((double) (-energy) / (double) Config.ENERGY_POWERPLANT);
					System.out.println(playerIndex + " : NEEDED POWERPLANTS = " + neededPowerplants);
					hasLoose = (money < (neededPowerplants * Config.CONSTRUCTION_COST_POWERPLANT));
				}
			}
			if(hasLoose)
			{
				int[] params = { score };
				game.execute(new Command(playerIndex, Command.TARGET_ALL, Command.COMMAND_LOSE, params));
				System.out.println(playerIndex + " : YOU LOSE !");
				if(game.getNumberOfPlayers() == 1)
					game.end();
			}
			return hasLoose;
		}
	}
	
	public boolean hasLoose()
	{
		return hasLoose;
	}
	
	public boolean hasWon()
	{
		if(hasWon)
			return true;
		else
		{
			if(score >= scoreToWin)
				hasWon = true;
			else
			{
				Enumeration players = game.getPlayers();
				PlayerInterface player;
				int playerLooseCount = 0;
				while(players.hasMoreElements())
				{
					player = (PlayerInterface) players.nextElement();
					if(player.getPlayerIndex() != playerIndex)
						if(player.hasLoose())
							++playerLooseCount;
				}
				hasWon = (playerLooseCount == game.getNumberOfPlayers() - 1 && game.getNumberOfPlayers() > 1);
			}
			if(hasWon)
			{
				int[] params = { score };
				game.execute(new Command(playerIndex, Command.TARGET_ALL, Command.COMMAND_WIN, params));
				System.out.println(playerIndex + " : YOU WIN !");
			}
			return hasWon;
		}
	}
	
	public void updateProduction(Building building)
	{
		if(this.energy > 0)
			switch(building.getProductionType())
			{
			case Weapon.WEAPON_MISSILE	:	++this.ammoMissiles; break;
			case Weapon.WEAPON_SHIELD	:	++this.ammoShields; break;
			case Weapon.WEAPON_AIRCRAFT	:	++this.ammoAirCrafts; break;
			case Weapon.WEAPON_MORTAR	:	++this.ammoMortars; break;
			case Weapon.WEAPON_SPY		:	++this.ammoSpies; break;
			case Weapon.WEAPON_NUKE		:	++this.ammoNukes; break;
			}
	}
	
	public void updateConstruction(Building building)
	{
		CellsIterator it = new CellsIterator(building.getCells());
		while (it.hasNext())
		{
			Cell cell = it.next();
			this.grid.setCell(cell.getType(), cell.getX(), cell.getY());
		}
	}
	
	public void updateShields()
	{
		CellsIterator it = new CellsIterator(this.grid.getShieldedCells());
		Cells cells = new Cells();
		TimedCell timedCell;
		while(it.hasNext())
		{
			timedCell = (TimedCell) it.next();
			if(timedCell.isOver())
				this.grid.setCell(timedCell.getType(), timedCell.getX(), timedCell.getY());
			else
				cells.push(timedCell);
		}
		this.grid.setShieldedCells(cells);
	}
	
	public void computeEnergy(Buildings buildings)
	{
		BuildingsIterator it = new BuildingsIterator(buildings);
		int count = 0;
		Building building = null;
		while(it.hasNext())
			if((building = it.next()).getState() == Building.STATE_OPERATIONAL)
				count += building.getEnergy();
		if(this.energy > 0 && count <= 0)
		{
			this.energyBellowZero = true;
			this.energyBellowZeroSince = System.currentTimeMillis();
		}
		else if(count > 0)
			this.energyBellowZero = false;
		this.energy = count;
	}
	
	public void computeMoney(Buildings buildings)
	{
		if(this.energy > 0)
		{
			BuildingsIterator it = new BuildingsIterator(buildings);
			int count = 0;
			Building building = null;
			while(it.hasNext())
				if((building = it.next()).getState() == Building.STATE_OPERATIONAL)
					if(building.getType() == Building.BUILDING_COMMERCIAL)
						++count;
			this.money += count * Config.MONEY_EARNED_PER_SECOND;
		}
	}
	
	public void computeAccelerationFactor(Buildings buildings)
	{
		if(this.energy > 0)
		{
			BuildingsIterator it = new BuildingsIterator(buildings);
			int count = 0;
			Building building = null;
			while(it.hasNext())
				if((building = it.next()).getState() == Building.STATE_OPERATIONAL)
					if(building.getType() == Building.BUILDING_HOUSE)
						++count;
			this.accelerationFactor = count * Config.ACCELERATION_FACTOR_PER_HOUSE;
			if(this.accelerationFactor > 50)
				this.accelerationFactor = 50;
		}
		else
			this.accelerationFactor = -200;
	}
	
	public int getAccelerationFactor()
	{
		return accelerationFactor;
	}
	public void setAccelerationFactor(int accelerationFactor)
	{
		this.accelerationFactor = accelerationFactor;
	}
	public int getDestroyedBuildings()
	{
		return destroyedBuildings;
	}
	public void setDestroyedBuildings(int destroyedBuildings)
	{
		this.destroyedBuildings = destroyedBuildings;
	}
	public int getDestroyedCells()
	{
		return destroyedCells;
	}
	public void setDestroyedCells(int destroyedCells)
	{
		this.destroyedCells = destroyedCells;
	}
	public int getScore()
	{
		return score;
	}
	public void setScore(int score)
	{
		this.score = score;
	}
	public int getScoreToWin()
	{
		return scoreToWin;
	}
	public void setScoreToWin(int scoreToWin)
	{
		this.scoreToWin = scoreToWin;
	}
	public int getMoney()
	{
		return money;
	}
	public void setMoney(int money)
	{
		this.money = money;
	}
	public int getAmmoMissiles()
	{
		return ammoMissiles;
	}
	public void setAmmoMissiles(int ammoMissiles)
	{
		this.ammoMissiles = ammoMissiles;
	}
	public int getAmmoAirCrafts()
	{
		return ammoAirCrafts;
	}
	public void setAmmoAirCrafts(int ammoAirCrafts)
	{
		this.ammoAirCrafts = ammoAirCrafts;
	}
	public int getAmmoMortars()
	{
		return ammoMortars;
	}
	public void setAmmoMortars(int ammoMortars)
	{
		this.ammoMortars = ammoMortars;
	}
	public int getAmmoSpies()
	{
		return ammoSpies;
	}
	public void setAmmoSpies(int ammoSpies)
	{
		this.ammoSpies = ammoSpies;
	}
	public int getAmmoNukes()
	{
		return ammoNukes;
	}
	public void setAmmoNukes(int ammoNukes)
	{
		this.ammoNukes = ammoNukes;
	}

	public Game getGame()
	{
		return game;
	}

	public void setGame(Game game)
	{
		this.game = game;
	}

	public Grid getGrid()
	{
		return grid;
	}

	public void setGrid(Grid grid)
	{
		this.grid = grid;
		this.statusGrid = new StatusGrid(playerIndex, grid, game);
	}

	public int getEnergy()
	{
		return energy;
	}

	public void setEnergy(int energy)
	{
		this.energy = energy;
	}

	public int getAmmoShields()
	{
		return ammoShields;
	}

	public void setAmmoShields(int ammoShields)
	{
		this.ammoShields = ammoShields;
	}
	
	public int getAmmoForWeaponType(int type)
	{
		switch(type)
		{
		case Weapon.WEAPON_MISSILE	:	return ammoMissiles;
		case Weapon.WEAPON_MORTAR	:	return ammoMortars;
		case Weapon.WEAPON_AIRCRAFT	:	return ammoAirCrafts;
		case Weapon.WEAPON_NUKE		:	return ammoNukes;
		case Weapon.WEAPON_SPY		:	return ammoSpies;
		case Weapon.WEAPON_SHIELD	:	return ammoShields;
		}
		return 0;
	}
	
	public void setAmmoForWeaponType(int type, int ammo)
	{
		switch(type)
		{
		case Weapon.WEAPON_MISSILE	:	ammoMissiles = ammo; break;
		case Weapon.WEAPON_MORTAR	:	ammoMortars = ammo; break;
		case Weapon.WEAPON_AIRCRAFT	:	ammoAirCrafts = ammo; break;
		case Weapon.WEAPON_NUKE		:	ammoNukes = ammo; break;
		case Weapon.WEAPON_SPY		:	ammoSpies = ammo; break;
		case Weapon.WEAPON_SHIELD	:	ammoShields = ammo; break;
		}
	}
	
	public void start()
	{
		Thread thread = new Thread(this);
		thread.start();
	}
	
	public boolean isLocal()
	{
		return true;
	}
	
	public void sendCommand(Command command) {}
	
	public int getPlayerIndex()
	{
		return playerIndex;
	}

	public StatusGrid getStatusGrid()
	{
		return statusGrid;
	}

	public void setPlayerIndex(int playerIndex)
	{
		this.playerIndex = playerIndex;
		if(this.statusGrid != null)
			this.statusGrid.setPlayerIndex(playerIndex);
	}
	
	public void win()
	{
		hasWon = true;
	}
	
	public void lose()
	{
		hasLoose = true;
	}

	public int getConstructedBuildings()
	{
		return constructedBuildings;
	}

	public long getFirstBuildingConstructedAt()
	{
		return firstBuildingConstructedAt;
	}

	public long getCannotFireBefore()
	{
		return cannotFireBefore;
	}

	public long getEnergyBellowZeroSince()
	{
		return energyBellowZeroSince;
	}

	public boolean isEnergyBellowZero()
	{
		return energyBellowZero;
	}
}
