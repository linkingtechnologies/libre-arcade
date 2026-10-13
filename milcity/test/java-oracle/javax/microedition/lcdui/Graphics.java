package javax.microedition.lcdui;

// Stand-in for the MIDP 2.0 class: it draws nothing. Only the clip is kept, because the original saves and restores it.
public class Graphics {
    public static final int HCENTER = 1, VCENTER = 2, LEFT = 4, RIGHT = 8, TOP = 16, BOTTOM = 32, BASELINE = 64;

    private int clipX = 0, clipY = 0, clipWidth = 240, clipHeight = 320;

    public int getClipX() { return clipX; }
    public int getClipY() { return clipY; }
    public int getClipWidth() { return clipWidth; }
    public int getClipHeight() { return clipHeight; }
    public void setClip(int x, int y, int width, int height) { clipX = x; clipY = y; clipWidth = width; clipHeight = height; }
    public void setColor(int rgb) { }
    public void setGrayScale(int value) { }
    public void setFont(Font font) { }
    public void fillRect(int x, int y, int width, int height) { }
    public void drawRect(int x, int y, int width, int height) { }
    public void drawString(String text, int x, int y, int anchor) { }
    public void drawImage(Image image, int x, int y, int anchor) { }
}
