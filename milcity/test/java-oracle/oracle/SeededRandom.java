package oracle;

// Stand-in for java.util.Random: the same generator (it is one underneath), but the no-argument constructor takes its seed from
// SeedSource instead of the clock. The original calls only nextInt(int). The class loader redirects its references to this class.
public class SeededRandom {
    private final java.util.Random random;

    public SeededRandom() { this.random = new java.util.Random(SeedSource.next()); }

    public SeededRandom(long seed) { this.random = new java.util.Random(seed); }

    public int nextInt(int bound) { return random.nextInt(bound); }

    public int nextInt() { return random.nextInt(); }
}
