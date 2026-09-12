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

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.image.BufferedImage;
import java.util.List;

import javax.swing.AbstractAction;
import javax.swing.JPanel;
import javax.swing.KeyStroke;

import shai.lpc.Engine;
import shai.lpc.GameObject;
import shai.lpc.Main;
import shai.lpc.Terramancer;
import shai.lpc.strings.StringPool;

public class GamePanel extends JPanel implements MouseListener, MouseMotionListener {
	
	public static final int STATE_MAIN_MENU = 1;
	public static final int STATE_IN_GAME = 2;
	public static final int STATE_HELP = 3;
	public static final int STATE_ABOUT = 4;
	public static final int STATE_SINGLE_PLAYER_SCOREBOARD = 5;
	public static final int STATE_MULTIPLAYER_SCOREBOARD = 6;
	public static final int STATE_DIFFICULTY_SELECT = 7;
	public static final int STATE_CHAR_SELECTION = 8;
	public static final int STATE_CHAR_SELECTION_2 = 9;

	private static final int BUTTON_HEIGHT = 50;
	private static final int BUTTON_MARGIN = 0;
	
	private static final int MAIN_MENU_TUTORIAL = 3;
	private static final int MAIN_MENU_SINGLE_PLAYER = 0;
	private static final int MAIN_MENU_MULTIPLAYER = 1;
	private static final int MAIN_MENU_HELP = 4;
	private static final int MAIN_MENU_ABOUT = 5;
	private static final int MAIN_MENU_EXIT = 2;
	
	private int width, height;
	private Tilemap arena;
	private int arenaLeftMargin, arenaTopMargin;
	private int state;
	
	private BufferedImage buttonImage;
	private BufferedImage hoveredButtonImage;
	private int hoveredButton;
	private BufferedImage textBackgroundImage;
	
	private int buttonsY;
	
