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

import javax.swing.JFrame;

import shai.lpc.combat.MatchReplay;
import shai.lpc.model.Gladiator;
import shai.lpc.model.Team;

public class GameFrame extends JFrame {
	
	public static final int STATE_IN_GAME = 1;
	
	public static int state;
	
	//private LevelEditorPanel gamePanel;
	//private ReplayPanel replayPanel;
	//private HallOfRecordsPanel hallOfRecordsPanel;
	private GamePanel gamePanel;
	
	public GameFrame() {
		super("Terramancers");
		this.setUndecorated(true);
		this.setExtendedState(JFrame.MAXIMIZED_BOTH);
		this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		
		//gamePanel = new LevelEditorPanel();
		//replayPanel = new ReplayPanel();
		//hallOfRecordsPanel = new HallOfRecordsPanel();
		gamePanel = new GamePanel();
		
		this.add(gamePanel);
		state = STATE_IN_GAME;
    	this.setVisible(true);
	}
	
	/*public void startReplay(MatchReplay replay) {
		this.remove(gamePanel);
		this.add(replayPanel);
		replayPanel.startReplay(replay);
	}
	
	public void openHallOfRecords() {
		this.remove(gamePanel);
		this.add(hallOfRecordsPanel);
		//hallOfRecordsPanel.openGladiatorRecord(new Gladiator("Ramm Stein"));
		//hallOfRecordsPanel.openTeamRecord(Team.getTestTeamA());
		hallOfRecordsPanel.openLeagueRecord();
	}*/
	
	public void openMainMenu() {
		gamePanel.openMainMenu();
	}
	
	public void openSinglePlayerScoreboard() {
		gamePanel.openSinglePlayerScoreBoard();
	}
	
	public void openMultiplayerScoreboard() {
		gamePanel.openMultiplayerScoreBoard();
	}
	
	public boolean isGameInProgress() {
		return state == STATE_IN_GAME;
	}
	
	public void updateSize(int width, int height) {
		//gamePanel.updateSize(width, height);
		//replayPanel.updateSize(width, height);
		//hallOfRecordsPanel.updateSize(width, height);
		gamePanel.updateSize(width, height);
	}
}
