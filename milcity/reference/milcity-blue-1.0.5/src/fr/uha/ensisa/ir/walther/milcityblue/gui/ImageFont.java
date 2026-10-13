/*
 *	MilCity - Blue
 *	Copyright (C) 2010, 2011, Jeremy WALTHER (jeremy.walther@gmail.com)
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.

 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see http://www.gnu.org/licenses/gpl-3.0.html.
 */

package fr.uha.ensisa.ir.walther.milcityblue.gui;

import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;

public class ImageFont
{
	private Image image;
	public static final String alpha = " !\"#%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\[]^_abcdefghijklmnopqrstuvwxyz{|}~$§יטחאשך";
	
	public ImageFont()
	{
		this.image = null;
	}
	
	public void init()
	{
		try
		{
			this.image = Image.createImage("/chars6x8.png");
		} 
		catch (Exception e)
		{
			e.printStackTrace();
		}
		if (this.image == null)
			System.out.println("ERROR ImageFont : image not fully loaded !");
	}
	
	private int charToInt(char c)
	{
		int i = alpha.indexOf(c);
		if (i < 0)
			i = 0;
		return i;
	}
	
	public void stringToImage(Graphics g, String s, int x, int y, int anchor)
	{
		if (image != null)
		{
			int l = s.length();
			int clipX = g.getClipX();
			int clipY = g.getClipY();
			int clipH = g.getClipHeight();
			int clipW = g.getClipWidth();
			for(int i = 0; i < l; ++i)
			{
				g.setClip(x + (i * 6), y, 6, 8);
				g.drawImage(image, x + (i * 6) - (charToInt(s.charAt(i)) * 7), y, anchor);
			}
			g.setClip(clipX,clipY,clipW,clipH);
		}
		else
		{
			g.setFont(Font.getFont(Font.FACE_MONOSPACE, Font.STYLE_PLAIN, Font.SIZE_SMALL));
			g.setColor(0x000000);
			g.drawString(s, x, y, anchor);
		}
	}
}
