package shai.lpc.ui;

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

import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

import shai.lpc.Engine;
import shai.lpc.ui.sprites.SpriteGenerator;

public class Tilemap {
	
	public static final String MAPS_FOLDER = "resources" + File.separator + "Maps" + File.separator;
	
	private int rowSize, columnSize; // In numbers of tiles
	private int[][] tilemapBase;
	private int[][] tilemapAddition;
	private int[][] tileset;
	private boolean[][] obstacles;
	private BufferedImage cachedImage;
	
	private int[] tilesetCount;
	
	public Tilemap(int rowSize, int columnSize) {
		this.rowSize = rowSize;
		this.columnSize = columnSize;
		tilemapBase = new int[rowSize][columnSize];
		tilemapAddition = new int[rowSize][columnSize];
		obstacles = new boolean[rowSize][columnSize];
		tilesetCount = new int[3];
		tileset = new int[rowSize][columnSize];
		for (int i = 0; i < rowSize; i++) {
			for (int j = 0; j < columnSize; j++) {
				tilemapBase[i][j] = 0;
				tilemapAddition[i][j] = 255;
				tileset[i][j] = 0;
				tilesetCount[0]++;
				obstacles[i][j] = false;
			}
		}
		updateCache();
	}
	
	public int getRowSize() {return rowSize;}
	public int getColumnSize() {return columnSize;}
	public int getWidth() {return rowSize * Tile.TILE_WIDTH;}
	public int getHeight() {return columnSize * Tile.TILE_HEIGHT;}
	
	public int getTileAt(int x, int y, boolean base) {
		if (base) {
			return tilemapBase[x][y];
		} else {
			return tilemapAddition[x][y];
		}
	}
	
	public int getTilesetCount(int tileset) {
		return tilesetCount[tileset];
	}
	
	public int getTilesetAt(int x, int y) {
		return tileset[x][y];
	}
	
	public void setTileset(int x, int y, int tileset, boolean connect) {
		this.tilesetCount[this.tileset[x][y]]--;
		this.tileset[x][y] = tileset;
		this.tilesetCount[tileset]++;
		setTile(x, y, tilemapBase[x][y], true);
		
		// If it's an edge tile, alter the background tile as well
		if (x == 1) {
			this.tileset[0][y] = tileset;
			setTile(0, y, tilemapBase[0][y], true);
		} else if (x == rowSize - 2) {
			this.tileset[rowSize - 1][y] = tileset;
			setTile(rowSize - 1, y, tilemapBase[rowSize - 1][y], true);
		}
		if (y == 1) {
			this.tileset[x][0] = tileset;
			setTile(x, 0, tilemapBase[x][0], true);
		} else if (y == columnSize - 2) {
			this.tileset[x][columnSize - 1] = tileset;
			setTile(x, columnSize - 1, tilemapBase[x][columnSize - 1], true);
		}
		
		if (x == 1 && y == 1) {
			this.tileset[0][0] = tileset;
			setTile(0, 0, tilemapBase[0][0], true);
		} else if (x == rowSize - 2 && y == columnSize - 2) {
			this.tileset[rowSize - 1][columnSize - 1] = tileset;
			setTile(rowSize - 1, columnSize - 1, tilemapBase[rowSize - 1][columnSize - 1], true);
		} else if (x == 1 && y == columnSize - 2) {
			this.tileset[0][columnSize - 1] = tileset;
			setTile(0, columnSize - 1, tilemapBase[0][columnSize - 1], true);
		} else if (x == rowSize - 2 && y == 1) {
			this.tileset[rowSize - 1][0] = tileset;
			setTile(rowSize - 1, 0, tilemapBase[rowSize - 1][0], true);
		}
		
		if (connect) {
			// Check for connections to the left
			int tileX = x - 1;
			while (tileX >= 0 && this.tileset[tileX][y] != tileset && !this.obstacles[tileX][y]) tileX--;
			if (tileX >= 0 && this.tileset[tileX][y] == tileset) {
				for (int i = tileX + 1; i < x; i++) {
					//this.tileset[i][y] = tileset;
					setTileset(i, y, tileset, false);
				}
			}
			// Check for connections to the right
			tileX = x + 1;
			while (tileX < rowSize && this.tileset[tileX][y] != tileset && !this.obstacles[tileX][y]) tileX++;
			if (tileX < rowSize && this.tileset[tileX][y] == tileset) {
				for (int i = tileX - 1; i > x; i--) {
					//this.tileset[i][y] = tileset;
					setTileset(i, y, tileset, false);
				}
			}
			// Check for connections to the top
			int tileY = y - 1;
			while (tileY >= 0 && this.tileset[x][tileY] != tileset && !this.obstacles[x][tileY]) tileY--;
			if (tileY >= 0 && this.tileset[x][tileY] == tileset) {
				for (int i = tileY + 1; i < y; i++) {
					//this.tileset[x][i] = tileset;
					setTileset(x, i, tileset, false);
				}
			}
			// Check for connections to the bottom
			tileY = y + 1;
			while (tileY < columnSize && this.tileset[x][tileY] != tileset && !this.obstacles[x][tileY]) tileY++;
			if (tileY < columnSize && this.tileset[x][tileY] == tileset) {
				for (int i = tileY - 1; i > y; i--) {
					//this.tileset[x][i] = tileset;
					setTileset(x, i, tileset, false);
				}
			}
		}
		
		if (tilesetCount[0] == 0) {
			Engine.getInstance().endGame();
		}
	}
	
