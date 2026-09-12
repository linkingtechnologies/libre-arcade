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

import java.util.ArrayList;
import java.util.List;

import shai.lpc.log.Logger;

public class Team {
	
	private String name;
	private List<Gladiator> roster;
	private Gladiator[] lineup;
	
	public Team(String name) {
		this.name = name;
		roster = new ArrayList<Gladiator>();
	}
	
	public String getName() {return name;}
	
	public void addGladiator(Gladiator gladiator) {
		if (gladiator.getTeam() == null) {
			roster.add(gladiator);
			gladiator.setTeam(this);
		} else {
			Logger.getInstance().log("Attempting to reassign gladiator to new team");
		}
	}
	
	public void chooseLineup() {
		lineup = new Gladiator[5];
		for (int i = 0; i < 5; i++) {
			lineup[i] = roster.get(i);
			lineup[i].setPlaceInLineup(i + 1);
		}
	}
	
	public Gladiator[] getRoster() {return roster.toArray(new Gladiator[0]);}
	public Gladiator[] getLineup() {return lineup;}
	
	public static Team getTestTeamA() {
		Team team = new Team("The Guardians");
		
		team.addGladiator(new Gladiator("Reuven"));
		team.addGladiator(new Gladiator("Shimeon"));
		team.addGladiator(new Gladiator("Levi"));
		team.addGladiator(new Gladiator("Jehuda"));
		team.addGladiator(new Gladiator("Dan"));
		team.chooseLineup();
		
		return team;
	}
	
	public static Team getTestTeamB() {
		Team team = new Team("The Leaves");
		
		team.addGladiator(new Gladiator("Naphtali"));
		team.addGladiator(new Gladiator("Gad"));
		team.addGladiator(new Gladiator("Asher"));
		team.addGladiator(new Gladiator("Yissachar"));
		team.addGladiator(new Gladiator("Zevulun"));
		team.chooseLineup();
		
		return team;
	}

}
