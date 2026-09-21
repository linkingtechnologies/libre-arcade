# Headless re-run of the original TAJJAVA classes

`OracleHarness.java` runs the original `tajjava.grid.GameSessionPanel` and `Square` classes from `../../reference/tajjava-v0.1/TAJJAVA.jar` without opening a window, and replays the 15 scenarios T01 to T15 of `../../test/fixtures/oracle_original_jar.txt`. It calls the real `Square.mouseClicked` and `GameSessionPanel.actionPerformed` handlers. It is declared in the package `tajjava.grid` only to reach the package-private fields (`grid`, `proposed`, `value`, `lastsq`, `plsq`, `gended`, `undobutton`). The JAR is not modified.

Needs a JDK (the output stored here was made with `javac` 21 targeting Java 8 and run on Java 1.8.0_503). From the game's root:

```sh
javac --release 8 -cp reference/tajjava-v0.1/TAJJAVA.jar -d tools/oracle/out tools/oracle/OracleHarness.java
java -Djava.awt.headless=true -cp "reference/tajjava-v0.1/TAJJAVA.jar:tools/oracle/out" tajjava.grid.OracleHarness test/fixtures/hamiltonian_witnesses.csv test/fixtures/blocked_path.csv
```

On Windows the classpath separator is `;` instead of `:`. The output is one line per scenario; `rerun-output.txt` is the stored result. It is compared with the audit log by `../../test/oracle-rerun.test.js`, which needs no Java. `tools/oracle/out/` is gitignored.
