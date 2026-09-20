# Libre Arcade link and historical JAR — initial import review

- The credits screen links to https://linkingtechnologies.github.io/libre-arcade/ and preserves the original game's source link.
- Inspection of the shaded original JAR reported **3,163 entries**, bundled dependencies, and two bitmap font atlases generated from `Nueva Std Cond` (`.fnt` and `.tga`). No specific grant was documented to redistribute the complete binary including all embedded third-party material.
- Apache-2.0 licensing of original game code does not automatically resolve rights for separately sourced assets. Accordingly, redistribution of the complete JAR remains **uncleared** and the original binary is **not bundled** in the public-repository package.
- Its upstream location, SHA-256 and local acquisition procedure are documented in `reference/SHA256SUMS`, `reference/releases/README.md` and `JAR-LICENSE-REVIEW.md`. Java oracles can be regenerated only after the developer downloads and verifies the JAR locally.
- The original 37-test suite and managed Chromium browser smoke passed at that revision, with localhost/file navigation blocked by the environment. Real hosting and physical-device acceptance were not claimed.
