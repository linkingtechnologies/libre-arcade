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

import shai.lpc.ui.Tilemap;
import shai.lpc.util.Point;

public class Arena {
	
	private String name;
	private Tilemap tilemap;
	private int width, height; // In tiles
	
	public Arena(String name) {
		this.name = name;
		width = 26;
		height = 20;
		tilemap = new Tilemap(width, height);
	}
	
	public int getWidth() {return width;}
	public int getHeight() {return height;}
	public String getName() {return name;}
	public Tilemap getTilemap() {return tilemap;}
	
	public Point getSpawnPoint(int number, boolean homeTeam) {
		int x = homeTeam ? 0 : width - 2;
		int y = (number - 1) * (height / 5);
		return new Point(x, y);
	}

}
