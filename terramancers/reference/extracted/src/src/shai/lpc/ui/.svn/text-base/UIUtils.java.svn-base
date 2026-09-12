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
import java.io.IOException;

import javax.imageio.ImageIO;

import shai.lpc.Main;
import shai.lpc.ui.sprites.SpriteGenerator;

public class UIUtils {
	
	public static final int BUTTON_TYPE_NORMAL = 0;
	public static final int BUTTON_TYPE_PRESSED = 1;
	public static final int BUTTON_TYPE_HOVERED = 2;
	public static final int BUTTON_TYPE_DISABLED = 3;
	
	public static BufferedImage getButtonImage(int width, int height) {
		return getButtonImage(width, height, BUTTON_TYPE_NORMAL);
	}
	
	public static BufferedImage getButtonImage(int width, int height, int type) {
    	String buttonImageSheetName = Main.UI_IMAGES_BASE_FOLDER + "Buttons.png";
    	BufferedImage buttonImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
    	int offset = type * 28;
    	try {
			BufferedImage buttonImageSheet = ImageIO.read(new File(buttonImageSheetName));
			Graphics g = buttonImage.getGraphics();
			g.setColor(SpriteGenerator.getColorFromARGB(buttonImageSheet.getRGB(30, offset + 15)));
	    	g.fillRect(1, 3, width - 2, height - 6);
			// Left and right sides
			int xIndex = 1;
			int yIndex = 8;
			for (int i = 0; i < 11; i++) {
				for (int j = 0; j < height; j++) {
					buttonImage.setRGB(i, j, buttonImageSheet.getRGB(xIndex, offset + yIndex));
					buttonImage.setRGB(width - i - 1, j, buttonImageSheet.getRGB(xIndex, offset + yIndex));
					yIndex++;
					if (yIndex > 21) yIndex = 8;
				}
				xIndex++;
				yIndex = 8;
			}
			// Corners
			xIndex = 1;
			yIndex = 1;
			for (int i = 0; i < 30; i++) {
				for (int j = 0; j < 14; j++) {
					buttonImage.setRGB(i, j, buttonImageSheet.getRGB(xIndex, offset + yIndex));
					buttonImage.setRGB(width - i - 1, j, buttonImageSheet.getRGB(xIndex, offset + yIndex));
					buttonImage.setRGB(i, height - j - 1, buttonImageSheet.getRGB(xIndex, offset + yIndex));
					buttonImage.setRGB(width - i - 1, height - j - 1, buttonImageSheet.getRGB(xIndex, offset + yIndex));
					yIndex++;
				}
				xIndex++;
				yIndex = 1;
			}
			// Top and bottom sides
			int[] colors = {buttonImageSheet.getRGB(6, offset + 3), buttonImageSheet.getRGB(6, offset + 4), buttonImageSheet.getRGB(6, offset + 5), buttonImageSheet.getRGB(6, offset + 6)};
			for (int i = 30; i < width - 30; i++) {
				buttonImage.setRGB(i, 2, colors[0]);
				buttonImage.setRGB(i, 3, colors[1]);
				buttonImage.setRGB(i, 4, colors[2]);
				buttonImage.setRGB(i, 5, colors[3]);
				
				buttonImage.setRGB(i, height - 6, colors[3]);
				buttonImage.setRGB(i, height - 5, colors[2]);
				buttonImage.setRGB(i, height - 4, colors[1]);
				buttonImage.setRGB(i, height - 3, colors[0]);
				yIndex++;
				if (yIndex > 21) yIndex = 8;
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return buttonImage;
    }

}
