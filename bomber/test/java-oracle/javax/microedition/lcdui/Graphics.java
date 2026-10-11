// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Oracle-only stand-in for the MIDP graphics context: every call is accepted
// and nothing is drawn. The anchor constants have their MIDP 2.0 values. drawImage
// returns void because that is the descriptor the original's compiled class calls
// (the source ignores the result, so it compiles either way).
package javax.microedition.lcdui;

public class Graphics
{
    public static final int HCENTER = 1;
    public static final int LEFT = 4;
    public static final int TOP = 16;
    public static final int BASELINE = 64;

    public void setColor(int rgb) {}

    public void fillRect(int x, int y, int width, int height) {}

    public void drawString(String text, int x, int y, int anchor) {}

    public void drawImage(Image image, int x, int y, int anchor) {}
}
