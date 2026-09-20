#include <cstdio>
#include <cstdlib>
int main() {
    std::srand(1234);
    for (int i=0;i<16;++i) std::printf("%d\n", std::rand());
    return 0;
}
