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
import java.awt.Graphics;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;

import javax.swing.JPanel;

import shai.lpc.combat.Avatar;
import shai.lpc.combat.MatchEngine;
import shai.lpc.combat.MatchReplay;
import shai.lpc.ui.sprites.AvatarSprite;

public class ReplayPanel extends JPanel implements MouseListener, MouseMotionListener, ActionListener {
	
	private MatchEngine engine;
	private MatchReplay replay;
	private long startTime;
	private Avatar[] avatars;
	private AvatarSprite[] avatarSprites;
	private Tilemap arena;
	private int arenaLeftMargin, arenaTopMargin;
	private int width, height;

	public ReplayPanel() {
        this.setBackground(Color.BLACK);
        this.addMouseListener(this);
        this.addMouseMotionListener(this);
        
        //getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_A, 0), "MoveLeft");
        
        //getActionMap().put("MoveLeft", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveLeft(0);}});
    }
	
	public void updateSize(int width, int height) {
		this.setSize(width, height);
		this.width = width;
		this.height = height;
	}
	
	public void startReplay(MatchReplay replay) {
		this.replay = replay;
		this.startTime = System.currentTimeMillis();
		engine = new MatchEngine();
		engine.startMatchReplay(replay);
		
		arena = engine.getArena().getTilemap();
		this.arenaLeftMargin = (this.width - arena.getWidth()) / 2;
		this.arenaTopMargin = (this.height - arena.getHeight()) / 2;
		
		avatars = engine.getAvatars();
		avatarSprites = new AvatarSprite[avatars.length];
		for (int i = 0; i < avatars.length; i++) {
			avatarSprites[i] = new AvatarSprite(avatars[i]);
		}
	}
    
    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        
        long currentTime = System.currentTimeMillis() - startTime;
        engine.advanceMatchReplay(currentTime);
        
        if (engine != null) {
        	drawArena(g);
        	drawAvatars(g);
        }
    }
    
    private void drawArena(Graphics g) {
    	arena.draw(g, arenaLeftMargin, arenaTopMargin);
    }
    
    private void drawAvatars(Graphics g) {
    	for (int i = 0; i < avatarSprites.length; i++) {
    		avatarSprites[i].draw(g, arenaLeftMargin, arenaTopMargin, System.currentTimeMillis() - startTime);
    	}
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
}
