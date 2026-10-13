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

package fr.uha.ensisa.ir.walther.milcityblue.gui;

import java.util.Stack;

import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;

public class DisplayManager 
{
	private Displayable current;
	private Display display;
	private Stack stack;
	
	/**
	 * Creates a display manager associated to
	 * the specified display.
	 * 
	 * @param display target display.
	 */
	public DisplayManager(Display display)
	{
		if (display == null) 
		{
			throw new IllegalArgumentException("Display can not be null.");
		}
		this.display = display;
		this.stack	 = new Stack();
	}
	
	public void setFirst(Displayable first)
	{
		if (first != null)
			this.stack.push(first);
	}
	
	/**
	 * Sets the specified displayable as the current
	 * screen.
	 * 
	 * @param next screen to show.
	 */
	public void next(Displayable next) 
	{
		if (this.current == next) 
		{
			return;
		}
		
		if (this.current != null) 
		{
			this.stack.push(this.current);
		}
		this.current = next;
		this.display.setCurrent(this.current);
	}
	
	/**
	 * Goes back to the last screen.
	 */
	public void back()
	{
		if (this.stack.size() > 0x00) 
		{
			this.current = (Displayable) this.stack.pop();
			this.display.setCurrent(this.current);
		}
	}
	
	public void clearHistory()
	{
		this.stack = new Stack();
	}
}
