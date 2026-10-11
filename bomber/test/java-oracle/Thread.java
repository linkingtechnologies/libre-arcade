// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Virtual-time stand-in for java.lang.Thread, used only by the oracle build.
//
// The original GameCanvasBomber.java is compiled unmodified in the unnamed
// package. A class declared in the same package shadows the classes imported on
// demand, and java.lang.Thread is one of those, so the original's
// "Thread.sleep(141)" resolves to this class and the game loop runs as fast as
// the machine allows while the harness counts the milliseconds the original
// asked to wait. Nothing else of the original is touched.

public class Thread
{
    private final Runnable target;

    public Thread(Runnable target)
    {
        this.target = target;
    }

    public void start()
    {
        throw new UnsupportedOperationException("the oracle runs the original loop on the calling thread");
    }

    public static void sleep(long millis) throws InterruptedException
    {
        BomberOracle.onSleep(millis);
    }
}
