// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Oracle-only stand-in for the original MIDlet. CreatorTask hands the finished
// grid to gameCreated() through invokeLater(); here invokeLater() runs the
// runnable at once and the harness overrides gameCreated() to catch the grid.
package de.wintermute.sudoku;

public class SudokuMidlet
{
    protected void gameCreated(final Grid grid)
    {
    }

    public void promoteProgress(final String text)
    {
    }

    public void invokeLater(Runnable r)
    {
        r.run();
    }
}
