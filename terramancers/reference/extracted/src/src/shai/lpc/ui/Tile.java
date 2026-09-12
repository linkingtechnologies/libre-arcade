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

import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import javax.imageio.ImageIO;

import shai.lpc.log.Logger;

public class Tile {
	
	// Dimensions of tiles, in pixels
	public static final int TILE_WIDTH = 32;
	public static final int TILE_HEIGHT = 32;
	
	private static final String TILE_DEF_BASE_FOLDER = "resources" + File.separator;
	private static final String TILE_IMAGES_BASE_FOLDER = "resources" + File.separator + "tiles" + File.separator;
	
	//private static Map<String, Integer> tileImageNames;
	private static Tile[] tilesets;
	private static int nextId;
	private String[] tileNames;
	private BufferedImage[] tileImages;
	private static Tile[] generalTiles;
	private int id;
	
	public static BufferedImage getTileImage(int tileNum) {
		return tilesets[0].tileImages[tileNum];
	}
	
	public static BufferedImage getTileImage(int tileNum, int tileset) {
		return tilesets[tileset].tileImages[tileNum];
	}
	
	/*public static BufferedImage getTileImage(String tileSymbol) {
		return tileImages[tileImageNames.get(tileSymbol)];
	}*/
	
	public static String[] getPossibleTiles() {
		//return tileImageNames.keySet().toArray(new String[0]);
		return tilesets[0].tileNames;
	}
	
	public static void loadTilesets() throws IOException {
		generalTiles = new Tile[6];
		generalTiles[0] = loadTileset("sand.cfg");
		generalTiles[1] = loadTileset("farmland.cfg");
		generalTiles[2] = loadTileset("grass.cfg");
		generalTiles[3] = loadTileset("cement.cfg");
		generalTiles[4] = loadTileset("dirt.cfg");
		generalTiles[5] = loadTileset("volcanic.cfg");
		
		tilesets = new Tile[3];
		loadRandomTiles();
	}
	
	public static int getTileType(int tileset) {
		return tilesets[tileset].id;
	}
	
	public static void loadRandomTiles() {
		List<Integer> tilesetTypes = new ArrayList<Integer>();
		tilesetTypes.add(0);
		tilesetTypes.add(1);
		tilesetTypes.add(2);
		tilesetTypes.add(3);
		tilesetTypes.add(4);
		tilesetTypes.add(5);
		
		Random random = new Random();
		tilesets[0] = generalTiles[tilesetTypes.remove(random.nextInt(6))];
		tilesets[1] = generalTiles[tilesetTypes.remove(random.nextInt(5))];
		tilesets[2] = generalTiles[tilesetTypes.remove(random.nextInt(4))];
	}
	
	private static Tile loadTileset(String filename) throws IOException {
		Tile tileset = new Tile();
		InputStreamReader isr = null;
		isr = new InputStreamReader(new FileInputStream(TILE_DEF_BASE_FOLDER + filename), "UTF-16");
		BufferedReader br = new BufferedReader(isr);
		tileset.id = nextId;
		nextId++;
		
		//tileImageNames = new HashMap<String, Integer>();
		tileset.tileNames = new String[256];
		tileset.tileImages = new BufferedImage[256];
		int index = 0;
		
		String line = br.readLine();
		while (line != null) {
			tileset.addTile(index, line);
			index++;
			line = br.readLine();
		}
		
		String[] tempTileNames = new String[index];
		BufferedImage[] tempTileImages = new BufferedImage[index];
		for (int i = 0; i < index; i++) {
			tempTileNames[i] = tileset.tileNames[i];
			tempTileImages[i] = tileset.tileImages[i];
		}
		
		tileset.tileNames = tempTileNames;
		tileset.tileImages = tempTileImages;
		
		return tileset;
	}
	
	/**
	 * Get the tile image from the appropriate image file, based on the tile definition in the tile definition file, and add it to the tiles map.
	 * @param tileDefinition String from the tile definition file, must have the form "<Symbol>#<Image file name>[#<X Offset>#<Y Offset>]"
	 */
	private void addTile(int index, String tileDefinition) throws IOException {
		String[] parts = tileDefinition.split("#");
		
		if (parts.length == 2) {
			String c = parts[0];
			String imageFileName = TILE_IMAGES_BASE_FOLDER + parts[1];
			tileImages[index] = getImageFromFile(imageFileName, 0, 0);
			//tileImageNames.put(c, index);
			tileNames[index] = c;
		} else if (parts.length >= 4) {
			String c = parts[0];
			String imageFileName = TILE_IMAGES_BASE_FOLDER + parts[1];
			int xOffset = Integer.valueOf(parts[2]);
			int yOffset = Integer.valueOf(parts[3]);
			tileImages[index] = getImageFromFile(imageFileName, xOffset, yOffset);
			//tileImageNames.put(c, index);
			tileNames[index] = c;
		} else {
			Logger.getInstance().log("Malformed tile definition file");
		}
	}
	
	private static BufferedImage getImageFromFile(String filename, int xTilesOffset, int yTilesOffset) throws IOException {
		BufferedImage originalImage = ImageIO.read(new File(filename));
		BufferedImage tileImage = new BufferedImage(TILE_WIDTH, TILE_HEIGHT, BufferedImage.TYPE_INT_ARGB);
		
		int xOffset = xTilesOffset * TILE_WIDTH;
		int yOffset = yTilesOffset * TILE_HEIGHT;
		
		for (int x = 0; x < TILE_WIDTH; x++) {
			for (int y = 0; y < TILE_HEIGHT; y++) {
				tileImage.setRGB(x, y, originalImage.getRGB(x + xOffset, y + yOffset));
			}
		}
		
		return tileImage;
	}

}
