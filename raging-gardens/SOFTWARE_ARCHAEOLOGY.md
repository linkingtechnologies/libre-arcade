# The software archaeology behind Raging Gardens

This is Raging Gardens's own recovery story. For the philosophy shared by every game in this collection,
see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Which repository is the game?

The brief named `alunix/RagingGardensFB`, a Facebook adaptation. It is a fork, made on 12 February 2013 and
last touched on 3 March 2013, of `petarov/game-off-2012`, the repository the game was made in for the
GitHub Game Off of November 2012. Comparing the two, ignoring comments and whitespace, showed that the
gameplay files (`tilemap.js`, `player.js`, `enemy.js`, `scene.game.js`, `gfx.js`) of the Game Off
submission (commit `6a3ae42`, 2 December 2012) and of the Facebook fork differ only in the copyright
header ("Dvubuz Games" instead of Petar Petrov), the base class (`Backbone.Model` instead of the
author's `ActorObject`), the Facebook app ids in `config.js` and the length comment of the timer. So the
Facebook fork adds nothing to the game: PHP, the Facebook SDK and the Facebook hiscore code are glue
around the same game, and no server component is needed to play.

The head of the original repository (`25ee169`, 28 November 2015, v0.9.10) was refactored to Crafty 0.6.3
by its author. Against the Game Off submission, the differences in the five gameplay files are the
engine's animation API (`animate` became `reel`), a mobile branch, small fixes (the timer display, the game
loop being unbound at the end) and whitespace. The rules, numbers and algorithms are the same. That head is
the baseline of this port, because it is the one that still runs on a library that can be fetched and
executed today.

## Reconstructing the game and running the original

The original game was not rewritten from a description. It was run. The 2015 sources and Crafty 0.6.3
load unmodified in a browser as soon as four things that make a game unrepeatable are taken away: the
clock (`Date.now`, which the game loop reads), the frame source (`requestAnimationFrame`), `Math.random`
and the audio device. With those replaced, the original plays the same game every time from a seed, and
its whole state can be read after every frame. That is the oracle. See
[`specs/port-map.md`](specs/port-map.md).

Reading the minified Crafty was part of the work, because the game quietly relies on the engine in places
no one wrote down:

- handlers of entities run in creation (id) order, and the scene's own loop runs after all of them;
- `hit()` returns the oldest overlapping entity first, and `Crafty("name")` returns the entity itself,
  not a selection, when exactly one matches (harmless here, since both have a `length` of 1);
- the collision test is strict: boxes that only touch do not collide;
- the keyboard dispatcher ignores a key that is already down, so holding Z does not start a second pull;
- the fixed timer runs 50 frames per second and catches up with at most five steps.

None of it needed guessing in the end, because the oracle showed any difference as a first differing
frame. The first full run of the port against the recording of a 3-minute game agreed on all 9000 frames.

## Oddities of the original, kept

- **Q and W act when the key is released**, not pressed, and Z must be held; after each carrot a fresh
  press is needed.
- **A carrot an enemy has set its mind on is claimed for good.** `newTarget` marks it `occupied` and never
  clears it; a rival pushed away, or called off by the totem, leaves its old carrot claimed, and no other
  rival will go for it.
- **The memory of carrot positions is eight entries that are never forgotten.** The code keeps "the last
  3" positions with `push` and `pop`; `pop` removes the newest, so the first eight positions of a game
  stay excluded for the whole game.
- **The push is measured from the enemy's corner,** not its centre, and the totem is planted at the
  player's centre while the enemies run to it by way of tile paths computed from corners.
- **A rival already pulling a carrot ignores the totem.** The totem only changes where an enemy is heading; one that is busy pulling keeps pulling until the carrot comes up. The others keep their old carrot as their formal target, go to the totem, and look for any carrot under their feet there; finding none, they choose again.
- **The sounds are picked with `Date.now() % 2`.** Cosmetic: the port picks the variant at random, apart
  from the game's own random numbers.

## The licence question

The README says the MIT licence covers "the game without game art". The 2015 commit adds `art/LICENSE` with
one line: "All images are (c) Stremena Tuzsuzova". The artist's own site says "All Rights Reserved". Nothing
in either repository or on those pages grants anyone the right to redistribute the pictures, so this
collection, which publishes its repository, does not carry them: the pictures of this version are new
and drawn by code. The ten sound effects are edited versions of nine Freesound clips; today's Freesound
pages show two as CC BY-NC (not compatible with a GPL collection that can be redistributed commercially),
one as deleted, and the others as CC BY or CC0, but nothing records which clip became which file, so none
is used and the effects are synthesised. The music, by Brandon Morris, is offered on OpenGameArt under
CC0 as well as OGA-BY, so the original track, in full quality instead of the original's low-bitrate
transcode, is used.

The reference tree in `reference/` therefore holds only the code and the MIT libraries; the artwork and
the sound files are present as SHA-256 hashes in `reference/SOURCES.json` and can be re-fetched, for
local use only, with `node scripts/fetch-original.mjs`.

## What would change the answer

If Stremena Tuzsuzova (stremena.com) gave written permission to redistribute her pictures under a free
licence, the original artwork could be restored, listed in the manifest with that evidence, and the
generated pictures retired. Nothing else about the game would need to change: sprite sizes and hit boxes
are the original's.
