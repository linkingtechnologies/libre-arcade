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

import shai.lpc.combat.ArenaInAction;
import shai.lpc.combat.Avatar;
import shai.lpc.combat.MatchEngine;

public class MovementAction extends AvatarAction {
	
	public static final int NORTH = 1;
	public static final int EAST = 2;
	public static final int SOUTH = 3;
	public static final int WEST = 4;
	
	private int direction;
	private int duration;
	private boolean successful;
	
	public MovementAction(int avatarIndex, int direction) {
		super(avatarIndex);
		this.direction = direction;
	}

	@Override
	public void executeAction(MatchEngine engine) {
		ArenaInAction arena = engine.getArena();
		Avatar avatar = engine.getAvatars()[avatarIndex];
		int currentX = avatar.getX();
		int currentY = avatar.getY();
		int destX = currentX;
		int destY = currentY;
		if (direction == NORTH) {
			destY--;
		} else if (direction == EAST) {
			destX++;
		} else if (direction == SOUTH) {
			destY++;
		} else if (direction == WEST) {
			destX--;
		}
		if (arena.isPointVacant(destX, destY)) {
			arena.clearPoint(currentX, currentY);
			arena.placeAvatar(avatar, destX, destY);
			avatar.place(destX, destY);
			successful = true;
			System.out.println(avatar.getName() + " moved to " + destX + ", " + destY);
		} else {
			successful = false;
			System.out.println(avatar.getName() + " failed to moved to " + destX + ", " + destY);
		}
		duration = (int) avatar.getMovementSpeed();
		avatar.setCurrentAction(this);
	}

	@Override
	public int getDuration() {
		return duration;
	}
	
	public int getDirection() {return direction;}
	public boolean isSuccessful() {return successful;}

}
