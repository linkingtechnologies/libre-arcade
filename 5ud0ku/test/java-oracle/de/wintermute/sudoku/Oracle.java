// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Executable oracle for the 5ud0ku port: drives the unmodified original classes
// (reference/5ud0ku-1.8/source/src/de/wintermute/sudoku/: AbortableTask,
// BruteForceSolver, CreatorTask, Grid, GridCreator, GridSlot, GridSolver,
// MoveStack, Position, Solver) over a line protocol on stdin and stdout. Only
// Dict, SudokuMidlet and SudokuStateControl are stand-ins (see their headers);
// nothing of the game logic is written again here.
//
// The harness lives in the original's package because Grid.setupPossibleDigits()
// and Grid.randomizeDigits() are protected. The original draws its random numbers
// from two java.util.Random objects that it seeds from the clock; they are
// private static final fields, so the harness reseeds them (setSeed) by reflection.
//
//   GEN <easy|normal|hard> <creatorSeed> <digitSeed>
//        runs the original CreatorTask (candidates, selection, randomizeDigits)
//   RND <seed> <count>
//        the first <count> values of new java.util.Random(seed).nextInt()
//   SOLVE <81 digits>
//        the sequence of SolverTask: setAllShownDigitsAsOriginal(), checkForRules(), and, if
//        that passes, BruteForceSolver(null, false).searchSolutions()
//   NEW <type as hex UTF-16BE, or -> <81 shown> <81 answer>   then any of: SHOW, MASK, PENCIL, SETUP,
//   INITPM, PROMOTE, HIDE, CLEARPENCIL, CLEARDIGITS, CONF, SINGLE, HSINGLE,
//   HSINGLE2, RULES, COUNTS, SOLVED, FULL, VALID, GIVEN, SINGLES, BT, SOLVEDDIGIT,
//   COPYSHOWN, RESETEDIT, ORIGINAL, ELAPSED, DUMP, FROMBYTES, MSADD, MSBACK,
//   MSFWD, MSNEXT, MSRESET, ROUNDTRIP, CLONE, SETBT (each prints one line; see the code)
//   QUIT

