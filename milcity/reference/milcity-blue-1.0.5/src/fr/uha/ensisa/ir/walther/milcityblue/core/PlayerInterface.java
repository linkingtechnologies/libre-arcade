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

package fr.uha.ensisa.ir.walther.milcityblue.core;

import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;

public interface PlayerInterface extends Runnable
{	
	public void fire(Command commandFire);
	public StatusGrid getStatusGrid();
	public void setGrid(Grid grid);
	public int getPlayerIndex();
	public void setPlayerIndex(int playerIndex);
	public void start();
	public void setGame(Game game);
	public Game getGame();
	public boolean isLocal();
	public void sendCommand(Command command);
	public boolean hasWon();
	public boolean hasLoose();
	public void win();
	public void lose();
}