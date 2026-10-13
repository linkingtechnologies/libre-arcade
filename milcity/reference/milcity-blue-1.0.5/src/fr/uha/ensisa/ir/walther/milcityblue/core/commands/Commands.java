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

public class Commands
{
	private Commands next;
	private Command value;
	
	public Commands(Command value, Commands next)
	{
		this.value = value;
		this.next = next;
	}
	
	public Commands()
	{
		this.value = null;
		this.next = null;
	}
	
	public boolean hasNext()
	{
		return (this.next != null);
	}
	
	public void push(Command value)
	{
		if (this.hasNext())
			this.next.push(value);
		else
			this.next = new Commands(value, null);
	}

	public Commands next()
	{
		if (this.next != null)
			return next;
		return null;
	}

	public void setNext(Commands next)
	{
		this.next = next;
	}

	public Command value()
	{
		return value;
	}

	public void setValue(Command value)
	{
		this.value = value;
	}
	
	public int count()
	{
		if(this.hasNext())
			return (1 + this.next.count());
		return 0;
	}
}