	public double getPlayerControl(int playerId) {
		if (playerId == 1) {
			return (double) tilesetCount[1] / (double) (tilesetCount[1] + tilesetCount[2]);
		} else if (playerId == 2) {
			return (double) tilesetCount[2] / (double) (tilesetCount[1] + tilesetCount[2]);
		} else return 0;
	}
	
	public void setTile(int x, int y, int tileType, boolean base) {
		if (base) {
			tilemapBase[x][y] = tileType;
		} else {
			tilemapAddition[x][y] = tileType;
		}
		Graphics g = cachedImage.createGraphics();
		BufferedImage tileImage = Tile.getTileImage(tilemapBase[x][y], tileset[x][y]);
		if (tilemapAddition[x][y] != 255) {
			BufferedImage tileAdditionalImage = Tile.getTileImage(tilemapAddition[x][y], tileset[x][y]);
			tileImage = SpriteGenerator.mergeImages(tileImage, tileAdditionalImage);
		}
		g.drawImage(tileImage, x * Tile.TILE_WIDTH, y * Tile.TILE_HEIGHT, null);
		/*BufferedImage tileImage = Tile.getTileImage(tileType);
		int xOffset = x * Tile.TILE_WIDTH;
		int yOffset = y * Tile.TILE_HEIGHT;
		for (int i = 0; i < Tile.TILE_WIDTH; i++) {
			for (int j = 0; j < Tile.TILE_HEIGHT; j++) {
				cachedImage.setRGB(xOffset + i, yOffset + j, tileImage.getRGB(i, j));
			}
		}*/
	}
	
	public void setIsObstacle(int x, int y, boolean isObstacle) {
		if (!obstacles[x][y] && isObstacle) tilesetCount[0]--;
		else if (obstacles[x][y] && !isObstacle) tilesetCount[0]++;
		obstacles[x][y] = isObstacle;
	}
	
	public boolean isObstacle(int x, int y) {
		return obstacles[x][y];
	}
	
	/**
	 * To avoid drawing each tile separately, the whole tilemap is saved as a single image after creation. This means that if it's ever changed,
	 * this method must be called again for the changes to actually appear on screen.
	 */
	public void updateCache() {
		cachedImage = new BufferedImage(rowSize * Tile.TILE_WIDTH, columnSize * Tile.TILE_HEIGHT, BufferedImage.TYPE_INT_ARGB);
		Graphics g = cachedImage.createGraphics();
		for (int i = 0; i < rowSize; i++) {
			for (int j = 0; j < columnSize; j++) {
				BufferedImage tileImage = Tile.getTileImage(tilemapBase[i][j], tileset[i][j]);
				if (tilemapAddition[i][j] != 255) {
					BufferedImage tileAdditionalImage = Tile.getTileImage(tilemapAddition[i][j], tileset[i][j]);
					tileImage = SpriteGenerator.mergeImages(tileImage, tileAdditionalImage);
				}
				g.drawImage(tileImage, i * Tile.TILE_WIDTH, j * Tile.TILE_HEIGHT, null);
				/*for (int x = 0; x < Tile.TILE_WIDTH; x++) {
					for (int y = 0; y < Tile.TILE_HEIGHT; y++) {
						cachedImage.setRGB(x + (i * Tile.TILE_WIDTH), y + (j * Tile.TILE_HEIGHT), tileImage.getRGB(x, y));
					}
				}*/
			}
		}
	}
	
	public void draw(Graphics g, int xOffset, int yOffset) {	
		g.drawImage(cachedImage, xOffset, yOffset, null);
	}
	
	public void saveToFile(String filename) {
		try {
			FileOutputStream fos = new FileOutputStream(new File(MAPS_FOLDER + filename));
			fos.write(this.rowSize);
			fos.write(this.columnSize);
			for (int i = 0; i < rowSize; i++) {
				for (int j = 0; j < columnSize; j++) {
					fos.write(tilemapBase[i][j]);
					fos.write(tilemapAddition[i][j]);
				}
			}
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public static Tilemap loadFromFile(String filename) {
		Tilemap tilemap = null;
		try {
			FileInputStream fis = new FileInputStream(new File(MAPS_FOLDER + filename));
			int width = fis.read();
			int height = fis.read();
			tilemap = new Tilemap(width, height);
			for (int i = 0; i < width; i++) {
				for (int j = 0; j < height; j++) {
					tilemap.tilemapBase[i][j] = fis.read();
					tilemap.tilemapAddition[i][j] = fis.read();
				}
			}
			tilemap.updateCache();
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return tilemap;
	}

}
