# Source snapshot verification

Repository: `DocDonkeys/Pinup-Pinball`

Reference commit: `220820357a6a9a455df920619e2240e4da130cb9`

Root Git tree SHA: `a6aaa44c90837ab0096aee14c9192da82ecb34e4`

Archive:

- File: `Pinup-Pinball-220820357a6a9a455df920619e2240e4da130cb9.zip`
- Size: 9,553,374 bytes
- SHA-256: `190acc935a191621754e7440c4d5c65f639d5eb58138df28f2754c8521984a9a`
- ZIP entries: 307 total (276 files + 31 directories)
- ZIP CRC test: PASS
- Path traversal/suspicious archive paths: none found

## Git blob spot verification

The Git blob SHA-1 was recomputed from the uncompressed archive bytes using Git's canonical object format and compared against the recursive tree for the reference commit.

| Path | Expected Git blob SHA-1 | Recomputed | Result |
|---|---|---|---|
| `LICENSE` | `2c625fd1ede4f72cad2686922523491ebf367971` | `2c625fd1ede4f72cad2686922523491ebf367971` | PASS |
| `README.md` | `bcc15880edb9079c310de12ed5109725b4f88d29` | `bcc15880edb9079c310de12ed5109725b4f88d29` | PASS |
| `Pinup Pinball/Application.cpp` | `37e5b986a20ec5fa338046e7a139efd7af62fdda` | `37e5b986a20ec5fa338046e7a139efd7af62fdda` | PASS |
| `Pinup Pinball/ModulePhysics.cpp` | `0bca03519979826b49629aa663c8c2881092324c` | `0bca03519979826b49629aa663c8c2881092324c` | PASS |
| `Pinup Pinball/ModuleSceneIntro.cpp` | `288dffad21685c390b46f5573c5b707213e53d69` | `288dffad21685c390b46f5573c5b707213e53d69` | PASS |
| `Pinup Pinball/ModuleSceneIntro.h` | `b4d3eddb9d47bcadc6f5cd518d17baeb0b01c321` | `b4d3eddb9d47bcadc6f5cd518d17baeb0b01c321` | PASS |
| `Assets/Map.png` | `533b135d03eb8591a1ba87bda0bee899d9aba070` | `533b135d03eb8591a1ba87bda0bee899d9aba070` | PASS |
| `Assets/Ramps.png` | `dc39a14e4a5201d350990ab3f48f2d5812e180cb` | `dc39a14e4a5201d350990ab3f48f2d5812e180cb` | PASS |
| `Assets/Sprite_Sheet.png` | `e12d477d41a03bdc38d711dfa8778a9cd2284eab` | `e12d477d41a03bdc38d711dfa8778a9cd2284eab` | PASS |
| `Pinup Pinball/Game/pinball/sprites/map.png` | `533b135d03eb8591a1ba87bda0bee899d9aba070` | `533b135d03eb8591a1ba87bda0bee899d9aba070` | PASS |
| `Pinup Pinball/Game/pinball/sprites/ramps.png` | `dc39a14e4a5201d350990ab3f48f2d5812e180cb` | `dc39a14e4a5201d350990ab3f48f2d5812e180cb` | PASS |
| `Pinup Pinball/Game/pinball/sprites/sprite_sheet.png` | `1d35c1237ec25ae50b56bac5c53b2b2d82baa95c` | `1d35c1237ec25ae50b56bac5c53b2b2d82baa95c` | PASS |
| `Pinup Pinball/Game/Pinup Pinball.exe` | `0338f09e19411ce2c45d99a7f5426f77801c3e46` | `0338f09e19411ce2c45d99a7f5426f77801c3e46` | PASS |

All checked files match exactly.

This includes the project license, README, core application/physics/gameplay sources, the shipped executable, and the principal runtime/source artwork files. Together with the exact commit SHA, root tree SHA, complete recursive tree enumeration (`truncated: false`), and the GitHub-generated archive root name, this audit treats the uploaded ZIP as the canonical source snapshot of the reference commit.
