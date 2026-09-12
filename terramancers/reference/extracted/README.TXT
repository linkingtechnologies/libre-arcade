=============
Terramancers
=============

A real-time action-reversi game, straight from the Liberated Pixel Cup.

Written by Shai Shapira. For more details see the following:

 - Game website: http://shaishapira.com/terramancers
 - Source repository: https://svn.code.sf.net/p/vakhoarena/code/trunk/dev

Building and running
--------------------

The game is written in pure Java. To build, simply compile all .java files with
a Java 6 compiler. Eclipse project files are included in the distribution.

to run the game, simply run the JAR file - "java -jar Terramancers.jar" from the
directory it's in. On some systems, double-clicking the file with suffice.
Requires JRE 6 or later.

Playing
-----------

The game is based on the famous Reversi game - you must take control of a majority of the board. Your character flips tiles by walking on them, and every time you flip a tile which has a line connecting it to another of your tiles with no obstacles in between, all other tiles in between also become yours.
On single player mode, trees will regularly create opposing tiles, and you'll have to hurry up and take control of strategic parts of the board to win. On multiplayer mode you directly face your opponent in a symmetric arena.

Controls: Arrow keys (player 1), WASD (player 2).