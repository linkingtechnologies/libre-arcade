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

import shai.lpc.combat.Avatar;
import shai.lpc.combat.MatchEngine;
import shai.lpc.util.Point;

/**
 * The action of a gladiator's placement in the arena in the begining of the match. This action happens exactly one in the begining of the match, and
 * requires no time to complete.
 * @author Shai Shapira
 *
 */
public class PlacementAction extends AvatarAction {
	
	private int x, y; // In tiles
	
	public PlacementAction(int avatarIndex, int x, int y) {
		super(avatarIndex);
		this.x = x;
		this.y = y;
	}
	
	public PlacementAction(int avatarIndex, Point p) {
		super(avatarIndex);
		this.x = p.x;
		this.y = p.y;
	}

	@Override
	public void executeAction(MatchEngine engine) {
		Avatar avatar = engine.getAvatars()[avatarIndex];
		System.out.println(avatar.getName() + " placed in " + x + ", " + y);
		avatar.place(x, y);
		engine.getArena().clearPoint(x, y);
		engine.getArena().placeAvatar(avatar, x, y);
	}
	
	@Override
	public int getDuration() {
		return 1;
	}

}
