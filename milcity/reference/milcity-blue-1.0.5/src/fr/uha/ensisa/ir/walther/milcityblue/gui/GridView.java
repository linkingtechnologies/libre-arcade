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
import fr.uha.ensisa.ir.walther.milcityblue.core.Cell;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.StatusGrid;

public class GridView implements GameView
{
	private MilCityModel mcModel;
	private int gridHeight, gridWidth, cellSize;
	private ImageDrawer imageDrawer;
	private byte timer;
	
	public GridView(int cellSize, ImageDrawer imageDrawer, MilCityModel mcModel)
	{
		super();
		this.mcModel = mcModel;
		this.gridHeight = mcModel.getGame().getLocalPlayer().getGrid().getMaxY();
		this.gridWidth = mcModel.getGame().getLocalPlayer().getGrid().getMaxX();
		this.cellSize = cellSize;
		this.imageDrawer = imageDrawer;
		this.timer = 0;
	}

	public int getGridHeight()
	{
		return gridHeight;
	}

	public void setGridHeight(int gridHeight)
	{
		this.gridHeight = gridHeight;
	}

	public int getGridWidth()
	{
		return gridWidth;
	}

	public void setGridWidth(int gridWidth)
	{
		this.gridWidth = gridWidth;
	}

	public int getCellSize()
	{
		return cellSize;
	}

	public void setCellSize(int cellSize)
	{
		this.cellSize = cellSize;
	}

	public void render(Graphics g)
	{
		if(mcModel.getModeSelected() == MilCityModel.MODE_CITY)
		{
			Grid grid = mcModel.getGame().getLocalPlayer().getGrid();
			int type = 0;
			boolean drawShield = false;
			int clipX = g.getClipX();
			int clipY = g.getClipY();
			int clipH = g.getClipHeight();
			int clipW = g.getClipWidth();
			for(int y = 0; y < grid.getMaxY(); ++y)
				for(int x = 0; x < grid.getMaxX(); ++x)
				{
					type = grid.getCell(x, y);
					if(type < 0)
					{
						type = -type;
						drawShield = true;
					}
					if(type > 0 && type <= Cell.CELL_EXPLOSION_5)
					{
						imageDrawer.cellToImage(g, type, x, y, cellSize);
					}
					if(type >= Cell.CELL_EXPLOSION_1)
					{
						++type;
						if(type > Cell.CELL_EXPLOSION_5)
							type = Cell.CELL_DESTROYED;
						grid.setCell(type, x, y);
					}
					if(drawShield)
					{
						g.setColor(0xBF00FE);
						g.drawRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
						drawShield = false;
					}
				}
			g.setClip(clipX,clipY,clipW,clipH);
		}
		else
		{
			StatusGrid grid = mcModel.getGame().getPlayerAt(mcModel.modeToPlayerIndex()).getStatusGrid();
			int type = 0;
			g.setColor(0x0000FF);
			for(int y = 0; y < grid.getMaxY(); ++y)
				for(int x = 0; x < grid.getMaxX(); ++x)
				{
					switch(type = grid.getCellStatusAt(x, y))
					{
					case StatusGrid.STATUS_WATER				:	g.setColor(0x0000FF); break;
					case StatusGrid.STATUS_GROUND				:	g.setColor(0x000000); break;
					case StatusGrid.STATUS_BUILDINGHIT			:	g.setColor(0xFF0000); break;
					case StatusGrid.STATUS_BUILDINGDESTROYED	:	g.setColor(0x00FF00); break;
					case StatusGrid.STATUS_BUILDINGDISCOVERED	:	g.setColor(0xFFFF00); break;
					default										:	if ((type >= StatusGrid.STATUS_CELLHIT_MIN) && (type <= StatusGrid.STATUS_CELLHIT_MAX))
																	{
																		g.setGrayScale(192 + type);
																		if(timer == 0)
																			grid.decrementCellHitAt(x, y);
																	}
																	break;
					}
					g.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
				}
			++timer;
			if(timer >= 10)
				timer = 0;
		}
	}

	public MilCityModel getMcModel()
	{
		return mcModel;
	}

	public void setMcModel(MilCityModel mcModel)
	{
		this.mcModel = mcModel;
	}

	public ImageDrawer getImageDrawer()
	{
		return imageDrawer;
	}

	public void setImageDrawer(ImageDrawer imageDrawer)
	{
		this.imageDrawer = imageDrawer;
	}
}
