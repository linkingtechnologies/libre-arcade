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

package fr.uha.ensisa.ir.walther.milcityblue.tools;

import java.util.Vector;

import javax.microedition.rms.InvalidRecordIDException;
import javax.microedition.rms.RecordStore;
import javax.microedition.rms.RecordStoreException;
import javax.microedition.rms.RecordStoreFullException;
import javax.microedition.rms.RecordStoreNotFoundException;
import javax.microedition.rms.RecordStoreNotOpenException;

/**
 * This class is in charge of parameters storage.
 * It takes Strings and returns Strings.
 * This works in silent mode (no exceptions).
 *
 * @author Jérémy Walther (jeremy.walther@ftad.fr)
 */
public class ParametersStore
{
	private RecordStore recordStore;
	
	public ParametersStore(String storeName)
	{
		try 
		{
			this.recordStore = RecordStore.openRecordStore(storeName, true);
		} 
		catch (RecordStoreFullException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreNotFoundException e)
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public int size()
	{
		try
		{
			return this.recordStore.getNumRecords();
		}
		catch (RecordStoreNotOpenException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return 0;
		}
	}
	
	public String get(int index)
	{
		try 
		{
			if (index <= this.recordStore.getNumRecords())
			{
				byte[] result = new byte[this.recordStore.getRecordSize(index)];
				this.recordStore.getRecord(index, result, 0);
				return new String(result);
			}
			else
				return null;
		} 
		catch (RecordStoreNotOpenException e)
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
		catch (InvalidRecordIDException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		} 
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
	}
	
	public void add(String value)
	{
		byte[] data = value.getBytes();
		try 
		{
			this.recordStore.addRecord(data, 0, data.length);
		} 
		catch (RecordStoreNotOpenException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreFullException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public void close()
	{
		try
		{
			this.recordStore.closeRecordStore();
		}
		catch (RecordStoreNotOpenException e)
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreException e)
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public void set(int index, String value)
	{
		byte[] data = value.getBytes();
		try 
		{
			if (index <= this.recordStore.getNumRecords())
				this.recordStore.setRecord(index, data, 0, data.length);
			else
				this.recordStore.addRecord(data, 0, data.length);
		} 
		catch (RecordStoreNotOpenException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreFullException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public void deleteStore(String storeName)
	{
		try
		{
			if (this.recordStore.getName().equals(storeName))
				this.close();
			RecordStore.deleteRecordStore(storeName);
		} 
		catch (RecordStoreNotFoundException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public Vector getAll()
	{
		try 
		{
			Vector result = new Vector(this.recordStore.getNumRecords());
			for (int i = 1; i <= this.recordStore.getNumRecords(); ++i)
			{
				byte[] buffer = new byte[this.recordStore.getRecordSize(i)];
				buffer = this.recordStore.getRecord(i);
				result.addElement(new String(buffer));
			}
			return result;
		} 
		catch (RecordStoreNotOpenException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		} 
		catch (RecordStoreFullException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		} 
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
	}
	
	public String toString()
	{
		Vector content = this.getAll();
		StringBuffer tmp = new StringBuffer();
		for (int i = 0; i < content.size(); ++i)
			tmp.append((String) content.elementAt(i)).append("\n");
		return tmp.toString();
	}
	
	public void delete(int index)
	{
		try
		{
		if (index <= this.recordStore.getNumRecords())
			this.recordStore.deleteRecord(index);
		}
		catch (RecordStoreNotOpenException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreFullException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		catch (RecordStoreException e) 
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}