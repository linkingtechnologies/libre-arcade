package shai.lpc.strings;

/**
 * Terramancers - an action game for the Liberated Pixel Cup.
 * Copyright (C) 2012 Shai Shapira
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

public class EnglishStringPool extends StringPool {

	@Override
	public String getGameName() {
		return "Terramancers";
	}

	@Override
	public String getMainMenuTutorial() {
		return "Tutorial";
	}

	@Override
	public String getMainMenuSinglePlayer() {
		return "Single Player";
	}

	@Override
	public String getMainMenuMultiPlayer() {
		return "Multiplayer";
	}

	@Override
	public String getMainMenuHelp() {
		return "Help";
	}

	@Override
	public String getMainMenuAbout() {
		return "About";
	}

	@Override
	public String getMainMenuExit() {
		return "Exit";
	}

	@Override
	public String getHelp() {
		return "Use the arrow keys (player 1) or WASD (player 2) to move. Every neutral tile you step on becomes yours.\n\n" +
				"When you take a tile which has a direct line connecting it to another of your tiles with no obstacles in between, they all become yours.\n\n" +
				"You must control more than half of the board to win!";
	}

	@Override
	public String getAbout() {
		return "Created by Shai Shapira for the Liberated Pixel Cup contest.\n\n +" +
				"Includes artwork by several contributors to the Liberated Pixel Cup, see AUTHORS.TXT for details. \n\n" +
				"This game is free software, released under the GPL 3.0 license. Enjoy!\n\n\n\n" +
				"http://shaishapira.com/terramancers\n" +
				"http://lpc.opengameart.org";
	}

}
