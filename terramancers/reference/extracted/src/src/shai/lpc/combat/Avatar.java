package shai.lpc.combat;

/**
 * Terramancers - an action game for the Liberated Pixel Cup.
 * Copyright (C) 2012 Shai Shapira
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import shai.lpc.combat.actions.AvatarAction;
import shai.lpc.combat.actions.MovementAction;
import shai.lpc.combat.actions.PlacementAction;
import shai.lpc.combat.actions.WaitAction;
import shai.lpc.model.Gladiator;

/**
 * The avatar is a gladiator's representation during the actual combat. The gladiator class has the general statistics that remain in the long run, while
 * the avatar has the dynamic statistics that change during combat - current health, buffs / debuffs, etc. The avatar object is created in the begining
 * of a match, and is removed after it.
 * @author Shai Shapira
 *
 */
public class Avatar {
	
	// Current state, for AI purposes
	private static final int STATE_CHARGING = 1;
	private static final int STATE_DEFENDING = 2;
	private static final int STATE_FIGHTING = 3;
	
	private MatchEngine matchEngine;
	
	private Gladiator gladiator;
	private int x, y; // In tiles. The avatar is 2X2 tiles big, so this location is the top left tile.
	private double health; // 1 is fully healthy, 0 is eliminated.
	private double energy; //1 is fully refreshed, 0 is fatigued.
	private int movementSpeed;
	private double strength;
	private double accuracy;
	private double toughness;
	private double endurance;
	private double initiative;
	
	private int state;
	private Avatar target; // For AI purposes - the avatar we're currently charging at, fighting, or defending.
	
	private boolean homeTeam;
	private int id; // The avatar's ID in the match engine
	private AvatarAction nextAction;
	private long timeOfNextAction;
	private AvatarAction currentAction;
	
	public Avatar (MatchEngine engine, int id, Gladiator gladiator, boolean homeTeam) {
		this.gladiator = gladiator;
		this.homeTeam = homeTeam;
		this.matchEngine = engine;
		this.id = id;
		
		this.health = 1.0;
		this.energy = 1.0;
		// When the avatar is created, many properties are copied from the gladiator object. This is because events during the match might change
		// those properties for the duration of the match (thus affecting the avatar), but will generally not affect the gladiator after the match is over.
		this.movementSpeed = gladiator.getMovementSpeed();
		this.strength = gladiator.getStrength();
		this.accuracy = gladiator.getAccuracy();
		this.toughness = gladiator.getToughness();
		this.endurance = gladiator.getEndurance();
		this.initiative = gladiator.getInitiative();
		
		int placeInLineup = gladiator.getPlaceInLineup();
		if (placeInLineup > 0) {
			nextAction = new PlacementAction(id, matchEngine.getArena().getSpawnPoint(placeInLineup, homeTeam));
		}
		timeOfNextAction = 0;
		state = STATE_CHARGING;
	}
	
	public void place(int x, int y) {
		this.x = x;
		this.y = y;
	}
	
	public int getX() {return x;}
	public int getY() {return y;}
	public int getId() {return id;}
	
	public AvatarAction getNextAction() {return nextAction;}
	public long getTimeOfNextAction() {return timeOfNextAction;}
	public AvatarAction getCurrentAction() {return currentAction;}
	public String getName() {return gladiator.getName();}
	public boolean isFromHomeTeam() {return homeTeam;}
	
	public void setCurrentAction(AvatarAction action) {currentAction = action;}
	public void setNextAction(AvatarAction action) {nextAction = action;}
	
	public double getHealth() {return health;}
	public double getInitiative() {return initiative;}
	public double getMovementSpeed() {return movementSpeed;}
	
	public void chooseNextAction(long timeOfNextAction) {
		currentAction = nextAction;		
		// Now set the time for the next action
		this.timeOfNextAction = timeOfNextAction;
		// Decide what to do
		if (state == STATE_CHARGING) {
			target = findNearestEnemy();
			if (distance(this, target) == 1) {
				state = STATE_FIGHTING;
			}
		}
		// Create action for it
		if (state == STATE_CHARGING) {
			int direction = 0;
			int xDifference = Math.abs(this.x - target.x);
			int yDifference = Math.abs(this.y - target.y);
			if (xDifference > yDifference) {
				if (this.x > target.x) direction = MovementAction.WEST;
				else direction = MovementAction.EAST;
			} else {
				if (this.y > target.y) direction = MovementAction.NORTH;
				else direction = MovementAction.SOUTH;
			}
			nextAction = new MovementAction(id, direction);
		} else {
			nextAction = new WaitAction(id);
		}
		currentAction.setNextAction(nextAction);
	}
	
	private Avatar findNearestEnemy() {
		Avatar[] allAvatars = matchEngine.getAvatars();
		int minDistance = -1;
		Avatar nearestEnemy = null;
		for (int i = 0; i < allAvatars.length; i++) {
			Avatar avatar = allAvatars[i];
			if (avatar.isFromHomeTeam() != homeTeam && avatar.getHealth() > 0) {
				int distance = distance(this, avatar);
				if (minDistance == -1 || distance < minDistance) {
					minDistance = distance;
					nearestEnemy = avatar;
				}
			}
		}
		return nearestEnemy;
	}
	
	/**
	 * Manhattan distance between two avatars.
	 * @param first
	 * @param second
	 * @return
	 */
	private static int distance(Avatar first, Avatar second) {
		return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
	}
	
	public Avatar clone() {
		Avatar other = new Avatar(this.matchEngine, this.id, this.gladiator, this.homeTeam);
		return other;
	}

}
