package oracle;

import java.util.concurrent.Semaphore;

// Stand-in for java.lang.Thread, as far as the original uses it: new Thread(runnable), a subclass with its own run(), start(),
// and the static sleep(). Each one is a real thread underneath, but it only runs when the scheduler hands it the baton, and a sleep
// is a number of virtual milliseconds. The class loader redirects the original's references to java.lang.Thread to this class.
public class VThread implements Runnable {
    private final Runnable target;
    private final Semaphore go = new Semaphore(0);
    private Thread real;
    private boolean started;

    public VThread() { this.target = null; }

    public VThread(Runnable target) { this.target = target; }

    /** For tracing: what this thread runs. */
    public String describe() {
        return target == null ? getClass().getSimpleName() : target.getClass().getSimpleName();
    }

    public void run() {
        if (target != null) target.run();
    }

    public void start() {
        if (started) throw new IllegalThreadStateException();
        started = true;
        Scheduler.enqueue(this, Scheduler.now());
    }

    /** Thread.sleep: the thread goes back into the queue `ms` later and gives the baton back. */
    public static void sleep(long ms) throws InterruptedException {
        VThread self = Scheduler.current();
        if (self == null) throw new IllegalStateException("sleep outside a virtual thread");
        Scheduler.enqueue(self, Scheduler.now() + Math.max(0L, ms));
        self.giveBackAndWait();
    }

    /** For a thread that waits to be woken by someone else (the engine's wait() when paused): it leaves without a wake-up time. */
    public static void park() {
        VThread self = Scheduler.current();
        if (self == null) throw new IllegalStateException("park outside a virtual thread");
        self.giveBackAndWait();
    }

    /** Wakes a parked thread at the current virtual time. */
    public static void unpark(VThread thread) { Scheduler.enqueue(thread, Scheduler.now()); }

    private void giveBackAndWait() {
        Scheduler.yieldBaton();
        go.acquireUninterruptibly();
    }

    // Called by the scheduler on its own thread.
    void resumeFromScheduler() {
        if (real == null) {
            real = new Thread(new Runnable() {
                public void run() {
                    go.acquireUninterruptibly();
                    try {
                        VThread.this.run();
                    } catch (Throwable t) {
                        t.printStackTrace();
                    } finally {
                        Scheduler.yieldBaton();
                    }
                }
            });
            real.setDaemon(true);
            real.start();
        }
        go.release();
    }
}
