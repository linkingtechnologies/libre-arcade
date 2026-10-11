/*
 *******************************************************************************
 * Java Tools for common purposes.
 * see startofentry.de or wintermute.de 
 *
 * Copyright (c) 2006 Ivonne Engemann and Marcus Wagner
 *
 * Enjoy.
 ******************************************************************************/
package de.wintermute.sudoku.res;

import java.io.IOException;
import java.io.InputStream;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Vector;

import javax.microedition.rms.RecordStore;
import javax.microedition.rms.RecordStoreException;

/**
 * Dictionary for 5ud0ku. This class works out the device lang settings, reads
 * in available language sets and offers methods to retrieve the language set
 * and store and delete a preferred language set to be used on restart.
 * 
 * Access to the class is via static methods to ease usage.
 * 
 * @author marcus
 * @version $Id: Dict.java,v 1.58 2006/11/19 13:05:23 marcus Exp $
 */
public class Dict {

	/**
	 * The main prefix to get the language file from
	 */
	private final static String RESOURCE_PREFIX = "/dict_";

	/**
	 * The resource name of the language directory file
	 */
	private final static String LANGUAGE_DIRECTORY = "/lang";

	/**
	 * the only instance of the dictionary
	 */
	private final static Dict instance = new Dict();

	/**
	 * Delimiter to be used to mark Array-entrys (e.g. []levels=easy|hard|bad|)
	 */
	private static final char STRING_ARRAY_DELIM = '|';

	/**
	 * the RMS Name for the Preferred Language file store.
	 */
	public static final String PREF_LANG_FILE_NAME = "PREF_LANG";

	/**
	 * the store for all the key and local entry.
	 */
	private Hashtable bundle = new Hashtable();

	/**
	 * The hashtable storing all configured languages (key=name, value=id, e.g
	 * english,en)
	 */
	private Hashtable languages = new Hashtable();

	/**
	 * the device locale language id
	 */
	private String deviceLanguageId = "";

	/**
	 * the device locale country id
	 */
	private String deviceCountryId = "";

	/**
	 * the default language the program uses, if nothing else is there
	 */
	private String defaultLanguage = "";

	/**
	 * the preferred language id selectable from users
	 */
	private String preferredLanguageId = "";
	/**
	 * Setup the device locale info.
	 */
	{
		String locale = System.getProperty("microedition.locale");

		if (locale != null) {
			int pos = locale.indexOf('-');
			if (pos != -1) {
				deviceLanguageId = locale.substring(0, pos);
				locale = locale.substring(pos + 1);

				pos = locale.indexOf('-');
				if (pos == -1) {
					deviceCountryId = locale;
				} else {
					deviceCountryId = locale.substring(0, pos);
				}
			} else {
				deviceLanguageId = locale;
			}
		}
	}

	/**
	 * Use the method to force loading from the default locale
	 * 
	 * @throws IOException
	 *             in case of File Errors
	 * 
	 */
	private void loadDictionary() throws IOException {
		InputStream is = getDictResource();
		readIntoStore(is, bundle);
	}

	/**
	 * Use the parameters to read out key value pairs from the Inputstream to
	 * write them into the given hashtable.
	 * 
	 * @param is
	 *            the InputStream to read from
	 * @param store
	 *            the Hashtable to store data in
	 * @returns the key read first
	 * @throws IOException
	 *             is throw if reading fails
	 */
	private String readIntoStore(InputStream is, Hashtable store)
			throws IOException {
		String firstKey = "";
		try {
			int buffer = 0;
			boolean esc = false;
			StringBuffer sb = new StringBuffer();
			while ((buffer = is.read()) != -1) {
				buffer = fromUTF8(buffer, is);

				if (buffer == '\n' || buffer == '\r') {
					String key = storeKeyValue(sb.toString(), store);
					if (firstKey.length() <= 0 && key != null) {
						firstKey = key;
					}
					sb = new StringBuffer();
				} else {
					// do simple escaping to support line break in normal
					// text
					if (buffer == '\\') {
						esc = true;
					} else {
						if (esc && buffer == 'n') {
							sb.append('\n');
						} else {
							sb.append((char) buffer);
						}
						esc = false;
					}
				}
			}
			if (sb.length() > 0) {
				String key = storeKeyValue(sb.toString(), store);
				if (firstKey.length() <= 0 && key != null) {
					firstKey = key;
				}
			}
		} finally {
			is.close();
		}
		return firstKey;
	}

