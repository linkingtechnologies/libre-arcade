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
import java.util.Enumeration;
import java.util.Vector;

import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.game.GameCanvas;

import fr.uha.ensisa.ir.walther.milcityblue.core.Engine;

/**
 * GameEngine class provides a basic game engine.
 */
public class GameEngine implements Runnable, Engine 
{
	private GameCanvasProxy canvas;
	private Graphics graphics;
	
	private GameModel models;
	private Vector 	  views;
	private int		  fps;
	
	private boolean paused;
	private boolean stoped;
	
	/**
	 * Creates a Game Engine with the specified
	 * Game model attached. The game runs at the
	 * specified fps.
	 * 
	 * @param model game model.
	 * @param fps frames per second.
	 */
	public GameEngine(GameModel model, int fps) 
	{
		this.canvas = new GameCanvasProxy();
		this.views  = new Vector();
		
		this.graphics = this.canvas.getGraphics();
		this.models   = model;
		this.stoped	  = true;
		this.fps	  = fps;
	}

	/**
	 * Gets the drawing area.
	 * 
	 * @return drawing area.
	 */
	public Displayable getDrawingArea() 
	{
		return this.canvas;
	}
	
	/**
	 * Starts the Game.
	 */
	public void start() 
	{
		if (stoped) 
		{			
			Thread t = new Thread(this);
			t.start();
		}
	}
	
	/**
	 * Stops the Game.
	 */
	public void stop() 
	{
		if (!stoped)			
			this.stoped = true;
	}

	/**
	 * Resumes the Game.
	 */
	public void resume() 
	{
		synchronized (this) 
		{
			if (paused) 
				this.paused = false;
			this.notifyAll();
		}
	}
	
	/**
	 * Pauses the Game.
	 */
	public void pause() 
	{
		synchronized (this) 
		{			
			if (!paused) 
				this.paused = true;
		}
	}
	
	/**
	 * Attaches the specified view to the
	 * engine.
	 * 
	 * @param view some view.
	 */
	public void attach(GameView view) 
	{
		if (!this.views.contains(view))
			this.views.addElement(view);
	}
	
	/**
	 * Detaches the specified view from the
	 * engine.
	 * 
	 * @param view some view.
	 */
	public void detach(GameView view)
	{
		this.views.removeElement(view);
	}
	
	/* (non-Javadoc)
	 * @see javax.microedition.lcdui.game.GameCanvas#paint(javax.microedition.lcdui.Graphics)
	 */
	public void paint(Graphics g) 
	{
		int keys = this.canvas.getKeyStates();
		this.models.Ai(keys, this.canvas.getWidth(), this.canvas.getHeight());
		
		Enumeration enumeration = this.views.elements();
		while (enumeration.hasMoreElements()) 
		{
			GameView view = (GameView) enumeration.nextElement();
			view.render(g);
		}
	}
	
	/**
	 * Game Loop
	 */
	public void run() 
	{
		this.stoped = false;
		while (!stoped) 
		{
			try 
			{
				synchronized (this) 
				{
					if (paused)
						this.wait();
				}
				
				long interval = System.currentTimeMillis();
				this.paint(this.graphics);
				this.canvas.flushGraphics();
				interval = System.currentTimeMillis() - interval;
				interval = ((1000 / fps) - interval);
				Thread.sleep(interval > 0 ? interval : 0x00);
				
				System.gc();
			} 
			catch (InterruptedException e) 
			{
				e.printStackTrace();
			}
		}
		this.stoped = true;
	}
	
	private class GameCanvasProxy extends GameCanvas 
	{
		protected GameCanvasProxy() 
		{
			super(true);
			this.setFullScreenMode(true);
		}
		
		/* (non-Javadoc)
		 * @see javax.microedition.lcdui.game.GameCanvas#getGraphics()
		 */
		public Graphics getGraphics() 
		{
			return super.getGraphics();
		}
	}
	
	public static String keyToString(int key)
	{
		try
		{
			GameCanvas gcp = new GameCanvas(true) {};
			return gcp.getKeyName(gcp.getKeyCode(key));
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		return "N/A";
	}
}
