// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Oracle-only stand-in for the original Dict, which reads language resources
// and the RMS. The generator only asks it for the level names that become the
// grid type, and the progress texts of CreatorTask; the keys themselves are
// returned, so a grid of level "hard" has type "hard".
package de.wintermute.sudoku.res;

public class Dict
{
    public static String getString(String key)
    {
        return key;
    }
}
