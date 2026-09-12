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
import java.awt.event.ActionListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;
import javax.swing.JPanel;

import shai.lpc.Main;
import shai.lpc.model.Gladiator;
import shai.lpc.model.League;
import shai.lpc.model.Team;
import shai.lpc.ui.sprites.AvatarSprite;
import shai.lpc.ui.sprites.SpriteGenerator;

public class HallOfRecordsPanel extends JPanel implements MouseListener, MouseMotionListener, ActionListener {
	
	private static final int BACK_BUTTON_SIZE = 24;
	private static final int LEAGUE_TABLE_BUTTON_WIDTH = 200;
	private static final int LEAGUE_TABLE_BUTTON_HEIGHT = 40;
	
	private static final int STATE_GLADIATOR = 1;
	private static final int STATE_TEAM = 2;
	private static final int STATE_MAIN = 3;
	
	private int  width, height;
	private BufferedImage backgroundImage;
	private int state;
	private BufferedImage[] portraits;
	private BufferedImage[] backButtonImages;
	private BufferedImage tableButtonImage;
	
	// For league
	private Team[] leagueTable;
	private int tableTop;
	
	// For teams
	private Team team;
	
	// For gladiators
	private Gladiator gladiator;

	public HallOfRecordsPanel() {
        this.setBackground(Color.BLACK);
        this.addMouseListener(this);
        this.addMouseMotionListener(this);
        this.state = STATE_MAIN;
        initBackButtonImage();
        tableButtonImage = UIUtils.getButtonImage(LEAGUE_TABLE_BUTTON_WIDTH, LEAGUE_TABLE_BUTTON_HEIGHT);
        openLeagueRecord();
        
        //getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_A, 0), "MoveLeft");
        
        //getActionMap().put("MoveLeft", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveLeft(0);}});
    }
	
	public void updateSize(int width, int height) {
		this.setSize(width, height);
		this.width = width;
		this.height = height;
		initBackgroundImage();
	}
	
	public void openGladiatorRecord(Gladiator gladiator) {
		this.state = STATE_GLADIATOR;
		this.gladiator = gladiator;
		portraits = new BufferedImage[1];
		portraits[0] = AvatarSprite.getPortrait(gladiator);
		team = null;
	}
	
	public void openTeamRecord(Team team) {
		this.state = STATE_TEAM;
		this.team = team;
		gladiator = null;
		portraits = new BufferedImage[team.getRoster().length];
		for (int i = 0; i < portraits.length; i++) {
			portraits[i] = AvatarSprite.getPortrait(team.getRoster()[i]);
		}
	}
	
