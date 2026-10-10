# UCI Connect-4 dataset

- Creator: John Tromp
- Donated: 3 February 1995
- Repository: UCI Machine Learning Repository, dataset 26
- DOI: https://doi.org/10.24432/C59P43
- Download: https://archive.ics.uci.edu/static/public/26/connect%2B4.zip
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Retrieved: 2 October 2026

The dataset contains 67,557 legal eight-ply positions where neither player has
won and the next move is not forced. Its class is the game-theoretic value for
the first player. ConnectLab redistributes the original compressed data and
metadata without modification, and derives categorical frequency counts with
`tools/train-uci-naive-bayes.py`.

## Checksums

```
1da8823a02f6b3d1539c5acf78dba7113d6ecf0d4074252968612b3c3ab6d188  Index
14c886b817783ac9b642f42ec78a2e67f727a3d41c94913af8954d454eee2367  connect-4.data.Z
dc366b892f457153057eb51e9f10b1e76cca02a71e4198481d3abbc95293653f  connect-4.names
```

Attribution: Tromp, J. (1995). *Connect-4* [Dataset]. UCI Machine Learning
Repository. https://doi.org/10.24432/C59P43

License text: https://creativecommons.org/licenses/by/4.0/legalcode
