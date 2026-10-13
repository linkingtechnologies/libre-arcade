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

import java.io.IOException;

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;

/**
 * Splash Class extends a Canvas for exibiting
 * a splash screen with an image in it.
 */
public class Splash extends Canvas 
{
	private Image image;
	private int   color;
	private int   centerX;
	private int   centerY;
	private boolean showing;
	private boolean isNextSplash;
	
	/**
	 * Creates a splash screen to display the specified
	 * image and fills the background with the specified
	 * color.
	 * 
	 * @param background
	 */
	public Splash(String image, int background) 
	{
		this.setFullScreenMode(true);
		this.color = background;
		this.showing = false;
		this.isNextSplash = false;
		
		try 
		{
			this.image = Image.createImage(image);
			
			/*Calculate center position*/
			this.centerX = (this.getWidth() - this.image.getWidth())/2;
			this.centerY = (this.getHeight() - this.image.getHeight())/2;
		} 
		catch (IOException e) 
		{
			/* Unable to load image. Do not display it. */
		}
	}
	
	/**
	 * Shows the splash during the specified number of milliseconds.
	 * 
	 * @param display Current Display.
	 * @param millis splash time in milliseconds.
	 */
	public void show(final Display display, final long millis)
	{
		this.show(display, null, millis);
	}

	/**
	 * Shows the splash and changes to the specified
	 * displayable after the specified number of milliseconds.
	 * 
	 * @param display Current Display.
	 * @param next new Displayable.
	 * @param millis splash time in milliseconds.
	 */
	public void show(final Display display, final Displayable next, final long millis)
	{
		showing = true;
		display.setCurrent(this);

		// Schedule next Displayable
		Thread t = new Thread(new Runnable() 
		{
			public void run()
			{
				try
				{
					Thread.sleep(millis);
				}
				catch (InterruptedException e)
				{
					e.printStackTrace();
				} finally 
				{
					showing = false;
					if (!isNextSplash)
						display.setCurrent(next);
				}
			}
		});
		t.start();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * javax.microedition.lcdui.Canvas#paint(javax.microedition.lcdui.Graphics)
	 */
	protected void paint(Graphics g) {
		g.setColor(this.color);
		g.fillRect(0x00, 0x00, getWidth(), getHeight());

		if (this.image != null) {
			g.drawImage(this.image, this.centerX, this.centerY, 0x00);
		}
	}
	
	public boolean isSplashing()
	{
		return this.showing;
	}
}