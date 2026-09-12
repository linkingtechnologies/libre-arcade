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

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

public class TreeSprite {
	
	private static final String TREE_IMAGES_BASE_FOLDER = "resources" + File.separator + "Trees" + File.separator;
	
	public static final int SPRITE_WIDTH = 64;
	public static final int SPRITE_HEIGHT = 64;
	
	private static BufferedImage[][] images;
	
	private TreeSprite() {
	}
	
	public static BufferedImage getTreeSprite(int tileset) {
		if (images == null) {
			String[] filenames = {TREE_IMAGES_BASE_FOLDER + "greenTrees.png"};
			images = new BufferedImage[filenames.length][2];
			for (int i = 0; i < filenames.length; i++) {
				BufferedImage basicImage;
				try {
					basicImage = ImageIO.read(new File(filenames[i]));
					images[i][0] = basicImage.getSubimage(0, 0, basicImage.getWidth() / 2, basicImage.getHeight());
					images[i][1] = basicImage.getSubimage(basicImage.getWidth() / 2, 0, basicImage.getWidth() / 2, basicImage.getHeight());
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		
		return images[tileset][0];
	}

}
