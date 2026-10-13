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

import java.io.InputStream;
import java.io.OutputStream;

import javax.bluetooth.DiscoveryAgent;
import javax.bluetooth.LocalDevice;
import javax.bluetooth.UUID;
import javax.microedition.io.Connector;
import javax.microedition.io.StreamConnection;
import javax.microedition.io.StreamConnectionNotifier;
import javax.microedition.lcdui.Form;

import fr.uha.ensisa.ir.walther.milcityblue.MilCityBlue;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.GridBuilder;
import fr.uha.ensisa.ir.walther.milcityblue.core.gridbuilders.RandomWalkGridBuilder;
import fr.uha.ensisa.ir.walther.milcityblue.core.players.LocalPlayer;
import fr.uha.ensisa.ir.walther.milcityblue.core.players.RemotePlayer;

public class StartServer extends Form implements Runnable
{
	private UUID 						RFCOMM_UUID;
	private String						serverUrl;
	private StreamConnection			streamConnection;
	private LocalDevice					localDevice;
	private InputStream					inputStream;
	private OutputStream				outputStream;
	private StreamConnectionNotifier	streamConnectionNotifier;
	private boolean						isServerStarted;
	private boolean						isClientConnected;
	private boolean						isFinished;
	private MilCityBlue					MCB;
	
	public StartServer(MilCityBlue MCB)
	{
		super("MilCity :: Server");
		this.MCB = MCB;
		RFCOMM_UUID = new UUID(0x0003);
		serverUrl = "btspp://localhost:" + RFCOMM_UUID + ";name=milcityrfcomm;authorize=true";
		streamConnection = null;
		localDevice = null;
		inputStream = null;
		outputStream = null;
		streamConnectionNotifier = null;
		isServerStarted = false;
		isFinished = false;
		isClientConnected = false;
	}

	public void run()
	{
		try
		{
			localDevice = LocalDevice.getLocalDevice();
			localDevice.setDiscoverable(DiscoveryAgent.GIAC);
			streamConnectionNotifier = (StreamConnectionNotifier)Connector.open(serverUrl);
			/*ServiceRecord serviceRecord = localDevice.getRecord(streamConnectionNotifier);
			serviceRecord.setAttributeValue(7588, new DataElement(DataElement.STRING, "MilCityBlue-101"));
			localDevice.updateRecord(serviceRecord);*/
			
			this.append("Server initialized.");
			this.append("Waiting for another player ...");
			isServerStarted = true;
			ClientServer cs = null;
			
			streamConnection = streamConnectionNotifier.acceptAndOpen();
		 	this.append("Player connected.");

		 	outputStream = streamConnection.openOutputStream();
		 	inputStream  = streamConnection.openInputStream();
		 	
		 	cs = new ClientServer(inputStream, outputStream);
			
			/*while (!isClientConnected)
			{
				streamConnection = streamConnectionNotifier.acceptAndOpen();
			 	this.append("Player connected.");
	
			 	outputStream = streamConnection.openOutputStream();
			 	inputStream  = streamConnection.openInputStream();
			 	
			 	cs = new ClientServer(inputStream, outputStream);
			 	cs.send("MilCityBlueServer");
			 	if(cs.receiveString().equals("MilCityBlueClient"))
			 		isClientConnected = true;
			 	else
			 	{
			 		cs.close();
			 		this.append("Player rejected.");
			 	}
			}*/
			this.append("Player accepted.");
			
			streamConnectionNotifier.close();
			
		 	this.append("Starting Game ...");
		 	
		 	// sending default money/max score ...
		 	cs.send(String.valueOf(Config.DEFAULT_SCORE_TO_WIN));
		 	cs.send(String.valueOf(Config.DEFAULT_MONEY_AT_START));
		 	
		 	MCB.startGameBegin();
		 	MCB.getGame().registerLocalPlayer(new LocalPlayer());
		 	Grid grid;
			GridBuilder gb = new RandomWalkGridBuilder();
			grid = gb.build(Config.DEFAULT_GRID_SIZE_X, Config.DEFAULT_GRID_SIZE_Y, Config.DEFAULT_PERCENT_OF_WATER);
			gb = null;
			MCB.getGame().getLocalPlayer().setGame(MCB.getGame());
			MCB.getGame().getLocalPlayer().setPlayerIndex(MCB.getGame().getLocalPlayerIndex());
			MCB.getGame().getLocalPlayer().setGrid(grid);
			
			RemotePlayer remotePlayer = new RemotePlayer(cs);
			MCB.getGame().registerRemotePlayer(remotePlayer);
			remotePlayer.setPlayerIndex(MCB.getGame().getIndexOfPlayer(remotePlayer));
			remotePlayer.setGame(MCB.getGame());
			remotePlayer.setGrid(grid);
			
			cs.send(grid);
			
			MCB.startGameEnd();
		}
		catch(Exception e)
		{
		   e.printStackTrace();
		}
		isFinished = true;
	}
	
	public void start()
	{
		isFinished = false;
		isServerStarted = false;
		isClientConnected = false;
		Thread thread = new Thread(this);
		thread.start();
	}
	
	public void waitUntilFinished()
	{
		while (!isFinished)
			Thread.yield();
	}

	public InputStream getInputStream()
	{
		return inputStream;
	}

	public OutputStream getOutputStream()
	{
		return outputStream;
	}

	public boolean isServerStarted()
	{
		return isServerStarted;
	}

	public boolean isClientConnected()
	{
		return isClientConnected;
	}
}
