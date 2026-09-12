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

import shai.lpc.model.Arena;
import shai.lpc.ui.Tilemap;
import shai.lpc.util.Point;

/**
 * This class represents an arena during combat. It differs from the Arena object in that the Arena object holds the general, static properties of
 * the arena, the ArenaInAction object holds the properties relevant for the current match, and will not remain after the match is over. An ArenaInAction
 * object is created at the begining of each match (based on an Arena object) and discarded when the match is over. 
 * @author Shai Shapira
 *
 */
public class ArenaInAction {
	
	private Arena arena;
	int width, height; // Duplicated from the Arena object, for ease of use.
	Avatar[][] avatars; // We keep locations twice - every Avatar objects remembers its location, and every location knows its Avatar.
	
	public ArenaInAction(Arena arena) {
		this.arena = arena;
		this.width = arena.getWidth();
		this.height = arena.getHeight();
		avatars = new Avatar[width][height];
	}
	
	public Tilemap getTilemap() {return arena.getTilemap();}
	
	public Point getSpawnPoint(int number, boolean homeTeam) {
		return arena.getSpawnPoint(number, homeTeam);
	}
	
	public boolean isPointVacant(int x, int y) {
		return (avatars[x][y] == null);
	}
	
	public void clearPoint(int x, int y) {
		avatars[x][y] = null;
	}
	
	public void placeAvatar(Avatar avatar, int x, int y) {
		avatars[x][y] = avatar;
	}

}
