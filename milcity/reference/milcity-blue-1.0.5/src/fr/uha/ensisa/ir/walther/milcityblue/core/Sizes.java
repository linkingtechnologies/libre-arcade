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

public class Sizes
{
	private Sizes next;
	private Size value;
	
	public Sizes(Size value, Sizes next)
	{
		this.value = value;
		this.next = next;
	}
	
	public Sizes()
	{
		this.value = null;
		this.next = null;
	}
	
	public boolean hasNext()
	{
		return (this.next != null);
	}
	
	public void push(Size value)
	{
		if (this.hasNext())
			this.next.push(value);
		else
			this.next = new Sizes(value, null);
	}

	public Sizes next()
	{
		if (this.next != null)
			return next;
		return null;
	}

	public void setNext(Sizes next)
	{
		this.next = next;
	}

	public Size value()
	{
		return value;
	}

	public void setValue(Size value)
	{
		this.value = value;
	}
}
