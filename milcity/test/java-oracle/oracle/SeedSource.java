package oracle;

// Where the seeds of the original's `new Random()` come from. The original seeds each one from the clock, so no two runs are
// alike; here every one takes the next value of a SplitMix64 sequence started from the scenario's seed, so a run can be repeated
// and the port can be given the same seeds in the same order.
public final class SeedSource {
    private static long state = 0;
    private static long count = 0;

    private SeedSource() { }

    public static void reset(long seed) {
        state = seed;
        count = 0;
    }

    public static long count() { return count; }

    public static long next() {
        count++;
        state += 0x9E3779B97F4A7C15L;
        long z = state;
        z = (z ^ (z >>> 30)) * 0xBF58476D1CE4E5B9L;
        z = (z ^ (z >>> 27)) * 0x94D049BB133111EBL;
        return z ^ (z >>> 31);
    }
}
