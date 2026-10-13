package oracle;

import fr.uha.ensisa.ir.walther.milcityblue.core.Building;
import fr.uha.ensisa.ir.walther.milcityblue.core.BuildingsIterator;
import fr.uha.ensisa.ir.walther.milcityblue.core.Cell;
import fr.uha.ensisa.ir.walther.milcityblue.core.CellsIterator;
import fr.uha.ensisa.ir.walther.milcityblue.core.Config;
import fr.uha.ensisa.ir.walther.milcityblue.core.Engine;
import fr.uha.ensisa.ir.walther.milcityblue.core.Game;
import fr.uha.ensisa.ir.walther.milcityblue.core.GameListener;
import fr.uha.ensisa.ir.walther.milcityblue.core.Grid;
import fr.uha.ensisa.ir.walther.milcityblue.core.GridBuilder;
import fr.uha.ensisa.ir.walther.milcityblue.core.PlayerAbstract;
import fr.uha.ensisa.ir.walther.milcityblue.core.Size;
import fr.uha.ensisa.ir.walther.milcityblue.core.commands.Command;
import fr.uha.ensisa.ir.walther.milcityblue.core.gridbuilders.RandomWalkGridBuilder;
import fr.uha.ensisa.ir.walther.milcityblue.core.players.AIPlayer;
import fr.uha.ensisa.ir.walther.milcityblue.core.players.LocalPlayer;
import fr.uha.ensisa.ir.walther.milcityblue.gui.CursorView;
import fr.uha.ensisa.ir.walther.milcityblue.gui.GameEngine;
import fr.uha.ensisa.ir.walther.milcityblue.gui.GridView;
import fr.uha.ensisa.ir.walther.milcityblue.gui.ImageDrawer;
import fr.uha.ensisa.ir.walther.milcityblue.gui.MenuView;
import fr.uha.ensisa.ir.walther.milcityblue.gui.MilCityModel;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.StringTokenizer;
import java.util.zip.CRC32;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.game.GameCanvas;

// Runs one scenario on the original's classes and reports the state after every tenth of a second of virtual time.
//
// It does what MilCityBlue.startSoloGame() and startGameEnd() do (the MIDlet itself needs a handset), with three differences that
// are only about the machine and not about the game: time is virtual (see Scheduler), the engine's thread is replaced by FrameEngine
// below (it is the same loop, but GameEngine.run() waits with Object.wait() when paused, which a cooperative scheduler cannot
// do), and the pictures are not loaded. GameEngine.paint(), the original's own, is what runs each frame: the model's Ai() with the
// keys, then MenuView, GridView and CursorView, in the order the MIDlet attaches them.
//
// What the person does is a list of actions, each at the start of a tenth of a second (a slot), at that exact virtual time and before
// the threads that are due at the same time: build, fire, shield (what MilCityModel.performSelectedAction() calls, without the
// cursor), and the key state of each slot (to change the view, which decides what the engine's paint changes).
//
// Scenario, on the input, one item per line:
//   mode <0..4>        0 to 3 the AI's level, 4 the training mode (no opponent)
//   water <percent>    maxScore <n>    money <n>      the options (Config)
//   seed <long>        where the seeds of every `new Random()` come from
//   slots <n>          the number of tenths of a second to run
//   keys <n integers>  the key state of each slot, as GameCanvas.getKeyStates() gives it
//   act <slot> build <buildingType> <x> <y>
//   act <slot> fire <weaponType> <x> <y> <targetPlayer>
//   act <slot> shield <x> <y>
//   act <slot> end     the person leaves the game (Game.stop())
//   dump <slot>        report the whole state at that slot, not only its checksum
// Report, one item per line:
//   S <slot> <checksum>     D <slot> <state>     END <slots> <seeds taken>
public final class Harness {
    private static final long BASE = Scheduler.BASE;
    private static final int FPS = 10;

    private Harness() { }

    // ---------------------------------------------------------------------------------------------------------------------
    // The engine
    // ---------------------------------------------------------------------------------------------------------------------
    static final class FrameEngine implements Engine, Runnable {
        private final GameEngine engine;
        private final Graphics graphics = new Graphics();
        boolean stopped = true, paused = false, parked = false;
        private VThread thread;

