/* Port of Jacob Downing's 2019 genetically trained feed-forward network. Original: MIT. */
import { downingGeneticMetadata, downingGeneticWeights } from './jacob-downing-genetic-weights.js';

const WIDTH = 7;
const HEIGHT = 6;

function relu(value) { return Math.max(value, 0); }

function layer(input, weights) {
  const withBias = [...input, 1];
  return weights.map((row) => relu(row.reduce((sum, weight, index) => sum + weight * withBias[index], 0)));
}

function feedForward(input) {
  let output = input;
  for (const weights of downingGeneticWeights) output = layer(output, weights);
  const exponentials = output.map(Math.exp);
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / denominator);
}

function encode(board, player) {
  const factor = player === 1 ? 1 : -1;
  const input = [];
  for (let row = 0; row < HEIGHT; row += 1) {
    for (let column = 0; column < WIDTH; column += 1) {
      const cell = board[column][row];
      input.push(cell === 0 ? 0 : (cell === 1 ? 1 : -1) * factor);
    }
  }
  return input;
}

function choose(board, player) {
  const scores = feedForward(encode(board, player));
  const ranked = scores.map((score, column) => ({ column, score })).sort((a, b) => b.score - a.score || a.column - b.column);
  const historical = ranked[0].column;
  const selected = ranked.find(({ column }) => board[column][0] === 0);
  return { column: selected?.column ?? -1, value: selected?.score ?? 0, historical, adapterFallback: selected?.column !== historical, scores };
}

export const jacobDowningGeneticPlayer = {
  id: 'jacob-downing-genetic-nn',
  name: 'Jacob Downing Genetic NN',
  source: 'jacobjdowning/genetic-connect-four, commit 0b0f78f; reproducible 100-generation snapshot',
  license: 'MIT',
  family: 'genetic-algorithm-neural-network',
  settings: { key: 'generations', label: 'Generations', values: [100], default: 100 },
  capabilities: { deterministic: true, supportsSeed: false, supportsDifficulty: false, reportsNodes: false, learnedWeights: true },
  create(options = {}) {
    const generations = Number(options.generations ?? 100);
    if (generations !== 100) throw new RangeError('Only the preserved 100-generation snapshot is available');
    return {
      id: 'jacob-downing-genetic-g100',
      reset() {},
      chooseMove(position) {
        const result = choose(position.board, position.player);
        return { column: result.column, value: result.value, historicalColumn: result.historical, adapterFallback: result.adapterFallback, generations };
      },
    };
  },
};

export const _test = { encode, feedForward, choose, metadata: downingGeneticMetadata, weights: downingGeneticWeights };
