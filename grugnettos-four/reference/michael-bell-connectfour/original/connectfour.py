#!/usr/bin/env python

"""
connectfour.py

The connect four gameplay application.
"""

"""
Copyright 2012 Michael Bell

This file is part of connectfour.

connectfour is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

connectfour is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with connectfour.  If not, see <http://www.gnu.org/licenses/>.
"""

import sys

from board import Board
import c4bot

# Player types
HUMAN = 0  # A Human player
RANDOM = 1  # A computer opponent that makes random moves.
BOTA = 2  # A dumb computer opponent, but it should be better than Random

player_types = {HUMAN: c4bot.Human, RANDOM: c4bot.Random, BOTA: c4bot.BotA}


def main(p1, p2, record=False, verbose=True):
    """
    The main game loop.

    Args:
        p1: An int indicating what kind of player 1 is.
        p2: Same as p1, but for player 2.
        record: A boolean indicating whether moves should be recorded and
            returned. [False]

    Returns:
        board: The game board instance.
    """

    b = Board(record)
    players = []
    players.append(player_types[p1](1))
    players.append(player_types[p2](2))

    while True:
        if verbose:
            print b
        move = players[b.curr_player - 1].move(b)
        if move < 0:
            if verbose:
                print "Thanks for playing!"
            break

        result = b.make_move(move)

        if result == b.VICTORY:
            if verbose:
                print ""
                print "-----------------------------------------"
                print ""
                print b
                print "Player " + str(b.curr_player) + " wins!"
                print ""
            break
        elif result == b.DRAW:
            if verbose:
                print "The game has ended in a draw."
            break
        elif result == b.ILLEGAL_MOVE:
            print "Illegal move, try again."

        if verbose:
            print ""
            print "-----------------------------------------"
            print ""

    return b


def print_player_types():
    """
    Prints the valid player types to the screen.
    """
    print ""
    print "Player types:"
    print "    0: Human player"
    print "    1: Random computer player"
    print "    2: BotA computer player"


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print "Please indicate the players."
        print "Usage: connectfour.py <p1> <p2>"
        print_player_types()
        sys.exit(0)
    p1 = int(sys.argv[1])
    p2 = int(sys.argv[2])

    playertypes = player_types.keys()

    if playertypes.count(p1) == 0 or playertypes.count(p2) == 0:
        print "Invalid player type!"
        print_player_types()
        sys.exit(0)

    main(p1, p2)
