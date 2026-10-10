#!/usr/bin/env python

"""
Connect Four Trainer

This script allows the user to train a population of agents to play connect four

'Numpy' is required to be installed on the python environment\
 on which this script is running 
 """

import argparse
import json
from modules import league

def main():
	parser = argparse.ArgumentParser(description=__doc__, 
		formatter_class=argparse.RawDescriptionHelpFormatter)
	parser.add_argument("generations", type=int,
		help="Number of generations for the genetic algorithm to run")
	parser.add_argument("-v", "--verbose", action="store_true")
	parser.add_argument("-o", "--output", type=str,
		help="Outputs a json representation of the population to a file")
	initial_pop = parser.add_mutually_exclusive_group()
	initial_pop.add_argument("-g", "--generate", action="store_true",
		help="Generates a random initial population")
	initial_pop.add_argument("-f", "--file", type=str,
		help="Start with a previous population from an output file")

	args = parser.parse_args()

	if args.file != None and args.output == None:
		print("This will overwrite your input file with the new")
		confirmation = input("type \"Y\" to confirm: ")
		if confirmation != "Y" and confirmation != "Yes":
			return

	if args.file == None:
		league.generate_pop()
	else:
		filename = args.file
		if not filename.lower().endswith(".json"):
			filename = filename + ".json"

		with open(filename, "r") as f:
			data = json.load(f)
		
		league.populate_from_export(data)


	league.play_season()
	for x in range(1, args.generations + 1):
		if args.verbose:
			print("Generation :", x)
		league.repop_from(league.gather_top())
		league.play_season()

	if args.output == None and args.file == None:
		league.print_standings()
	else:
		#take output if there is one, if not take file
		filename = next(name for name in \
			(args.output, args.file) if name != None)

		if not filename.lower().endswith(".json"):
			filename = filename + ".json"

		with open(filename, "w") as f:
			json.dump(league.export(), f)



if __name__ == '__main__':
	main()
