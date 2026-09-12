package shai.lpc.model;

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

public class Gladiator {
	
	private Team team;
	
	private String name;
	private int movementSpeed; // In milliseconds per tile. Therefore, lower means faster.
	private double strength; // May be any positive real number. Average person is 5.0.
	private double accuracy; // May be any positive real number. Average person is 5.0.
	private double toughness; // Generally, the ability to take damage. May be any positive real number, average person is 5.0.
	private double endurance; // May be any positive real number, average person is 5.0.
	private double initiative; // May be any real number, average person is 0.0.
	
	private int placeInLineup; // 0 if out of lineup, otherwise 1-5.
	
	public Gladiator(String name) {
		this.name = name;
		this.movementSpeed = 1000;
		this.strength = 5.0;
		this.accuracy = 5.0;
		this.toughness = 5.0;
		this.endurance = 5.0;
		this.initiative = 0.0;
	}
	
	public void setTeam(Team team) {
		this.team = team;
	}
	
	public void setPlaceInLineup(int placeInLineup) {this.placeInLineup = placeInLineup;}
	
	public Team getTeam() {return team;}
	public int getPlaceInLineup() {return placeInLineup;}
	public String getName() {return name;}
	public int getMovementSpeed() {return movementSpeed;}
	public double getStrength() {return strength;}
	public double getAccuracy() {return accuracy;}
	public double getToughness() {return toughness;}
	public double getEndurance() {return endurance;}
	public double getInitiative() {return initiative;}
	
	public String[] getPropertiesForDisplay() {
		String[] properties = new String[6];
		
		properties[0] = "Speed: " + movementSpeed;
		properties[1] = "Strength: " + strength;
		properties[2] = "Accuracy: " + accuracy;
		properties[3] = "Toughness: " + toughness;
		properties[4] = "Endurance: " + endurance;
		properties[5] = "Initiative: " + initiative;
		
		return properties;
	}
	
	public String[] getStatisticsForDisplay() {
		String[] statistics = new String[1];
		
		statistics[0] = "Matches played: " + (5);
		
		return statistics;
	}

}
