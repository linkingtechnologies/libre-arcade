A simple connect four game written in Python. There is no fancy GUI, 
just a CLI interface. This is more of a connect four library, really, 
although there is an executable application with which one can play 
human v. human, human v. computer, or computer v. computer matches.

Run 

    > ./connectfour.py

to get a help message indicating how to run the game.

The motivation for this project was to create a sandbox for writing 
machine learning algorithms to try to make a robust AI opponent. Write 
your own AI modules and test them against one another, or against 
yourself. Connect four is a simple game, so it seemed like a reasonable 
thing to play around with.

This software is released under
[GPLv3](http://www.gnu.org/licenses/gpl.html).

Dependencies
------------

Just Python and Numpy.

File Description
----------------

`connectfour.py` - The connect four game. Provides a function call so 
you can run the game from your own application (e.g. you want to write a 
script to have the computer play itself a bunch of times) or run from 
the command line to use as an application for playing PvP.

`board.py` - Contains the Board class, which is the basic object for 
connect four gameplay. This object encodes the rules for connect four, 
and stores the current game state. It also contains methods for dealing 
with unique integer IDs describing the current game state. Convert 
between a board array object or its associated ID, which might be more 
useful for e.g. storing in a database.

`c4bot.py` - Connect four player objects. This includes AI players and 
human players. The basic human player just asks for input from the 
command line as of now. A C4Bot object just knows what player it is, and 
contains the logic for making a move given a board object. Make a child 
of C4Bot if you want to write your own AI opponent.

`init_db.py` - Initializes an SQLite database for storing information 
about board configurations.

`trainer.py` - A script for having the computer play itself and "learn" 
a good strategy. Feeds the database setup by `init_db.py`.

`fight.py` - A script to have the computer play itself a bunch of times 
and report how many times player 1 was victorious.
