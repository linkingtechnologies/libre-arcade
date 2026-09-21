package tajjava.grid;

import java.awt.event.ActionEvent;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Headless re-run of the original TAJJAVA 100-Square Challenge classes (taken unchanged from
 * TAJJAVA.jar). It lives in the game's own package only to reach the package-private fields,
 * and it drives the real Square.mouseClicked / GameSessionPanel.actionPerformed code paths.
 */
public class OracleHarness {
    static GameSessionPanel g;

    static String state() {
        int used = 0, max = 0, highlighted = 0;
        StringBuilder hl = new StringBuilder();
        for (int y = 0; y < 10; y++) {
            for (int x = 0; x < 10; x++) {
                Square s = g.grid[x][y];
                if (s.value > 0) { used++; max = Math.max(max, s.value); }
                if (s.proposed) { highlighted++; hl.append("(").append(x).append(",").append(y).append(")"); }
            }
        }
        return String.format("used=%d max=%d cursor=(%d,%d) highlighted=%d %s gended=%b undoEnabled=%b",
                used, max, g.lastsq.x, g.lastsq.y, highlighted, hl, g.gended, g.undobutton.isEnabled());
    }

    static void click(int x, int y) { g.grid[x][y].mouseClicked(null); }
    static void action(String command) { g.actionPerformed(new ActionEvent(g, 0, command)); }

    static void say(String label, String state) { System.out.println(String.format("%-4s %-24s %s", label.substring(0, 3), label.substring(4), state)); }

    static List<int[]> path(String file, boolean witness, int startX, int startY) throws Exception {
        List<int[]> out = new ArrayList<>();
        List<String> lines = Files.readAllLines(Paths.get(file), StandardCharsets.UTF_8);
        for (String line : lines.subList(1, lines.size())) {
            String[] c = line.trim().split(",");
            if (witness) {
                if (Integer.parseInt(c[0]) == startX && Integer.parseInt(c[1]) == startY) out.add(new int[]{Integer.parseInt(c[3]), Integer.parseInt(c[4])});
            } else {
                out.add(new int[]{Integer.parseInt(c[1]), Integer.parseInt(c[2])});
            }
        }
        return out;
    }

    public static void main(String[] args) throws Exception {
        String witnesses = args[0], blocked = args[1];
        g = new GameSessionPanel();
        say("T01 startup", state());
        click(0, 0);                       say("T02 first valid click", state());
        click(5, 5);                       say("T03 non knight click", state());
        click(1, 2);                       say("T04 knight click", state());
        click(0, 0);                       say("T05 reused cell", state());
        click(9, 9);                       say("T06 far cell", state());
        action("undomove");                say("T07 undo once", state());
        action("newgame");                 say("T08 restart", state());
        click(0, 0); action("undomove");   say("T09 undo first move", state());
        action("newgame");                 say("T10 restart after undo", state());
        for (int[] p : path(witnesses, true, 0, 0)) click(p[0], p[1]);
        say("T11 full solution", state());
        action("newgame");                 say("T12 restart after win", state());
        for (int[] p : path(blocked, false, 0, 0)) click(p[0], p[1]);
        say("T13 dead end", state());
        click(5, 5);                       say("T14 click after dead end", state());
        click(0, 0);                       say("T15 first after auto reset", state());
    }
}
