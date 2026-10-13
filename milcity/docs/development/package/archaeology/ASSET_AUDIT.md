# MilCity Blue 1.0.5 — asset audit M1

Runtime source archive contains three image assets and no audio/music/font files.

| Asset | Dimensions | Current classification | Reason |
|---|---:|---|---|
| `res/images.png` | 111x91 | YELLOW / UNKNOWN | bundled with GPL project, but no per-file author/license statement found |
| `res/MilCityLogo_Shiro_icon.png` | 32x32 | YELLOW | filename appears to credit/identify `Shiro`; provenance/license not independently established |
| `res/Splash_MilCity_Koojoo.png` | 240x320 | YELLOW | filename appears to credit/identify `Koojoo`; provenance/license not independently established |

No independent public evidence establishing who Shiro/Koojoo were or an explicit asset license was found in the initial web search. Do not assume code GPL automatically resolves third-party artwork rights.

Recommended gate before public redistribution: either recover explicit upstream attribution/license evidence, or replace uncertain artwork with manual CC0/OFL-compatible/non-AI assets while keeping historical originals only under `/reference` where legally appropriate.
