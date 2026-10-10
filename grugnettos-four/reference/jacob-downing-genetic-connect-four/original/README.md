# Genetic Connect Four
Implementation of genetic algorithms from [this paper](https://www.ijcai.org/Proceedings/89-1/Papers/122.pdf), with an evaluation algorithm from [this video](https://youtu.be/cUTMhmVh1qs?t=2872), used to train a neural network to play connect four.

## Motivation
This project was solely for my own curiosity in how these algorithms worked. I posted it here in case anyone wanted a look at one of the more simple implementations of genetic algorithms for neural network training.

## Installation
These scripts require numpy for the true arrays and matrix multiplication in the neural networks
```
pip install numpy
```
The module [graphics.py](https://mcsp.wartburg.edu/zelle/python/graphics.py) by John Zelle is used to visualize the connect four board when playing against an agent. The module must be in the module folder for the play.py script to run.

## Use
Train a randomly generated population of agents for 100 generations (100 generations is very low so will likely result in poor quality agents)
```
python train.py -v -g -o population.json 100
```

Play against the best agent from the trained population as the second player
```
python play.py population.json -p2
```

Command line help documentation is available for both scripts
```
python train.py --help
python play.py --help
```

## Possible Improvements
1. Parallelizing the league play would greatly improve training performance
    * This would be safe because games between agents have no bearing on the outcomes of any other games
2. Pooling neural network objects
    * Currently chromosomal crossover creates a new neural network object, this creates unnecessary garbage
3. Storing biases in separate matrices
    * The cost of appending a one to the output array of each layer in the feedforward of the neural network did not turn out to be worth the simplified implementation.

## Credits
[Training Feedforward Neural Networks Using Genetic Algorithms](https://www.ijcai.org/Proceedings/89-1/Papers/122.pdf) David J. Montana and Lawrence Davis

[DeepMind StarCraft II Demonstration](https://youtu.be/cUTMhmVh1qs) Oriol Vinyals, David Silver
