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

import java.awt.Color;
import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.util.Random;

import shai.lpc.ui.Tile;
import shai.lpc.ui.sprites.TreeSprite;

public class Tree extends GameObject {
	
	private int xTile, yTile;
	private int reloadTime;
	private int reloadIndex;
	private int tileset;
	private int patience;
	private int patienceRemaining;
	private int levelWidth, levelHeight;
	private BufferedImage sprite;
	private int spriteX, spriteY;
	
	public Tree(int xTile, int yTile) {
		this.xTile = xTile;
		this.yTile = yTile;
		this.tileset = 2;
		this.reloadTime = 50;
		this.reloadIndex = 0;
		this.patience = 20;
		this.levelWidth = Engine.getInstance().getLevelRowSize();
		this.levelHeight = Engine.getInstance().getLevelColumnSize();
		sprite = TreeSprite.getTreeSprite(0);
		spriteX = xTile * Tile.TILE_WIDTH - sprite.getWidth() / 2 + Tile.TILE_WIDTH / 2;
		spriteY = yTile * Tile.TILE_HEIGHT - sprite.getHeight() + Tile.TILE_HEIGHT / 2;
	}

	@Override
	public void tick() {
		if (reloadIndex == 0) {
			patienceRemaining = patience;
			generatePaint(xTile, yTile);
			reloadIndex = reloadTime;
		} else reloadIndex--;
	}
	
	private void generatePaint(int baseX, int baseY) {
		if (Engine.getInstance().getTilesetAt(baseX, baseY) == 0 && Engine.getInstance().isTileFree(baseX, baseY)) {
			Engine.getInstance().setTilesetAt(baseX, baseY, this.tileset);
		} else if (patienceRemaining > 0) {
			patienceRemaining--;
			Random rand = new Random();
			int direction = rand.nextInt(8) + 1;
			int newTileX = baseX;
			int newTileY = baseY;
			switch (direction) {
			case 1: newTileX--; newTileY--; break;
			case 2: newTileY--; break;
			case 3: newTileX++; newTileY--; break;
			case 4: newTileX--; break;
			case 5: newTileX++; break;
			case 6: newTileX--; newTileY++; break;
			case 7: newTileY++; break;
			case 8: newTileX++; newTileY++; break;
			}
			
			if (newTileX < 0) newTileX = 0;
			if (newTileX >= levelWidth) newTileX = levelWidth - 1;
			if (newTileY < 0) newTileY = 0;
			if (newTileY >= levelHeight) newTileY = levelHeight - 1;
			generatePaint(newTileX, newTileY);
		}
	}

	@Override
	public void draw(Graphics g) {
		//g.setColor(Color.GREEN);
		//g.fillRect(xTile * Tile.TILE_WIDTH, yTile * Tile.TILE_HEIGHT, 50, 100);
		if (sprite != null) {
			g.drawImage(sprite, spriteX, spriteY, null);
		}
	}

}
