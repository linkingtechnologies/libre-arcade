package shai.lpc;

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

import java.awt.Toolkit;
import java.io.File;
import java.io.IOException;

import javax.swing.SwingUtilities;

import shai.lpc.ui.GameFrame;
import shai.lpc.ui.Tile;

public class Main {
	
	public static final String UI_IMAGES_BASE_FOLDER = "resources" + File.separator + "UI" + File.separator;
	
	private static GameFrame gameFrame;
	public static final int FPS = 60;
	public static final int TPF = 3;
	
	private static boolean quit;
	
	public static void main(String[] args) {
		
		quit = false;
		int width = (int) Toolkit.getDefaultToolkit().getScreenSize().getWidth();
		int height = (int) Toolkit.getDefaultToolkit().getScreenSize().getHeight();
		
		//League.initializeLeague();
		
		try {
			Tile.loadTilesets();
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}

        SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                createAndShowGUI(); 
            }
        });
        
        while (gameFrame == null) {
        	try {
				Thread.sleep(100);
			} catch (InterruptedException e) {
				;
			}
        }
        
        gameFrame.updateSize(width, height);
        
        // Testing the match engine
        /*MatchEngine matchEngine = new MatchEngine();
        MatchReplay replay = matchEngine.runMatch(Team.getTestTeamA(), Team.getTestTeamB(), new Arena("Test Arena"));
        gameFrame.startReplay(replay);*/
        //gameFrame.openHallOfRecords();
        
        long tickTime = 1000 / FPS;
        long frameDebt = 0;
        
		//gamePanel.setMessage("Press space to begin");
        //engine.startNextLevel();
        
        Engine engine = Engine.getInstance();
        openMainMenu();
        
        while (!quit) {
        	long startTime = System.nanoTime();
        	
        	if (frameDebt < 100) {
        		if (gameFrame.isGameInProgress()) {
        			for (int i = 0; i < TPF; i++) {
            			engine.tick();
            		}
        		}
            	gameFrame.repaint();
        	}
        	
        	long endTime = System.nanoTime();
        	long frameTime = endTime - startTime;
        	
        	// Convert from nanoseconds to miliseconds
        	frameTime /= 1000000;
        	
        	if (frameTime < tickTime) {
        		try {
        			//System.out.println(" " + frameTime + " / " + tickTime);
        			long remainingTime = (tickTime - frameTime);
        			long sleepTime = remainingTime - frameDebt;
        			if (sleepTime < 0) sleepTime = 0;
        			frameDebt -= remainingTime;
        			if (frameDebt < 0) frameDebt = 0;
        			if (sleepTime > 0) {
        				Thread.sleep(sleepTime);
        			}
				} catch (InterruptedException e) {
					System.out.println(e.getMessage());
				}
        	} else {
        		frameDebt += (frameTime - tickTime);
        		//System.out.println(" " + frameTime + " / " + tickTime);
        	}
        }
    }
	
	public static void openMainMenu() {
		Engine.getInstance().startExhibition();
        gameFrame.openMainMenu();
	}
	
	public static void startTutorial() {
		Engine.getInstance().startSinglePlayerGame(1);
	}
	
	public static void startSinglePlayerGame(int difficultyLevel) {
		Engine.getInstance().startSinglePlayerGame(difficultyLevel);
	}
	
	public static void startMultiplayerGame() {
		Engine.getInstance().startMultiplayerGame();
	}
	
	public static void endSinglePlayerGame() {
		gameFrame.openSinglePlayerScoreboard();
	}
	
	public static void endMultiplayerGame() {
		gameFrame.openMultiplayerScoreboard();
	}
	
	public static void startNextMatch() {
		Engine.getInstance().startSinglePlayerGame();
	}
	
	public static int getScreenWidth() {
		return (int) Toolkit.getDefaultToolkit().getScreenSize().getWidth();
	}
	
	public static int getScreenHeight() {
		return (int) Toolkit.getDefaultToolkit().getScreenSize().getHeight();
	}
	
	public static GameFrame getGameFrame() {
		return gameFrame;
	}
	
	public static void quit() {
		quit = true;
		System.exit(0);
	}

    private static void createAndShowGUI() {
    	gameFrame = new GameFrame();
    }

}
