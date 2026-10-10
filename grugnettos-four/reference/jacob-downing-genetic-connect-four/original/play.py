#!/usr/bin/env python

"""
Connect Four Play

This script allows the user to compete in a connect four game with \
the winningest agent in a json file of agent representations from \
the train.py script

'Numpy' is required to be installed on the python environment\
 on which this script is running
 """

import argparse
import json
from modules import board, league
from modules import game as game_mod

def agent_choice(agent, game_board, current_player, game):
	return league.choose_move(agent, game_board, current_player)

def human_choice(agent, game_board, current_player, game):
	return board.get_move(len(game.board[0]))

def play(agent, human_first):
	board.setup()
	game = game_mod.Game()
	board.render(game.board)
	if human_first:
		players = {1:human_choice, -1:agent_choice}
	else:
		players = {1:agent_choice, -1:human_choice}

	while True:
		move = players[game.current_player](agent, game.board, game.current_player, game)
		if not game.can_place(move):
			board.show_winner(game.current_player*-1)
			human_choice(None,None,None,game)
			board.win.close()
			break
		won = game.check_win_with(move)
		board.render(game.board)
		if won:
			board.show_winner(game.current_player)
			human_choice(None,None,None,game)
			board.win.close()
			break

def main():
	parser = argparse.ArgumentParser(description=__doc__, 
		formatter_class=argparse.RawDescriptionHelpFormatter)
	parser.add_argument("file", type=str,
		help="The json file with the agents to compete against")
	player_choice = parser.add_mutually_exclusive_group()
	player_choice.add_argument("-p1", "--player1", action="store_true")
	player_choice.add_argument("-p2", "--player2", action="store_true")
	args = parser.parse_args()

	filename = args.file
	if not filename.lower().endswith(".json"):
		filename = filename + ".json"

	with open(filename, "r") as f:
		data = json.load(f)

	league.populate_from_export(data)
	league.play_season()

	agent = league.gather_top(n=1,nmax=1)[0]

	play(agent, not args.player2)

if __name__ == '__main__':
	main()