        FrameEngine(GameEngine engine) { this.engine = engine; }

        public void start() {
            if (stopped) {
                thread = new VThread(this);
                thread.start();
            }
        }

        public void stop() {
            if (!stopped) stopped = true;
        }

        public void pause() {
            if (!paused) paused = true;
        }

        public void resume() {
            if (paused) paused = false;
            if (parked) {                  // notifyAll()
                parked = false;
                VThread.unpark(thread);
            }
        }

        // GameEngine.run(), with the wait replaced by a park
        public void run() {
            stopped = false;
            while (!stopped) {
                try {
                    if (paused) {
                        parked = true;
                        VThread.park();
                    }
                    long interval = Scheduler.now();
                    engine.paint(graphics);
                    interval = Scheduler.now() - interval;
                    interval = ((1000 / FPS) - interval);
                    VThread.sleep(interval > 0 ? interval : 0x00);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            stopped = true;
        }
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // The state: the game's, in the terms the port also has (see tools/oracle-state.mjs, which writes the same text)
    // ---------------------------------------------------------------------------------------------------------------------
    private static Object field(Object o, String name) throws Exception {
        for (Class<?> c = o.getClass(); c != null; c = c.getSuperclass()) {
            try {
                Field f = c.getDeclaredField(name);
                f.setAccessible(true);
                return f.get(o);
            } catch (NoSuchFieldException e) {
                // look in the superclass
            }
        }
        throw new NoSuchFieldException(name);
    }

    private static long num(Object o) {
        if (o instanceof Boolean) return ((Boolean) o).booleanValue() ? 1 : 0;
        return ((Number) o).longValue();
    }

    private static long f(Object o, String name) throws Exception { return num(field(o, name)); }

    // A time held by the original as the clock's value, shown as milliseconds since the start (0 stays 0: "never")
    private static long rel(long t) { return t == 0 ? 0 : t - BASE; }

    private static String snapshot(Game game, MilCityModel model, GridView gridView, List<String> vibrations) throws Exception {
        StringBuilder b = new StringBuilder(8192);
        int status = game.getStatus();
        b.append("t ").append(Scheduler.now() - BASE).append('\n');
        b.append("G ").append(status == Game.STATUS_END || status == Game.STATUS_STOP ? 1 : 0).append(' ').append(game.getWinnerIndex()).append(' ')
            .append(game.getWinnerScore()).append('\n');
        for (int i = 0; i < game.getNumberOfPlayers(); i++) {
            PlayerAbstract p = (PlayerAbstract) game.getPlayerAt(i);
            boolean ai = p instanceof AIPlayer;
            b.append('P').append(i).append(' ').append(p.getMoney()).append(' ').append(p.getEnergy()).append(' ').append(p.getAccelerationFactor()).append(' ')
                .append(p.getScore()).append(' ').append(p.getAmmoMissiles()).append(' ').append(p.getAmmoMortars()).append(' ').append(p.getAmmoAirCrafts()).append(' ')
                .append(p.getAmmoNukes()).append(' ').append(p.getAmmoSpies()).append(' ').append(p.getAmmoShields()).append(' ')
                .append(rel(p.getCannotFireBefore())).append(' ').append(rel(p.getEnergyBellowZeroSince())).append(' ')
                .append(f(p, "energyBellowZero")).append(' ').append(f(p, "hasLoose")).append(' ').append(f(p, "hasWon")).append(' ')
                .append(p.getConstructedBuildings());
            if (ai) b.append(" A ").append(f(p, "turn"));
            b.append('\n');
            Grid grid = p.getGrid();
            b.append('C').append(i).append(' ');
            for (int y = 0; y < grid.getMaxY(); y++)
                for (int x = 0; x < grid.getMaxX(); x++) b.append(grid.getCell(x, y)).append(',');
            b.append('\n');
            // the shielded cells, in the order they were pushed: where, and until when
            List<String> shielded = new ArrayList<String>();
            CellsIterator si = new CellsIterator(grid.getShieldedCells());
            while (si.hasNext()) {
                Cell c = si.next();
                shielded.add(c.getX() + "," + c.getY() + "," + (f(c, "endTime") - BASE) + "," + c.getType());
            }
            b.append('H').append(i).append(' ').append(shielded.size());
            for (String t : shielded) b.append(' ').append(t);
            b.append('\n');
            // the buildings: kind, state, when made, when last updated (only where it means something: a building that produces
            // something), and one 0/1 for each of its cells, 1 if it has been hit
            List<String> buildings = new ArrayList<String>();
            BuildingsIterator bi = new BuildingsIterator(grid.getBuildings());
            while (bi.hasNext()) {
                Building bd = bi.next();
                StringBuilder one = new StringBuilder();
                boolean tracksUpdates = bd.getProductionTime() > 0 && bd.getType() != Building.BUILDING_POWERPLANT;
                one.append(bd.getType()).append(':').append(f(bd, "state")).append(':').append(bd.getCreatedOn() - BASE).append(':')
                    .append(tracksUpdates ? String.valueOf(bd.getUpdatedOn() - BASE) : "-").append(':');
                CellsIterator ci = new CellsIterator(bd.getCells());
                while (ci.hasNext()) {
                    Cell c = ci.next();
                    one.append(c.getX()).append(',').append(c.getY()).append(c.getType() >= Cell.CELL_BURNING ? 'x' : 'o').append(';');
                }
                buildings.add(one.toString());
            }
            b.append('B').append(i).append(' ').append(buildings.size());
            for (String t : buildings) b.append(' ').append(t);
            b.append('\n');
            // what the others know of this city
            byte[][] radar = p.getStatusGrid().getStatusGrid();
            b.append('R').append(i).append(' ');
            for (int y = 0; y < grid.getMaxY(); y++)
                for (int x = 0; x < grid.getMaxX(); x++) b.append(radar[x][y]).append(',');
            b.append('\n');
        }
        // the view that is drawn (the engine's paint changes the game differently in each) and the radar's count of tens
        b.append("V ").append(model.getModeSelected() < 0 ? 0 : 1).append(' ').append(f(gridView, "timer")).append('\n');
        // the handset's vibrations since the last report: when, and for how many milliseconds
        b.append('Q');
        for (String v : vibrations) b.append(' ').append(v);
        b.append('\n');
        vibrations.clear();
        return b.toString();
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // The scenario
    // ---------------------------------------------------------------------------------------------------------------------
    public static void run(InputStream input, PrintStream out) throws Exception {
        int mode = 0, water = 50, maxScore = 1000, money = 100, slots = 0;
        long seed = 1;
        int[] keys = new int[0];
        List<String[]> acts = new ArrayList<String[]>();
        Set<Integer> dumps = new HashSet<Integer>();
        BufferedReader in = new BufferedReader(new InputStreamReader(input, "ISO-8859-1"));
        for (String line = in.readLine(); line != null; line = in.readLine()) {
            StringTokenizer t = new StringTokenizer(line);
            if (!t.hasMoreTokens()) continue;
            String key = t.nextToken();
            if (key.equals("mode")) mode = Integer.parseInt(t.nextToken());
            else if (key.equals("water")) water = Integer.parseInt(t.nextToken());
            else if (key.equals("maxScore")) maxScore = Integer.parseInt(t.nextToken());
            else if (key.equals("money")) money = Integer.parseInt(t.nextToken());
            else if (key.equals("seed")) seed = Long.parseLong(t.nextToken());
            else if (key.equals("slots")) slots = Integer.parseInt(t.nextToken());
            else if (key.equals("keys")) {
                keys = new int[t.countTokens()];
                for (int i = 0; i < keys.length; i++) keys[i] = Integer.parseInt(t.nextToken());
            } else if (key.equals("act")) {
                String[] act = new String[t.countTokens()];
                for (int i = 0; i < act.length; i++) act[i] = t.nextToken();
                acts.add(act);
            } else if (key.equals("dump")) dumps.add(Integer.valueOf(t.nextToken()));
        }

        SeedSource.reset(seed);
        Config.DEFAULT_PERCENT_OF_WATER = water;
        Config.DEFAULT_SCORE_TO_WIN = maxScore;
        Config.DEFAULT_MONEY_AT_START = money;

        // MilCityBlue.startGameBegin()
        final Game game = new Game();
        final List<String> vibrations = new ArrayList<String>();
        game.setGameListener(new GameListener() {
            public void notifyGameEvent(Game sender, byte eventType, int arg) {
                if (eventType == GameListener.GAMEEVENT_VIBRATE) vibrations.add((Scheduler.now() - BASE) + ":" + arg);
            }
        });
        MilCityModel model = new MilCityModel(game, 0, 0, 240, 240, 8, new Size(2, 1));
        GameEngine gameEngine = new GameEngine(model, FPS);
        FrameEngine engine = new FrameEngine(gameEngine);
        game.setEngine(engine);

        // MilCityBlue.startSoloGame(mode)
        game.registerLocalPlayer(new LocalPlayer());
        GridBuilder gb = new RandomWalkGridBuilder();
        Grid grid = gb.build(Config.DEFAULT_GRID_SIZE_X, Config.DEFAULT_GRID_SIZE_Y, Config.DEFAULT_PERCENT_OF_WATER);
        game.getLocalPlayer().setPlayerIndex(game.getLocalPlayerIndex());
        game.getLocalPlayer().setGame(game);
        game.getLocalPlayer().setGrid(grid);
        if (mode <= AIPlayer.LEVEL_MADNESS) {
            AIPlayer aiPlayer = new AIPlayer((byte) mode);
            aiPlayer.setGame(game);
            aiPlayer.setPlayerIndex(game.registerRemotePlayer(aiPlayer));
            aiPlayer.setGrid(new Grid(Config.DEFAULT_GRID_SIZE_X, Config.DEFAULT_GRID_SIZE_Y, grid.getGrid()));
        }

        // MilCityBlue.startGameEnd()
        ImageDrawer imageDrawer = new ImageDrawer();
        MenuView menuView = new MenuView(game, model, "A", "B", "C", "D", imageDrawer);
        CursorView cursorView = new CursorView(model);
        GridView gridView = new GridView(8, imageDrawer, model);
        gameEngine.attach(menuView);
        gameEngine.attach(gridView);
        gameEngine.attach(cursorView);
        game.start();

        PlayerAbstract local = game.getLocalPlayer();
        for (int slot = 0; slot < slots; slot++) {
            long time = BASE + 100L * slot;
            Scheduler.runUntil(time - 1);          // everything due before this tenth of a second
            Scheduler.setNow(time);                // the person acts at this moment, before what is due at the same time
            for (String[] act : acts) {
                if (Integer.parseInt(act[0]) != slot) continue;
                String name = act[1];
                if (name.equals("build")) {
                    local.constructBuilding(Integer.parseInt(act[2]), Integer.parseInt(act[3]), Integer.parseInt(act[4]), Building.ANGLE_0);
                } else if (name.equals("fire")) {
                    int[] args = { Integer.parseInt(act[2]), Integer.parseInt(act[3]), Integer.parseInt(act[4]), Building.ANGLE_0 };
                    local.fireOnAnotherPlayer(new Command(game.getLocalPlayerIndex(), Integer.parseInt(act[5]), Command.COMMAND_FIRE, args));
                } else if (name.equals("shield")) {
                    int[] args = { fr.uha.ensisa.ir.walther.milcityblue.core.Weapon.WEAPON_SHIELD, Integer.parseInt(act[2]), Integer.parseInt(act[3]), Building.ANGLE_0 };
                    local.fire(new Command(game.getLocalPlayerIndex(), game.getLocalPlayerIndex(), Command.COMMAND_FIRE, args));
                } else if (name.equals("end")) {
                    game.stop();
                }
            }
            GameCanvas.scriptedKeys = slot < keys.length ? keys[slot] : 0;
            Scheduler.runUntil(time);
            String text = snapshot(game, model, gridView, vibrations);
            CRC32 crc = new CRC32();
            crc.update(text.getBytes("ISO-8859-1"));
            out.println("S " + slot + " " + String.format("%08x", crc.getValue()));
            if (dumps.contains(Integer.valueOf(slot))) out.println("D " + slot + " " + text.replace("\n", "|"));
        }
        out.println("END " + slots + " " + SeedSource.count());
        out.flush();
    }
}
