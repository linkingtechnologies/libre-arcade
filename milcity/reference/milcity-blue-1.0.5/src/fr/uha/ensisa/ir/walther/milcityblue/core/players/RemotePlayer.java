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

package fr.uha.ensisa.ir.walther.milcityblue.core.players;

import fr.uha.ensisa.ir.walther.milcityblue.bluetooth.ClientServer;
import fr.uha.ensisa.ir.walther.milcityblue.core.Game;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerInterface;
import fr.uha.ensisa.ir.walther.milcityblue.core.StatusGrid;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;

public class RemotePlayer implements PlayerInterface
{
	private ClientServer cs;
	private StatusGrid statusGrid;
	private int playerIndex;
	private Game game;
	private boolean hasWon, hasLoose;
	
	public RemotePlayer(ClientServer cs)
	{
		this.cs = cs;
		this.statusGrid = null;
		this.playerIndex = -1;
		this.game = null;
		this.hasLoose = false;
		this.hasWon = false;
	}
	
	public void fire(Command commandFire)
	{
		System.out.println("RemotePlayer-" + playerIndex + ":\t Sending Command :" + commandFire);
		cs.send(commandFire);
	}

	public void run()
	{
		while(game.getStatus() == Game.STATUS_PLAY)
		{
			Command command = cs.receiveCommand();
			CommandExecuter executer = new CommandExecuter(command, game);
			executer.start();
		}
		if(game.getStatus() == Game.STATUS_END || game.getStatus() == Game.STATUS_STOP)
			cs.close();
	}

	public int getPlayerIndex()
	{
		return playerIndex;
	}

	public StatusGrid getStatusGrid()
	{
		return statusGrid;
	}

	public void setPlayerIndex(int playerIndex)
	{
		this.playerIndex = playerIndex;
	}

	public void start()
	{
		Thread thread = new Thread(this);
		thread.start();
	}

	public void setGrid(Grid grid)
	{
		statusGrid = new StatusGrid(playerIndex, grid, game);
	}

	public Game getGame()
	{
		return game;
	}

	public void setGame(Game game)
	{
		this.game = game;
	}
	
	public boolean isLocal()
	{
		return false;
	}

	public void sendCommand(Command command)
	{
		cs.send(command);
	}
	
	public boolean hasLoose()
	{
		return hasLoose;
	}
	
	public boolean hasWon()
	{
		return hasWon;
	}
	
	public void win()
	{
		hasWon = true;
	}
	
	public void lose()
	{
		hasLoose = true;
	}
	
	private class CommandExecuter extends Thread
	{
		private Command command;
		private Game game;
		
		public CommandExecuter(Command command, Game game)
		{
			super();
			this.command = command;
			this.game = game;
		}
		
		public void run()
		{
			System.out.println("RemotePlayer-" + playerIndex + ":\t Receveid Command :" + command);
			game.execute(command);
		}
	}
}
