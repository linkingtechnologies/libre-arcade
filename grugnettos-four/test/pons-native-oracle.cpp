#include <iostream>
#include <string>
#include "../reference/pascal-pons-connect4/original/Position.hpp"
#include "../reference/pascal-pons-connect4/original/Solver.hpp"

using GameSolver::Connect4::Position;
using GameSolver::Connect4::Solver;

int main() {
  std::string sequence;
  while (std::cin >> sequence) {
    Position position;
    const auto played = position.play(sequence);
    if (played != sequence.size()) { std::cout << "INVALID\n"; continue; }
    Solver solver;
    const auto scores = solver.analyze(position, false);
    std::cout << position.nbMoves() << ' ' << position.key() << ' ' << position.canWinNext();
    for (int column = 0; column < Position::WIDTH; ++column)
      std::cout << ' ' << position.canPlay(column) << ':' << position.isWinningMove(column) << ':' << scores[column];
    std::cout << ' ' << solver.getNodeCount() << '\n';
  }
}