	public GamePanel() {
        this.setBackground(Color.WHITE);
        this.addMouseListener(this);
        this.addMouseMotionListener(this);
        
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_A, 0), "MoveLeftP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_S, 0), "MoveDownP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_D, 0), "MoveRightP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_W, 0), "MoveUpP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_A, 0, true), "StopLeftP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_S, 0, true), "StopDownP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_D, 0, true), "StopRightP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_W, 0, true), "StopUpP2");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, 0), "MoveLeft");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_DOWN, 0), "MoveDown");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_RIGHT, 0), "MoveRight");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_UP, 0), "MoveUp");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, 0, true), "StopLeft");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_DOWN, 0, true), "StopDown");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_RIGHT, 0, true), "StopRight");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_UP, 0, true), "StopUp");
        
        getActionMap().put("MoveLeft", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveLeft(0);}});
        getActionMap().put("MoveDown", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveDown(0);}});
        getActionMap().put("MoveRight", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveRight(0);}});
        getActionMap().put("MoveUp", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveUp(0);}});
        getActionMap().put("StopLeft", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopLeft(0);}});
        getActionMap().put("StopDown", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopDown(0);}});
        getActionMap().put("StopRight", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopRight(0);}});
        getActionMap().put("StopUp", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopUp(0);}});
        getActionMap().put("MoveLeftP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveLeft(1);}});
        getActionMap().put("MoveDownP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveDown(1);}});
        getActionMap().put("MoveRightP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveRight(1);}});
        getActionMap().put("MoveUpP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveUp(1);}});
        getActionMap().put("StopLeftP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopLeft(1);}});
        getActionMap().put("StopDownP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopDown(1);}});
        getActionMap().put("StopRightP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopRight(1);}});
        getActionMap().put("StopUpP2", new AbstractAction() {public void actionPerformed(ActionEvent e) {stopUp(1);}});
    }
	
	public void updateSize(int width, int height) {
		this.setSize(width, height);
		this.width = width;
		this.height = height;
		textBackgroundImage = UIUtils.getButtonImage(width / 2, height / 2);
		this.buttonImage = UIUtils.getButtonImage(width / 2, BUTTON_HEIGHT, UIUtils.BUTTON_TYPE_DISABLED);
		this.hoveredButtonImage = UIUtils.getButtonImage(width / 2, BUTTON_HEIGHT, UIUtils.BUTTON_TYPE_NORMAL);
	}
	
	public void openMainMenu() {
		hoveredButton = -1;
		this.state = STATE_MAIN_MENU;
	}
	
	public void openSinglePlayerScoreBoard() {
		hoveredButton = -1;
		this.state = STATE_SINGLE_PLAYER_SCOREBOARD;
	}
	
	public void openMultiplayerScoreBoard() {
		hoveredButton = -1;
		this.state = STATE_MULTIPLAYER_SCOREBOARD;
	}
	
	private void moveLeft(int id) {Engine.getInstance().moveLeft(id);}
	private void moveDown(int id) {Engine.getInstance().moveDown(id);}
	private void moveRight(int id) {Engine.getInstance().moveRight(id);}
	private void moveUp(int id) {Engine.getInstance().moveUp(id);}
	private void stopLeft(int id) {Engine.getInstance().stopLeft(id);}
	private void stopDown(int id) {Engine.getInstance().stopDown(id);}
	private void stopRight(int id) {Engine.getInstance().stopRight(id);}
	private void stopUp(int id) {Engine.getInstance().stopUp(id);}
	
	public void paintComponent(Graphics g) {
        super.paintComponent(g);
        
        arena = Engine.getInstance().getCurrentLevel();
        
        drawArena(g);
        drawAvatars(g);
        
        List<GameObject> objects = Engine.getInstance().getObjects();
        if (objects != null) {
        	for (GameObject obj : objects) {        
            	obj.draw(g);
            }
        }
        
        if (state == STATE_MAIN_MENU) {
        	drawMenu(g);
        } else if (state == STATE_HELP) {
        	drawText(g, StringPool.getStringPool().getHelp());
        } else if (state == STATE_ABOUT) {
        	drawText(g, StringPool.getStringPool().getAbout());
        } else if (state == STATE_SINGLE_PLAYER_SCOREBOARD) {
        	drawSinglePlayerScoreBoard(g);
        } else if (state == STATE_MULTIPLAYER_SCOREBOARD) {
        	drawMultiplayerScoreBoard(g);
        } else if (state == STATE_DIFFICULTY_SELECT) {
        	drawDiffucultySelect(g);
        }
    }
    
    private void drawArena(Graphics g) {
    	if (arena != null) {
    		this.arenaLeftMargin = (this.width - arena.getWidth()) / 2;
    		this.arenaTopMargin = (this.height - arena.getHeight()) / 2;
    		arena.draw(g, arenaLeftMargin, arenaTopMargin);
    	}
    }
    
    private void drawAvatars(Graphics g) {
    	Terramancer[] players = Engine.getInstance().getPlayers();
    	if (players != null) {
    		for (int i = 0; i < players.length; i++) {
    			if (players[i] != null) {
    				players[i].draw(g);
    			}
        	}
    	}
    }
    
    private void drawText(Graphics g, String text) {
    	int x = width / 2 - (textBackgroundImage.getWidth() / 2);
    	int y = height / 2 - (textBackgroundImage.getHeight() / 2);
    	
    	String[] lines = text.split("\n");
    	
    	g.drawImage(textBackgroundImage, x, y, null);    	
    	drawString(g, x + 12, y + 15, lines[0], 16, 2);
    }
    
    private void drawMenu(Graphics g) {
    	String[] buttons = {"Single Player", "Multiplayer", "Exit"};
    	
    	int buttonsHeight = BUTTON_HEIGHT * buttons.length + BUTTON_MARGIN * (buttons.length - 1);
    	
    	g.setColor(Color.BLACK);
    	
    	int x = width / 2 - (buttonImage.getWidth() / 2);
    	int y = height / 2 - (buttonsHeight / 2);
    	for (int i = 0; i < buttons.length; i++) {
    		if (i == hoveredButton) {
    			g.drawImage(hoveredButtonImage, x, y, null);
    		} else {
    			g.drawImage(buttonImage, x, y, null);
    		}
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), buttons[i], 20, 0);
    		y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	}
    }
    
    private void drawDiffucultySelect(Graphics g) {
    	String[] buttons = {"Easy", "Medium", "Hard"};
    	
    	int buttonsHeight = BUTTON_HEIGHT * buttons.length + BUTTON_MARGIN * (buttons.length - 1);
    	
    	g.setColor(Color.BLACK);
    	
    	int x = width / 2 - (buttonImage.getWidth() / 2);
    	int y = height / 2 - (buttonsHeight / 2);
    	for (int i = 0; i < buttons.length; i++) {
    		if (i == hoveredButton) {
    			g.drawImage(hoveredButtonImage, x, y, null);
    		} else {
    			g.drawImage(buttonImage, x, y, null);
    		}
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), buttons[i], 20, 0);
    		y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	}
    }
    
    private void drawCharSelect(Graphics g) {
    	int x = width / 2 - (buttonImage.getWidth() / 2);
    	int y = height / 4;
    	g.drawImage(hoveredButtonImage, x, y, null);
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Choose Character", 20, 0);
    }
    
    private void drawSinglePlayerScoreBoard(Graphics g) {    	
    	int scoreboardHeight = BUTTON_HEIGHT * 5 + BUTTON_MARGIN * 4 + 50;
    	
    	g.setColor(Color.BLACK);
    	
    	// The scoreboard
    	int x = width / 2 - (buttonImage.getWidth() / 2);
    	int y = height / 2 - (scoreboardHeight / 2);
    	int player1Score = Engine.getInstance().getPlayerControl(1);
    	int player2Score = Engine.getInstance().getPlayerControl(2);
    	g.drawImage(hoveredButtonImage, x, y, null);
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Your Control: " + player1Score + "%", 20, 0);
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	g.drawImage(hoveredButtonImage, x, y, null);
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "CPU Control: " + player2Score + "%", 20, 0);
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	g.drawImage(hoveredButtonImage, x, y, null);
    	if (player1Score > player2Score) {
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "You Win!", 20, 0);
    	} else {
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "You Lose.", 20, 0);
    	}
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	
    	// The menu
    	y += 50;
    	buttonsY = y;
    	if (hoveredButton == 0) {
    		g.drawImage(hoveredButtonImage, x, y, null);
    	} else {
    		g.drawImage(buttonImage, x, y, null);
    	}
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Play Again", 20, 0);
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	if (hoveredButton == 1) {
    		g.drawImage(hoveredButtonImage, x, y, null);
    	} else {
    		g.drawImage(buttonImage, x, y, null);
    	}
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Return to Main Menu", 20, 0);
    }
    
    private void drawMultiplayerScoreBoard(Graphics g) {    	
    	int scoreboardHeight = BUTTON_HEIGHT * 3 + BUTTON_MARGIN * 2;
    	
    	g.setColor(Color.BLACK);
    	
    	// The scoreboard
    	int x = width / 2 - (buttonImage.getWidth() / 2);
    	int y = height / 2 - (scoreboardHeight / 2);
    	int player1Score = Engine.getInstance().getPlayerControl(1);
    	int player2Score = Engine.getInstance().getPlayerControl(2);
    	g.drawImage(hoveredButtonImage, x, y, null);
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Player 1: " + player1Score + "%", 20, 0);
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	g.drawImage(hoveredButtonImage, x, y, null);
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Player 2: " + player2Score + "%", 20, 0);
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	g.drawImage(hoveredButtonImage, x, y, null);
    	if (player1Score > player2Score) {
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Player 1 Wins!", 20, 0);
    	} else if (player2Score > player1Score) {
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Player 2 Wins!", 20, 0);
    	} else {
    		drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Tie!", 20, 0);
    	}
    	
    	// The menu
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	y += 50;
    	buttonsY = y;
    	if (hoveredButton == 0) {
    		g.drawImage(hoveredButtonImage, x, y, null);
    	} else {
    		g.drawImage(buttonImage, x, y, null);
    	}
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Play Again", 20, 0);
    	y += BUTTON_HEIGHT + BUTTON_MARGIN;
    	if (hoveredButton == 1) {
    		g.drawImage(hoveredButtonImage, x, y, null);
    	} else {
    		g.drawImage(buttonImage, x, y, null);
    	}
    	drawString(g, x + buttonImage.getWidth() / 2, y + (BUTTON_HEIGHT / 2), "Return to Main Menu", 20, 0);
    }
    
    private void chooseMenuOption(int index) {
    	if (state == STATE_MAIN_MENU) {
    		if (index == MAIN_MENU_TUTORIAL) {
    			Main.startTutorial();
    			state = STATE_IN_GAME;
    		} else if (index == MAIN_MENU_SINGLE_PLAYER) {
    			//Main.startSinglePlayerGame();
    			state = STATE_DIFFICULTY_SELECT;
    		} else if (index == MAIN_MENU_MULTIPLAYER) {
    			Main.startMultiplayerGame();
    			state = STATE_IN_GAME;
    		} else if (index == MAIN_MENU_HELP) {
    			state = STATE_HELP;
    		} else if (index == MAIN_MENU_ABOUT) {
    			state = STATE_ABOUT;
    		} else if (index == MAIN_MENU_EXIT) {
    			Main.quit();
    		}
    	}
    }

	@Override
	public void mouseClicked(MouseEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void mouseEntered(MouseEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void mouseExited(MouseEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void mousePressed(MouseEvent arg0) {
		if (state == STATE_MAIN_MENU) {
			if (hoveredButton != -1) {
				chooseMenuOption(hoveredButton);
			}
		} else if (state == STATE_HELP || state == STATE_ABOUT) {
			state = STATE_MAIN_MENU;
		} else if (state == STATE_SINGLE_PLAYER_SCOREBOARD) {
			if (hoveredButton == 0) {
				Main.startNextMatch();
				state = STATE_IN_GAME;
			} else if (hoveredButton == 1) {
				Main.openMainMenu();
			}
		} else if (state == STATE_MULTIPLAYER_SCOREBOARD) {
			if (hoveredButton == 0) {
				Main.startMultiplayerGame();
				state = STATE_IN_GAME;
			} else if (hoveredButton == 1) {
				Main.openMainMenu();
			}
		} else if (state == STATE_DIFFICULTY_SELECT) {
			if (hoveredButton >= 0) {
				Main.startSinglePlayerGame(hoveredButton + 1);
				state = STATE_IN_GAME;
			}
		}
	}

	@Override
	public void mouseReleased(MouseEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void mouseDragged(MouseEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void mouseMoved(MouseEvent event) {
		if (state == STATE_MAIN_MENU || state == STATE_DIFFICULTY_SELECT) {
			String[] buttons = {"Single Player", "Multiplayer", "Exit"};
	    	
	    	int buttonsHeight = BUTTON_HEIGHT * buttons.length + BUTTON_MARGIN * (buttons.length - 1);
	    	
	    	int x = width / 2 - (buttonImage.getWidth() / 2);
	    	int y = height / 2 - (buttonsHeight / 2);
	    	
	    	if (event.getX() >= x && event.getX() < x + buttonImage.getWidth() && event.getY() > y && event.getY() < y + buttonsHeight) {
	    		hoveredButton = (event.getY() - y) / BUTTON_HEIGHT;
	    	} else {
	    		hoveredButton = -1;
	    	}
		} else if (state == STATE_SINGLE_PLAYER_SCOREBOARD) {
			int x = width / 2 - (buttonImage.getWidth() / 2);
			int y = buttonsY;
			int buttonsHeight = BUTTON_HEIGHT * 2 + BUTTON_MARGIN * 1;
			if (event.getX() >= x && event.getX() < x + buttonImage.getWidth() && event.getY() > y && event.getY() < y + buttonsHeight) {
	    		hoveredButton = (event.getY() - y) / BUTTON_HEIGHT;
	    	} else {
	    		hoveredButton = -1;
	    	}
		} else if (state == STATE_MULTIPLAYER_SCOREBOARD) {
			int x = width / 2 - (buttonImage.getWidth() / 2);
			int y = buttonsY;
			int buttonsHeight = BUTTON_HEIGHT * 2 + BUTTON_MARGIN * 1;
			if (event.getX() >= x && event.getX() < x + buttonImage.getWidth() && event.getY() > y && event.getY() < y + buttonsHeight) {
	    		hoveredButton = (event.getY() - y) / BUTTON_HEIGHT;
	    	} else {
	    		hoveredButton = -1;
	    	}
		}
	}
	
	private void drawString(Graphics g, int x, int y, String str, int fontSize, int alignment) {
		Font oldFont = g.getFont();
		Font font = new Font(oldFont.getFamily(), Font.PLAIN,  fontSize);
    	g.setFont(font);
    	FontMetrics fontMetrics = g.getFontMetrics();
    	int messageWidth = fontMetrics.stringWidth(str);
    	int fontHeight = fontMetrics.getAscent();
    	int finalX = x;
    	if (alignment == 0) { // Center
    		finalX = x - (messageWidth / 2);
    	} else if (alignment == 1) { // Right
    		finalX = x - messageWidth;
    	} else if (alignment == 2) { // Left
    		finalX = x;
    	}
    	g.drawChars(str.toCharArray(), 0, str.length(), finalX, y + fontHeight / 2);
    	//System.out.println(x + " ; " + finalX);
	}

}
