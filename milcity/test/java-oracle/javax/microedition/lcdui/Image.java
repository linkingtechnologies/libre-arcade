package javax.microedition.lcdui;

// Stand-in for the MIDP 2.0 class. The original's pictures are not available to the oracle, and it never needs them to decide anything.
public class Image {
    public static Image createImage(String name) throws java.io.IOException {
        throw new java.io.IOException("the oracle has no pictures: " + name);
    }
}
