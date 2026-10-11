/*
 *******************************************************************************
 * Java Tools for common purposes.
 * see startofentry.de or wintermute.de 
 *
 * Copyright (c) 2006 Ivonne Engemann and Marcus Wagner
 *
 * Enjoy.
 ******************************************************************************/

package de.wintermute.midlet;

import java.util.Enumeration;
import java.util.Vector;

import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.List;
import javax.microedition.midlet.MIDlet;

import com.nokia.mid.ui.FullCanvas;

import de.wintermute.sudoku.res.Dict;

/**
 * The Nokia Canvas as Full screen to use for MIDP 1.0 version. If no nokia api
 * is avaialbe on compile, just delete this class. Midlet will still compile and
 * run.
 * 
 * @author Ivonne Engemann
 * @version $Id: MyNokiaCanvas.java,v 1.8 2006/10/21 13:42:02 marcus Exp $
 * 
 */
public class MyNokiaCanvas extends FullCanvas implements ICanvas {

	/**
	 * The GUI class to use for painting.
	 */
	private IGui gui;

	/**
	 * The Midlet to use.
	 */
	private MIDlet midlet;

	/**
	 * The commands to displayin List (Nokia Fullscreen does not support
	 * addCommand() )
	 */
	private Vector commands = new Vector();

	/**
	 * The command listener to delegate the commands to (Nokia Fullscreen does
	 * not support setCommandListener() )
	 */
	private CommandListener listener;

	/**
	 * The BACK command in the command list.
	 */
	private final Command backCommand = new Command(Dict.getString("back"),
			Command.BACK, 5000);

	/**
	 * Initialize the canvas.
	 * 
	 * @param g
	 *            the GUI implementation to use
	 * 
	 * @param m
	 *            the midlet to use
	 * @return the GUI implementation
	 */
	public void init(final MIDlet m, final IGui g) {

		midlet = m;
		gui = g;

		gui.init(this, midlet);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#paint(javax.microedition.lcdui.Graphics)
	 */
	protected void paint(final Graphics g) {
		gui.paint(g);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#keyPressed(int)
	 */
	protected void keyPressed(int k) {

		// special handling for Nokia FullScreen:
		// use SOFTKEY 1 to display internal menu
		if (listener != null && k == FullCanvas.KEY_SOFTKEY1) {
			displayMenu();
			return;
		}

		// default key handling in the GUI class
		gui.keyPressed(k);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#keyRepeated(int)
	 */
	protected void keyRepeated(int k) {

		// special handling for Nokia FullScreen:
		// use SOFTKEY 1 to display internal menu
		if (listener != null && k == FullCanvas.KEY_SOFTKEY1) {
			displayMenu();
			return;
		}

		// default key handling in the GUI class
		gui.keyRepeated(k);
	}

	/**
	 * Display the internal menu list.
	 */
	private void displayMenu() {

		final List menuList = new List("Menu", List.IMPLICIT);
		menuList.addCommand(backCommand);

		final Enumeration cmds = commands.elements();
		while (cmds.hasMoreElements()) {
			final Command cmd = (Command) cmds.nextElement();
			menuList.append(cmd.getLabel(), null);
		}

		// establish commands
		menuList.setCommandListener(new CommandListener() {

			public void commandAction(final Command command,
					final Displayable displayable) {

				if (command == backCommand) {
					displayCanvas();

				} else {
					final short index = (short) menuList.getSelectedIndex();
					displayCanvas();
					final Command cmd = (Command) commands.elementAt(index);
					listener.commandAction(cmd, null);
				}
			}

		});
		Display.getDisplay(midlet).setCurrent(menuList);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#addCommand(javax.microedition.lcdui.Command)
	 */
	public void addCommand(final Command command) {
		// Nokia FullScreenCanvas does not support addCommand()
		// store our own command

		if (!commands.contains(command)) {
			int i;
			for (i = 0; i < commands.size()
					&& ((Command) commands.elementAt(i)).getPriority() < command
							.getPriority(); i++)
				;
			if (!commands.contains(command)) {
				commands.insertElementAt(command, i);
			}
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#setCommandListener(javax.microedition.lcdui.CommandListener)
	 */
	public void setCommandListener(final CommandListener controller) {

		// Nokia FullScreenCanvas does not support setCommandListener()
		// store our own listener
		listener = controller;
	}
	/**
	 * Display this canvas.
	 */
	private void displayCanvas() {

		Display.getDisplay(midlet).setCurrent(this);
		repaint();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see de.wintermute.midlet.ICanvas#setFullScreenRequested(boolean)
	 */
	public void setFullScreenRequested(final boolean useFullScreen) {
		// always fullscreen in NOKIA canvas
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#pointerPressed(int, int)
	 */
	public void pointerPressed(final int x, final int y) {

		gui.pointerPressed(x, y);
	}

	/**
	 * Remove a command from the canvas.
	 * 
	 * @param command
	 *            the command to remove
	 */
	public final void removeCommand(final Command command) {
		// Nokia FullScreenCanvas does not support addCommand()
		// store our own command

		if (commands.contains(command)) {
			commands.removeElement(command);
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see de.wintermute.midlet.ICanvas#setNewTitle(java.lang.String)
	 */
	public void setNewTitle(String newTitle) {

		// no implementation for MyNokiaCanvas, because if MIPD 2.0 is
		// requested, we always use My20Canvas

	}

}
