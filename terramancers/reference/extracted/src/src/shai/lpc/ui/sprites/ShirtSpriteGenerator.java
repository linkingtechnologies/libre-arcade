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

public class ShirtSpriteGenerator {
	
	private static final String[] SHIRT_TYPES = {"ChainJacket", "ChainTorso", "PaddedTorso", "PlainShirt", "PlainShirt2", "PlateShirt"};
		
	public static BufferedImage[] generateShirtSpriteSheets() {
		Random random = new Random();
		String shirtTypeName = SHIRT_TYPES[random.nextInt(SHIRT_TYPES.length)];
		return generateShirtSpriteSheets(shirtTypeName);
	}
	
	private static BufferedImage[] generateShirtSpriteSheets(String typeName) {
		String filenames[] = {AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "UpperBodyClothes" + File.separator + typeName + "WalkSheet.png",
				AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "UpperBodyClothes" + File.separator + typeName + "SlashSheet.png",
				AvatarSprite.SPRITE_IMAGES_BASE_FOLDER + "UpperBodyClothes" + File.separator + typeName + "SpellSheet.png"};
		
		BufferedImage[] spriteSheets = new BufferedImage[filenames.length]; // Walking, Slashing, Spellcasting
		try {
			//List<Integer> colors = new ArrayList<Integer>();
			//int[] baseColorSet = {PANTS_COLOR, PANTS_COLOR_2, PANTS_COLOR_3};
			//int[] newColorSet = generateNewColorSet(baseColorSet);
			for (int i = 0; i < filenames.length; i++) {
				spriteSheets[i] = ImageIO.read(new File(filenames[i]));
				/*for (int x = 0; x < spriteSheets[i].getWidth(); x++) {
					for (int y = 0; y < spriteSheets[i].getHeight(); y++) {
						int color = spriteSheets[i].getRGB(x, y);
						for (int c = 0; c < baseColorSet.length; c++) {
							if (color == baseColorSet[c]) {
								spriteSheets[i].setRGB(x, y, newColorSet[c]);
							}
						}
					}
				}*/
				/*for (int x = 0; x < spriteSheets[i].getWidth(); x++) {
					for (int y = 0; y < spriteSheets[i].getHeight(); y++) {
						int color = spriteSheets[i].getRGB(x, y);
						if (color == COLOR_11) {
							spriteSheets[i].setRGB(x, y, SpriteGenerator.getARGBColor(255, 0, 0, 255));
						}
					}
				}*/
			}
			//System.out.println("Colors:\n" + colors);
		} catch (IOException e) {
			Logger.getInstance().log("Can't read image " + filenames[0]);
		}
		return spriteSheets;
	}
	
	private static int[] generateNewColorSet(int[] oldColorSet) {
		int[] colorSet = new int[3];
		Random random = new Random();
		
		// Pants
		float newPantsHue = random.nextFloat();
		for (int i = 0; i < 3; i++) {
			float[] oldHsv = SpriteGenerator.getHSV(oldColorSet[i]);
			colorSet[i] = SpriteGenerator.getARGBColor(Color.getHSBColor(newPantsHue, oldHsv[1], oldHsv[2]));
		}
		
		return colorSet;
	}
}
