# Marco Melilli Minimax — porting notes

## Preserved

- row-major 6×7 internal matrix;
- human `1` as maximizing side and CPU `2` as minimizing side;
- alpha-beta recursion and terminal thresholds;
- selectable depth 1–8, default 4;
- column scan from 0 through 6;
- first encountered move on equal score;
- score weights: four = 100000, three = 5, two = 1;
- exact historical counter-reset behaviour inside every four-cell window.

## Adapter-only changes

- converts the neutral ConnectLab position to the historical row-major matrix;
- maps the acting side to historical CPU `2` regardless of disc colour;
- runs synchronously rather than through the original Web Worker;
- reports node count without influencing search decisions;
- omits the EaselJS, Bootstrap, jQuery and Lodash interface.

The parity test executes the unmodified original scripts in an isolated Node VM and compares score, selected column and returned value with the port over four legal fixtures and depths 1–4.
