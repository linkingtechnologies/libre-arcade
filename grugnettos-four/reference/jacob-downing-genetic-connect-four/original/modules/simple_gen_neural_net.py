import numpy as np

class SimpleGenNeuralNet(object):
	"""
	A class to represent a simple feed forward neural netowrk that is 
	activated by ReLU at each layer and has softmax applied to each of
	it's output nodes

	Also includes methods to implement Genetic learning algorithms

	Attributes
	----------
	layer_weights: list of numpy arrays
		Each numpy array is a matrix representing the weigths and biases
		of one layer

	Class Methods
	-------------
	from_random(*num_nodes): SimpleGenNeuralNet
		Creates a new neural network with random weights and biases

	copy(network): SimpleGenNeuralNet
		Creates a deep copy of the given network

	from_export(export): SimpleGenNeuralNet
		Creates a new neural network from an export

	crossover(parent1, parent2): SimpleGenNeuralNet
		Creates a child neural network from two parents using
		node wise crossover

	Methods
	-------
	export(): list
		Exports the neural network as a list for serialization

	feed_forward(): narray
		Calculates output of the neural network

	mutate(n)
		Mutates n number of nodes

	Static Methods
	--------------
	relu(vector): narray
		Applies the rectifier to the given vector
	
	softmax(vector): narray
		Applies softmax normalization to the vector

	"""
	def __init__(self, *layer_weights):
		"""
		Parameters
		----------
		layer_weights - variable: narray
			2 axis narray that represents the weights and biases
			of the neural network
			The neural network will be an n layer network where
			n is the number of arguments given for this parameter.

		Raises
		------
		Exception
			If only one layer weight is given becuase the neural network
			needs at least one hidden and one output layer

		Exception
			If any layer - other than the last's - number of columns
			are not equall to the number of the next layer's rows + 1
		"""
		super(SimpleGenNeuralNet, self).__init__()

		weights_itt = iter(layer_weights)
		first = next(weights_itt)
		last_output_length = first[:,0].size
		self.layer_weights = [first]

		for matrix in weights_itt:
			if len(matrix[0,:]) == last_output_length + 1:
				last_output_length = len(matrix[:,0])
				self.layer_weights.append(matrix)
			else:
				raise Exception('weight matrices do not have valid dimensions to describe a neural network')

		if len(self.layer_weights) < 2:
			raise Exception('SimpleGenNeuralNet must recieve at least 2 arguments (layers). only {} was given'.format(self.layer_weights.size))

	def __repr__(self):
		output = "Neural Net {"
		for layer in self.layer_weights:
			output += "\n"
			output += layer.__repr__()

		return output + "}\n"

	@classmethod
	def copy(cls, network):
		"""
		Creates a deep copy of the given network

		Parameters
		----------
		network: SimpleGenNeuralNet
			network to copy

		Returns
		-------
		SimpleGenNeuralNet
			mutable deep copy of given network
		"""
		return cls(*[np.copy(matrix) for matrix in network.layer_weights])

	@classmethod
	def from_random(cls, *num_nodes):
		"""
		Creates a new neural network with random weights and biases

		All random values are in the interval [0.0, 1.0)

		Parameters
		----------
		num_nodes - variable: int
			number of nodes at input and then every layer afterwards
			created neural network will be an n-1 layer network where
			n is the number of num_nodes arguments given

		Returns
		-------
		SimpleGenNeuralNet

		Raises
		------
		Exception
			If only 2 or less arguments are given.
			The network needs one input, one output and at least one
			hidden layer
		"""
		nodes_itt = iter(num_nodes)
		size_of_last_layer=next(nodes_itt)
		count = 1
		layer_weights = []
		for size in nodes_itt:
			count += 1
			layer_weights.append(np.random.rand(size, size_of_last_layer+1))
			size_of_last_layer=size

		if count < 3:
			raise Exception('from_random should recieve at least 3 arguments. {} were given'.format(count))

		return cls(*layer_weights)

	@classmethod
	def from_export(cls,export):
		"""
		creates a new neural network from an export

		Parameters
		----------
		export: list
			the export list from the export method

		Returns
		-------
		SimpleGenNeuralNet
		"""
		return cls(*[np.array(matrix, dtype=np.float64) for matrix in export])

	def export(self):
		"""
		Exports the neural network as a list for serialization

		Returns
		-------
		list
			can be given to from_export class method to recreate
		"""
		return [matrix.tolist() for matrix in self.layer_weights]

	@staticmethod
	def relu(vector):
		"""
		Applies the rectifier to the given vector
		"""
		return np.maximum(vector, 0, vector)

	@staticmethod
	def softmax(vector):
		"""
		Applies softmax normalization to the vector
		"""
		np.exp(vector, vector)
		denominator = np.sum(vector)
		return vector/denominator

	def feed_forward(self, x):
		"""
		Calculates output of the neural network
		
		a fully connected neural network that is activated at each
		layer by ReLU and with softmax applied to the output nodes
		is assumed

		Parameters
		----------
		x: narray
			Input nodes

		Returns
		-------
		narray
			Output nodes

		Raises
		------
		Exception
			If the input nodes given do not match the columns of the first
			weight array.

		"""
		first=self.layer_weights[0]
		if len(x) + 1 != first[0,:].size:
			raise Exception("input is not the required number of nodes, {} is required and {} were given".format(first[0,:].size - 1, len(x)))

		product = np.array(x).reshape(len(x),1)
		for layer_weight in self.layer_weights:
			product = np.append(product, [[1]], axis=0)
			product = layer_weight @ product
			product = self.relu(product)

		return self.softmax(product)

	def mutate(self, n):
		"""
		Mutates n number of nodes

		Nodes are picked randomly and are mutated by adding 
		random numbers to them from the interval [-1.0, 1.0)

		Parameters
		----------
		n: int
			number of nodes to mutate

		Returns
		-------
		self
		"""
		total_nodes = 0
		for layer in self.layer_weights:
			total_nodes+=np.size(layer,0)

		for times in range(1,n+1):
			overall_index = np.random.randint(total_nodes)
			for layer in self.layer_weights:
				if overall_index < np.size(layer,0):
					layer[overall_index,:] += np.random.random_sample((np.size(layer,1),))*2.0-1.0
					break
				else:
					overall_index -= np.size(layer,0)

		return self

	@classmethod
	def crossover(cls, parent1, parent2):
		"""
		Creates a child neural network from two parents using
		node wise crossover

		Child nodes are chosen from corresponding nodes from one of
		the parents at random

		Parameters
		----------
		parent1, parent2: SimpleGenNeuralNet
			Parent neural networks used to create child

		Returns
		-------
		SimpleGenNeuralNet
			Child network
		"""
		if len(parent1.layer_weights) != len(parent2.layer_weights):
			raise Exception("Parent networks must have the same structure. Parent one has {} layers. Parent two has {} layers".format(len(parent1.layer_weights), len(parent2.layer_weights)))
		
		child = []
		for layer1, layer2 in zip(parent1.layer_weights, parent2.layer_weights):
			if np.shape(layer1) != np.shape(layer2):
				raise Exception("Both Parents must have exactly the same sturcture. Parent one has a layer with shape {}, the corresponding layer on the second parent has shape{}".format(np.shape(layer1), np.shape(layer2)))

			child_layer = []
			for row_from_1, row_from_2 in zip(list(layer1), list(layer2)):
				if np.random.random_sample() > 0.5:
					child_layer.append(row_from_1)
				else:
					child_layer.append(row_from_2)

			child.append(np.vstack(child_layer))
		return cls(*child)