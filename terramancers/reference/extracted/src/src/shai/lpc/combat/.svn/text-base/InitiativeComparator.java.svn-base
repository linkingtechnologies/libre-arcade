package shai.lpc.combat;

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

import java.util.Comparator;

public class InitiativeComparator implements Comparator<Integer> {
	
	private Avatar[] avatars;
	
	public InitiativeComparator(Avatar[] avatars) {
		this.avatars = avatars;
	}

	@Override
	public int compare(Integer firstIndex, Integer secondIndex) {
		Avatar first = avatars[firstIndex];
		Avatar second = avatars[secondIndex];
		if (first.getTimeOfNextAction() < second.getTimeOfNextAction()) {
			return -1;
		} else if (second.getTimeOfNextAction() < first.getTimeOfNextAction()) {
			return 1;
		} else {
			if (first.getInitiative() > second.getInitiative()) {
				return -1;
			} else if (second.getInitiative() > first.getInitiative()) {
				return 1;
			} else {
				return 0;
			}
		}
	}

}