	/**
	 * Search for a suitable resource and return it as input stream.
	 * 
	 * @return the input stream pointing to the language resource
	 * @throws IOException
	 *             in case no suitable file was found
	 */
	private InputStream getDictResource() throws IOException {
		InputStream is = null;

		// try to read the preferred langauage
		if (readPreferredLanguage()) {
			is = getClass().getResourceAsStream(
					RESOURCE_PREFIX + preferredLanguageId);
		}
		// try to get the devices language set
		if (is == null) {
			is = getClass().getResourceAsStream(
					RESOURCE_PREFIX + deviceLanguageId);
		}
		if (is == null) {
			is = getClass().getResourceAsStream(
					RESOURCE_PREFIX + deviceLanguageId + deviceCountryId);
		}
		// go for the default language set
		if (is == null) {
			is = getClass().getResourceAsStream(
					RESOURCE_PREFIX + languages.get(defaultLanguage));
		}
		// go for the only one set
		if (is == null) {
			is = getClass().getResourceAsStream(RESOURCE_PREFIX);
		}
		// did try everything
		if (is == null)
			throw new IOException("no matching resource files found");
		return is;
	}

	/**
	 * Read preferred language from record store.
	 * 
	 * @return true if language was read.
	 */
	private boolean readPreferredLanguage() {
		RecordStore recordStore = null;
		try {
			try {
				recordStore = RecordStore.openRecordStore(PREF_LANG_FILE_NAME,
						false);
				final byte[] byteArray = recordStore.getRecord(1);
				if (byteArray != null) {
					preferredLanguageId = new String(byteArray);
					return true;
				}
			} finally {
				if (recordStore != null) {
					recordStore.closeRecordStore();
				}
			}
		} catch (RecordStoreException rsex) {
			// nothing we can do
		}
		return false;
	}

	/**
	 * Sets the preferred language (will be loaded on next startup).
	 * 
	 * @param preferredLanguage
	 *            the language name to presave or null if do clear the preset
	 * @return true if storing was successfull (in case of clearing, the status
	 *         must not be used)
	 */
	public static boolean storePreferredLanguage(String preferredLanguage) {

		try {
			RecordStore recordStore = null;
			if (preferredLanguage != null
					&& instance.languages.containsKey(preferredLanguage)) {
				// store preflang in rms
				try {
					recordStore = RecordStore.openRecordStore(
							PREF_LANG_FILE_NAME, true);
					final byte[] b = ((String) instance.languages
							.get(preferredLanguage)).getBytes();
					if (recordStore.getNumRecords() == 0)
						recordStore.addRecord(b, 0, b.length);
					else
						recordStore.setRecord(1, b, 0, b.length);
					return true;
				} finally {
					if (recordStore != null)
						recordStore.closeRecordStore();
				}
			} else {
				// delete preflang rms
				RecordStore.deleteRecordStore(PREF_LANG_FILE_NAME);
				return true;
			}
		} catch (RecordStoreException rsex) {
			// do nothing
		}
		return false;
	}

	/**
	 * Parse and store the values, but empty, or // or # lines
	 * 
	 * @param string
	 *            the read line to parse
	 * @param store
	 *            the hashtable to store values in
	 * @return the key read
	 */
	private String storeKeyValue(String string, Hashtable store) {
		if (string.startsWith("//") || string.startsWith("#")
				|| string.length() == 0)
			return null;

		final int keyEnd = string.indexOf('=');
		String key = null;

		if (keyEnd >= 0) {
			if (string.indexOf(STRING_ARRAY_DELIM) > 0
					|| string.startsWith("[")) {
				key = storeKeyMultiString(keyEnd, string, store);
			} else {
				key = string.substring(0, keyEnd);
				store.put(key, string.substring(keyEnd + 1, string.length()));
			}
		}
		return key;
	}

