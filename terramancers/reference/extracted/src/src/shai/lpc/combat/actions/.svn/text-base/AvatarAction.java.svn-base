package shai.lpc.combat.actions;

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

import shai.lpc.combat.MatchEngine;

/**
 * This is an unmbrella class for avatar actions - everything an avatar does starts with an AvatarAction object. The action is sent to the match engine,
 * which rolls the neccessary dice and computes the result. The dice rolls are updated into the AvatarActionRecord object, to be put in the MatchReplay
 * object. This way, everything that happens in the match is later fully reproduceable by the replay mechanism.
 * @author Shai Shapira
 *
 */
public abstract class AvatarAction {
	
	protected long executionTime;
	protected int avatarIndex;
	protected AvatarAction nextAction;
	
	public AvatarAction(int avatarIndex) {
		this.avatarIndex = avatarIndex;
	}
	
	public void setExecutionTime(long executionTime) {this.executionTime = executionTime;}
	public long getExecutionTime() {return executionTime;}
	
	public void setNextAction(AvatarAction nextAction) {this.nextAction = nextAction;}
	public AvatarAction getNextAction() {return nextAction;}
	
	public int getAvatarIndex() {return avatarIndex;}
	
	public abstract void executeAction(MatchEngine engine);
	public abstract int getDuration();

}
