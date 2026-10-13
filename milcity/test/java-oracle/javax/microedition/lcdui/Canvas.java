package javax.microedition.lcdui;

// Stand-in for the MIDP 2.0 class: only the members the original touches.
public abstract class Canvas extends Displayable {
    public static final int UP = 1, LEFT = 2, RIGHT = 5, DOWN = 6, FIRE = 8, GAME_A = 9, GAME_B = 10, GAME_C = 11, GAME_D = 12;

    public int getWidth() { return 240; }
    public int getHeight() { return 320; }
    public int getKeyCode(int gameAction) { return gameAction; }
    public String getKeyName(int keyCode) { return "key" + keyCode; }
    public void setFullScreenMode(boolean mode) { }
}
