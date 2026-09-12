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

import java.util.ArrayList;
import java.util.List;

import shai.lpc.combat.actions.AvatarAction;
import shai.lpc.model.Arena;
import shai.lpc.model.Team;

/**
 * The saved log of actions and events of a match, allowing to view the match again after being finished. Produced by the Match Engine.
 * @author Shai Shapira
 *
 */
public class MatchReplay {
	
	private Team homeTeam, awayTeam;
	private Arena arena;
	private List<AvatarAction> actions;
	private Avatar[] avatars;
	private int iterator;
	
	public MatchReplay(Team homeTeam, Team awayTeam, Arena arena, Avatar[] avatars) {
		this.homeTeam = homeTeam;
		this.awayTeam = awayTeam;
		this.arena = arena;
		actions = new ArrayList<AvatarAction>();
		iterator = 0;
		this.avatars = new Avatar[avatars.length];
		for (int i = 0; i < avatars.length; i++) {
			this.avatars[i] = avatars[i].clone();
		}
	}
	
	public void addActionRecord(AvatarAction action, long time) {
		action.setExecutionTime(time);
		actions.add(action);
	}
	
	public Arena getArena() {return arena;}
	public Avatar[] getInitialAvatars() {return avatars;}
	
	public AvatarAction getNextAction() {
		if (iterator >= actions.size()) return null;
		AvatarAction action = actions.get(iterator);
		iterator++;
		return action;
	}
	
	public AvatarAction peekNextAction() {
		if (iterator >= actions.size()) return null;
		return actions.get(iterator);
	}
	
	public boolean isOver() {
		return (iterator >= actions.size());
	}

}
