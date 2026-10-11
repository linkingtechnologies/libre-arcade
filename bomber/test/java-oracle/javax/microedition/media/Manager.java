// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Oracle-only stand-in for the MIDP media manager: every tone the original asks
// for is handed to the harness, which records it.
package javax.microedition.media;

import javax.microedition.lcdui.game.Hooks;

public final class Manager
{
    private Manager() {}

    public static void playTone(int note, int duration, int volume) throws MediaException
    {
        if (Hooks.listener != null)
            Hooks.listener.playTone(note, duration, volume);
    }
}