	public void openLeagueRecord() {
		this.state = STATE_MAIN;
		this.team = null;
		this.gladiator = null;
		this.leagueTable = League.getCurrentLeague().getLeagueTable();
	}
    
    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        g.setColor(Color.YELLOW);
        g.fillRect(100, 100, 100, 100);
        if (backgroundImage != null) {
        	g.drawImage(backgroundImage, 0, 0, null);
        	g.drawImage(backButtonImages[0], this.width - 20 - BACK_BUTTON_SIZE, 20, null);
        }
        if (this.state == STATE_MAIN) {
        	g.setColor(Color.BLACK);
        	drawString(g, width / 2, 50, "Week 1", 40, 1);
        	tableTop = this.height / 2 - LEAGUE_TABLE_BUTTON_HEIGHT * (League.NUMBER_OF_TEAMS / 2);
        	int tableX = width / 2 - tableButtonImage.getWidth() / 2;
        	for (int i = 0; i < leagueTable.length; i++) {
        		int currentHeight = tableTop + i * LEAGUE_TABLE_BUTTON_HEIGHT;
        		g.drawImage(tableButtonImage, tableX, currentHeight, null);
        		drawString(g, width / 2, currentHeight + LEAGUE_TABLE_BUTTON_HEIGHT / 2, leagueTable[i].getName(), 20, 0);
        	}
        } else if (this.state == STATE_TEAM) {
        	g.setColor(Color.BLACK);
        	drawString(g, width / 2, 50, team.getName(), 40, 1);
        	Gladiator[] roster = team.getRoster();
        	int portraitWidth = portraits[0].getWidth();
        	int portraitHeight = portraits[0].getHeight();
        	int portraitMargin = this.width / 6 - portraitWidth;
        	for (int i = 0; i < 5; i++) {
        		int x = portraitMargin + i * (portraitWidth + portraitMargin);
        		int portraitY = 200;
        		g.drawImage(portraits[i], x, portraitY, null);
        		portraitY += portraitHeight + 20;
        		drawString(g, x, portraitY, roster[i].getName(), 20, 0);
        	}
        } else if (this.state == STATE_GLADIATOR) {
        	g.drawImage(portraits[0], 20, 20, null);
        	g.setColor(Color.BLACK);
        	drawString(g, width / 2, 20 + portraits[0].getHeight() / 2, gladiator.getName(), 40, 1);
        	String[] properties = gladiator.getPropertiesForDisplay();
        	for (int i = 0; i < properties.length; i++) {
        		drawString(g, 20, 200 + i * 30, properties[i], 20, 2);
        	}
        }
    }
    
    private void initBackButtonImage() {
    	String backButtonImageSheetName = Main.UI_IMAGES_BASE_FOLDER + "ButtonsX.png";
    	backButtonImages = new BufferedImage[4]; // Regular, hovering, clicked, disabled
    	try {
    		BufferedImage backButtonImageSheet = ImageIO.read(new File(backButtonImageSheetName));
    		for (int i = 0; i < 4; i++) {
    			backButtonImages[i] = backButtonImageSheet.getSubimage(0, i * BACK_BUTTON_SIZE, BACK_BUTTON_SIZE, BACK_BUTTON_SIZE);
    		}
    	} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    private void initBackgroundImage() {
    	backgroundImage = UIUtils.getButtonImage(this.width, this.height);
    }

	@Override
	public void mouseClicked(MouseEvent event) {
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
	public void mousePressed(MouseEvent event) {
	}

	@Override
	public void mouseReleased(MouseEvent event) {
		if (state == STATE_MAIN) {
			// Check for clicks on the back button
			if (event.getY() > 20 && event.getY() < 20 + BACK_BUTTON_SIZE && event.getX() > this.width - 20 - BACK_BUTTON_SIZE && event.getX() < this.width - 20) {
				this.state = STATE_MAIN;
			} else {
				// Check for clicks on teams
				if (event.getX() > this.width / 2 - LEAGUE_TABLE_BUTTON_WIDTH / 2 && event.getX() < this.width / 2 + LEAGUE_TABLE_BUTTON_WIDTH / 2 &&
						event.getY() > tableTop && event.getY() < tableTop + LEAGUE_TABLE_BUTTON_HEIGHT * League.NUMBER_OF_TEAMS) {
					int teamNum = (event.getY() - tableTop) / LEAGUE_TABLE_BUTTON_HEIGHT;
					this.openTeamRecord(leagueTable[teamNum]);
				}
			}
		} else if (state == STATE_TEAM) {
			// Check for clicks on the back button
			if (event.getY() > 20 && event.getY() < 20 + BACK_BUTTON_SIZE && event.getX() > this.width - 20 - BACK_BUTTON_SIZE && event.getX() < this.width - 20) {
				this.openLeagueRecord();
			} else {
				// Check for clicks on roster members
				int portraitHeight = portraits[0].getHeight();
	    		int portraitY = 200;
	        	if (event.getY() > portraitY && event.getY() < portraitY + portraitHeight) {
	        		int portraitWidth = portraits[0].getWidth();
	        		int portraitMargin = this.width / 6 - portraitWidth;
	        		for (int i = 0; i < 5; i++) {
	        			int x = portraitMargin + i * (portraitWidth + portraitMargin);
	        			if (event.getX() > x && event.getX() < x + portraitWidth) {
	        				openGladiatorRecord(team.getRoster()[i]);
	        			}
	        		}
	        	}
			}
		} else if (state == STATE_GLADIATOR) {
			// Check for clicks on the back button
			if (event.getY() > 20 && event.getY() < 20 + BACK_BUTTON_SIZE && event.getX() > this.width - 20 - BACK_BUTTON_SIZE && event.getX() < this.width - 20) {
				openTeamRecord(gladiator.getTeam());
			} 
		}
	}

	@Override
	public void mouseDragged(MouseEvent event) {
	}

	@Override
	public void mouseMoved(MouseEvent event) {
	}

	@Override
	public void actionPerformed(ActionEvent event) {
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
