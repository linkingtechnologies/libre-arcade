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

import javax.microedition.lcdui.Canvas;

/**
 * Helper class for accessing device specific (MIDP, NOKIA...) functionalities.
 * 
 * @author marcus
 * @version $Id: UIHelper.java,v 1.2 2006/10/21 14:29:14 ive Exp $
 * 
 */
public class UIHelper {

	/**
	 * The only device control instance.
	 */
	private static IDevControl deviceControl;

	/**
	 * Get the canvas implementation to use. Depending if MIDP 2.0 is available
	 * or the device is a NOKIA phone.
	 * 
	 * @param useFullScreen
	 *            if true, try to use a fullscreen mode
	 * 
	 * @return the canvas implementation
	 */
	public static Canvas getCanvas(final boolean useFullScreen) {

		Canvas theCanvas = null;

		// if MIDP 2.0 supported => always use My20Canvas
		final boolean midp20 = isMidp20Supported();
		if (midp20) {
			try {
				theCanvas = (Canvas) Class.forName(
						"de.wintermute.midlet.My20Canvas").newInstance();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		// if not MIDP 1.0 device, but fullscreen requested => check if NOKIA
		// device can be used
		if (theCanvas == null && useFullScreen) {
			try {
				Class.forName("com.nokia.mid.ui.FullCanvas");
				theCanvas = (Canvas) Class.forName(
						"de.wintermute.midlet.MyNokiaCanvas").newInstance();
			} catch (Exception e2) {
				e2.printStackTrace();
			}
		}

		// if only MIDP 1.0 device => use MyCanvas
		// if NOKIA device and non-fullscreen option requested => use MyCanvas
		// too
		if (theCanvas == null) {
			theCanvas = new MyCanvas();
		}

		// try to use fullscreen (if requested)
		((ICanvas) theCanvas).setFullScreenRequested(useFullScreen);

		return theCanvas;

	}

	/**
	 * Check if the canvas implementation to support fullscreen. Depending if
	 * MIDP 2.0 is available or the device is a NOKIA phone.
	 * 
	 * @return true if full-screen is supported by this device
	 */
	public static boolean isFullScreenSupported() {

		final boolean midp20 = isMidp20Supported();
		if (midp20) {
			return true;
		}

		try {
			Class.forName("com.nokia.mid.ui.FullCanvas");
			return true;
		} catch (Exception e2) {
		}

		return false;
	}

	/**
	 * Check if the canvas implementation supports backlight or vibration.
	 * Depending if device is a NOKIA phone.
	 * 
	 * @return true if the device is a NOKIA phone
	 */
	private static boolean isNokiaDeviceControlSupported() {

		try {
			Class.forName("com.nokia.mid.ui.DeviceControl");
			return true;
		} catch (final Exception ex) {
		}

		return false;
	}

	/**
	 * Check if MIDP 2.0 is supported.
	 * 
	 * @return true if MIDP 2.0 is supported
	 */
	private static boolean isMidp20Supported() {

		final String profiles = System.getProperty("microedition.profiles");

		// check for null properties here! some devices will not provide this
		if (profiles != null && profiles.startsWith("MIDP-2.")) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if this device supports backlight setting.
	 * 
	 * @return true if backlight is supported
	 */
	public static boolean isBacklightSupported() {
		return isNokiaDeviceControlSupported();
	}

	/**
	 * change the backlight of the device.
	 * 
	 * @param level
	 *            the int specifying the light level (0=dark)
	 */
	public static void setBacklight(final int level) {
		if (isBacklightSupported()) {
			if (deviceControl == null) {
				try {
					deviceControl = (IDevControl) Class.forName(
							"de.wintermute.midlet.NokiaDevConWrapper")
							.newInstance();
				} catch (final Exception ex) {
					return;
				}
			}
			deviceControl.setBacklight(level);
		}
	}

}