package de.wintermute.sudoku;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.lang.reflect.Field;
import java.util.Random;
import java.util.Vector;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class Oracle
{
    static Grid grid = new Grid("easy");
    static MoveStack moves = new MoveStack();

    static void reseed(Class<?> owner, long seed) throws Exception
    {
        Field field = owner.getDeclaredField("random");
        field.setAccessible(true);
        ((Random) field.get(null)).setSeed(seed);
    }

    static String shown(Grid g)
    {
        StringBuilder sb = new StringBuilder(81);
        for (byte r = 0; r < 9; r++)
            for (byte c = 0; c < 9; c++)
                sb.append(g.getSlot(r, c).getShown());
        return sb.toString();
    }

    static String answer(Grid g)
    {
        StringBuilder sb = new StringBuilder(81);
        for (byte r = 0; r < 9; r++)
            for (byte c = 0; c < 9; c++)
                sb.append(g.getSlot(r, c).getAnswer());
        return sb.toString();
    }

    static String hex(byte[] bytes)
    {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (int i = 0; i < bytes.length; i++)
        {
            int v = bytes[i] & 0xFF;
            sb.append(Character.forDigit(v >> 4, 16)).append(Character.forDigit(v & 15, 16));
        }
        return sb.toString();
    }

    static byte[] unhex(String text)
    {
        byte[] out = new byte[text.length() / 2];
        for (int i = 0; i < out.length; i++)
            out[i] = (byte) Integer.parseInt(text.substring(2 * i, 2 * i + 2), 16);
        return out;
    }

    static String positions(Vector v)
    {
        if (v == null)
            return "null";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.size(); i++)
        {
            Position p = (Position) v.elementAt(i);
            if (i > 0)
                sb.append(';');
            sb.append(p.row).append(',').append(p.col);
        }
        return sb.length() == 0 ? "empty" : sb.toString();
    }

    // Grid types travel as hexadecimal UTF-16BE so that any characters can be tested.
    static String text(String s)
    {
        if (s.length() == 0)
            return "-";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++)
        {
            int c = s.charAt(i);
            sb.append(Character.forDigit((c >> 12) & 15, 16)).append(Character.forDigit((c >> 8) & 15, 16));
            sb.append(Character.forDigit((c >> 4) & 15, 16)).append(Character.forDigit(c & 15, 16));
        }
        return sb.toString();
    }

    static String untext(String hex)
    {
        if (hex.equals("-"))
            return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < hex.length(); i += 4)
            sb.append((char) Integer.parseInt(hex.substring(i, i + 4), 16));
        return sb.toString();
    }

    static String position(Position p)
    {
        return p == null ? "null" : p.row + "," + p.col;
    }

    static String dump(Grid g) throws Exception
    {
        StringBuilder masks = new StringBuilder();
        StringBuilder originals = new StringBuilder();
        for (byte r = 0; r < 9; r++)
            for (byte c = 0; c < 9; c++)
            {
                if (masks.length() > 0)
                    masks.append(',');
                masks.append(g.getSlot(r, c).getPencilMarks());
                originals.append(g.getSlot(r, c).isOriginalDigit() ? '1' : '0');
            }
        return "D " + text(g.getType()) + " " + g.getElapsedTime() + " " + shown(g) + " " + answer(g) + " " + originals + " " + masks + " " + hex(g.toByteArray());
    }

    static String generate(String level, long creatorSeed, long digitSeed) throws Exception
    {
        int index = level.equals("easy") ? 0 : level.equals("normal") ? 1 : 2;
        reseed(GridCreator.class, creatorSeed);
        reseed(Grid.class, digitSeed);
        final Grid[] result = new Grid[1];
        final CountDownLatch done = new CountDownLatch(1);
        SudokuMidlet midlet = new SudokuMidlet()
        {
            protected void gameCreated(final Grid created)
            {
                result[0] = created;
                done.countDown();
            }
        };
        new CreatorTask(midlet, new SudokuStateControl()).createGame((short) index);
        if (!done.await(300, TimeUnit.SECONDS))
            return "ERR generation timed out";
        Grid g = result[0];
        Grid copy = g.clone();
        copy.setupPossibleDigits();
        AbortableTask task = new AbortableTask() {};
        task.startRunning();
        int solutions = new GridSolver(task).searchSolutions(copy).size();
        // CreatorTask measures givens and singles on the candidate grid before it clears the
        // candidates; the clone above is set up the same way (singles do not depend on digit names).
        return "G " + level + " " + creatorSeed + " " + digitSeed + " " + shown(g) + " " + answer(g) + " " + g.getNumberOfGiven() + " "
            + copy.getNumberOfSingles() + " " + g.getBackTrackingDepth() + " " + text(g.getType()) + " " + solutions + " " + hex(g.toByteArray());
    }

    static String solve(String puzzle)
    {
        // The sequence of SolverTask.run(): digits become fixed, the rules are checked, and only a
        // grid that passes is searched (BruteForceSolver does not look for clashes among fixed
        // digits, so on a grid that fails it would search without end).
        Grid g = new Grid("user");
        for (int i = 0; i < 81; i++)
        {
            int d = puzzle.charAt(i) >= '1' && puzzle.charAt(i) <= '9' ? puzzle.charAt(i) - '0' : 0;
            g.getSlot((byte) (i / 9), (byte) (i % 9)).setShown((byte) d);
        }
        g.setAllShownDigitsAsOriginal();
        boolean rules = g.checkForRules();
        if (!rules)
            return "S 0 0";
        Vector found = new BruteForceSolver(null, false).searchSolutions(g);
        StringBuilder sb = new StringBuilder("S " + (rules ? 1 : 0) + " " + found.size());
        for (int i = 0; i < found.size(); i++)
            sb.append(' ').append(shown((Grid) found.elementAt(i)));
        return sb.toString();
    }

    static Position pos(String[] f, int at)
    {
        return new Position(Byte.parseByte(f[at]), Byte.parseByte(f[at + 1]));
    }

    static String command(String[] f) throws Exception
    {
        String op = f[0];
        if (op.equals("GEN"))
            return generate(f[1], Long.parseLong(f[2]), Long.parseLong(f[3]));
        if (op.equals("SOLVE"))
            return solve(f[1]);
        if (op.equals("RND"))
        {
            Random r = new Random(Long.parseLong(f[1]));
            StringBuilder sb = new StringBuilder("R");
            for (int i = 0; i < Integer.parseInt(f[2]); i++)
                sb.append(' ').append(r.nextInt());
            return sb.toString();
        }
        if (op.equals("NEW"))
        {
            grid = new Grid(untext(f[1]));
            moves = new MoveStack();
            for (int i = 0; i < 81; i++)
            {
                GridSlot slot = grid.getSlot((byte) (i / 9), (byte) (i % 9));
                slot.setAnswer((byte) (f[3].charAt(i) - '0'));
                int sh = f[2].charAt(i) - '0';
                slot.setShown((byte) sh);
                slot.setOriginalDigit(sh != 0);
            }
            return "OK";
        }
        if (op.equals("SHOW"))
        {
            grid.getSlot(Byte.parseByte(f[1]), Byte.parseByte(f[2])).setShown(Byte.parseByte(f[3]));
            return "OK";
        }
        if (op.equals("MASK"))
        {
            grid.getSlot(Byte.parseByte(f[1]), Byte.parseByte(f[2])).setPencilMarks(Integer.parseInt(f[3]));
            return "OK";
        }
        if (op.equals("PENCIL"))
        {
            grid.getSlot(Byte.parseByte(f[1]), Byte.parseByte(f[2])).setPencilMark(Integer.parseInt(f[3]), f[4].equals("1"));
            return "OK";
        }
        if (op.equals("SETUP"))
            return "V " + grid.setupPossibleDigits();
        if (op.equals("INITPM"))
        {
            grid.intializePencilMarks(grid.allEmptyPositions());
            return "OK";
        }
        if (op.equals("PROMOTE"))
        {
            grid.promote(Byte.parseByte(f[1]), Byte.parseByte(f[2]));
            return "OK";
        }
        if (op.equals("HIDE"))
            return "V " + (grid.hideNumber(pos(f, 1)) ? 1 : 0);
        if (op.equals("CLEARPENCIL"))
        {
            grid.clearPencilMarks();
            return "OK";
        }
        if (op.equals("CLEARDIGITS"))
        {
            grid.clearDigits();
            return "OK";
        }
        if (op.equals("CONF"))
            return "C " + positions(grid.getConflictPositions(Byte.parseByte(f[1]), Byte.parseByte(f[2]), Byte.parseByte(f[3])));
        if (op.equals("SINGLE"))
            return "V " + grid.isSingle(pos(f, 1));
        if (op.equals("HSINGLE"))
            return "V " + grid.isHiddenSingle(pos(f, 1));
        if (op.equals("HSINGLE2"))
            return "V " + (grid.isHiddenSingle(pos(f, 1), Byte.parseByte(f[3])) ? 1 : 0);
        if (op.equals("RULES"))
            return "V " + (grid.checkForRules() ? 1 : 0);
        if (op.equals("COUNTS"))
        {
            int[] counts = grid.getDigitCounts();
            StringBuilder sb = new StringBuilder("V");
            for (int i = 0; i < counts.length; i++)
                sb.append(' ').append(counts[i]);
            return sb.toString();
        }
        if (op.equals("SOLVED"))
            return "V " + (grid.isSolved() ? 1 : 0);
        if (op.equals("FULL"))
            return "V " + (grid.isCompletelyFilled() ? 1 : 0);
        if (op.equals("VALID"))
            return "V " + (grid.isValidSolution() ? 1 : 0);
        if (op.equals("GIVEN"))
            return "V " + grid.getNumberOfGiven();
        if (op.equals("SINGLES"))
            return "V " + grid.getNumberOfSingles();
        if (op.equals("BT"))
            return "V " + grid.getBackTrackingDepth();
        if (op.equals("SOLVEDDIGIT"))
        {
            grid.setSolvedDigit(pos(f, 1), Byte.parseByte(f[3]), grid.allEmptyPositions());
            return "OK";
        }
        if (op.equals("COPYSHOWN"))
        {
            grid.copyShownToAnswer();
            return "OK";
        }
        if (op.equals("RESETEDIT"))
        {
            grid.resetForEdit();
            return "OK";
        }
        if (op.equals("ORIGINAL"))
        {
            grid.setAllShownDigitsAsOriginal();
            return "OK";
        }
        if (op.equals("ELAPSED"))
        {
            grid.setElapsedTime(Long.parseLong(f[1]));
            return "OK";
        }
        if (op.equals("DUMP"))
            return dump(grid);
        if (op.equals("CLONE"))
        {
            grid = grid.clone();
            return dump(grid);
        }
        if (op.equals("SETBT"))
        {
            grid.setBackTrackingDepth(Short.parseShort(f[1]));
            return "OK";
        }
        if (op.equals("ROUNDTRIP"))
        {
            grid = new Grid(grid.toByteArray());
            return dump(grid);
        }
        if (op.equals("FROMBYTES"))
        {
            grid = new Grid(unhex(f[1]));
            return dump(grid);
        }
        if (op.equals("MSADD"))
        {
            moves.addMove(Byte.parseByte(f[1]), Byte.parseByte(f[2]), Byte.parseByte(f[3]), Byte.parseByte(f[4]), f[5].equals("1"));
            return "OK";
        }
        if (op.equals("MSBACK"))
            return "P " + position(moves.stepBack(grid));
        if (op.equals("MSFWD"))
            return "P " + position(moves.stepForward(grid));
        if (op.equals("MSNEXT"))
            return "P " + position(moves.getNextUndoPosition());
        if (op.equals("MSRESET"))
        {
            moves.resetStack();
            return "OK";
        }
        return "ERR unknown command " + op;
    }

    public static void main(String[] args) throws Exception
    {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "US-ASCII"));
        PrintStream out = new PrintStream(System.out, true, "US-ASCII");
        String line;
        while ((line = in.readLine()) != null)
        {
            String[] f = line.trim().split("\\s+");
            if (f[0].equals("QUIT"))
                break;
            String reply;
            try
            {
                reply = command(f);
            }
            catch (Throwable t)
            {
                reply = "EXC " + t.getClass().getName();
            }
            out.println(reply);
        }
        System.exit(0);
    }
}
