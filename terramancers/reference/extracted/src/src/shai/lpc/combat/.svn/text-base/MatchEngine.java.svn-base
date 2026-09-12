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
import java.util.Collections;
import java.util.List;

import shai.lpc.combat.actions.AvatarAction;
import shai.lpc.combat.actions.PlacementAction;
import shai.lpc.combat.actions.WaitAction;
import shai.lpc.model.Arena;
import shai.lpc.model.Gladiator;
import shai.lpc.model.Team;

/**
 * The class that performs the actual combat. Note that no user interaction is involved - The engine is given the teams and arena, performs the entire
 * combat automatically, and generates a replay that can later be viewed.
 * @author Shai Shapira
 *
 */
public class MatchEngine {
	
	private static final long MAX_MATCH_TIME = 20000;
	
	private ArenaInAction arena;
	private long clock;
	private List<Integer> avatarIndices; // Sorted by initiative
	private Avatar[] avatars;
	private boolean matchOver;
	private int homeAvatarsRemaining;
	private int awayAvatarsRemaining;
	MatchReplay replay;
	
	public MatchEngine() {
		avatarIndices = new ArrayList<Integer>();
	}
	
	public ArenaInAction getArena() {return arena;}
	
	public MatchReplay runMatch(Team teamA, Team teamB, Arena arena) {
		matchOver = false;
		clock = 0;
		this.arena = new ArenaInAction(arena);
		
		Gladiator[] teamALineup = teamA.getLineup();
		Gladiator[] teamBLineup = teamB.getLineup();
		
		avatars = new Avatar[teamALineup.length + teamBLineup.length];
		
		for (int i = 0; i < teamALineup.length; i++) {
			avatarIndices.add(i);
			homeAvatarsRemaining++;
			avatars[i] = new Avatar(this, i, teamALineup[i], true);
		}
		for (int i = 0; i < teamBLineup.length; i++) {
			avatarIndices.add(teamALineup.length + i);
			awayAvatarsRemaining++;
			avatars[teamALineup.length + i] = new Avatar(this, (teamALineup.length + i), teamBLineup[i], false);
		}
		
		replay = new MatchReplay(teamA, teamB, arena, avatars);
		
		Collections.sort(avatarIndices, new InitiativeComparator(avatars));
		
		while (!isMatchOver()) {
			executeNextAction();
		}
		
		return replay;
	}
	
	public void avatarEliminated(Avatar avatar) {
		if (avatar.isFromHomeTeam()) {
			homeAvatarsRemaining--;
		} else {
			awayAvatarsRemaining--;
		}
	}
	
	public Avatar[] getAvatars() {
		return avatars;
	}
	
	private void executeNextAction() {
		Avatar nextAvatar = avatars[avatarIndices.get(0)];
		AvatarAction action = nextAvatar.getNextAction();
		if (action == null) {
			action = new WaitAction(avatarIndices.get(0));
		}
		
		clock = nextAvatar.getTimeOfNextAction();
		action.executeAction(this);
		nextAvatar.chooseNextAction(clock + action.getDuration());
		replay.addActionRecord(action, clock);
		
		Collections.sort(avatarIndices, new InitiativeComparator(avatars));
		matchOver = true;
	}
	
	private boolean isMatchOver() {
		return (homeAvatarsRemaining == 0 || awayAvatarsRemaining == 0 || clock >= MAX_MATCH_TIME);
	}
	
	public void startMatchReplay(MatchReplay replay) {
		this.replay = replay;
		this.arena = new ArenaInAction(replay.getArena());
		
		Avatar[] avatarCopies = replay.getInitialAvatars();
		this.avatars = new Avatar[avatarCopies.length];
		for (int i = 0; i < avatars.length; i++) {
			avatars[i] = avatarCopies[i].clone();
		}
		
		// Perform placement actions
		while (replay.peekNextAction() instanceof PlacementAction) {
			AvatarAction action = replay.getNextAction();
			action.executeAction(this);
		}
	}
	
	public void advanceMatchReplay(long targetTime) {
		while (!replay.isOver() && replay.peekNextAction().getExecutionTime() < targetTime) {
			AvatarAction action = replay.getNextAction();
			action.executeAction(this);
			avatars[action.getAvatarIndex()].setNextAction(action.getNextAction());
		}
	}
}
