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
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;

import javax.swing.AbstractAction;
import javax.swing.JMenu;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JPopupMenu;
import javax.swing.KeyStroke;

public class LevelEditorPanel extends JPanel implements MouseListener, MouseMotionListener, ActionListener {
	
	private Tilemap currentLevel;
	private JPopupMenu tileMenu;
	int width, height;
	
	private int currentRow, currentColumn;
	private int currentTile;
	private boolean baseLayer;
	private int selectionX, selectionY, selectionWidth, selectionHeight;
	private boolean selectionActive;
	private int selectionCopyX, selectionCopyY;
	private int hoveredTileX, hoveredTileY;

	public LevelEditorPanel() {
        //setBorder(BorderFactory.createLineBorder(Color.black));
        this.setBackground(Color.BLACK);
        this.addMouseListener(this);
        this.addMouseMotionListener(this);
        
        selectionX = 0;
        selectionY = 0;
        selectionWidth = 1;
        selectionHeight = 1;
        selectionCopyX = -1;
        selectionCopyY = -1;
        
        // TEMP: Popup menu to allow primitive level editing
        tileMenu = new JPopupMenu();
        String[] possibleTiles = Tile.getPossibleTiles();
        JMenu currentSubMenu = null;
        String currentSubMenuName = null;
        for (int i = 0; i < possibleTiles.length; i++) {
        	String nextTile = possibleTiles[i];
        	JMenuItem item = new JMenuItem(nextTile);
        	item.addActionListener(this);
        	item.setActionCommand("PutTile" + i);
        	
        	if (nextTile.contains("_")) {
        		String newSubMenuName = nextTile.substring(0, nextTile.indexOf('_'));
        		if (!newSubMenuName.equals(currentSubMenuName)) {
        			currentSubMenuName = newSubMenuName;
        			if (currentSubMenu != null) tileMenu.add(currentSubMenu);
        			currentSubMenu = new JMenu(currentSubMenuName);
        		}
        		currentSubMenu.add(item);
        	} else {
        		tileMenu.add(item);
        	}
        }
        if (currentSubMenu != null) tileMenu.add(currentSubMenu);
        
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_S, 0), "SaveMap");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_1, 0), "SwitchToBaseLayer");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_2, 0), "SwitchToAdditionsLayer");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_L, 0), "ToggleSelection");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_RIGHT, 0), "SelectRight");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, 0), "SelectLeft");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_UP, 0), "SelectUp");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_DOWN, 0), "SelectDown");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_K, 0), "ExpandSelectionRight");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_H, 0), "ReduceSelectionRight");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_J, 0), "ExpandSelectionBottom");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_U, 0), "ReduceSelectionBottom");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_C, 0), "CopySelection");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_V, 0), "PasteSelection");
        getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_P, 0), "TilePicker");
        
        getActionMap().put("SaveMap", new AbstractAction() {public void actionPerformed(ActionEvent e) {saveMap();}});
        getActionMap().put("SwitchToBaseLayer", new AbstractAction() {public void actionPerformed(ActionEvent e) {switchLayer(true);}});
        getActionMap().put("SwitchToAdditionsLayer", new AbstractAction() {public void actionPerformed(ActionEvent e) {switchLayer(false);}});
        getActionMap().put("ToggleSelection", new AbstractAction() {public void actionPerformed(ActionEvent e) {toggleSelection();}});
        getActionMap().put("SelectRight", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveSelectionWindow(1, 0);}});
        getActionMap().put("SelectLeft", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveSelectionWindow(-1, 0);}});
        getActionMap().put("SelectUp", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveSelectionWindow(0, -1);}});
        getActionMap().put("SelectDown", new AbstractAction() {public void actionPerformed(ActionEvent e) {moveSelectionWindow(0, 1);}});
        getActionMap().put("ExpandSelectionRight", new AbstractAction() {public void actionPerformed(ActionEvent e) {scaleSelectionWindow(1, 0);}});
        getActionMap().put("ReduceSelectionRight", new AbstractAction() {public void actionPerformed(ActionEvent e) {scaleSelectionWindow(-1, 0);}});
        getActionMap().put("ExpandSelectionBottom", new AbstractAction() {public void actionPerformed(ActionEvent e) {scaleSelectionWindow(0, 1);}});
        getActionMap().put("ReduceSelectionBottom", new AbstractAction() {public void actionPerformed(ActionEvent e) {scaleSelectionWindow(0, -1);}});
        getActionMap().put("CopySelection", new AbstractAction() {public void actionPerformed(ActionEvent e) {copySelection();}});
        getActionMap().put("PasteSelection", new AbstractAction() {public void actionPerformed(ActionEvent e) {pasteSelection();}});
        getActionMap().put("TilePicker", new AbstractAction() {public void actionPerformed(ActionEvent e) {pickTile();}});
    }
	
	public void updateSize(int width, int height) {
		this.setSize(width, height);
		this.width = width;
		this.height = height;
		
		int rowSize = width / Tile.TILE_WIDTH + 1;
		int columnSize = height / Tile.TILE_HEIGHT + 1;
		
		//currentLevel = new Tilemap(rowSize, columnSize);
		currentLevel = Tilemap.loadFromFile("Map.map");
	}
	
	private void pickTile() {
		currentTile = currentLevel.getTileAt(hoveredTileX, hoveredTileY, baseLayer);
	}
	
	private void copySelection() {
		if (!selectionActive) return;
		selectionCopyX = selectionX;
		selectionCopyY = selectionY;
	}
	
	private void pasteSelection() {
		if (!selectionActive || selectionCopyX < 0) return;
		for (int i = 0; i < selectionWidth; i++) {
			for (int j = 0; j < selectionHeight; j++) {
				currentLevel.setTile(selectionX + i, selectionY + j, currentLevel.getTileAt(selectionCopyX + i, selectionCopyY + j, baseLayer), baseLayer);
			}
		}
	}
	
	private void scaleSelectionWindow(int deltaX, int deltaY) {
		if (!selectionActive) return;
		selectionWidth += deltaX;
		selectionHeight += deltaY;
		if (selectionWidth < 1) selectionWidth = 1;
		if (selectionHeight < 1) selectionHeight = 1;
	}
	
	private void moveSelectionWindow(int deltaX, int deltaY) {
		if (!selectionActive) return;
		selectionX += deltaX;
		selectionY += deltaY;
		
		if (selectionX < 0) selectionX = 0;
		if (selectionX > currentLevel.getRowSize() - 1) selectionX = currentLevel.getRowSize() - 1;
		if (selectionY < 0) selectionY = 0;
		if (selectionY > currentLevel.getColumnSize() - 1) selectionY = currentLevel.getColumnSize() - 1;
	}
	
	private void toggleSelection() {
		selectionActive = !selectionActive;
	}
	
	private void switchLayer(boolean base) {
		this.baseLayer = base;
	}
	
	private void saveMap() {
		currentLevel.saveToFile("Map.map");
		System.out.println("Saved.");
	}
    
    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        
        if (currentLevel != null) {
        	currentLevel.draw(g, 0, 0);
        }
        
        if (selectionActive) {
        	g.setColor(Color.WHITE);
        	g.drawRect(selectionX * Tile.TILE_WIDTH, selectionY * Tile.TILE_HEIGHT, selectionWidth * Tile.TILE_WIDTH, selectionHeight * Tile.TILE_HEIGHT);
        }
        
        /*g.setColor(Color.RED);
        g.drawRect(this.width / 2 - (1024 / 2), this.height / 2 - (768 / 2), 1024, 768);
        g.setColor(Color.YELLOW);
        g.drawRect(this.width / 2 - (800 / 2), this.height / 2 - (600 / 2), 800, 600);*/
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
		if (event.isPopupTrigger()) {
			currentColumn = event.getX() / Tile.TILE_WIDTH;
			currentRow = event.getY() / Tile.TILE_HEIGHT;
			tileMenu.show(event.getComponent(), event.getX(), event.getY());
        } else {
        	int column = event.getX() / Tile.TILE_WIDTH;
			int row = event.getY() / Tile.TILE_HEIGHT;
			currentLevel.setTile(column, row, currentTile, this.baseLayer);
			//currentLevel.updateCache();
        }
	}

	@Override
	public void mouseDragged(MouseEvent event) {
		int column = event.getX() / Tile.TILE_WIDTH;
		int row = event.getY() / Tile.TILE_HEIGHT;
		currentLevel.setTile(column, row, currentTile, this.baseLayer);
		//currentLevel.updateCache();
	}

	@Override
	public void mouseMoved(MouseEvent event) {
		hoveredTileX = event.getX() / Tile.TILE_WIDTH;
		hoveredTileY = event.getY() / Tile.TILE_HEIGHT;
	}

	@Override
	public void actionPerformed(ActionEvent event) {
		String command = event.getActionCommand();
		if (command.startsWith("PutTile")) {
			currentTile = Integer.valueOf(command.substring(7));
			//currentLevel.setTile(currentColumn, currentRow, currentTile);
			//currentLevel.updateCache();
		}
	}
}
