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
package fr.uha.ensisa.ir.walther.milcityblue.core.commands;

import fr.uha.ensisa.ir.walther.milcityblue.core.Game;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;

public class Commander
{
	private Game game;

	public Commander(Game game)
	{
		super();
		this.game = game;
	}
	
	public void execute(Command command)
	{
		//int[] args = command.getParameters();
		PlayerAbstract player = game.getLocalPlayer();
		
		if (command.getPlayerTarget() == game.getLocalPlayerIndex())
		{
			switch(command.getCommandType())
			{
			case Command.COMMAND_FIRE		:	player.fire(command);
												break;
			case Command.COMMAND_ADDSCORE	:	player.setScore(player.getScore() + command.getParameter(0));
												break;
			case Command.COMMAND_DISCOVER	:	game.getPlayerAt(command.getPlayerSender()).getStatusGrid().update(command);
												break;
			}
		}
		
		if (command.getPlayerTarget() == Command.TARGET_ALL)
		{
			switch(command.getCommandType())
			{
			case Command.COMMAND_HIT		:	System.out.println("Begin GridStatus update");
												game.getPlayerAt(command.getPlayerSender()).getStatusGrid().update(command);
												System.out.println("GridStatus updated");
												break;
			case Command.COMMAND_DESTROYED	:	game.getPlayerAt(command.getPlayerSender()).getStatusGrid().update(command);
												break;
			case Command.COMMAND_START		:	game.setStatus(Game.STATUS_PLAY);
												break;
			case Command.COMMAND_PAUSE		:	game.setStatus(Game.STATUS_PAUSE);
												break;
			case Command.COMMAND_CONTINUE	:	game.setStatus(Game.STATUS_PLAY);
												break;
			case Command.COMMAND_END		:	game.setStatus(Game.STATUS_END);
												break;
			case Command.COMMAND_WIN		:	game.getPlayerAt(command.getPlayerSender()).win();
												game.setWinnerIndex(command.getPlayerSender());
												game.setWinnerScore(command.getParameter(0));
												game.setStatus(Game.STATUS_END);
												break;
			case Command.COMMAND_LOSE		:	game.getPlayerAt(command.getPlayerSender()).lose();
												break;
			}
		}
		
		if(command.getPlayerSender() == game.getLocalPlayerIndex())
		{
			if(command.getPlayerTarget() != command.getPlayerSender())
			{
				if(game.isServer())
				{
					int playersCount = game.getNumberOfPlayers();
					for(int i = 0; i < playersCount; ++i)
						if(i != game.getServerIndex())
							game.getRemotePlayer(i).sendCommand(command);
				}
				else
					game.getRemotePlayer(game.getServerIndex()).sendCommand(command);
			}
		}
	}
	
	public void execute(Commands commands)
	{
		CommandsIterator it = new CommandsIterator(commands);
		while (it.hasNext())
			execute(it.next());
	}
}
