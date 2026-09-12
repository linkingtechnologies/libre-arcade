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

public class WaitAction extends AvatarAction {
	
	private int amount;
	
	public WaitAction(int avatarIndex) {
		super(avatarIndex);
		amount = 100;
	}
	
	public WaitAction(int avatarIndex, int amount) {
		super(avatarIndex);
		this.amount = amount;
	}

	@Override
	public void executeAction(MatchEngine engine) {
		// Do nothing.
	}
	
	@Override
	public int getDuration() {
		return amount;
	}

}
