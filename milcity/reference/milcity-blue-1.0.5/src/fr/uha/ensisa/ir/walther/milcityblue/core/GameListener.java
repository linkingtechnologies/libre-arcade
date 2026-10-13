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

public interface GameListener
{
	public static final byte GAMEEVENT_NULL = 0;
	public static final byte GAMEEVENT_STARTED = 1;
	public static final byte GAMEEVENT_PAUSED = 2;
	public static final byte GAMEEVENT_RESUMED = 3;
	public static final byte GAMEEVENT_STOPPED = 4;
	public static final byte GAMEEVENT_ENDED = 5;
	public static final byte GAMEEVENT_VIBRATE = 10;
	
	public void notifyGameEvent(Game sender, byte eventType, int arg);
}
