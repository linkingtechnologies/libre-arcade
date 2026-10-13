package oracle;

import java.util.PriorityQueue;
import java.util.concurrent.Semaphore;

// The virtual clock and the cooperative scheduler behind the original's threads.
//
// The original runs on the handset's wall clock: every player has a thread that does one pass of its work and sleeps a second, the
// engine has a thread that paints ten times a second, and System.currentTimeMillis() is read all over the game. Here none of that
// depends on the machine: time is a number that only the scheduler advances, and exactly one thread runs at a time. A thread runs
// until it sleeps (or ends); the scheduler then picks the entry with the earliest wake time, and among equal times the one that went
// to sleep (or was started) first. This is a model of the handset, which has no such order: on the handset equal times are a race.
public final class Scheduler {
    public static final long BASE = 1700000000000L;       // the clock's value before the game starts; any realistic number would do

    private static final class Entry implements Comparable<Entry> {
        final long wake;
        final long seq;
        final VThread thread;

        Entry(long wake, long seq, VThread thread) {
            this.wake = wake;
            this.seq = seq;
            this.thread = thread;
        }

        public int compareTo(Entry o) {
            return wake != o.wake ? Long.compare(wake, o.wake) : Long.compare(seq, o.seq);
        }
    }

    private static final boolean TRACE = System.getProperty("oracle.trace") != null;
    private static final PriorityQueue<Entry> queue = new PriorityQueue<Entry>();
    private static final Semaphore baton = new Semaphore(0);
    private static long now = BASE;
    private static long seq = 0;
    private static VThread current = null;

    private Scheduler() { }

    public static long now() { return now; }

    public static VThread current() { return current; }

    /** Puts a thread in the queue to run at `wake` (the start of a thread, the end of a sleep, or a wake-up after a wait). */
    public static void enqueue(VThread thread, long wake) {
        queue.add(new Entry(Math.max(wake, now), seq++, thread));
    }

    /** Runs every entry whose time is not after `target`, in order, then sets the clock to `target`. Called by the harness only. */
    public static void runUntil(long target) {
        while (!queue.isEmpty() && queue.peek().wake <= target) {
            Entry e = queue.poll();
            now = e.wake;
            current = e.thread;
            if (TRACE) System.err.println("trace " + (now - BASE) + " " + e.thread.describe());
            e.thread.resumeFromScheduler();
            baton.acquireUninterruptibly();               // until that thread sleeps again, waits, or ends
            current = null;
        }
        now = Math.max(now, target);
    }

    /** Sets the clock to `t` (not before the present) without running anything: what a person does between two tasks of the machine. */
    public static void setNow(long t) {
        now = Math.max(now, t);
    }

    /** Called by a thread when it gives the baton back. */
    static void yieldBaton() { baton.release(); }
}