	/**
	 * Dict supports storing of array values as in []levels=bad|worse
	 * 
	 * @param end
	 *            the index of the key value end
	 * @param string
	 *            the complete string to parse
	 * @param store
	 *            the Hashtable to store values in.
	 * @return the key read
	 */
	private String storeKeyMultiString(int end, String string, Hashtable store) {
		String key = string.substring(0, end);
		int cEnd = end;
		Vector tempStack = new Vector();
		while ((end = string.indexOf(STRING_ARRAY_DELIM, cEnd + 1)) > 0) {
			tempStack.addElement(string.substring(cEnd + 1, end));
			cEnd = end;
		}
		tempStack.addElement(string.substring(cEnd + 1, string.length()));
		String[] value = new String[tempStack.size()];
		for (int i = 0; i < value.length; i++) {
			value[i] = (String) tempStack.elementAt(i);
		}
		store.put(key, value);
		return key;
	}

	/**
	 * Retrieve single string.
	 * 
	 * @param key
	 *            to lookup
	 * @return matching String or [key]
	 */
	public static String getString(String key) {
		final Object obj = instance.bundle.get(key);
		if (obj != null && obj instanceof String) {
			return (String) obj;
		}
		return "[" + key + "]";
	}

	/**
	 * retrieve String [].
	 * 
	 * @param key
	 *            to lookup
	 * @return matching String[]
	 */
	public static String[] getStringArray(String key) {
		final Object obj = instance.bundle.get(key);
		if (obj != null && obj instanceof String[]) {
			return (String[]) obj;
		}
		return new String[] { "[" + key + "]" };
	}

	/**
	 * Load up Dict.
	 */
	private Dict() {
		try {
			setupLanguages();
			loadDictionary();
		} catch (Exception anyEx) {
			System.err.println(anyEx);
			// do nothing else, user will get the keys now instead of values
		}
	}

	/**
	 * Read in language configurations.
	 * 
	 * @throws IOException
	 *             on File Error
	 */
	private void setupLanguages() throws IOException {
		// read LANGUAGE_DIRECTORY file
		final InputStream is = getClass().getResourceAsStream(
				LANGUAGE_DIRECTORY);
		// first key read is marked as default language to load
		if (is != null) {
			defaultLanguage = readIntoStore(is, languages);
		}
	}

	/**
	 * Due to some problems and non-availibility of UTF-8 encoding, this helper
	 * method does its own. see
	 * http://discussion.forum.nokia.com/forum/showpost.php?p=69821&postcount=2
	 * http://en.wikipedia.org/wiki/UTF-8
	 * 
	 * @param nCharCode
	 *            the current int read from the stream
	 * @param is
	 *            the inputstream to read the bytes from
	 * @return an int holding the correct char value for the UTF-8 encoded
	 *         stream
	 * @throws IOException
	 */
	private static int fromUTF8(int nCharCode, InputStream is)
			throws IOException {

		if (nCharCode >= 0x80) {
			if (nCharCode < 0xe0) {
				// need 2 bytes
				nCharCode = (nCharCode & 0x1f) << 6;
				nCharCode |= (is.read() & 0x3f);
			} else if (nCharCode < 0xf0) {
				// need 3 bytes
				nCharCode = (nCharCode & 0x0f) << 12;
				nCharCode |= (is.read() & 0x3f) << 6;
				nCharCode |= (is.read() & 0x3f);
			} else {
				// need 4 bytes
				nCharCode = (nCharCode & 0x07) << 18;
				nCharCode |= (is.read() & 0x3f) << 12;
				nCharCode |= (is.read() & 0x3f) << 6;
				nCharCode |= (is.read() & 0x3f);
			}
		}
		return nCharCode;
	}

	/**
	 * Get all available / configured languages.
	 * 
	 * @return a String[] with all names(keys) for the languages
	 */
	public static String[] getAvailableLanguages() {
		final String[] lang = new String[instance.languages.size()];
		Enumeration keys = instance.languages.keys();
		int i = 0;
		while (keys.hasMoreElements()) {
			lang[i] = (String) keys.nextElement();
			i++;
		}
		return lang;
	}

}
