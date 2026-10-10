#!/usr/bin/env python

"""
fight.py

A script for pitting two computer opponents against one another.
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

import connectfour as c4
import board as B


def fight(p1, p2, ntrials):
    """
    A simple function for having the computer play itself a number of times and
    to record who wins.
    """

    p1wins = 0  # number of player 1 wins
    draws = 0  # number of draws
    counter = 0  # counts the total number of games

    sys.stdout.write("Progress (* = 10% complete)\n")
    sys.stdout.flush()

    for i in range(ntrials):

        if counter >= int(ntrials / 10.):
                sys.stdout.write("*")
                sys.stdout.flush()
                counter = 0

        # Turn off logging and text display
        result = c4.main(p1, p2, False, False)

        if result.curr_player == B.Board.P1:
            p1wins += 1
        elif result.curr_player == B.Board.EMPTY:
            draws += 1

        counter += 1

    sys.stdout.write("\n")
    sys.stdout.flush()

    print "Player 1 won " + str(p1wins) + " games of out of " + \
        str(ntrials - draws) + " decisions."


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print "Invalid number of arguments!"
        print "Usage: ./fight.py <p1> <p2> <ngames>"
        print "The players must be computer player types!"
        c4.print_player_types()
        sys.exit(0)

    ntrials = int(sys.argv[3])
    p1 = int(sys.argv[1])
    p2 = int(sys.argv[2])

    playertypes = c4.player_types.keys()
    if playertypes.count(p1) == 0 or playertypes.count(p2) == 0:
        print "Invalid player type!"
        c4.print_player_types()
        sys.exit(0)

    if p1 == c4.HUMAN or p2 == c4.HUMAN:
        print "Only computer players can be chosen."
        c4.print_player_types()
        sys.exit(0)

    fight(p1, p2, ntrials)
