package javax.microedition.lcdui;

// Stand-in for the MIDP 2.0 class.
public class Font {
    public static final int FACE_MONOSPACE = 32, STYLE_PLAIN = 0, SIZE_SMALL = 8;

    public static Font getFont(int face, int style, int size) { return new Font(); }
}
