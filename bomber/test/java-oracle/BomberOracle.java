// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only
//
// Executable oracle for the Bomber port: runs the unmodified original game loop
// (reference/bomber-1.0/src/GameCanvasBomber.java, compiled as it is) against
// stand-ins for the MIDP API and for java.lang.Thread (see Thread.java), and
// prints what the original did after every iteration of its loop.
//
//   RUN <seed> <iterations> <policy> <policySeed>
//   RND <seed> <count>      java.util.Random.nextInt(bound) for count bounds 1..100 (the port's own generator is checked against it)
//
// <seed> seeds the original's java.util.Random (the original seeds it with the
// clock; the field is package-private and is replaced before the loop starts).
// <policy> decides the one key the game has: 0 never bombs, 1 bombs at random,
// 2 holds the key down, 3 bombs tall buildings, 4 bombs any standing building. At the title screen every
// policy presses the key at random until a game starts.
//
// One line per iteration, fields separated by spaces:
//   I k key from to score landings record planeX planeY bombStatus bombX bombY
//     bombLife planeFrame ms heights caps colours tones
// "from" and "to" are the original's appStatus at the start and at the end of
// the iteration, "ms" the total of its Thread.sleep requests, "record" the high
// score (shown only for iterations that ran the title screen, where the original
// updates it) and "bombLife" is shown only while a bomb is falling (the original
// does not reset it at a new city, and nothing reads it before a launch resets it).

import java.util.Random;
import javax.microedition.lcdui.game.Hooks;

public class BomberOracle implements Hooks.Listener
{
    static class StopRun extends RuntimeException
    {
        StopRun() { super(null, null, false, false); }
    }

    static BomberOracle current;

    final GameCanvasBomber canvas;
    final int maxIterations;
    final int policy;
    final Random policyRandom;

    int iteration = 0;
    int calls = 0;
    int key = 0;
    int fromStatus = 0;
    long ms = 0;
    final StringBuilder tones = new StringBuilder();
    final StringBuilder out = new StringBuilder();

    // appStatus is the one private field of the original (the "private" label in
    // front of its field list covers only it), so it is read by reflection.
    static final java.lang.reflect.Field APP_STATUS;
    static
    {
        try
        {
            APP_STATUS = GameCanvasBomber.class.getDeclaredField("appStatus");
            APP_STATUS.setAccessible(true);
        }
        catch (NoSuchFieldException e)
        {
            throw new ExceptionInInitializerError(e);
        }
    }

    int status()
    {
        try
        {
            return APP_STATUS.getInt(canvas);
        }
        catch (IllegalAccessException e)
        {
            throw new IllegalStateException(e);
        }
    }

    BomberOracle(GameCanvasBomber canvas, int maxIterations, int policy, long policySeed)
    {
        this.canvas = canvas;
        this.maxIterations = maxIterations;
        this.policy = policy;
        this.policyRandom = new Random(policySeed);
    }

    public int getKeyStates()
    {
        calls++;
        if (calls == 1)
            return 0;               // the original's first call per iteration discards its result
        boolean press;
        if (status() == 1)
            press = policyRandom.nextInt(2) == 0;
        else if (status() != 3)
            press = false;
        else if (policy == 0)
            press = false;
        else if (policy == 1)
            press = policyRandom.nextInt(10) < 3;
        else if (policy == 2)
            press = true;
        else if (policy == 4)
        {
            // sweeper: bomb whenever there is a standing building under the drop point
            int target = canvas.planeY - 3;
            press = target >= 0 && target < canvas.buildingCount && canvas.buildingHeights[target] > 0;
        }
        else
        {
            int target = canvas.planeY - 3;
            press = (target >= 0 && target < canvas.buildingCount && canvas.buildingHeights[target] > 4)
                    || policyRandom.nextInt(10) == 0;
        }
        key = press ? 1 : 0;
        return press ? 256 : 0;
    }

    public void playTone(int note, int duration, int volume)
    {
        if (tones.length() > 0)
            tones.append(',');
        tones.append(note).append(':').append(duration).append(':').append(volume);
    }

    static void onSleep(long millis)
    {
        current.sleep(millis);
    }

    void sleep(long millis)
    {
        ms += millis;
        if (millis != canvas.timeDelay)
            return;
        // end of one iteration of the original loop
        GameCanvasBomber c = canvas;
        out.setLength(0);
        out.append("I ").append(iteration).append(' ').append(key).append(' ')
           .append(fromStatus).append(' ').append(status()).append(' ')
           .append(c.score).append(' ').append(c.landings).append(' ')
           .append(fromStatus == 1 ? Integer.toString(c.scoreRecord) : "-").append(' ')
           .append(c.planeX).append(' ').append(c.planeY).append(' ')
           .append(c.bombStatus).append(' ').append(c.bombX).append(' ').append(c.bombY).append(' ')
           .append(c.bombStatus == 1 ? Integer.toString(c.bombLife) : "-").append(' ')
           .append(c.planeSprite.frame).append(' ').append(ms).append(' ');
        join(c.buildingHeights);
        out.append(' ');
        join(c.buildingCaps);
        out.append(' ');
        join(c.buildingColours);
        out.append(' ').append(tones.length() == 0 ? "-" : tones.toString());
        System.out.println(out);
        iteration++;
        fromStatus = status();
        calls = 0;
        key = 0;
        ms = 0;
        tones.setLength(0);
        if (iteration >= maxIterations)
            throw new StopRun();
    }

    void join(int[] values)
    {
        for (int i = 0; i < values.length; i++)
        {
            if (i > 0)
                out.append(',');
            out.append(values[i]);
        }
    }

    static void run(long seed, int iterations, int policy, long policySeed)
    {
        GameCanvasBomber canvas = new GameCanvasBomber();
        canvas.random = new Random(seed);
        BomberOracle oracle = new BomberOracle(canvas, iterations, policy, policySeed);
        current = oracle;
        Hooks.listener = oracle;
        try
        {
            canvas.run();
            System.out.println("END ended");
        }
        catch (StopRun stop)
        {
            System.out.println("END ok");
        }
    }

    public static void main(String[] args) throws Exception
    {
        java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(System.in, "US-ASCII"));
        String line;
        while ((line = in.readLine()) != null)
        {
            String[] f = line.trim().split("\\s+");
            if (f[0].equals("QUIT"))
                break;
            if (f[0].equals("RND"))
            {
                Random random = new Random(Long.parseLong(f[1]));
                int count = Integer.parseInt(f[2]);
                StringBuilder sb = new StringBuilder("R");
                for (int i = 0; i < count; i++)
                    sb.append(' ').append(random.nextInt(1 + (i * 7) % 100));
                System.out.println(sb);
                System.out.flush();
            }
            else if (f[0].equals("RUN"))
            {
                run(Long.parseLong(f[1]), Integer.parseInt(f[2]), Integer.parseInt(f[3]), Long.parseLong(f[4]));
                System.out.flush();
            }
            else
                System.out.println("ERR unknown command");
        }
    }
}
