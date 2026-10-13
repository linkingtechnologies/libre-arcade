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

/**
 *	GameModel class provides an interface for game
 *  objects to encapsulate it's game state. 
 */
public interface GameModel {
	
	/**
	 * Process the game logic on the object model.
	 * 
	 * @param keys the state of the keys.
	 * @see javax.microedition.lcdui.GameCanvas
	 * 
	 * @param width Width of the drawing area.
	 * @param height Height of the drawing area.
	 */
	public void Ai(int keys, int width, int height);
	
}
