package fr.uha.ensisa.ir.walther.milcityblue.gridbuilders;

import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.gridbuilders.RandomWalkGridBuilder;

public class TestRW
{

	/**
	 * @param args
	 */
	public static void main(String[] args)
	{
		// TODO Auto-generated method stub
		RandomWalkGridBuilder gb = new RandomWalkGridBuilder();
		System.out.println(gb.build(Config.DEFAULT_GRID_SIZE_X, Config.DEFAULT_GRID_SIZE_Y, 90).toWaterAndGrassMap());
	}
}
