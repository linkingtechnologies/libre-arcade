/*
 *******************************************************************************
 * Java Tools for common purposes.
 * see startofentry.de or wintermute.de 
 *
 * Copyright (c) 2006 Ivonne Engemann and Marcus Wagner
 *
 * Enjoy.
 ******************************************************************************/
package de.wintermute.sudoku;

import java.util.Enumeration;
import java.util.Vector;
import javax.microedition.rms.RecordStore;
import javax.microedition.rms.RecordStoreException;
import javax.microedition.rms.RecordStoreNotFoundException;
import javax.microedition.rms.RecordStoreNotOpenException;

import de.wintermute.sudoku.res.Dict;

/**
 * The storage to save and load grids.
 * 
 * @author Ivonne Engemann
 * @version $Id: GridStore.java,v 1.13 2006/10/28 17:04:34 marcus Exp $
 * 
 */
public class GridStore {
	/** Storage name for Autosave game */
	private static final String AUTO_SAVE_FILENAME = "AUTO_SAVE";

	/**
	 * Get the stored games.
	 * 
	 * @return Vector of stored files
	 */
	public static Vector getStoredGridFilenames() {

		final String[] recordStores = RecordStore.listRecordStores();
		final Vector v = new Vector();

		for (int i = 0; i < recordStores.length; i++) {
			if (!recordStores[i].equals(SettingsStore.SETTING_FILE_NAME)
					&& !recordStores[i].equals(Dict.PREF_LANG_FILE_NAME)) {
				v.addElement(recordStores[i]);
			}
		}
		return v;
	}

	/**
	 * Delete all grids.
	 */
	public static void deleteAllGrids() throws RecordStoreException {

		final Enumeration list = getStoredGridFilenames().elements();
		while (list.hasMoreElements()) {
			final String filename = (String) list.nextElement();
			RecordStore.deleteRecordStore(filename);
		}
	}

	/**
	 * Delete single grid.
	 * 
	 * @param filename
	 *            the game to delete
	 */
	public static boolean deleteGrid(final String filename) {

		if (!filename.equals(SettingsStore.SETTING_FILE_NAME)) {

			try {

				RecordStore.deleteRecordStore(filename);
				return true;

			} catch (RecordStoreNotFoundException e) {
				// can't to anything
			} catch (RecordStoreException e) {
				// can't do anything
			}
		}
		return false;

	}

	/**
	 * Read AUTO-SAVE grid. If not yet store, return null.
	 */
	public static Grid getAutoSaveGrid() {

		return loadGrid(AUTO_SAVE_FILENAME);
	}

	/**
	 * Load grid.
	 * 
	 * @param filename
	 *            the name of the grid to load
	 * @return loaded Grid or null in case of error
	 */
	public static Grid loadGrid(final String filename) {
		RecordStore recordStore = null;
		try {
			recordStore = RecordStore.openRecordStore(filename, true);

			final byte[] byteArray = recordStore.getRecord(1);
			if (byteArray != null) {
				return new Grid(byteArray);
			}

		} catch (Exception e) {
			return null;
		} finally {
			if (recordStore != null)
				try {
					recordStore.closeRecordStore();
				} catch (RecordStoreNotOpenException e) {
					// do nothing
				} catch (RecordStoreException e) {
					// do nothing
				}
		}

		return null;
	}

	/**
	 * Save a grid to the storage.
	 * 
	 * @param grid
	 *            the Grid to save
	 * @return true if save completed
	 */
	public static boolean saveGrid(final Grid grid, final String filename) {

		if (filename.equals(SettingsStore.SETTING_FILE_NAME)
				|| filename.equals(Dict.PREF_LANG_FILE_NAME)) {
			return false;
		}

		// Add it to the record store
		RecordStore recordStore = null;
		try {
			recordStore = RecordStore.openRecordStore(filename, true);

			// Extract the byte array
			final byte[] b = grid.toByteArray();

			if (recordStore.getNumRecords() == 0) {
				recordStore.addRecord(b, 0, b.length);
			} else {
				recordStore.setRecord(1, b, 0, b.length);
			}
		} catch (Exception ex) {
			return false;

		} finally {
			if (recordStore != null)
				try {
					recordStore.closeRecordStore();
				} catch (RecordStoreNotOpenException e) {
					// do nothing
				} catch (RecordStoreException e) {
					// do nothing

				}
		}
		return true;

	}

	/**
	 * Save the current grid to the storage.
	 * 
	 * @return true if save was completed
	 */
	public static boolean autosaveGrid(final Grid grid) {

		return saveGrid(grid, AUTO_SAVE_FILENAME);

	}

}
