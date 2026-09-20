# Comet Pinball — music provenance and license

Track: **Mechanical Night loop**, reused as the background soundtrack of Comet Pinball. This track is **not** a new composition for Comet; it was taken from the earlier Mechanical Night Pinball 1.1.0 RC2 source release.

Source archive: `mechanical-night-pinball-1.1.0-rc2-source-commit-ready.zip`; source member `mechanical-night-pinball-1.1.0-rc2/assets/music/mechanical-night-loop.ogg`. The included source README identifies this as a project-authored synthesized musical loop, published under **CC0-1.0**. The complete asset license is included in `ASSETS_LICENSE`.

Original source OGG SHA-256: `5f6502426b13c1b9d2d462c15c6cc82e93756de4186c148d8e71e76b80f60b29`. The shipped `assets/music/comet-loop.ogg` is **byte-identical** to this original. `assets/music/comet-loop.mp3` is an MP3 compatibility conversion of the same recording, not a separate track; both files are CC0.

The original historical Comet Pinball archive under `/reference` contains none of this replacement music and is left unchanged. Existing port-generated sound effects remain separate.

Music is enabled by default only after a user starts or resumes gameplay. The player can switch it off and independently adjust its level.
