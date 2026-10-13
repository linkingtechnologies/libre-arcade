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

package fr.uha.ensisa.ir.walther.milcityblue.bluetooth;

public class Protocol
{
	public static final int SEND_STRING = 1;
	public static final int SEND_COMMAND = 2;
	public static final int SEND_GRID = 3;
	public static final int SEND_COMMANDS = 4;
	
	public static final int RECEIVED_STRING = 101;
	public static final int RECEIVED_COMMAND = 102;
	public static final int RECEIVED_GRID = 103;
	public static final int RECEIVED_COMMANDS = 104;
	
	public static final int FAILED = 0;
	
	public static final int NULL = -1;
}
