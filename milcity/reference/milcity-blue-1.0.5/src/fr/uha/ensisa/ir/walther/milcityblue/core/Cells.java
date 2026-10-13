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

public class Cells
{
	private Cells next;
	private Cell value;
	
	public Cells(Cell value, Cells next)
	{
		this.value = value;
		this.next = next;
	}
	
	public Cells()
	{
		this.value = null;
		this.next = null;
	}
	
	public boolean hasNext()
	{
		return (this.next != null);
	}
	
	public void push(Cell value)
	{
		if (this.hasNext())
			this.next.push(value);
		else
			this.next = new Cells(value, null);
	}
	
	public boolean isHit(int x, int y)
	{
		if(this.value == null && this.hasNext())
			return this.next.isHit(x, y);
		if(this.value.isHit(x, y))
			return true;
		else
			if(this.hasNext())
				return this.next.isHit(x, y);
			else
				return false;
	}
	
	public boolean isDestroyed()
	{
		if(this.value == null && this.hasNext())
			return this.next.isDestroyed();
		if(this.value.isDestroyed())
			if(this.hasNext())
				return this.next.isDestroyed();
			else
				return true;
		else
			return false;
	}

	public Cells next()
	{
		if (this.next != null)
			return next;
		return null;
	}

	public void setNext(Cells next)
	{
		this.next = next;
	}

	public Cell value()
	{
		return value;
	}

	public void setValue(Cell value)
	{
		this.value = value;
	}
	
	public static Cells createCells(Size size, int type, int x, int y, int r)
	{
		Cells cells = new Cells();
		for(int j = 0; j < y; ++j)
			for(int i = 0; i < x; ++i)
				cells.push(new Cell(type, x + i, y + j));
		return cells;
	}
}
