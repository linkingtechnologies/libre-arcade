package javax.microedition.lcdui.game;

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Graphics;

// Stand-in for the MIDP 2.0 class. The key state comes from the script of the scenario: the harness sets scriptedKeys before the
// original's paint() reads it with getKeyStates(), as the handset's key state would be read.
public abstract class GameCanvas extends Canvas {
    public static final int UP_PRESSED = 0x0002, LEFT_PRESSED = 0x0004, RIGHT_PRESSED = 0x0020, DOWN_PRESSED = 0x0040;
    public static final int FIRE_PRESSED = 0x0100, GAME_A_PRESSED = 0x0200, GAME_B_PRESSED = 0x0400, GAME_C_PRESSED = 0x0800, GAME_D_PRESSED = 0x1000;

    public static int scriptedKeys = 0;
    private final Graphics graphics = new Graphics();

    protected GameCanvas(boolean suppressKeyEvents) { }

    protected Graphics getGraphics() { return graphics; }
    public void flushGraphics() { }
    public int getKeyStates() { return scriptedKeys; }
}
