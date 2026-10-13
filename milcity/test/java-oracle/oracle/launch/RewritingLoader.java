package oracle.launch;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Loads the original's classes, compiled unmodified, and changes nothing in them but three class names in their constant pools:
//   java/lang/Thread  -> oracle/VThread       (so that its threads run in virtual time)
//   java/lang/System  -> oracle/VSystem       (so that its clock is the virtual clock and its console prints nothing)
//   java/util/Random  -> oracle/SeededRandom  (so that its unseeded random numbers can be repeated)
// The bytecode of every method is left as the compiler wrote it. The classes of package oracle (the harness, the scheduler, the
// stand-ins) are loaded by this loader as well, so that they are the same classes the original sees, but they are not rewritten:
// the scheduler needs the real java.lang.Thread.
public final class RewritingLoader extends ClassLoader {
    private static final Charset LATIN1 = Charset.forName("ISO-8859-1");
    private static final String[][] REDIRECTS = {
        { "java/lang/Thread", "oracle/VThread" },
        { "java/lang/System", "oracle/VSystem" },
        { "java/util/Random", "oracle/SeededRandom" },
    };
    private static final Pattern[] PATTERNS = new Pattern[REDIRECTS.length];
    static {
        for (int i = 0; i < REDIRECTS.length; i++) PATTERNS[i] = Pattern.compile(Pattern.quote(REDIRECTS[i][0]) + "(?![A-Za-z0-9_$])");
    }

    private final File root;

    public RewritingLoader(File root, ClassLoader parent) {
        super(parent);
        this.root = root;
    }

    private static boolean ours(String name) {
        return name.startsWith("fr.uha.") || name.startsWith("javax.microedition.") || (name.startsWith("oracle.") && !name.startsWith("oracle.launch."));
    }

    private static boolean rewritten(String name) {
        return name.startsWith("fr.uha.") || name.startsWith("javax.microedition.");
    }

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
            Class<?> c = findLoadedClass(name);
            if (c == null && ours(name)) {
                File file = new File(root, name.replace('.', '/') + ".class");
                if (file.isFile()) {
                    try {
                        byte[] bytes = Files.readAllBytes(file.toPath());
                        if (rewritten(name)) bytes = rewrite(bytes);
                        c = defineClass(name, bytes, 0, bytes.length);
                    } catch (IOException e) {
                        throw new ClassNotFoundException(name, e);
                    }
                }
            }
            if (c == null) return super.loadClass(name, resolve);
            if (resolve) resolveClass(c);
            return c;
        }
    }

    /** Rewrites the Utf8 entries of the constant pool and copies everything else as it is. */
    static byte[] rewrite(byte[] classFile) throws IOException {
        DataInputStream in = new DataInputStream(new ByteArrayInputStream(classFile));
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(classFile.length + 128);
        DataOutputStream out = new DataOutputStream(bytes);
        out.writeInt(in.readInt());
        out.writeShort(in.readUnsignedShort());
        out.writeShort(in.readUnsignedShort());
        int count = in.readUnsignedShort();
        out.writeShort(count);
        for (int i = 1; i < count; i++) {
            int tag = in.readUnsignedByte();
            out.writeByte(tag);
            switch (tag) {
                case 1: {
                    int length = in.readUnsignedShort();
                    byte[] text = new byte[length];
                    in.readFully(text);
                    byte[] changed = redirect(text);
                    out.writeShort(changed.length);
                    out.write(changed);
                    break;
                }
                case 3: case 4:
                    out.writeInt(in.readInt());
                    break;
                case 5: case 6:
                    out.writeLong(in.readLong());
                    i++;
                    break;
                case 7: case 8: case 16: case 19: case 20:
                    out.writeShort(in.readUnsignedShort());
                    break;
                case 9: case 10: case 11: case 12: case 17: case 18:
                    out.writeInt(in.readInt());
                    break;
                case 15:
                    out.writeByte(in.readUnsignedByte());
                    out.writeShort(in.readUnsignedShort());
                    break;
                default:
                    throw new IOException("unknown constant pool tag " + tag);
            }
        }
        byte[] rest = new byte[in.available()];
        in.readFully(rest);
        out.write(rest);
        return bytes.toByteArray();
    }

    // Latin-1 maps every byte to one char and back, so bytes outside ASCII (modified UTF-8 sequences) pass through unchanged.
    private static byte[] redirect(byte[] text) {
        String s = new String(text, LATIN1);
        String t = s;
        for (int i = 0; i < REDIRECTS.length; i++) {
            Matcher m = PATTERNS[i].matcher(t);
            t = m.replaceAll(Matcher.quoteReplacement(REDIRECTS[i][1]));
        }
        return t.equals(s) ? text : t.getBytes(LATIN1);
    }
}
