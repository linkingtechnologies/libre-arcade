# -*- coding: utf-8 *-*
"""
board.py

The generic connect four board object. Encodes the rules of the connect four
game (i.e. checks for legal moves and for victory conditions). It also provides
a method for encoding board configurations with a unique ID.
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

import numpy as np


class Board(object):
    """
    The class defining a connect four board.
    """

    # Move states
    ILLEGAL_MOVE = -1
    VICTORY = 1
    LEGAL_MOVE = 0
    DRAW = 2

    # Player definitions and board states
    P1 = 1
    P2 = 2
    EMPTY = 0

    # Board dimensions
    NCOL = 7
    NROW = 6

    # A NROWxNCOL numpy array that acts as the board
    state = np.zeros((NROW, NCOL), dtype=int)
    curr_player = P1  # Which player has the next move.
    nmoves = 0  # How many moves have been played on this board instance
    # optionally store all board configurations as a list of board IDs
    state_record = []
    record = False  # Store the board configuration record?

    def __init__(self, record=False):
        """
        Initialize a Board instance.
        """

        self.state = np.zeros((self.NROW, self.NCOL), dtype=int)
        self.curr_player = self.P1
        self.nmoves = 0
        self.state_record = []
        self.record = record

        return

    def __repr__(self):
        """
        Print the board state to the screen as well as the next player to move.
        """

        print "Move number ", self.nmoves
        print ""
        head = "  "
        for i in range(self.NCOL):
            head = head + str(i + 1) + " "
        print head
        print ""
        print self.state
        print ""
        return "Next player to go: " + str(self.curr_player)

    def make_move(self, col):
        """
        Makes a move for the current player, updating the board, changing the
        current player, and checking whether the game is over. If the game ends
        the current player indicates the victor. An EMPTY player is set as the
        current player in case of a draw.

        Args:
            col: The column in which to add a piece.

        Returns:
            result: returns a move state indicating the result of the move
                VICTORY = The current player won with the move
                ILLEGAL_MOVE = The requested move is invalid
                LEGAL_MOVE = The requested move is valid, the board has been
                    updated and the current player changed.
                DRAW = The game has ended in a draw, no legal moves left.
        """

        moves = self.get_move_list()

        if len(moves) == 0:
            self.curr_player = self.EMPTY
            return self.DRAW
        elif moves.count(col) == 0:
            return self.ILLEGAL_MOVE

        self.state = self.get_new_board(col)

        self.nmoves += 1

        if self.record:
            self.state_record.append(self.get_board_id())

        if self._check_for_victory():
            return self.VICTORY
        else:
            if self.curr_player == self.P1:
                self.curr_player = self.P2
            else:
                self.curr_player = self.P1

            return self.LEGAL_MOVE

    def get_new_board(self, col, board=None):
        """
        Given a column for the current player to put a piece into, return a new
        board after having made the requested move.

        Args:
            col: An int for the column in which the current player should put
                a piece.
            board: A numpy array containing a board to update. If None, the
                current instance board is used.

        Returns:
            newboard: A numpy array with an updated board.
        """

        if board is None:
            board = np.array(self.state)

        if col >= self.NCOL or col < 0:
            raise Exception("Illegal move requested!")

        for row in range(self.NROW - 1, -1, -1):
            if board[row, col] == self.EMPTY:
                board[row, col] = self.curr_player
                break

        return board

    def get_move_list(self):
        """
        Return the list of valid moves given the current board state.

        Returns:
            moves: A list of ints, each being a column that can be played as
                a valid move by the current player.
        """
        moves = []

        for i in range(self.NCOL):
            if self._check_move(i):
                moves.append(i)

        return moves

    def get_board_id(self, board=None):
        """
        Obtain the unique board ID for the given board array. The board ID is
        the base-10 integer obtained by treating the flattened board as a
        numeral in base-3.

        Args:
            board: A numpy array with the board to convert to an ID. If None,
                the current board in the class instance is used.

        Returns:
            bid: The unique board ID.
        """

        if board is None:
            board = self.state

        fboard_list = board.flatten()
        fboard_string = ''
        for i in range(len(fboard_list)):
            fboard_string += str(int(fboard_list[i]))
        bid = int(fboard_string, base=3)

        return bid

    def get_board_from_id(self, bid):
        """
        Given a unique board ID, return the associated board array. The board
        ID is a base-10 number, that when converted to a base-3 number repro-
        duces the board configuration.

        Args:
            bid: The board ID to evaluate.

        Returns:
            board: A numpy array containing the associated board configuration.
        """

        # convert the decimal bid into a base 3 number, represented as a string
        flat_board_string = np.base_repr(bid, base=3)
        strlen = len(flat_board_string)
        fboard = np.zeros(self.NROW * self.NCOL, dtype=int)
        for i in range(strlen):
            fboard[i] = flat_board_string[strlen - 1 - i]

        board = np.reshape(np.flipud(fboard), (self.NROW, self.NCOL))

        return board

    def get_mirrored_board(self, board=None):
        """
        Obtain the mirrored board.

        Args:
            board: A numpy array with the board to mirror. If None
                the current board in the class instance is used.

        Returns:
            mboard: A numpy array containing the mirrored board
        """

        if board is None:
            board = self.state

        mboard = np.fliplr(board)

        return mboard

    def get_mirrored_board_id(self, board=None):
        """
        Obtain the unique ID for the mirrored board.

        Args:
            board: A numpy array with the board to mirror and then convert to
                an ID. If None the current board in the class instance is used.

        Returns:
            mbid: The mirrored board ID.
        """

        if board is None:
            board = self.state

        mboard = self.get_mirrored_board(board)
        mbid = self.get_board_id(mboard)

        return mbid

    def get_mirrored_board_from_id(self, bid):
        """
        Given a board ID, return the mirrored board.

        Args:
            bid: The board ID to convert.

        Returns:
            mboard: A numpy array containing the mirrored board.
        """

        board = self.get_board_from_id(bid)
        mboard = self.get_mirrored_board(board)

        return mboard

    def get_mirrored_id_from_id(self, bid):
        """
        Given a board ID, return the mirrored board.

        Args:
            bid: The board ID to convert.

        Returns:
            mboard: A numpy array containing the mirrored board.
        """

        mboard = self.get_mirrored_board_from_id(bid)
        mbid = self.get_board_id(mboard)

        return mbid

    def _check_move(self, col):
        """
        Checks whether a move is valid.

        Args:
            col: Column into which a piece should be played.

        Returns:
            result: Bool stating whether the move is valid or not.
        """

        if col >= self.NCOL:
            return False

        if self.state[0, col] == self.EMPTY:
            return True
        else:
            return False

    def _check_for_victory(self):
        """
        Check whether the current player has won with the given board
        configuration.

        Returns:
            result: Bool indicating victory or not.
        """

        cp = self.curr_player

        # check for vertical connections
        for i in range(self.NCOL):
            num = 0
            for j in range(self.NROW):
                if self.state[j, i] == cp:
                    num += 1
                else:
                    num = 0

                if num == 4:
                    return True

        # check for horizontal connections
        for i in range(self.NROW):
            num = 0
            for j in range(self.NCOL):
                if self.state[i, j] == cp:
                    num += 1
                else:
                    num = 0

                if num == 4:
                    return True

        # check diagonal connections
        # subtract 1 from col, but add to row to get to next diag entry
        sdiags = [(0, 3), (0, 4), (0, 5), (0, 6), (1, 6), (2, 6)]
        # add 1 to row and column to get to next diag entry
        adiags = [(0, 3), (0, 2), (0, 1), (0, 0), (1, 0), (2, 0)]

        for i in range(len(sdiags)):
            indx = sdiags[i]
            num = 0
            while indx[0] < self.NROW and indx[1] >= 0:
                if self.state[indx] == cp:
                    num += 1
                else:
                    num = 0

                if num == 4:
                    return True

                indx = (indx[0] + 1, indx[1] - 1)

        for i in range(len(adiags)):
            indx = adiags[i]
            num = 0
            while indx[0] < self.NROW and indx[1] < self.NCOL:
                if self.state[indx] == cp:
                    num += 1
                else:
                    num = 0

                if num == 4:
                    return True

                indx = (indx[0] + 1, indx[1] + 1)

        return False
