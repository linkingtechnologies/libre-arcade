#define main stratzilla_original_main
#include "../reference/stratzilla-connect-four/original/source.cpp"
#undef main

void load(const int values[6][7], unsigned int moveCount) {
  for (unsigned int r=0; r<6; r++) for (unsigned int c=0; c<7; c++) board[r][c]=values[r][c];
  turns=moveCount;
}

int main() {
  const int fixtures[4][6][7] = {
    {{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0}},
    {{1,1,1,0,2,2,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0}},
    {{1,2,1,2,0,0,0},{0,1,1,2,0,0,0},{0,0,2,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0}},
    {{0,1,2,2,0,0,0},{0,0,1,2,0,0,0},{0,0,0,1,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0},{0,0,0,0,0,0,0}}
  };
  const unsigned int counts[4]={0,6,7,6};
  for(int f=0;f<4;f++) {
    load(fixtures[f],counts[f]);
    cout << f << " score " << tabScore(board,COMPUTER) << " win1 " << winningMove(board,PLAYER) << " win2 " << winningMove(board,COMPUTER) << endl;
    for(unsigned int d=1;d<=5;d++) { auto m=miniMax(board,d,0-INT_MAX,INT_MAX,COMPUTER); cout << f << " depth " << d << " value " << m[0] << " column " << m[1] << endl; }
  }
}
