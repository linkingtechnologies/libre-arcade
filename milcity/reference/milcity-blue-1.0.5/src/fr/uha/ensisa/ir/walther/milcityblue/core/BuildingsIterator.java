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

public class BuildingsIterator
{
	private Buildings buildings;
	
	public BuildingsIterator(Buildings buildings)
	{
		this.buildings = buildings;
	}
	
	public boolean hasNext()
	{
		return this.buildings.hasNext();
	}
	
	public Building next()
	{
		if (this.hasNext())
		{
			this.buildings = this.buildings.next();
			return this.buildings.value();
		}
		return null;
	}
}
