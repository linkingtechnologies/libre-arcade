#include <cstdio>
#include <cstdlib>
#include "oracle_trace.hpp"
int main() {
    hm_oracle_srand(1234, "test", 1);
    for (int i=0;i<16;++i) std::printf("%d\n", hm_oracle_rand("test", 2));
    return 0;
}
