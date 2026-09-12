package shai.lpc;

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
import java.util.Random;

import shai.lpc.ui.Tilemap;

public class LevelGenerator {
	
	public static final int TILE_BASIC = 10;
	public static final int TILE_BASIC_2 = 15;
	public static final int TILE_BASIC_3 = 16;
	public static final int TILE_BASIC_4 = 17;
	public static final int TILE_WATER_BASIC = 46;
	public static final int TILE_WATER_PATCH = 36;
	public static final int TILE_WATER_PATCH2 = 37;
	public static final int TILE_WATER_INNER_SE = 38;
	public static final int TILE_WATER_INNER_NE = 39;
	public static final int TILE_WATER_INNER_SW = 40;
	public static final int TILE_WATER_INNER_NW = 41;
	public static final int TILE_WATER_OUTER_NW = 42;
	public static final int TILE_WATER_OUTER_N = 43;
	public static final int TILE_WATER_OUTER_NE = 44;
	public static final int TILE_WATER_OUTER_W = 45;
	public static final int TILE_WATER_OUTER_E = 47;
	public static final int TILE_WATER_OUTER_SW = 48;
	public static final int TILE_WATER_OUTER_S = 49;
	public static final int TILE_WATER_OUTER_SE = 50;
	
	public static Tilemap generateLevel(int rowSize, int columnSize) {
		return generateLevel(rowSize, columnSize, 0.1, false);
	}
	
	public static Tilemap generateLevel(int rowSize, int columnSize, boolean multiplayer) {
		return generateLevel(rowSize, columnSize, 0.1, multiplayer);
	}
	
