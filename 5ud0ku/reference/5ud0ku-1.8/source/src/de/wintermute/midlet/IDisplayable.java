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
/**
 * Pseudo Interface to allow MIDP2 compiled code run on MIDP1 due to change in 
 * MIDP2 to move some methods to Displayable.
 * @author marcus
 * @version $Id: IDisplayable.java,v 1.1 2006/10/21 17:55:49 marcus Exp $
 */
public interface IDisplayable {
	/**
	 * set the forms title
	 * @param newTitle the new Title String
	 */
	public void setTitle(String newTitle);
	/**
	 * get the width
	 * @return int width
	 */
	public int getWidth();
	/**
	 * get the height
	 * @return int height
	 */
	public int getHeight();
}
