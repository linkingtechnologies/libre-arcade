package oracle;

import java.io.OutputStream;
import java.io.PrintStream;

// Stand-in for java.lang.System, as far as the original uses it: the clock, the console (which it fills with debugging text, here
// thrown away) and gc(). The class loader redirects the original's references to java.lang.System to this class.
public final class VSystem {
    public static final PrintStream out = new PrintStream(new OutputStream() {
        public void write(int b) { }
    });
    public static final PrintStream err = out;

    private VSystem() { }

    public static long currentTimeMillis() { return Scheduler.now(); }

    public static long nanoTime() { return Scheduler.now() * 1000000L; }

    public static void gc() { }

    public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length) {
        System.arraycopy(src, srcPos, dest, destPos, length);
    }

    public static int identityHashCode(Object x) { return System.identityHashCode(x); }

    public static String getProperty(String key) { return System.getProperty(key); }
}
