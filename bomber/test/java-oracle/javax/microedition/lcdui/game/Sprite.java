// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Oracle-only stand-in for the MIDP sprite: it remembers the current frame (the
// harness compares the plane's frame after a crash) and draws nothing.
package javax.microedition.lcdui.game;

import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;

public class Sprite
{
    public int frame;

    public Sprite(Image image) {}

    public Sprite(Image image, int frameWidth, int frameHeight) {}

    public void setFrame(int frame) { this.frame = frame; }

    public void setPosition(int x, int y) {}

    public void paint(Graphics g) {}
}
