class Game(object):
	"""
	A class to keep track of a game of Connect-4 and determine a winner

	Class Constant
	--------------
	SEARCH_PAIRS: nested list of int
		denote search axis for checking for win

	Attributes
	----------
	board: nested list of int
		represents the connect four board 0 represents no piece 
		player one's pieces are represented by 1 and player two's by -1

	current_player: int
		represents the player who will take the next turn. 1 for
		player one and -1 for player 2

	Methods
	-------
	can_place(move): boolean
		returns whether a piece can be placed in the given column

	check_win_with(move): boolean
		places the current player's piece with the given move and
		returns if that player won the game.
	"""
	SEARCH_PAIRS = [[-1,0],[-1,1],[0,1],[1,1]] #search axis

	def __init__(self):
		super(Game, self).__init__()
		self.board = [
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0]
			]
		self.current_player = 1

	def can_place(self, move):
		"""
		returns whether a piece can be placed in the given column

		Parameters
		----------
		move: int 
			where the piece would be placed 
			0 being the left most column of the board

		Returns
		-------
		boolean
			whether a piece can be place in the given column
		"""
		return self.board[0][move] == 0

	def check_win_with(self, move): 
		"""
		places the current player's piece with the given move and
		returns if that player won the game. 

		If false is returned the current player is swapped

		Parameters
		----------
		move: int
			where the piece is dropped
			0 being the left most column of the board

		Returns
		-------
		boolean
			whether the move given won the game for the current player
		"""
		row, col = self._piece_fall(0,move)
		self.board[row][col] = self.current_player
		
		for pair in Game.SEARCH_PAIRS:
			#recursively count pieces in a row in opposite directions
			#starting on the last played piece
			in_a_row = self._count_in_direction(0, pair[0], pair[1], self.current_player, row, col)\
			+ self._count_in_direction(0, pair[0]*-1, pair[1]*-1, self.current_player, row, col)\
			- 1
			if in_a_row >= 4:
				return True

		self.current_player *= -1
		return False

	#recursively finds where a piece would land given a column
	def _piece_fall(self,row,col):
		if not( ( 0 <= row < len(self.board) ) and ( 0 <= col < len(self.board[0]) ) ):
			return row-1, col
		if self.board[row][col] == 0:
			return self._piece_fall(row+1,col)
		return row-1, col

	#recursively totals the pieces in a row given a starting spot and direction
	def _count_in_direction(self, count, drow, dcol, player, row, col):
		if not( ( 0 <= row < len(self.board) ) and ( 0 <= col < len(self.board[0]) ) ):
			return count
		if self.board[row][col] == player:
			return self._count_in_direction(count+1, drow, dcol, player, row+drow, col+dcol)
		return count		