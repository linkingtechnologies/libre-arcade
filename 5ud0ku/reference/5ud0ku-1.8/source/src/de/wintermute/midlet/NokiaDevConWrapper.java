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

import com.nokia.mid.ui.DeviceControl;

/**
 * Wrapper to allow access to static NOKIA class methods using an instance of
 * this class. If no nokia api is available for compiling, just delete this
 * class. Compile should then work fine.
 * 
 * @author marcus
 * @version $Id: NokiaDevConWrapper.java,v 1.2 2006/10/21 14:29:43 ive Exp $
 */
public class NokiaDevConWrapper implements IDevControl {
	/**
	 * Recent backlight level.
	 */
	private int lastBacklightLevel = 0;

	/**
	 * Set the backlight level for NOKIA device.
	 * 
	 * @param level
	 *            0 = off, 1-100 on
	 */
	public void setBacklight(int level) {

		if (level != lastBacklightLevel && level >= 0 && level <= 100) {
			DeviceControl.setLights(0, level);
			lastBacklightLevel = level;
		}
	}

}
