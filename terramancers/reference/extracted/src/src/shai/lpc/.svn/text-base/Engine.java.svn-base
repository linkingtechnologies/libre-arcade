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

import shai.lpc.ui.Tile;
import shai.lpc.ui.Tilemap;

public class Engine {
	
	private static Engine instance;
	
	private Terramancer[] players;
	private List<GameObject> objects;
	private Tilemap currentLevel;
	
	private int previousDifficulty;
	
	private Engine() {}
	
	public static Engine getInstance() {
		if (instance == null) {
			instance = new Engine();
		}
		return instance;
	}
	
	public Terramancer[] getPlayers() {return players;}
	public List<GameObject> getObjects() {return objects;}
	
	/**
	 * Start a non-interactive game, just for showing on the background of the menu.
	 */
	public void startExhibition() {
		int screenWidth = Main.getScreenWidth();
		int screenHeight = Main.getScreenHeight();
		int rowSize = screenWidth / Tile.TILE_WIDTH + 1;
		int columnSize = screenHeight / Tile.TILE_HEIGHT + 1;
		
		currentLevel = LevelGenerator.generateLevel(rowSize, columnSize, 0.01, false);
		players = new Terramancer[0];
		objects = LevelGenerator.generateOpponents(currentLevel, 8);
	}
	
	public void startSinglePlayerGame() {
		startSinglePlayerGame(previousDifficulty);
	}
	
	public void startSinglePlayerGame(int difficultyLevel) {
		//currentLevel = Tilemap.loadFromFile("Map.map");
		
		previousDifficulty = difficultyLevel;
		Tile.loadRandomTiles();
		
		int screenWidth = Main.getScreenWidth();
		int screenHeight = Main.getScreenHeight();
		int rowSize = screenWidth / Tile.TILE_WIDTH + 1;
		int columnSize = screenHeight / Tile.TILE_HEIGHT + 1;
		
		int numberOfTrees = 0;
		double obstacleRatio = 0.0;
		
		if (difficultyLevel == 1) {
			numberOfTrees = 6;
			obstacleRatio = 0.02;
		} else if (difficultyLevel == 2) {
			numberOfTrees = 8;
			obstacleRatio = 0.05;
		} else if (difficultyLevel == 3) {
			numberOfTrees = 10;
			obstacleRatio = 0.08;
		}
		
		currentLevel = LevelGenerator.generateLevel(rowSize, columnSize, obstacleRatio, false);
		
		Terramancer[] playersArray = new Terramancer[1];
		playersArray[0] = new Terramancer(1);
		playersArray[0].setLocation(screenWidth / 2 - 32, screenHeight / 2 - 32);
		
		players = playersArray;
		//players[0] = new Terramancer(1);
		//players[0].setLocation(screenWidth / 2 - 32, screenHeight / 2 - 32);
		
		//objects = new ArrayList<GameObject>();
		//Tree tree = new Tree(10, 10);
		//objects.add(tree);
		objects = LevelGenerator.generateOpponents(currentLevel, numberOfTrees);
	}
	
	public void startMultiplayerGame() {
		int screenWidth = Main.getScreenWidth();
		int screenHeight = Main.getScreenHeight();
		int rowSize = screenWidth / Tile.TILE_WIDTH + 1;
		int columnSize = screenHeight / Tile.TILE_HEIGHT + 1;
		Tile.loadRandomTiles();
		
		currentLevel = LevelGenerator.generateLevel(rowSize, columnSize, 0.05, true);
		
		Terramancer[] playersArray = new Terramancer[2];
		playersArray[0] = new Terramancer(1);
		playersArray[0].setLocation(Tile.TILE_WIDTH + 32, Tile.TILE_HEIGHT + 32);
		playersArray[1] = new Terramancer(2);
		playersArray[1].setLocation(screenWidth - Tile.TILE_WIDTH, screenHeight - Tile.TILE_HEIGHT);
		players = playersArray;
		
		objects = new ArrayList<GameObject>();
	}
	
	public int getPlayerControl(int playerId) {
		return (int) (currentLevel.getPlayerControl(playerId) * 100);
	}
	
	public void moveRight(int id) {if (id < players.length) players[id].moveRight();};
	public void moveUp(int id) {if (id < players.length) players[id].moveUp();};
	public void moveLeft(int id) {if (id < players.length) players[id].moveLeft();};
	public void moveDown(int id) {if (id < players.length) players[id].moveDown();};
	public void stopRight(int id) {if (id < players.length) players[id].stopMovingRight();};
	public void stopUp(int id) {if (id < players.length) players[id].stopMovingUp();};
	public void stopLeft(int id) {if (id < players.length) players[id].stopMovingLeft();};
	public void stopDown(int id) {if (id < players.length) players[id].stopMovingDown();};
	
	public Tilemap getCurrentLevel() {
		return currentLevel;
	}
	
	public double getPlayerSpeed(int tileset) {
		int friendlyTiles = currentLevel.getTilesetCount(tileset);
		int enemyTiles = currentLevel.getTilesetCount(3 - tileset);
		int neutralTiles = currentLevel.getTilesetCount(0);
		int totalTiles = friendlyTiles + enemyTiles + neutralTiles;
		double speed = (((double) friendlyTiles * 5 + (double) (0.1 * neutralTiles)) / (double) totalTiles) * Terramancer.MAX_SPEED;
		return speed;
	}
	
	public boolean isPointFree(double x, double y) {
		return !currentLevel.isObstacle(getTileXAtPoint(x), getTileYAtPoint(y));
	}
	
	public boolean isTileFree(int x, int y) {
		return !currentLevel.isObstacle(x, y);
	}
	
	public int getTilesetAt(int x, int y) {
		return currentLevel.getTilesetAt(x, y);
	}
	
	public void setTilesetAt(int x, int y, int tileset) {
		currentLevel.setTileset(x, y, tileset, false);
	}
	
	public int getTilesetAtCoordinates(double x, double y) {
		return currentLevel.getTilesetAt(getTileXAtPoint(x), getTileYAtPoint(y));
	}
	
	public void setTilesetAtCoordinates(double x, double y, int tileset) {
		currentLevel.setTileset(getTileXAtPoint(x), getTileYAtPoint(y), tileset, true);
	}
	
	public int getTileXAtPoint(double x) {
		return (int) (x / Tile.TILE_WIDTH);
	}
	
	public int getTileYAtPoint(double y) {
		return (int) (y / Tile.TILE_HEIGHT);
	}
	
	public void endGame() {
		if (players.length == 1) {
			Main.endSinglePlayerGame();
		} else if (players.length == 2) {
			Main.endMultiplayerGame();
		}
	}
	
	public int getLevelWidth() {return currentLevel.getWidth();}
	public int getLevelHeight() {return currentLevel.getHeight();}
	public int getLevelRowSize() {return currentLevel.getRowSize();}
	public int getLevelColumnSize() {return currentLevel.getColumnSize();}
	
	public void tick() {
		if (players != null) {
			for (int i = 0; i < players.length; i++) {
				players[i].tick();
			}
		}
		if (objects != null) {
			for (GameObject obj : objects) {
				obj.tick();
			}
		}
	}

}
