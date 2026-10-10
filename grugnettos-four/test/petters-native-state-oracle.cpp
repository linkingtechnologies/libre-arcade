#include <iostream>
#include <vector>
#include "../reference/petters-mcts/original/games/connect_four.h"

void run(const std::vector<int>& moves) {
  ConnectFourState state;
  for (int move : moves) state.do_move(move);
  auto legal = state.get_moves();
  std::cout << "player " << state.player_to_move << " winner " << state.get_winner() << " moves";
  for (int move : legal) std::cout << " " << move;
  if (legal.empty()) std::cout << " result1 " << state.get_result(1) << " result2 " << state.get_result(2);
  std::cout << std::endl;
}

int main() {
  run({0,1,0,1,0,2});
  run({0,1,0,1,0,2,0});
  run({0,1,1,2,4,2,2,3,4,3,5,3,3});
}
