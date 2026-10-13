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

import javax.microedition.lcdui.Graphics;

public class CursorView implements GameView
{
	private MilCityModel mcModel;
	
	public CursorView(MilCityModel mcModel)
	{
		this.mcModel = mcModel;
	}
	
	public void render(Graphics g)
	{
		g.setColor(0xFF0000);
		if(mcModel.canPerformActionHere())
			g.setColor(0x00FF00);
		g.drawRect(	this.mcModel.getX(), this.mcModel.getY(), 
					this.mcModel.getSize().getSizeX() * this.mcModel.getS() - 1,
					this.mcModel.getSize().getSizeY() * this.mcModel.getS() - 1);
	}

}
