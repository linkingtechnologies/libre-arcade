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

import javax.bluetooth.DeviceClass;
import javax.bluetooth.DiscoveryListener;
import javax.bluetooth.DiscoveryAgent;
import javax.bluetooth.LocalDevice;
import javax.bluetooth.RemoteDevice;
import javax.bluetooth.ServiceRecord;
import javax.bluetooth.UUID;
import javax.microedition.io.Connector;
import javax.microedition.io.StreamConnection;
import javax.microedition.lcdui.Form;

import fr.uha.ensisa.ir.walther.milcityblue.MilCityBlue;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.players.LocalPlayer;
import fr.uha.ensisa.ir.walther.milcityblue.core.players.RemotePlayer;

public class StartClient extends Form implements Runnable, DiscoveryListener
{
	private UUID				RFCOMM_UUID;
	private DiscoveryAgent		discoveryAgent;
	private LocalDevice			localDevice;
	private boolean				isFinished;
	private String				serverUrl;
	private boolean				serverFound;
	//private boolean				initClient;
	private StreamConnection	streamConnection;
	private InputStream			inputStream;
	private OutputStream		outputStream;
	private boolean				isClientConnected;
	private MilCityBlue			MCB;
	
	public StartClient(MilCityBlue MCB)
	{
		super("MilCity :: Client");
		this.MCB = MCB;
		RFCOMM_UUID = new UUID(0x0003);
		discoveryAgent = null;
		localDevice = null;
		isFinished = false;
		serverUrl = null;
		serverFound = false;
		//initClient = false;
		streamConnection = null;
		inputStream = null;
		outputStream = null;
		isClientConnected = false;
	}

	public void run()
	{
		try
        {
			localDevice = LocalDevice.getLocalDevice();
            
            discoveryAgent=  localDevice.getDiscoveryAgent();
            discoveryAgent.startInquiry(DiscoveryAgent.GIAC,this);
        }
        catch (Exception e) 
        {
            e.printStackTrace();
        }
	}
	
	public void start()
	{
		isFinished = false;
		Thread thread = new Thread(this);
		thread.start();
	}
	
	public void waitUntilFinished()
	{
		while (!isFinished)
			Thread.yield();
	}

	public void deviceDiscovered(RemoteDevice btDevice, DeviceClass cod)
	{
		try 
	     {
	      // Get Device Info
	      System.out.println("Device Discovered");
	      System.out.println("Major Device Class: " + cod.getMajorDeviceClass() + " Minor Device Class: " + cod.getMinorDeviceClass());
	      System.out.println("Bluetooth Address: " + btDevice.getBluetoothAddress());
	      System.out.println("Bluetooth Friendly Name: " + btDevice.getFriendlyName(true));     
	      
	      // Search for Services
	      UUID uuidSet[] = new UUID[1];     
	      uuidSet[0] =  RFCOMM_UUID;      
	      //int searchID = 
	      discoveryAgent.searchServices(null,uuidSet,btDevice,this);      
	    }
	    catch (Exception e) 
	    {
	      System.out.println("Device Discovered Error: " + e);	
	    }
	}

	public void inquiryCompleted(int discType)
	{
		this.setTitle("MilCity :: Client");
	}

	public void serviceSearchCompleted(int transID, int respCode)
	{
		System.out.println("serviceSearchCompleted called");
		if(serverFound)
	    {
			try
			{ 
				this.append("Server found, trying to establish a connection ...");
				
				streamConnection = (StreamConnection) Connector.open(serverUrl);
               
				outputStream = streamConnection.openOutputStream(); 
				inputStream = streamConnection.openInputStream();
				
				System.out.println("Client Connection Openned");
				
				this.append("Connection openned. Initializing game ...");
                 
				ClientServer cs = new ClientServer(inputStream, outputStream);
				
			 	/*cs.send("MilCityBlueClient");
			 	if(cs.receiveString().equals("MilCityBlueServer"))
			 	{
			 		isClientConnected = true;
			 		System.out.println("Connected to Server");
			 	}*/
				
				// receiving default money/max score ...
				Config.DEFAULT_SCORE_TO_WIN = Integer.parseInt(cs.receiveString());
				Config.DEFAULT_MONEY_AT_START = Integer.parseInt(cs.receiveString());
                
				System.out.println("serviceSearchCompleted");
				
				MCB.startGameBegin();
				
				RemotePlayer remotePlayer = new RemotePlayer(cs);
				Grid grid = cs.receiveGrid();
				MCB.getGame().registerRemotePlayer(remotePlayer);
				remotePlayer.setGame(MCB.getGame());
				remotePlayer.setPlayerIndex(MCB.getGame().getIndexOfPlayer(remotePlayer));
				remotePlayer.setGrid(grid);
				
			 	MCB.getGame().registerLocalPlayer(new LocalPlayer());
			 	MCB.getGame().getLocalPlayer().setGame(MCB.getGame());
				MCB.getGame().getLocalPlayer().setPlayerIndex(MCB.getGame().getLocalPlayerIndex());
				MCB.getGame().getLocalPlayer().setGrid(grid);
				
				this.append("Starting Game ...");
				
				MCB.startGameEnd();
			}
			catch (Exception e)
			{
				e.printStackTrace();
			}
	    }
	}

	public void servicesDiscovered(int transID, ServiceRecord[] records)
	{
		for (int i = 0; i < records.length; i++)
	        if(records[i].getConnectionURL(ServiceRecord.AUTHENTICATE_ENCRYPT, false).startsWith("btspp")) 
	        {
	        	for(int j = 0; j < records[i].getAttributeIDs().length; ++j)
	        		System.out.println(records[i].getAttributeIDs()[j]);
	        	/*if(records[i].getAttributeValue(7588) != null)
		        	if(records[i].getAttributeValue(7588).equals(Config.GAME_NAME + "_" +  Config.GAME_VERSION))
	        		{*/
		        		serverUrl = records[i].getConnectionURL(ServiceRecord.AUTHENTICATE_ENCRYPT, false);
		        		System.out.println(serverUrl);
			        	serverFound = true;
			        	//initClient=true;
			        	System.out.println("Client Initialized");
			        	break;
	        		//}
	        }
	}

	public boolean isClientConnected()
	{
		return isClientConnected;
	}
}
