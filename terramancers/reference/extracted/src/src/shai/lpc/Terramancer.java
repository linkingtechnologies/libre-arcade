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

import java.awt.Graphics;

import shai.lpc.ui.sprites.AvatarSprite;
import shai.lpc.ui.sprites.Sprite;

public class Terramancer extends GameObject {
	
	public static final int DIRECTION_UP = 0;
	public static final int DIRECTION_RIGHT = 1;
	public static final int DIRECTION_DOWN = 2;
	public static final int DIRECTION_LEFT = 3;
	public static final int DIRECTION_UP_RIGHT = 4;
	public static final int DIRECTION_DOWN_RIGHT = 5;
	public static final int DIRECTION_DOWN_LEFT = 6;
	public static final int DIRECTION_UP_LEFT = 7;
	
	public static final double MAX_SPEED = 2.0;
	
	private double x, y;
	private int width, height;
	private int tileset;
	protected boolean movingLeft, movingRight, movingUp, movingDown;
	protected int facing; // Direction the terramancer is looking towards
	private Sprite sprite;
	
	public Terramancer(int tileset) {
		this.x = 100.0;
		this.y = 100.0;
		this.width = 50;
		this.height = 100;
		this.tileset = tileset;
		sprite = Sprite.getTerramancerSprite(this);
	}
	
	public double getX() {return x;}
	public double getY() {return y;}	
	public double getWidth() {return width;}
	public double getHeight() {return height;}
	
	public void setLocation(double x, double y) {
		this.x = x;
		this.y = y;
	}
	
	public int getTileset() {return this.tileset;}

	public void tick() {
		double deltaX = 0.0;
		double deltaY = 0.0;
		
		double speed = 0.8;//Engine.getInstance().getPlayerSpeed(this.tileset);
		
		if (isMoving()) {
			if (movingLeft) {
				deltaX -= speed;
			}
			if (movingRight) {
				deltaX += speed;
			}
			if (movingUp) {
				deltaY -= speed;
			}
			if (movingDown) {
				deltaY += speed;
			}
			
			boolean movementPossible = true;
			if (!Engine.getInstance().isPointFree(x + deltaX, y + deltaY)) {
				movementPossible = false;
			}
			// TODO: Check for collisions
			
			if (movementPossible) {
				x += deltaX;
				y += deltaY;
			}
			
			// Change tileset if necessary
			int currentTileset = Engine.getInstance().getTilesetAtCoordinates(this.x, this.y);
			if (currentTileset == 0) {
				Engine.getInstance().setTilesetAtCoordinates(this.x, this.y, this.tileset);
			}
		}
	}
	
	public void draw(Graphics g) {
		sprite.draw(g, (int) this.x - (AvatarSprite.SPRITE_WIDTH / 2) + 16, (int) this.y - AvatarSprite.SPRITE_HEIGHT + 16);
	}
	
	public void moveLeft() {
		movingLeft = true;
		if (movingUp) facing = DIRECTION_UP_LEFT;
		else if (movingDown) facing = DIRECTION_DOWN_LEFT;
		else facing = DIRECTION_LEFT;
	}
	
	public void moveRight() {
		movingRight = true;
		if (movingUp) facing = DIRECTION_UP_RIGHT;
		else if (movingDown) facing = DIRECTION_DOWN_RIGHT;
		else facing = DIRECTION_RIGHT;
	}
	
	public void moveUp() {
		movingUp = true;
		if (movingLeft) facing = DIRECTION_UP_LEFT;
		else if (movingRight) facing = DIRECTION_UP_RIGHT;
		else facing = DIRECTION_UP;
	}
	
	public void moveDown() {
		movingDown = true;
		if (movingLeft) facing = DIRECTION_DOWN_LEFT;
		else if (movingRight) facing = DIRECTION_DOWN_RIGHT;
		else facing = DIRECTION_DOWN;
	}
	
	public void stopMovingLeft() {
		movingLeft = false;
		if (movingUp) facing = DIRECTION_UP;
		else if (movingDown) facing = DIRECTION_DOWN;
	}
	
	public void stopMovingRight() {
		movingRight = false;
		if (movingUp) facing = DIRECTION_UP;
		else if (movingDown) facing = DIRECTION_DOWN;
	}
	
	public void stopMovingUp() {
		movingUp = false;
		if (movingLeft) facing = DIRECTION_LEFT;
		else if (movingRight) facing = DIRECTION_RIGHT;
	}
	
	public void stopMovingDown() {
		movingDown = false;
		if (movingLeft) facing = DIRECTION_LEFT;
		else if (movingRight) facing = DIRECTION_RIGHT;
	}
	
	public boolean isMoving() {
		return (movingUp || movingRight || movingDown || movingLeft);
	}
	
	public int facingDirection() {
		return facing;
	}

}
