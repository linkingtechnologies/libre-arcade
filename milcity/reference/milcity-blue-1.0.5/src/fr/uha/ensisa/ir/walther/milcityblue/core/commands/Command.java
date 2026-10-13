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

import fr.uha.ensisa.ir.walther.milcityblue.core.Config;

public class Command
{
	public static final int COMMAND_NULL = 0;
	public static final int COMMAND_GRID = 1;
	public static final int COMMAND_START = 2;
	public static final int COMMAND_PAUSE = 3;
	public static final int COMMAND_CONTINUE = 4;
	public static final int COMMAND_FIRE = 5;
	public static final int COMMAND_HIT = 6;
	public static final int COMMAND_DESTROYED = 7;
	public static final int COMMAND_WIN = 8;
	public static final int COMMAND_LOSE = 9;
	public static final int COMMAND_DISCOVER = 10;
	public static final int COMMAND_SETINDEX = 11;
	public static final int COMMAND_END = 12;
	public static final int COMMAND_ADDSCORE = 13;
	
	public static final int PARAMETERS_NULL = 0;
	public static final int PARAMETERS_GRID = Config.DEFAULT_GRID_SIZE_X * Config.DEFAULT_GRID_SIZE_Y;
	public static final int PARAMETERS_START = 0;
	public static final int PARAMETERS_PAUSE = 0;
	public static final int PARAMETERS_CONTINUE = 0;
	public static final int PARAMETERS_FIRE = 4;
	public static final int PARAMETERS_HIT = 4;
	public static final int PARAMETERS_DESTROYED = 4;
	public static final int PARAMETERS_END = 0;
	public static final int PARAMETERS_WIN = 1;
	public static final int PARAMETERS_LOSE = 1;
	public static final int PARAMETERS_DISCOVER = 3;
	public static final int PARAMETERS_SETINDEX = 1;
	public static final int PARAMETERS_ADDSCORE = 1;
	
	public static final int SENDER_NULL = 100;
	
	public static final int TARGET_NULL = 100;
	public static final int TARGET_ALL = 200;
	
	private int playerSender;
	private int playerTarget;
	private int commandType;
	private int[] parameters;
	
	public Command(int playerSender, int playerTarget, int commandType, int[] parameters)
	{
		super();
		this.playerSender = playerSender;
		this.playerTarget = playerTarget;
		this.commandType = commandType;
		this.parameters = parameters;
		//System.out.println(this);
	}

	public int getPlayerSender()
	{
		return playerSender;
	}

	public void setPlayerSender(int playerSender)
	{
		this.playerSender = playerSender;
	}

	public int getPlayerTarget()
	{
		return playerTarget;
	}

	public void setPlayerTarget(int playerTarget)
	{
		this.playerTarget = playerTarget;
	}

	public int getCommandType()
	{
		return commandType;
	}

	public void setCommandType(int commandType)
	{
		this.commandType = commandType;
	}

	public int[] getParameters()
	{
		return parameters;
	}

	public void setParameters(int[] parameters)
	{
		this.parameters = parameters;
	}
	
	public int getParameter(int index)
	{
		if((index >= 0) || (index < parameters.length))
			return parameters[index];
		return -1;
	}
	
	public String toString()
	{
		StringBuffer tmp = new StringBuffer("Command (" + this.hashCode() + ")\n{\n");
		tmp.append("\tPlayerSender\t=\t" + playerSender + ";\n");
		tmp.append("\tPlayerTarget\t=\t" + playerTarget + ";\n");
		tmp.append("\tCommandType \t=\t" + commandTypeToString(commandType) + " (" + commandType + ");\n");
		tmp.append("\tParameters  \t=\t" + parametersToString(parameters) + ";\n");
		tmp.append("}\n");
		return tmp.toString();
	}
	
	public static String commandTypeToString(int type)
	{
		switch(type)
		{
		case Command.COMMAND_NULL		:	return "NULL";
		case Command.COMMAND_GRID		:	return "GRID";
		case Command.COMMAND_START		:	return "START";
		case Command.COMMAND_PAUSE		:	return "PAUSE";
		case Command.COMMAND_CONTINUE	:	return "CONTINUE";
		case Command.COMMAND_FIRE		:	return "FIRE";
		case Command.COMMAND_HIT		:	return "HIT";
		case Command.COMMAND_DESTROYED	:	return "DESTROYED";
		case Command.COMMAND_WIN		:	return "WIN";
		case Command.COMMAND_LOSE		:	return "LOSE";
		case Command.COMMAND_DISCOVER	:	return "DISCOVER";
		case Command.COMMAND_SETINDEX	:	return "SETINDEX";
		case Command.COMMAND_END		:	return "END";
		case Command.COMMAND_ADDSCORE	:	return "ADDSCORE";
		}
		return "UNKNOWN COMMAND TYPE";
	}
	
	public static String parametersToString(int[] args)
	{
		StringBuffer tmp = new StringBuffer("(");
		for(int i = 0; i < args.length; ++i)
		{
			tmp.append(args[i]);
			if(i < (args.length - 1))
				tmp.append(", ");
		}
		tmp.append(")");
		return tmp.toString();
	}
}
