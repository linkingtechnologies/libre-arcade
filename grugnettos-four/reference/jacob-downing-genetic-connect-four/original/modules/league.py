"""
Manages population of agents

organizes competition between the agents and keeps record
prunes under performing agents and refills with corssover and mutation

Constants
---------
POP_SIZE: int
	size of population

NET_STRUCT: tupple of ints
	number of nodes in the input and then each layer of the 

SURVIVE_MIN, SURVIVE_MAX: int
	min and max parents that survive to reproduce each generation

MUTATED_NODES: int
	number of nodes mutated on each child

Globals
-------
population: list of SimpleGenNeuralNet

standings: list of lists with 2 ints 
	wins and losses of the record corresponding 
	SimpleGenNeuralNet in population

Funcitons
---------
generate_pop()
	fills population list with random initial population

export()
	returns a respresentation of the population in python lists

populate_from_export(export)
	rebuilds population from an export

play_game(agent1, agent2)
	plays a game of connect four between two agents

choose_move(agent,board,player)
	returns the agent's most confident move given the board

play_season()
	each agent plays each other agent twice

print_standings()
	prints the win/loss records of each agent

gather_top(n=SURVIVE_MIN, nmax=SURVIVE_MAX)
	returns a number between n and nmax of agents with the most wins

repop_from(parents)
	refills the population to POP_SIZE from genetic algorithms performed on parents
"""

from random import sample
import numpy as np
from .game import Game
from .simple_gen_neural_net import SimpleGenNeuralNet

POP_SIZE = 50
SURVIVE_MIN = 5
SURVIVE_MAX = 10
NET_STRUCT = (42,25,7)
MUTATED_NODES = 2

population=[]
standings=[] #[wins, losses]

def populate_from_export(export):
	"""
	returns a respresentation of the population in python lists
	"""
	global population
	global standings
	population = [SimpleGenNeuralNet.from_export(agent) for agent in export]
	standings = [[0,0] for agent in export]

def export():
	"""
	rebuilds population from an export
	"""
	return [agent.export() for agent in population]

def generate_pop():
	"""
	fills population list with random initial population

	values of the nodes wieghts and biases are in the interval [0.0, 1.0)
	"""
	for i in range(1,POP_SIZE+1):
		population.append(SimpleGenNeuralNet.from_random(*NET_STRUCT))
		standings.append([0,0])

def play_game(agent1, agent2):
	"""
	plays a game of connect four between two agents

	Prameters
	---------
	agent1, agent2: SimpleGenNeuralNet
		players of the game
		agent1 goes first

	Returns
	-------
	int
		1 if agent 1 won the game, -1 for agent 2
	"""
	game=Game()
	agents = {1:agent1, -1:agent2}
	move = choose_move(agents[game.current_player],\
	game.board, game.current_player)
	while game.can_place(move) and (not game.check_win_with(move)):
		move = choose_move(agents[game.current_player],\
		game.board, game.current_player)

	if not game.can_place(move):
		game.current_player *= -1

	return game.current_player

def choose_move(agent, board, player):
	"""
	returns the agent's most confident move given the board
	
	Parameters
	----------
	agent: SimpleGenNeuralNet
		agent making the decision

	board: list of lists of int
		a matrix of lists representing the board
		agent's pieces are represented by 1s
		opponenets pieces are represented by -1s
		open slots are represented by 0s

	player: int
		represents what player the agent is. 1 for first, -1 for second
	"""
	input_nodes = np.array(board).flatten()*player
	output_nodes = agent.feed_forward(input_nodes)
	return np.argmax(output_nodes)

def play_season():
	"""
	each agent plays each other agent twice

	updates standings
	"""
	for first_player, first_record in zip(population, standings):
		for second_player, second_record in zip(population, standings):
			if first_player != second_player:
				if play_game(first_player, second_player) == 1 :
					first_record[0] += 1
					second_record[1] += 1
				else:
					first_record[1] += 1
					second_record[0] += 1

def print_standings():
	"""
	prints the win/loss records of each agent
	"""
	for record in standings:
		print(record)

def _wins(item):
	return item[1][0]

def gather_top(n=SURVIVE_MIN, nmax=SURVIVE_MAX):
	"""
	returns a number between n and nmax of agents with the most wins

	any agents added after n number are because they are tied in fitness
	with it's predecessor

	Parameters
	----------
	n: int, optional
		the minimum number of top agents returned(defaults to SURVIVE_MIN)
	nmax: int, optional
		the maximum number of top agents returned(defaults to SURVIVE_MAX)
	"""
	ordered = list(zip(population, standings))
	ordered_itt = iter(ordered)
	ordered.sort(key = _wins, reverse = True)
	top = []
	index = 1
	indexed = next(ordered_itt)
	#loop until we have n number of agents in pop, add extra if there are ties
	#all the while never going over nmax
	while index <= nmax and (index<n+1 or _wins(top[-1]) == _wins(indexed)):
		top.append(indexed)
		indexed = next(ordered_itt)
		index += 1

	return [i[0] for i in top]
		
def repop_from(parents):
	"""
	refills the population to POP_SIZE from genetic algorithms performed on parents


	Two parants are chosen at random to crossover and then the child is mutated
	Parameters
	----------
	parents : list of SimpleGenNeuralNet
	the agents used to repopulate.
	Should be length less than POP_SIZE
	
	"""
	global population 
	global standings
	population = parents.copy()
	standings = [[0,0] for i in range(1, POP_SIZE + 1)]
	for x in range(len(parents), POP_SIZE):
		parent_sample = sample(parents, 2)
		population.append(SimpleGenNeuralNet.crossover(*parent_sample)\
			.mutate(MUTATED_NODES))