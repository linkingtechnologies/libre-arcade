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

import java.util.Enumeration;
import java.util.Vector;

import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Commander;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Commands;

public class Game implements Engine
{
	private Vector players;
	private int localPlayerIndex;
	private Commander commander;
	private Engine engine;
	private GameListener gameListener;
	
	private int winnerIndex, winnerScore;
	
	private byte status = 0;
	
	public static final byte STATUS_INIT = 0;
	public static final byte STATUS_PLAY = 1;
	public static final byte STATUS_PAUSE = 2;
	public static final byte STATUS_END = 3;
	public static final byte STATUS_STOP = 4;
	
	public Game()
	{
		players = new Vector(2, 1);
		localPlayerIndex = -1;
		commander = new Commander(this);
		winnerIndex = -1;
		winnerScore = -1;
		this.engine = new Engine() 
		{
			public void pause() {}
			public void resume() {}
			public void start() {}
			public void stop() {}
		};
		this.gameListener = new GameListener()
		{
			public void notifyGameEvent(Game sender, byte eventType, int arg) {}
		};
	}
	
	public int registerLocalPlayer(PlayerAbstract localPlayer)
	{
		if (localPlayerIndex == -1)
			players.addElement(localPlayer);
		else
			players.setElementAt(localPlayer, localPlayerIndex);
		return (localPlayerIndex = players.indexOf(localPlayer));
	}
	
	public int registerRemotePlayer(PlayerInterface remotePlayer)
	{
		players.addElement(remotePlayer);
		remotePlayer.setPlayerIndex(players.indexOf(remotePlayer));
		return players.indexOf(remotePlayer);
	}
	
	public PlayerAbstract getLocalPlayer()
	{
		if (localPlayerIndex != -1)
			return ((PlayerAbstract) players.elementAt(localPlayerIndex));
		return null;
	}
	
	public PlayerInterface getRemotePlayer(int remotePlayerIndex)
	{
		if ((remotePlayerIndex >= 0) && (remotePlayerIndex < players.size()))
			return ((PlayerInterface) players.elementAt(remotePlayerIndex));
		return null;
	}
	
	public int getNumberOfPlayers()
	{
		return players.size();
	}
	
	public void removePlayer(int playerIndex)
	{
		if ((playerIndex >= 0) && (playerIndex < players.size()))
			players.removeElementAt(playerIndex);
	}
	
	public void removePlayer(PlayerInterface player)
	{
		players.removeElement(player);
	}
	
	public int getIndexOfPlayer(PlayerInterface player)
	{
		return players.indexOf(player);
	}

	public int getLocalPlayerIndex()
	{
		return localPlayerIndex;
	}
	
	public void execute(Commands commands)
	{
		this.commander.execute(commands);
	}
	
	public void execute(Command command)
	{
		this.commander.execute(command);
	}

	public void setStatus(byte status)
	{
		if((this.status == Game.STATUS_INIT) && (status == Game.STATUS_PLAY))
		{
			this.status = status;
			for (int i = 0; i < players.size(); ++i)
				((PlayerInterface) players.elementAt(i)).start();
			engine.start();
			gameListener.notifyGameEvent(this, GameListener.GAMEEVENT_STARTED, 0);
		}
		else
		{
			if((this.status == Game.STATUS_PAUSE) && (status == Game.STATUS_PLAY))
			{
				for (int i = 0; i < players.size(); ++i)
					((PlayerInterface) players.elementAt(i)).start();
				engine.resume();
				gameListener.notifyGameEvent(this, GameListener.GAMEEVENT_RESUMED, 0);
			}
			if((status == Game.STATUS_PAUSE) && (this.status != Game.STATUS_PAUSE))
			{
				engine.pause();
				gameListener.notifyGameEvent(this, GameListener.GAMEEVENT_PAUSED, 0);
			}
			if((status == Game.STATUS_STOP) && (this.status != Game.STATUS_STOP))
			{
				engine.stop();
				gameListener.notifyGameEvent(this, GameListener.GAMEEVENT_STOPPED, 0);
			}
			if((status == Game.STATUS_END) && (this.status != Game.STATUS_END))
			{
				engine.stop();
				gameListener.notifyGameEvent(this, GameListener.GAMEEVENT_ENDED, 0);
			}
			
			if(this.status != status)
			{
				int commandType = Command.COMMAND_START;
				if(status == Game.STATUS_PAUSE)
					commandType = Command.COMMAND_PAUSE;
				else if(status == Game.STATUS_END || status == Game.STATUS_STOP)
					commandType = Command.COMMAND_END;
				Command command = new Command(localPlayerIndex, Command.TARGET_ALL, commandType, new int[0]);
				if(isServer())
				{
				int playersCount = getNumberOfPlayers();
				for(int i = 0; i < playersCount; ++i)
					if(i !=  getServerIndex())
						 getRemotePlayer(i).sendCommand(command);
				}
				else
					getRemotePlayer(getServerIndex()).sendCommand(command);
			}
			
			this.status = status;
		}
	}

	public byte getStatus()
	{
		return status;
	}
	
	public PlayerInterface getPlayerAt(int playerIndex)
	{
		if((playerIndex >= 0) && (playerIndex < players.size()))
			return ((PlayerInterface) players.elementAt(playerIndex));
		return null;
	}
	
	public boolean isServer()
	{
		return (localPlayerIndex == 0);
	}

	public Engine getEngine()
	{
		return engine;
	}

	public void setEngine(Engine engine)
	{
		this.engine = engine;
	}

	public void pause()
	{
		setStatus(Game.STATUS_PAUSE);
	}

	public void resume()
	{
		setStatus(Game.STATUS_PLAY);
	}

	public void start()
	{
		setStatus(Game.STATUS_PLAY);
	}

	public void stop()
	{
		setStatus(Game.STATUS_STOP);
	}
	
	public void end()
	{
		setStatus(Game.STATUS_END);
	}
	
	public int getServerIndex()
	{
		if(localPlayerIndex > 0)
			return 0;
		return -1;
	}
	
	public Enumeration getPlayers()
	{
		return players.elements();
	}

	public GameListener getGameListener()
	{
		return gameListener;
	}

	public void setGameListener(GameListener gameListener)
	{
		this.gameListener = gameListener;
	}
	
	public void vibrate(int ms)
	{
		gameListener.notifyGameEvent(this, GameListener.GAMEEVENT_VIBRATE, ms);
	}
	
	// TODO This method is only used for 2-player game !
	public int getOtherPlayerIndex(int playerIndex)
	{
		if(playerIndex == 0)
			return 1;
		return 0;
	}

	public int getWinnerIndex()
	{
		return winnerIndex;
	}

	public void setWinnerIndex(int winnerIndex)
	{
		this.winnerIndex = winnerIndex;
	}

	public int getWinnerScore()
	{
		return winnerScore;
	}

	public void setWinnerScore(int winnerScore)
	{
		this.winnerScore = winnerScore;
	}
}
