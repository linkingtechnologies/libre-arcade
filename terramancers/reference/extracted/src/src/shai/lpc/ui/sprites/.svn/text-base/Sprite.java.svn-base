package shai.lpc.ui.sprites;

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
import java.io.IOException;

import javax.imageio.ImageIO;

import shai.lpc.Terramancer;
import shai.lpc.ui.Tile;
import shai.lpc.ui.UIUtils;

public class Sprite {
	
	public static final int SPRITE_WIDTH = 64;
	public static final int SPRITE_HEIGHT = 64;
	
	private static final int WALKING_SPRITESHEET_LENGTH = 9;
	
	private BufferedImage spriteSheet;
	
	private Terramancer character;
	
	private int animationFrame;
	private int animationFrameCounter;
	private boolean animating;
	
	private Sprite() {
		//spriteSheet = spriteSheets[i] = ImageIO.read(new File(filenames[i]));
	}
	
	public static Sprite getTerramancerSprite(Terramancer terramancer) {
		Sprite sprite = new Sprite();
		
		sprite.character = terramancer;
		int tileset = Tile.getTileType(terramancer.getTileset());
		
		String filename = AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "Mage.png";
		
		if (tileset == 0) {
			filename = AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "professor.png";
		} else if (tileset == 1) {
			filename = AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "Baldric.png";
		} else if (tileset == 2) {
			filename = AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "princess.png";
		} else if (tileset == 3) {
			filename = AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "FBI.png";
		} else if (tileset == 4) {
			filename = AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "Astraea.png";
		}
		
		try {
			sprite.spriteSheet = ImageIO.read(new File(filename));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return sprite;
	}
	
	public void draw(Graphics g, int locationX, int locationY) {
		int spriteSheetY = getSpriteSheetY(character.facingDirection());
		int spriteSheetX = 0;
		
		int x = locationX - SPRITE_WIDTH / 2;
		int y = locationY - SPRITE_HEIGHT / 2;
		
		if (character.isMoving()) {
			spriteSheetX = animationFrame * SPRITE_WIDTH;
			if (animationFrameCounter == 0) {
				animationFrame++;
				if (animationFrame >= WALKING_SPRITESHEET_LENGTH) animationFrame = 0;
				animationFrameCounter = 5;
			} else animationFrameCounter--;
		}
			
		g.drawImage(spriteSheet, x, y, x + SPRITE_WIDTH, y + SPRITE_HEIGHT,
					spriteSheetX, spriteSheetY, spriteSheetX + SPRITE_WIDTH - 1, spriteSheetY + SPRITE_HEIGHT - 1, null);
	}
	
	private int getSpriteSheetY(int facingDirection) {
		if (facingDirection == Terramancer.DIRECTION_UP) return 0;
		else if (facingDirection == Terramancer.DIRECTION_LEFT || facingDirection == Terramancer.DIRECTION_UP_LEFT || facingDirection == Terramancer.DIRECTION_DOWN_LEFT) return SPRITE_WIDTH;
		else if (facingDirection == Terramancer.DIRECTION_DOWN) return SPRITE_WIDTH * 2;
		else return SPRITE_WIDTH * 3;
	}

}
