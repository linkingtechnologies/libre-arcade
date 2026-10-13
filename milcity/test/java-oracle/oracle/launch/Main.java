package oracle.launch;

import java.io.File;
import java.io.InputStream;
import java.io.PrintStream;

// java -cp <build> oracle.launch.Main <build>   (the scenario on stdin, the report on stdout)
// Loads the harness through the rewriting loader, so that the original and the harness live in one world.
public final class Main {
    private Main() { }

    public static void main(String[] args) throws Exception {
        RewritingLoader loader = new RewritingLoader(new File(args[0]), Main.class.getClassLoader());
        Class<?> harness = loader.loadClass("oracle.Harness");
        harness.getMethod("run", InputStream.class, PrintStream.class).invoke(null, System.in, System.out);
        System.out.flush();
        System.exit(0);
    }
}
