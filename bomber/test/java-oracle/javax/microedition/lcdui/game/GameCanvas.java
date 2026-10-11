// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Oracle-only stand-in for the MIDP 2.0 game canvas. It has no screen; it
// reports the key states the harness decides on, and the size of the device
// the restoration package assumed (240 by 320). The original uses the size only
// to fill the background and to place the title texts, never in the game rules.
package javax.microedition.lcdui.game;

import javax.microedition.lcdui.Graphics;

public abstract class GameCanvas
{
    protected GameCanvas(boolean suppressKeyEvents) {}

    public int getWidth() { return 240; }

    public int getHeight() { return 320; }

    protected Graphics getGraphics() { return new Graphics(); }

    public void flushGraphics() {}

    public int getKeyStates()
    {
        return Hooks.listener == null ? 0 : Hooks.listener.getKeyStates();
    }
}