	public static Tilemap generateLevel(int rowSize, int columnSize, double obstacleRatio, boolean multiplayer) {
		Tilemap map = new Tilemap(rowSize, columnSize);
		
		Random random = new Random();
		
		if (multiplayer) { // Make the arena symmetric
			for (int i = 0; i < rowSize / 2 + 1; i++) {
				for (int j = 0; j < columnSize; j++) {
					map.setTile(i, j, getBasicTile(), true);
					map.setTile(rowSize - i - 1, columnSize - j - 1, getBasicTile(), true);
					map.setIsObstacle(i, j, false);
					map.setIsObstacle(rowSize - i - 1, columnSize - j - 1, false);
					if (random.nextDouble() < obstacleRatio) {
						map.setTile(i, j, TILE_WATER_PATCH, false);
						map.setIsObstacle(i, j, true);
						map.setTile(rowSize - i - 1, columnSize - j - 1, TILE_WATER_PATCH, false);
						map.setIsObstacle(rowSize - i - 1, columnSize - j - 1, true);
					}
				}
			}			
		} else {
			for (int i = 0; i < rowSize; i++) {
				for (int j = 0; j < columnSize; j++) {
					map.setTile(i, j, getBasicTile(), true);
					map.setIsObstacle(i, j, false);
					if (random.nextDouble() < obstacleRatio) {
						map.setTile(i, j, TILE_WATER_PATCH, false);
						map.setIsObstacle(i, j, true);
					}
				}
			}
		}
		
		// Spawn point
		map.setTile(rowSize / 2, columnSize / 2, getBasicTile(), false);
		map.setIsObstacle(rowSize / 2, columnSize / 2, false);
		
		for (int i = 2; i < rowSize - 2; i++) {
			map.setIsObstacle(i, 0, true);
			map.setIsObstacle(i, 1, false);
			map.setTile(i, 0, TILE_WATER_BASIC, false);
			map.setTile(i, 1, TILE_WATER_OUTER_S, false);
			map.setTile(i, columnSize - 2, TILE_WATER_OUTER_N, false);
			map.setTile(i, columnSize - 1, TILE_WATER_BASIC, false);
			map.setIsObstacle(i, columnSize - 2, false);
			map.setIsObstacle(i, columnSize - 1, true);
		}
		
		for (int i = 2; i < columnSize - 2; i++) {
			map.setIsObstacle(0, i, true);
			map.setIsObstacle(1, i, false);
			map.setTile(0, i, TILE_WATER_BASIC, false);
			map.setTile(1, i, TILE_WATER_OUTER_E, false);
			map.setTile(rowSize - 2, i, TILE_WATER_OUTER_W, false);
			map.setTile(rowSize - 1, i, TILE_WATER_BASIC, false);
			map.setIsObstacle(rowSize - 2, i, false);
			map.setIsObstacle(rowSize - 1, i, true);
		}
		
		map.setIsObstacle(1, 1, false);
		map.setIsObstacle(1, columnSize - 1, false);
		map.setIsObstacle(rowSize - 1, columnSize - 1, false);
		map.setIsObstacle(rowSize - 1, 1, false);
		
		map.setTile(1, 1, TILE_WATER_INNER_SE, false);
		map.setTile(1, columnSize - 2, TILE_WATER_INNER_NE, false);
		map.setTile(rowSize - 2, 1, TILE_WATER_INNER_SW, false);
		map.setTile(rowSize - 2, columnSize - 2, TILE_WATER_INNER_NW, false);
		map.setTile(0, 0, TILE_WATER_BASIC, false);
		map.setTile(1, 0, TILE_WATER_BASIC, false);
		map.setTile(0, 1, TILE_WATER_BASIC, false);
		map.setTile(rowSize - 1, 0, TILE_WATER_BASIC, false);
		map.setTile(rowSize - 2, 0, TILE_WATER_BASIC, false);
		map.setTile(rowSize - 1, 1, TILE_WATER_BASIC, false);
		map.setTile(0, columnSize - 1, TILE_WATER_BASIC, false);
		map.setTile(1, columnSize - 1, TILE_WATER_BASIC, false);
		map.setTile(0, columnSize - 2, TILE_WATER_BASIC, false);
		map.setTile(rowSize - 1, columnSize - 1, TILE_WATER_BASIC, false);
		map.setTile(rowSize - 2, columnSize - 1, TILE_WATER_BASIC, false);
		map.setTile(rowSize - 1, columnSize - 2, TILE_WATER_BASIC, false);
		
		map.setIsObstacle(0, 0, true);
		map.setIsObstacle(0, columnSize - 1, true);
		map.setIsObstacle(rowSize - 1, 0, true);
		map.setIsObstacle(rowSize - 1, columnSize - 1, true);
		map.setIsObstacle(0, 0, true);
		map.setIsObstacle(1, 0, true);
		map.setIsObstacle(0, 1, true);
		map.setIsObstacle(rowSize - 1, 0, true);
		map.setIsObstacle(rowSize - 2, 0, true);
		map.setIsObstacle(rowSize - 1, 1, true);
		map.setIsObstacle(0, columnSize - 1, true);
		map.setIsObstacle(1, columnSize - 1, true);
		map.setIsObstacle(0, columnSize - 2, true);
		map.setIsObstacle(rowSize - 1, columnSize - 1, true);
		map.setIsObstacle(rowSize - 2, columnSize - 1, true);
		map.setIsObstacle(rowSize - 1, columnSize - 2, true);
		
		return map;
	}
	
	public static List<GameObject> generateOpponents(Tilemap level) {
		return generateOpponents(level, 8);
	}
	
	public static List<GameObject> generateOpponents(Tilemap level, int numOfTrees) {
		List<GameObject> objects = new ArrayList<GameObject>();
		int rowSize = level.getRowSize();
		int columnSize = level.getColumnSize();
		
		Random random = new Random();
		
		int[] treeXs = new int[numOfTrees];
		int[] treeYs = new int[numOfTrees];
		for (int i = 0; i < numOfTrees; i++) {
			treeXs[i] = 2 + random.nextInt(rowSize - 4);
			treeYs[i] = 2 + random.nextInt(columnSize - 4);
			while (level.isObstacle(treeXs[i], treeYs[i])) {
				treeXs[i]++;
				if (treeXs[i] >= rowSize - 2) {
					treeXs[i] = 2;
					treeYs[i]++;
					if (treeYs[i] >= columnSize - 2) treeYs[i] = 2;
				}
			}
			Tree tree = new Tree(treeXs[i], treeYs[i]);
			objects.add(tree);
			level.setIsObstacle(treeXs[i], treeYs[i], true);
		}
		return objects;
	}
	
	private static int getBasicTile() {
		Random random = new Random();
		int roll = random.nextInt(4);
		if (roll == 0) return TILE_BASIC;
		else if (roll == 1) return TILE_BASIC_2;
		else if (roll == 2) return TILE_BASIC_3;
		else return TILE_BASIC_4;
	}

}
