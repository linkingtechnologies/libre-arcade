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
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Random;

import javax.imageio.ImageIO;

import shai.lpc.log.Logger;

public class BaseSpriteGenerator {
	
	// Color Constants:
	private static final int BASE_TRANSPARENT_BACKGROUND_2 = 16777215;
	private static final int BASE_TRANSPARENT_BACKGROUND = 14274233;
	private static final int BASE_OUTLINE_COLOR = -14149600;
	private static final int BASE_SKIN_1 = -6406601;
	private static final int BASE_SKIN_2 = -2980512;
	private static final int BASE_SKIN_3 = -1399945;
	private static final int BASE_SKIN_4 = -267034;
	private static final int BASE_SKIN_5 = -141897;
	private static final int BASE_EYE_HIGHLIGHT_2 = -11479828;
	private static final int BASE_EYE_WHITE = -853767;
	private static final int BASE_EYE_SHADE = -14074549;
	private static final int BASE_EYE_HIGHLIGHT = -11434061;
	
	public static BufferedImage[] generateBaseFemaleSpriteSheets() {
		String filenames[] = {AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "FemaleBaseWalkSheet.png",
				AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "FemaleBaseSlashSheet.png",
				AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "FemaleBaseSpellSheet.png",};
		BufferedImage[] baseSpriteSheets = generateBaseSpriteSheet(filenames);
		return baseSpriteSheets;
	}
	
	public static BufferedImage[] generateBaseMaleSpriteSheets() {
		String filenames[] = {AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "MaleBaseWalkSheet.png",
				AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "MaleBaseSlashSheet.png",
				AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "MaleBaseSpellSheet.png",};
		BufferedImage[] baseSpriteSheets = generateBaseSpriteSheet(filenames);
		return baseSpriteSheets;
	}
	
	public static BufferedImage[] generateBaseSpriteSheet(String[] filenames) {
		BufferedImage[] spriteSheets = new BufferedImage[filenames.length]; // Walking, Slashing, Spellcasting
		try {
			for (int i = 0; i < filenames.length; i++) {
				spriteSheets[i] = ImageIO.read(new File(filenames[i]));
			}
			int[] baseColorSet = {BASE_SKIN_1, BASE_SKIN_2, BASE_SKIN_3, BASE_SKIN_4, BASE_SKIN_5, BASE_EYE_HIGHLIGHT_2, BASE_EYE_SHADE, BASE_EYE_HIGHLIGHT};
			int[] newColorSet = generateNewBaseColorSet(baseColorSet);
			for (int i = 0; i < spriteSheets[0].getWidth(); i++) {
				for (int j = 0; j < spriteSheets[0].getHeight(); j++) {
					int color = spriteSheets[0].getRGB(i, j);
					for (int c = 0; c < baseColorSet.length; c++) {
						if (color == baseColorSet[c]) {
							spriteSheets[0].setRGB(i, j, newColorSet[c]);
						}
					}
				}
			}
		} catch (IOException e) {
			Logger.getInstance().log("Can't read image " + filenames[0]);
		}
		return spriteSheets;
	}
	
	private static int[] generateNewBaseColorSet(int[] oldColorSet) {
		int[] colorSet = new int[8];
		Random random = new Random();
		
		// Skin
		float brightnessFactor = 0.2f + random.nextFloat() * 0.8f;
		for (int i = 0; i < 5; i++) {
			float[] oldHsv = SpriteGenerator.getHSV(oldColorSet[i]);
			float newBrightness = oldHsv[2] * brightnessFactor;
			colorSet[i] = SpriteGenerator.getARGBColor(Color.getHSBColor(oldHsv[0], oldHsv[1], newBrightness));
		}
		// Eyes
		float newEyeHue = random.nextFloat();
		for (int i = 5; i < 8; i++) {
			float[] oldHsv = SpriteGenerator.getHSV(oldColorSet[i]);
			colorSet[i] = SpriteGenerator.getARGBColor(Color.getHSBColor(newEyeHue, oldHsv[1], oldHsv[2]));
		}
		
		return colorSet;
	}
}
