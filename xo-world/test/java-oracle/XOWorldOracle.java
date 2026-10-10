// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Executable oracle for the XO World port: drives the unmodified original
// applet class (reference/javagames-1.0/xoworld.java, compiled as it is) over
// a line protocol on stdin/stdout. Nothing of the game logic is re-implemented
// here: human moves go through the original mouseUp(), positions through the
// original igraj().
//
//   N                       new game (the original "New game" click)
//   M <col> <row>           a click on a board cell
//   P <potez> <x> <y> <b>   igraj(x, y) on a fresh object holding board b
//                           (100 digits, 0 empty / 1 X / 2 O) at turn <potez>
//   Q                       quit
//
// The original draws its random fallback move with Math.random(), which cannot
// be seeded. To tell a deterministic decision from a random one, every
// decision is also taken by CLONES throw-away copies of the object holding the
// identical state: if the copies disagree, the fallback was used (fallback=1).
// With three or fewer empty squares the random choice cannot be told from a
// deterministic one this way; the Node driver accounts for that.
// The main object is never replaced, so it carries its own state from game to
// game exactly as the applet does.

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintStream;

public class XOWorldOracle
{
    static final int CLONES = 16;

    static void copyState(xoworld from, xoworld to)
    {
        for (int i = 0; i < 3; i++)
            System.arraycopy(from.t[i], 0, to.t[i], 0, 100);
        for (int i = 0; i < 7; i++)
            System.arraycopy(from.tr[i], 0, to.tr[i], 0, 100);
        System.arraycopy(from.tp, 0, to.tp, 0, 100);
        System.arraycopy(from.tf, 0, to.tf, 0, 100);
        System.arraycopy(from.p, 0, to.p, 0, from.p.length);
        System.arraycopy(from.brojac, 0, to.brojac, 0, from.brojac.length);
        to.potez = from.potez;
        to.st = from.st;
        to.LastMove = from.LastMove;
    }

    static String board(xoworld g)
    {
        StringBuilder sb = new StringBuilder(100);
        for (int i = 0; i < 100; i++)
            sb.append((char) ('0' + g.t[0][i]));
        return sb.toString();
    }

    static void click(xoworld g, int col, int row)
    {
        g.mouseUp(null, col * 30 + 15, 40 + row * 30 + 15);
    }

    public static void main(String[] args) throws Exception
    {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "US-ASCII"));
        PrintStream out = new PrintStream(System.out, true, "US-ASCII");
        xoworld main = new xoworld();
        String line;

        while ((line = in.readLine()) != null)
        {
            String[] f = line.trim().split("\\s+");
            if (f[0].equals("Q"))
                break;

            if (f[0].equals("N"))
            {
                main.mouseUp(null, 10, 10);     // the original "New game" button
                out.println("OK " + main.potez + " " + main.st);
            }
            else if (f[0].equals("M"))
            {
                int col = Integer.parseInt(f[1]), row = Integer.parseInt(f[2]);
                xoworld[] clones = new xoworld[CLONES];
                for (int i = 0; i < CLONES; i++)
                {
                    clones[i] = new xoworld();
                    copyState(main, clones[i]);
                }
                int before = main.potez;
                click(main, col, row);
                int fallback = 0;
                for (int i = 0; i < CLONES; i++)
                {
                    click(clones[i], col, row);
                    if (clones[i].LastMove != main.LastMove || !board(clones[i]).equals(board(main)))
                        fallback = 1;
                }
                int legal = main.potez != before ? 1 : 0;
                out.println("R " + legal + " " + main.st + " " + main.potez + " " + main.LastMove + " " + fallback + " " + board(main));
            }
            else if (f[0].equals("P"))
            {
                int potez = Integer.parseInt(f[1]), x = Integer.parseInt(f[2]), y = Integer.parseInt(f[3]);
                String b = f[4];
                xoworld g = new xoworld();
                for (int i = 0; i < 100; i++)
                    g.t[0][i] = b.charAt(i) - '0';
                g.potez = potez;
                xoworld[] clones = new xoworld[CLONES];
                for (int i = 0; i < CLONES; i++)
                {
                    clones[i] = new xoworld();
                    copyState(g, clones[i]);
                }
                int result = g.igraj(x, y);
                int fallback = 0;
                for (int i = 0; i < CLONES; i++)
                    if (clones[i].igraj(x, y) != result)
                        fallback = 1;
                out.println("R " + result + " " + fallback);
            }
            else
                out.println("ERR unknown command");
        }
    }
}
