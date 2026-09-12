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

import java.awt.Color;
import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.Random;

import shai.lpc.combat.Avatar;
import shai.lpc.combat.actions.AvatarAction;
import shai.lpc.combat.actions.MovementAction;
import shai.lpc.model.Gladiator;
import shai.lpc.ui.Tile;

public class AvatarSprite {
	
	public static final String SPRITE_IMAGES_BASE_FOLDER = "resources" + File.separator + "Characters" + File.separator;
	public static final int SPRITE_WIDTH = 64;
	public static final int SPRITE_HEIGHT = 64;
	
	private static final int WALKING_SPRITESHEET_LENGTH = 9;
	
	private static boolean first = true;
	
	private BufferedImage walkingSpriteSheet;
	private Avatar avatar;
	private int animationFrame;
	private int animationFrameCounter;
	
	public static BufferedImage getPortrait(Gladiator gladiator) {
		BufferedImage portrait = SpriteGenerator.generateMaleSprite()[0].getSubimage(0, SPRITE_HEIGHT * 2, SPRITE_WIDTH, SPRITE_HEIGHT);
		return portrait;
	}
	
	public AvatarSprite(Avatar avatar) {
		this.avatar = avatar;
		if ((new Random()).nextBoolean()) {
			walkingSpriteSheet = SpriteGenerator.generateMaleSprite()[0];
		} else {
			walkingSpriteSheet = SpriteGenerator.generateFemaleSprite()[0];
		}
		if (first) {
			first = false;
			/*List<Integer> colors = new ArrayList<Integer>();
			for (int i = 0; i < walkingSpriteSheet.getWidth(); i++) {
				for (int j = 0; j < walkingSpriteSheet.getHeight(); j++) {
					int color = walkingSpriteSheet.getRGB(i, j);
					if (!colors.contains(color)) {
						colors.add(color);
					}
				}
			}
			System.out.println("Colors:\n" + colors);*/
			/*for (int i = 0; i < walkingSpriteSheet.getWidth(); i++) {
				for (int j = 0; j < walkingSpriteSheet.getHeight(); j++) {
					int color = walkingSpriteSheet.getRGB(i, j);
					if (color == COLOR_1) {
						walkingSpriteSheet.setRGB(i, j, getARGBColor(255, 0, 0, 255));
					}
				}
			}*/
		}
	}
	
	public void draw(Graphics g, int xOffset, int yOffset, long currentTime) {
		int x = xOffset + avatar.getX() * Tile.TILE_WIDTH;
		int y = yOffset + avatar.getY() * Tile.TILE_HEIGHT;
		int spriteSheetY = (avatar.isFromHomeTeam()) ? SPRITE_HEIGHT * 3 : SPRITE_HEIGHT;
		int spriteSheetX = 0;
		AvatarAction nextAction = avatar.getNextAction();
		if (nextAction instanceof MovementAction && ((MovementAction) nextAction).isSuccessful()) {
			MovementAction movementAction = (MovementAction) nextAction;
			long endTime = movementAction.getExecutionTime();
			double movementFraction = 1 - ((double) (endTime - currentTime) / movementAction.getDuration());
			
			//System.out.println("End time: " + endTime + " ; Current time: " + currentTime + " ; Movement fraction: " + movementFraction);
			
			if (movementAction.getDirection() == MovementAction.NORTH) {
				y -= (int) (movementFraction * Tile.TILE_HEIGHT);
				spriteSheetY = 0;
			} else if (movementAction.getDirection() == MovementAction.EAST) {
				x += (int) (movementFraction * Tile.TILE_WIDTH);
				spriteSheetY = SPRITE_HEIGHT * 3;
			} else if (movementAction.getDirection() == MovementAction.SOUTH) {
				y += (int) (movementFraction * Tile.TILE_HEIGHT);
				spriteSheetY = SPRITE_HEIGHT * 2;
			} else if (movementAction.getDirection() == MovementAction.WEST) {
				x -= (int) (movementFraction * Tile.TILE_WIDTH);
				spriteSheetY = SPRITE_HEIGHT;
			}
			
			spriteSheetX = animationFrame * SPRITE_WIDTH;
			if (animationFrameCounter == 0) {
				animationFrame++;
				if (animationFrame >= WALKING_SPRITESHEET_LENGTH) animationFrame = 0;
				animationFrameCounter = 5;
			} else animationFrameCounter--;
		}
		g.drawImage(walkingSpriteSheet, x, y, x + SPRITE_WIDTH, y + SPRITE_HEIGHT,
					spriteSheetX, spriteSheetY, spriteSheetX + SPRITE_WIDTH - 1, spriteSheetY + SPRITE_HEIGHT - 1, null);
	}

	private static int getARGBColor(int red, int green, int blue, int alpha) {
		return blue + (green * 256) + (red * 256 * 256) + (alpha * 256 * 256 * 256);
	}
	
	private static Color getColorFromARGB(int argb) {
		int blue = argb % 256;
		if (blue < 0) blue += 256;
		int blueGreen = (argb % (256 * 256));
		if (blueGreen < 0) blueGreen += (256 * 256);
		int green =  blueGreen / 256;
		int blueGreenRed = (argb % (256 * 256 * 256));
		if (blueGreenRed < 0) blueGreenRed += (256 * 256 * 256);
		int red =  blueGreenRed/ (256 * 256);
		int all = (argb % (256 * 256 * 256));
		if (all < 0) all += (256 * 256 * 256);
		int alpha = all / (256 * 256 * 256);
		return new Color(red, green, blue, alpha); 
	}
}
