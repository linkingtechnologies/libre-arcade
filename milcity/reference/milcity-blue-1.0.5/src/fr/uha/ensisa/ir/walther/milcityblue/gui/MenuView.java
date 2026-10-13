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

import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;

import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Game;

public class MenuView implements GameView
{
	private Game game;
	private MilCityModel mcModel;
	private String A, B, C, D;
	private ImageDrawer imageDrawer;
	
	public MenuView(Game game, MilCityModel mcModel, String a, String b, String c, String d, ImageDrawer imageDrawer)
	{
		super();
		this.game = game;
		this.mcModel = mcModel;
		A = a;
		B = b;
		C = c;
		D = d;
		this.imageDrawer = imageDrawer;
	}

	public void render(Graphics g)
	{
		g.setColor(0xCCCCCC);
		g.fillRect(0, 240, 240, 80);
		g.setFont(Font.getFont(Font.FACE_MONOSPACE, Font.STYLE_PLAIN, Font.SIZE_SMALL));
		g.setColor(0x000000);
		/*g.drawString("Energy : " + this.game.getLocalPlayer().getEnergy() + "e", 5, 245, Graphics.TOP|Graphics.LEFT);
		g.drawString("Money  : " + this.game.getLocalPlayer().getMoney() + "$", 5, 255, Graphics.TOP|Graphics.LEFT);
		g.drawString("Action : " + A + "< " + this.mcModel.getActionSelectedName() + "(" + this.mcModel.getActionSelectedCost() + "$," + this.mcModel.getActionSelectedEnergy() + "e) >" + B, 5, 265, Graphics.TOP|Graphics.LEFT);
		g.drawString("Ammos  : " 	+ this.game.getLocalPlayer().getAmmoMissiles() + "M "
									+ this.game.getLocalPlayer().getAmmoMortars() + "A "
									+ this.game.getLocalPlayer().getAmmoAirCrafts() + "P "
									+ this.game.getLocalPlayer().getAmmoNukes() + "N "
									+ this.game.getLocalPlayer().getAmmoShields() + "S "
									+ this.game.getLocalPlayer().getAmmoSpies() + "V"
									, 5, 275, Graphics.TOP|Graphics.LEFT);*/
		String energyWarning = "";
		if(this.game.getLocalPlayer().isEnergyBellowZero() && this.game.getLocalPlayer().getConstructedBuildings() > 0)
			energyWarning = " ! WARNING ! " + ((this.game.getLocalPlayer().getEnergyBellowZeroSince() + Config.MAX_TIME_BELLOW_ZERO * 1000 - System.currentTimeMillis()) / 1000) + "s left.";
		this.imageDrawer.stringToImage(g, "Energy: " + this.game.getLocalPlayer().getEnergy() + "§" + energyWarning, 5, 245, Graphics.TOP|Graphics.LEFT);
		this.imageDrawer.stringToImage(g, "Money : " + this.game.getLocalPlayer().getMoney() + "$", 5, 255, Graphics.TOP|Graphics.LEFT);
		this.imageDrawer.stringToImage(g, "Ammos : " + this.game.getLocalPlayer().getAmmoMissiles() + "é "
													+ this.game.getLocalPlayer().getAmmoMortars() + "è "
													+ this.game.getLocalPlayer().getAmmoAirCrafts() + "ç "
													+ this.game.getLocalPlayer().getAmmoNukes() + "à "
													+ this.game.getLocalPlayer().getAmmoShields() + "ù "
													+ this.game.getLocalPlayer().getAmmoSpies() + "ê"
													, 5, 265, Graphics.TOP|Graphics.LEFT);
		this.imageDrawer.stringToImage(g, "Score : " + this.game.getLocalPlayer().getScore() + " / " + this.game.getLocalPlayer().getScoreToWin(), 5, 275, Graphics.TOP|Graphics.LEFT);
		//this.imageDrawer.stringToImage(g, "Target: " + this.game.getLocalPlayer().getScore() + " / " + this.game.getLocalPlayer().getScoreToWin(), 5, 285, Graphics.TOP|Graphics.LEFT);
		if(this.mcModel.getModeSelected() == MilCityModel.MODE_CITY)
			this.imageDrawer.stringToImage(g, "Build : " + A + "< " + this.mcModel.getActionSelectedName() + "(" + this.mcModel.getActionSelectedCost() + "$," + this.mcModel.getActionSelectedEnergy() + "§) >" + B, 5, 285, Graphics.TOP|Graphics.LEFT);
		else
			this.imageDrawer.stringToImage(g, "Weapon: " + A + "< " + this.mcModel.getActionSelectedName() +" >" + B, 5, 285, Graphics.TOP|Graphics.LEFT);
		this.imageDrawer.stringToImage(g, "Mode  : " + C + "< " + this.mcModel.getModeSelectedName() + " >" + D, 5, 295, Graphics.TOP|Graphics.LEFT);
		this.imageDrawer.stringToImage(g, "Menu", 211, 312, Graphics.TOP|Graphics.LEFT);
	}

}
