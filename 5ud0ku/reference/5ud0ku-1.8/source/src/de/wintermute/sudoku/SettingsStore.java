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

import java.io.IOException;

import javax.microedition.rms.RecordStore;
import javax.microedition.rms.RecordStoreException;

/**
 * Store all settings.
 * 
 * @author Ivonne Engemann
 * @version $Id: SettingsStore.java,v 1.11 2006/06/23 17:01:08 ive Exp $
 * 
 */
public class SettingsStore {

	/**
	 * Storage name
	 */
	protected final static String SETTING_FILE_NAME = "SETTINGS";

	public final static int currentVersion = 180;

	/** the state holder */
	private SudokuStateControl settings;

	/**
	 * Create SettingsStore
	 * 
	 * @param theSettings
	 *            the SudokuStateControl to use as source for settings
	 */
	public SettingsStore(final SudokuStateControl theSettings) {
		settings = theSettings;
	}

	/**
	 * Write settings to the storage.
	 * 
	 * @throws RecordStoreException
	 * @throws IOException
	 * 
	 */
	public void write() throws RecordStoreException, IOException {

		// Add it to the record store
		RecordStore recordStore = null;
		try {
			recordStore = RecordStore.openRecordStore(SETTING_FILE_NAME, true);

			final byte[] b = settings.asByteArrayForStorage();

			if (recordStore.getNumRecords() == 0)
				recordStore.addRecord(b, 0, b.length);
			else
				recordStore.setRecord(1, b, 0, b.length);
		} finally {
			if (recordStore != null) {
				recordStore.closeRecordStore();
			}
		}
	}

	/**
	 * Read settings.
	 * 
	 * @throws IOException
	 * @throws RecordStoreException
	 */
	public void read() throws RecordStoreException, IOException {
		RecordStore recordStore = null;
		try {
			recordStore = RecordStore.openRecordStore(SETTING_FILE_NAME, true);

			final byte[] byteArray = recordStore.getRecord(1);
			if (byteArray != null) { // Fix for RMS corruption
				settings.initializeSettings(byteArray);
			}
		} finally {
			if (recordStore != null) {
				recordStore.closeRecordStore();
			}
		}
	}
}
