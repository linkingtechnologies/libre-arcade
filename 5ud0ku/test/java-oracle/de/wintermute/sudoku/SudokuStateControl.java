// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Oracle-only stand-in for the original state holder, which is the user
// interface's brain. CreatorTask asks it for two preferences only: how many
// unique grids a Hard game compares (the original default, 3) and the timeout
// in seconds (the original default is 15; the oracle makes it so long that it
// never fires, because a wall-clock timeout would make the result depend on the
// machine).
package de.wintermute.sudoku;

public class SudokuStateControl
{
    public int getMaxCreationIterations()
    {
        return 3;
    }

    public int getMaxCreationTimeout()
    {
        return 100000;
    }
}
