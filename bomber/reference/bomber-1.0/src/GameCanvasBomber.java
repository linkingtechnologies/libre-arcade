/*
	GameCanvasBomber.java
	
	Copyright (C) 2007  Juan Jose Luna Espinosa juanjo.luna@gmail.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import javax.microedition.lcdui.*;
import javax.microedition.lcdui.game.*;
import javax.microedition.media.*;
import java.io.*;
import java.util.*;

public class GameCanvasBomber extends GameCanvas implements Runnable {

private
	// Application status:
	// < 0 = exitig application
	// 0 = Startup screen
	// 1 = Initial screen with record info etc.
	// 2 = starting game (melody of new city)
	// 3 = playing
	int appStatus;
		
	// player score and score record
	int score, scoreRecord;
	
	// number of player landings
	int landings;
		
	// time in ms of each app frame while playing
	long timeDelay = 141;

	// inherent to Spectrum char of 8x8
	int pixelsPerBlock = 8;
	
	// position of plane in blocks
	int planeX, planeY;
	
	// position of bomb in blocks
	int bombX, bombY;
	
	// bomb life time
	int bombLife;
		
	// status of bomb:
	// 0: not appearing
	// 1: falling
	int bombStatus;

	// building heights (in blocks)
	int buildingHeights[];
	
	// building caps type:
	// 0: Flat cap
	// 1: low cap
	// 2: higher cap (skyscraper)
	// 3: destroyed cap
	int buildingCaps[];

	// building colours, 0 to 6
	int buildingColours[];
	
	// number of buildings
	int buildingCount = 26;
	
	// screen width and height
	int screenWidth;
	int screenHeight;

	// random generator
	Random random;

	// generic image for loading
	Image image;
	
	// Background start image
	Image startImage;
	
	// Sprites
	Sprite planeSprite;
	Sprite bombSprite;
	Sprite buildingSprite;

	// large image with 4 building parts and 7 colours
	Image buildingsImage[][];
	
	// Thread that runs this GameCanvas
	Thread t;

	public GameCanvasBomber() {
		super(true);

		// Global variables initialization

		score = 0;
		scoreRecord = 0;
		landings = 0;

		screenHeight = getHeight();
		screenWidth = getWidth();

		buildingHeights = new int[buildingCount];
		buildingCaps = new int[buildingCount];
		buildingColours = new int[buildingCount];
		
		// large image with 4 building parts and 7 colours
		buildingsImage = new Image[4][7];

		random = new Random( System.currentTimeMillis() );

		// resources loading
		try {
			startImage= Image.createImage("/loadscreen.png");
		} catch (IOException e) {
			throw new RuntimeException ("Unable to load Image: "+e);
		}	
		try {
			image= Image.createImage("/plane.png");
		} catch (IOException e) {
			throw new RuntimeException ("Unable to load Image: "+e);
		}
		planeSprite = new Sprite(image,8,24);
		
		try {
			image= Image.createImage("/bomb.png");
		} catch (IOException e) {
			throw new RuntimeException ("Unable to load Image: "+e);
		}
		bombSprite = new Sprite(image);
		
		try {
			image= Image.createImage("/buildings.png");
		} catch (IOException e) {
			throw new RuntimeException ("Unable to load Image: "+e);
		}
		buildingSprite = new Sprite(image, 8, 8);

	}
	
	public void LevelInitialization()
	{
		// initial plane position
		planeX = 22;
		planeY = 0;
		planeSprite.setFrame(0);
		
		bombStatus = 0;
		bombX = 0;
		bombY = 0;
					
		// initialize buildings heights and cap type
		for (int i = 0; i < buildingCount; i++)
		{
			int h = random.nextInt( landings * 3 + 8 ) + 1;
			buildingHeights[i] = h;
			if ( h > 4 ) {
				buildingCaps[i] = random.nextInt(2) + 1;
			}
			else {
				buildingCaps[i] = 0;
			}
			buildingColours[i] = random.nextInt(7);
		}
	}
	
	public void start() {
		this.t = new Thread(this);
		this.t.start();
	}
	
	public void stop() {
		this.appStatus = -1;
		this.t = null;
	}
	
	public void run() {
		
		Graphics g = getGraphics();
		
		appStatus = 0;
		
		while (appStatus >= 0) {

			keyPressed();
			
			switch ( appStatus )
			{
				case 0:
					// show startup screen
					g.drawImage(startImage, 0, 0, Graphics.LEFT | Graphics.TOP);		
					flushGraphics();
					try { Thread.sleep(3000); } 
					catch (InterruptedException ie) {};
					appStatus = 1;

				break;
				
				case 1:

					if ( score > scoreRecord )
					{
						scoreRecord = score;
					}
					
					g.setColor(0xC5C5C5);
					g.fillRect(0, 0, screenWidth, screenHeight);
					g.setColor(0x008080);
					g.fillRect(24, 0, screenWidth - 48, screenHeight);
					g.setColor(0x000080);
					g.drawString("BOMBER", screenWidth/2, 30, Graphics.HCENTER | Graphics.BASELINE);
					g.drawString("ORIGINAL GAME BY", screenWidth/2, 50, Graphics.HCENTER | Graphics.BASELINE);
					g.drawString("JOSEPH DUFFY", screenWidth/2, 70, Graphics.HCENTER | Graphics.BASELINE);
					g.drawString("J2ME ADAPTATION BY", screenWidth/2, 90, Graphics.HCENTER | Graphics.BASELINE);
					g.drawString("JUAN J LUNA", screenWidth/2, 110, Graphics.HCENTER | Graphics.BASELINE);
					g.drawString("SCORE = " + Integer.toString(score), 30, 130, 0);
					g.drawString("LANDINGS = " + Integer.toString(landings), 30, 150, 0);
					g.drawString("HI-SCORE = " + Integer.toString(scoreRecord), 30, 170, 0);
					
					g.drawString("Press any key to begin", screenWidth/2, 210, Graphics.HCENTER | Graphics.BASELINE);
					flushGraphics();
				
					if ( keyPressed() )
					{
						// Game is starting
						score = 0;
						landings = 0;
						LevelInitialization();
						appStatus = 2;
					}
					
				break;
				
				case 2:
					drawScreen(g, 0xC5C5C5);
					
					PlayStartMelody();
					
					appStatus = 3;
				break;
				
				case 3:
			
					// move plane
					if ( planeY >= 29 )
					{
						// si x==0, gana
						if ( planeX == 0 ) 
						{							
							// winning landing melody
							PlaySuccessMelody();
							
							landings++;
							LevelInitialization();
							appStatus = 2;
						}
						else
						{
							planeY = 0;
							planeX = planeX - 1;
						}
					}
					else
					{
						if ( ( planeY < buildingCount - 1 ) && buildingHeights[planeY] - 1 >= planeX )
						{
							// we have collision
							for (int i = 0; i < 30; i++)
							{
								try { Thread.sleep(100); } 
								catch (InterruptedException ie) {}
														
								planeSprite.setFrame(1 + random.nextInt(3));
								//planeSprite.paint(g);
								
								// draw screen with alternating background color
								if ( i % 2 ==0 )
								{
									drawScreen(g,0xFFFFFF);
								}
								else
								{
									drawScreen(g,0xC5C5C5);
								}
								
								flushGraphics();
							}
							
							// black screen with crash melody
							g.setColor(0x000000);
							g.fillRect(0, 0, screenWidth, screenHeight);
							flushGraphics();
							PlayCrashMelody();
							
							appStatus = 1;
							break;
						}
						else
						{
							planeY = planeY + 1;
						}
					}
					
					// move bomb
					
					if ( bombStatus == 0 )
					{
						if ( keyPressed() && planeY >= 3 )
						{
							bombStatus = 1;
							bombX = planeX - 1;
							bombY = planeY;
							bombLife = 0;
						}
					}
					
					if ( bombStatus == 1 )
					{
						if ( bombX < 0 )
						{
							bombStatus = 0;
						}
						else
						{
							if ( ( bombY >= 3 ) &&( bombY < buildingCount + 3 ) && 
								 ( buildingHeights[bombY - 3] >= bombX ) &&
								 ( buildingHeights[bombY - 3] > 0 ) )
							{
								// bomb impact
								bombStatus = 0;
								for (int i = 0; i < 3 && bombX >= 0; i++)
								{
									buildingHeights[bombY - 3]--;
									buildingCaps[bombY - 3] = 3;
									bombX--;
									drawScreen(g, 0xC5C5C5);
									score++;
									PlayTone(10, 25,100);
									try { Thread.sleep(25); } 
									catch (InterruptedException ie) {}
								}
							}
							else
							{
								if ( bombX <= 0 )
								{
									bombStatus = 0;
								}
								bombX--;
								
								bombLife++;
								
								PlayTone(110 - bombLife, 20,10);
							}
						}
					}
					else
					{
						PlayMotorSound();
					}

					drawScreen(g, 0xC5C5C5);
				break;
			}

			//control de fps
			try { Thread.sleep(timeDelay); } 
			catch (InterruptedException ie) {}
		}
	}
	
	private boolean keyPressed() {
		return getKeyStates() != 0;
	}

	public void PlayTone(int note, int duration, int volume)
	{
		try {
			Manager.playTone( note, duration, volume);
		} catch (MediaException me) {}
	}

	public void PlayToneBlock(int note, int duration, int volume)
	{
		try {
			try {
				Manager.playTone( note, duration, volume);
			} catch (MediaException me) {}
			Thread.sleep( duration );
		} 
		catch (InterruptedException ie) {}					
	}
	
	public void PlayMotorSound()
	{
		if ( bombStatus == 0 )
		{
			//PlayToneBlock(45, 50,100);
			try {
				Manager.playTone( 30, (int)timeDelay, 100);
			} catch (MediaException me) {}
		}
	}
							
	public void PlayStartMelody()
	{
		PlayToneBlock(70, 400,100);
		PlayToneBlock(71, 400,100);
		PlayToneBlock(73, 200,100);
		PlayToneBlock(70, 200,100);					
		PlayToneBlock(73, 200,100);
		PlayToneBlock(78, 200,100);
		
		PlayToneBlock(77, 400,100);
		PlayToneBlock(78, 400,100);
		PlayToneBlock(80, 200,100);
		PlayToneBlock(78, 200,100);
		PlayToneBlock(77, 200,100);
		PlayToneBlock(75, 200,100);	
	}
	
	public void PlaySuccessMelody()
	{
		PlayToneBlock(77, 600,100);
		PlayToneBlock(75, 600,100);
		PlayToneBlock(73, 800,100);
		PlayToneBlock(75, 600,100);
		PlayToneBlock(77, 600,100);
		PlayToneBlock(75, 600,100);
		PlayToneBlock(73, 600,100);
		PlayToneBlock(75, 600,100);
		PlayToneBlock(77, 600,100);
		PlayToneBlock(73, 800,100);
		PlayToneBlock(73, 800,100);
		
	}
	
	public void PlayCrashMelody()
	{
		PlayToneBlock(73, 800,100);
		PlayToneBlock(73, 800,100);
		PlayToneBlock(73, 400,100);
		PlayToneBlock(73, 400,100);
		PlayToneBlock(75, 400,100);
		PlayToneBlock(76, 400,100);
		PlayToneBlock(75, 400,100);
		PlayToneBlock(73, 400,100);
		PlayToneBlock(73, 400,100);
		PlayToneBlock(71, 400,100);
		PlayToneBlock(73, 1000,100);
		
	}
	
	private void drawScreen(Graphics g, int background) {	

		g.setColor(background);
		
		g.fillRect(24, 0, screenWidth - 48, screenHeight);
	
		drawBuildings(g);

		planeSprite.setPosition( planeX * pixelsPerBlock + 24,
								 planeY * pixelsPerBlock );		
		planeSprite.paint(g);

		if ( bombStatus != 0 )
		{
			bombSprite.setPosition( bombX * pixelsPerBlock + 24,
									bombY * pixelsPerBlock );		
			bombSprite.paint(g);
		}

		flushGraphics();
		
	}
	
	private void drawBuildings(Graphics g)
	{
		
		g.setColor(0x000000);
		g.fillRect(16, 0, 8, 32*8);
		
		int x, y, xBuilding;
		
		for (y = 0; y < buildingCount; y++)
		{
			xBuilding = buildingHeights[y];
			
			for (x = 0; x < xBuilding; x++)
			{
				if ( x == xBuilding - 1 )
				{
					buildingSprite.setFrame( buildingColours[y] + 7 * buildingCaps[y] );
				}
				else {
					buildingSprite.setFrame( buildingColours[y] );
				}
				
				buildingSprite.setPosition( x * pixelsPerBlock + 24, y * pixelsPerBlock +24);
				buildingSprite.paint(g);
			}
		}
	}
}
