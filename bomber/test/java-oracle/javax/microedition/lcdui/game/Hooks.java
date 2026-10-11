// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Oracle-only: the way the MIDP stand-ins report to the harness, which lives in
// the unnamed package and therefore cannot be referenced from a named one.
package javax.microedition.lcdui.game;

public final class Hooks
{
    public interface Listener
    {
        int getKeyStates();
        void playTone(int note, int duration, int volume);
    }

    public static Listener listener;

    private Hooks() {}
}
