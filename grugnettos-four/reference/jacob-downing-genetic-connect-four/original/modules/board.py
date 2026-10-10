"""
Displays a connect four board

Functions
---------
setup()
	prepares window for rendering

render(board)
	renders the board state on the window

get_move(columns)
	Waits for mouse input and returns the column that was clicked

show_winner(player)
	displays text for a winner of the game


This module can run as a script to play a two player game of connect four
"""

from math import trunc
if __name__ != "__main__" : 
	from . import graphics

win = None
colour_for_player = {
				0:"black",
				1:"yellow",
				-1: "red"
				}

def setup():
	"""
	prepares window for rendering
	"""
	global win
	win = graphics.GraphWin("Connect Four", 1001, 858)
	win.setBackground("blue")

def render(board):
	"""
	renders the board state on the window
	
	Parameters
	----------
	board: list of lists of ints
		matrix that represents the boardstate
		1 represents a yellow piece, -1 for a red
	"""
	slot_size = min(win.getWidth()/len(board[0]), win.getHeight()/len(board))
	slot_point = graphics.Point(-slot_size/2, -slot_size/2)
	for row in board:
		slot_point.move(0, slot_size)
		for slot in row:
			slot_point.move(slot_size, 0)
			slot_circle = graphics.Circle(slot_point, slot_size/2 - 2)
			slot_circle.setFill(colour_for_player[slot])
			slot_circle.draw(win)
		slot_point.move(-slot_size/2 - slot_point.getX(),0)

def get_move(columns):
	"""
	Waits for mouse input and returns the column that was clicked

	Parameters
	----------
	columns: int
		number of columns on the board

	Returns
	-------
	int
	column number that was clicked on, 0 on the left side
	"""
	click = win.getMouse()
	return trunc(click.getX()/(win.getWidth()/columns));


def show_winner(player):
	"""
	displays text for a winner of the game

	Parameters
	----------
	player: int
		represents the player that won, 1 for yellow player, -1 for red
	"""
	ann_point = graphics.Point(win.getWidth()/2.0, win.getHeight()/2.0)
	announcement = graphics.Text(ann_point, "%s Player wins!" %colour_for_player[player].capitalize())
	announcement.setSize(36)
	announcement.setFill("white")

	announcement.draw(win)


#if run as script plays a two player game
if __name__ == "__main__" : 
	import graphics
	from game import Game
	game = Game()
	setup()
	render(game.board)
	while True:
		move = get_move(len(game.board[0]))
		if not game.can_place(move):
			show_winner(game.current_player*-1)
			win.getMouse()
			win.close()
			break
		won = game.check_win_with(move)
		render(game.board)
		if won:
			show_winner(game.current_player)
			win.getMouse()
			win.close()
			break