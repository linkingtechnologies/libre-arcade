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

package fr.uha.ensisa.ir.walther.milcityblue.bluetooth;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import fr.uha.ensisa.ir.walther.milcityblue.core.Cell;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Commands;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.CommandsIterator;

public class ClientServer
{
	private InputStream		inputStream;
	private OutputStream	outputStream;
	//private int				currentReception;
	
	public ClientServer(InputStream inputStream, OutputStream outputStream)
	{
		super();
		this.inputStream = inputStream;
		this.outputStream = outputStream;
	}
	
	public void send(String message)
	{
		if(outputStream != null)
		{
			try
			{
				outputStream.write(Protocol.SEND_STRING);
				
				byte[] data = message.getBytes();
				outputStream.write(data.length);
				outputStream.write(data);
				outputStream.flush();
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}

	public void send(Command command)
	{
		if(outputStream != null)
		{
			try
			{
				outputStream.write(Protocol.SEND_COMMAND);
				
				outputStream.write(command.getPlayerSender());
				outputStream.write(command.getPlayerTarget());
				outputStream.write(command.getCommandType());
				outputStream.write(command.getParameters().length);
				for (int i = 0; i < command.getParameters().length; ++i)
					outputStream.write(command.getParameters()[i]);
				outputStream.flush();
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}
	
	public void send(Commands commands)
	{
		if(outputStream != null)
		{
			try
			{
				outputStream.write(Protocol.SEND_COMMANDS);
				
				outputStream.write(commands.count());
				CommandsIterator it = new CommandsIterator(commands);
				while (it.hasNext())
					send(it.next());
				outputStream.flush();
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}
	
	public void send(Grid grid)
	{
		if(outputStream != null)
		{
			try
			{
				outputStream.write(Protocol.SEND_GRID);
				
				outputStream.write(grid.getMaxX());
				outputStream.write(grid.getMaxY());
				int sizeX = grid.getMaxX(), sizeY = grid.getMaxY();
				byte[] data = new byte[sizeX * sizeY];
				for (int y = 0; y < sizeY; ++y)
					for (int x = 0; x < sizeX; ++x)
						data[(y * sizeY) + x] = ((byte) grid.getCell(x, y));
				outputStream.write(data);
				outputStream.flush();
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
	}
	
	public String receiveString()
	{
		byte[] data = null;
		
		if(inputStream != null)
		{
			try
			{
				if(inputStream.read() == Protocol.SEND_STRING)
				{
					int length = inputStream.read();
					System.out.println("LENGTH = " + length);
					data = new byte[length];
					length = 0;
					int readed = 0;
					
					while (length != data.length)
					{
						readed = inputStream.read(data, length, data.length - length);
						if (readed == -1)
							throw new IOException("Cannot read byte");
						length += readed;
					}
				}
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		System.out.println("DATA = " + new String(data));
		return new String(data);
	}
	
	public Command receiveCommand()
	{
		int type = Command.COMMAND_NULL;
		int sender = Command.SENDER_NULL;
		int target = Command.TARGET_NULL;
		int[] parameters = null;
		
		if(inputStream != null)
		{
			try
			{
				if(inputStream.read() == Protocol.SEND_COMMAND)
				{
					sender = inputStream.read();
					target = inputStream.read();
					type = inputStream.read();
					int length = inputStream.read();
					parameters = new int[length];
					
					length = 0;
					
					while (length != parameters.length)
					{
						parameters[length] = inputStream.read();
						++length;
					}
				}
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		
		return new Command(sender, target, type, parameters);
	}
	
	public Commands receiveCommands()
	{
		Commands commands = new Commands();
		
		if(inputStream != null)
		{
			try
			{
				if(inputStream.read() == Protocol.SEND_COMMANDS)
				{
					int length = inputStream.read();
					
					for (int i = 0; i < length; ++i)
						commands.push(receiveCommand());
				}
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		
		return commands;
	}
	
	public Grid receiveGrid()
	{
		Grid grid = new Grid(Config.DEFAULT_GRID_SIZE_X, Config.DEFAULT_GRID_SIZE_Y, Cell.CELL_EMPTY);
		
		if(inputStream != null)
		{
			try
			{
				if(inputStream.read() == Protocol.SEND_GRID)
				{
					int sizeX = inputStream.read();
					int sizeY = inputStream.read();
					
					int[][] gridint = new int[sizeX][sizeY];
					for (int y = 0; y < sizeY; ++y)
						for (int x = 0; x < sizeX; ++x)
							gridint[x][y] = inputStream.read();
					grid = new Grid(sizeX, sizeY, gridint);
				}
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		
		return grid;
	}
	
	public void close()
	{
		try
		{
			if(inputStream != null)
				inputStream.close();
			if(outputStream != null)
				outputStream.close();
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
	}

	public InputStream getInputStream()
	{
		return inputStream;
	}

	public void setInputStream(InputStream inputStream)
	{
		this.inputStream = inputStream;
	}

	public OutputStream getOutputStream()
	{
		return outputStream;
	}

	public void setOutputStream(OutputStream outputStream)
	{
		this.outputStream = outputStream;
	}
	
	public boolean isConnected()
	{
		return ((inputStream != null) &&(outputStream != null));
	}
}
