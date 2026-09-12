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

import shai.lpc.ui.sprites.PantsSpriteGenerator;
import shai.lpc.ui.sprites.ShirtSpriteGenerator;

public class SpriteGenerator {
	
	public static BufferedImage[] generateMaleSprite() {
		BufferedImage[] baseSprite = BaseSpriteGenerator.generateBaseMaleSpriteSheets();
		BufferedImage[] pantsSprite = PantsSpriteGenerator.generatePantsSpriteSheets();
		BufferedImage[] shirtSprite = ShirtSpriteGenerator.generateShirtSpriteSheets();
		return mergeSpriteSheets(mergeSpriteSheets(baseSprite, pantsSprite), shirtSprite);
	}
	
	public static BufferedImage[] generateFemaleSprite() {
		BufferedImage[] baseSprite = BaseSpriteGenerator.generateBaseFemaleSpriteSheets();
		BufferedImage[] pantsSprite = PantsSpriteGenerator.generatePantsSpriteSheets();
		BufferedImage[] shirtSprite = ShirtSpriteGenerator.generateShirtSpriteSheets();
		return mergeSpriteSheets(mergeSpriteSheets(baseSprite, pantsSprite), shirtSprite);
	}
	
	public static int getARGBColor(Color color) {
		return color.getBlue() + (color.getGreen() * 256) + (color.getRed() * 256 * 256) + (color.getAlpha() * 256 * 256 * 256);
	}
	
	public static int getARGBColor(int red, int green, int blue, int alpha) {
		return blue + (green * 256) + (red * 256 * 256) + (alpha * 256 * 256 * 256);
	}
	
	public static Color getColorFromARGB(int argb) {
		int blue = ((argb & 0x000000FF) >>> 0);
		int green = ((argb & 0x0000FF00) >>> 8);
		int red = ((argb & 0x00FF0000) >>> 16);
		int alpha = ((argb & 0xFF000000) >>> 24);
		return new Color(red, green, blue, alpha); 
	}
	
	public static int mergeColors(int first, int second) {
		int firstAlpha = ((first & 0xFF000000) >>> 24);
		int secondAlpha = ((second & 0xFF000000) >>> 24);
		if (secondAlpha < 128) return first;
		else return second; // TODO: Support actual alpha transparency, not just binary transparency.
	}
	
	public static float[] getHSV(int argbColor) {
		float hue = 0f;
		float sat = 0f;
		float value = 0f;
		
		Color color = getColorFromARGB(argbColor);
		float red = (float) color.getRed() / 255f;
		float green = (float) color.getGreen() / 255f;
		float blue = (float) color.getBlue() / 255f;
		
		float min = red > green ? (green > blue ? blue : green) : (red > blue ? blue : red);
		float max = red < green ? (green < blue ? blue : green) : (red < blue ? blue : red);
		
		value = max;
		
		float delta = max - min;
		if (max != 0) {
			sat = delta / max;
			if (max == red) {
				hue = (green - blue) / delta;
			} else if (max == green) {
				hue = 2 + (blue - red) / delta;
			} else {
				hue = 4 + (red - green) / delta;
			}
			hue *= 60;
			if (hue < 0) {
				hue += 360;
			}
			hue /= 360;
		} else {
			sat = 0;
			hue = 0;
		}
		
		return new float[] {hue, sat, value};
	}
	
	public static BufferedImage mergeImages(BufferedImage first, BufferedImage second) {
		BufferedImage mergedImage = new BufferedImage(first.getWidth(), first.getHeight(), BufferedImage.TYPE_INT_ARGB);
		for (int x = 0; x < first.getWidth(); x++) {
			for (int y = 0; y < first.getHeight(); y++) {
				int firstColor = first.getRGB(x, y);
				int secondColor = second.getRGB(x, y);
				mergedImage.setRGB(x, y, mergeColors(firstColor, secondColor));
			}
		}
		return mergedImage;
	}
	
	public static BufferedImage[] mergeSpriteSheets(BufferedImage[] first, BufferedImage[] second) {
		BufferedImage[] mergedSheet = new BufferedImage[first.length];
		for (int i = 0; i < first.length; i++) {
			mergedSheet[i] = mergeImages(first[i], second[i]);
		}
		return mergedSheet;
	}

}
