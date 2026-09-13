# Source evidence index

Paths below refer to files inside the extracted OS4 1.0final archive. The original archive itself is preserved under `/reference/os4depot/`.

- GPL-2.0-or-later grant: `src/Bubble.cpp:3-19` (representative; 93 files match).
- Third-party list exception: `src/List.h:1-5`.
- 25 FPS loop: `src/BubbleTrainWorld.h:44-50`; frame lock `BubbleTrainWorld.cpp:201-208`.
- RNG seed: `src/BubbleTrainWorld.cpp:30`.
- Bubble radius/diameter: `src/Bubble.h:37-38`.
- Straight projectile movement/no wall bounce: `src/Bullet.cpp:45-59`; screen removal `Level.cpp:126-137`.
- Spawn after 30 px start clearance: `src/TrainStation.cpp:117-130`; `src/Train.cpp:150-158`.
- Ripple/gap propagation: `src/Train.cpp:247-294`.
- Insertion split 15+15: `src/Train.cpp:296-344`.
- Match 3 + touching: `src/Train.cpp:190-243`; touch <=31 `Train.cpp:346-353`.
- Bomb radius 60: `src/Train.h:38-39`; `src/Train.cpp:399-420`.
- Colour bomb: `src/Train.cpp:422-442`.
- Driving-segment speed effects: `src/Train.cpp:451-493`.
- Speed/rainbow behavior: `src/Bubble.cpp:34-57`, `122-157`.
- Track end/start state: `src/Track.cpp:133-199`.
- Arc movement: `src/TrackArc.cpp:204-263`.
- Spiral movement/radius formula: `src/TrackSpiral.cpp:202-262`, `431-434`.
- Win/loss checks: `src/Level.cpp:149-170`.
- Retry/progression/high-score flow: `src/Game.cpp:398-493`.
- Timer unit: `src/LevelTimer.cpp:45-75`.
- OS4 F11 final fix: `src/BubbleTrainWorld.cpp:77-82`; compare `specs/os4-diff.csv`.
