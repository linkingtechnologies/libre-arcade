# Three pinball tables, three kinds of physics
What I measured by running the same experiments on three restored games

I restore old open-source games for a project called Libre Arcade: find abandoned code, work out what it actually did, and make it playable again in a browser. Three of the games are pinball tables: Comet Pinball (2013, Java and libGDX), Nova Pinball (2015, Lua and LÖVE) and Mechanical Night Pinball (2018, Box2D). All three have a ball, a tilted table, bumpers and two flippers. All three feel different.

I wanted numbers instead of impressions, so I wrote a handful of small experiments and ran them on each game's own physics code. This article is a tour of what came out, one table element at a time.

One note on method. These are the browser versions in Libre Arcade, not the original programs. Comet and Mechanical Night reproduce Box2D's behaviour and were calibrated against the originals. Nova uses a small purpose-built collision layer. When I say "Comet does X", I mean the port, and I flag the places where that matters.

## A ruler that works across tables

The first problem is comparing them. Comet is in metres, the other two in pixels, and gravity is 1.2 m/s² in one and 350 px/s² in another.

The ruler I settled on is the speed a ball gains by falling the full height of the table, `v_H = √(2gH)`. It is 1.83 m/s in Comet, 759 px/s in Mechanical Night and 1202 px/s in Nova. A shot at 0.5 v_H means the same thing in all three: half the speed needed to fall the whole table.

| | Table height (ball radii) | Fall time | Flipper length (ball radii) | Flipper tip speed / v_H |
|---|---|---|---|---|
| Comet | 104 | 1.53 s | 8.1 | 3.0 |
| Mechanical Night | 91 | 2.17 s | 4.5 | 1.3 |
| Nova | 63 | 1.57 s | 7.9 | 1.3 |

Comet is the only table with real-world dimensions: a 13.5 mm ball on a 0.76 by 1.40 m field, tilted 7 degrees, so gravity along the table is 9.81 · sin 7° = 1.2 m/s². Mechanical Night runs at 50 pixels per metre, which makes its 18 px ball 36 cm wide. Nova is a pixel world with no physical scale at all. These choices are invisible on screen, because the camera fits the table to the window, but they decide what feels fast.

## The flipper is not a bat with a speed

The textbook picture is `v = ωr`: a flipper turns at a fixed angular velocity, so the tip moves faster than the base. That is true, and it is where the three games start. Comet commands 50 rad/s, Mechanical Night 25 rad/s, Nova 13.5 rad/s.

To see what the ball actually gets, I placed it at rest on a resting flipper at six distances from the pivot, pressed the key, and recorded its speed when it left the flipper.

Nova behaves like the textbook. The ball leaves at roughly one to one and a tenth times the surface speed of the flipper at the contact point, and the shot grows with distance from the pivot. Its flipper restitution is 0.05, so the ball mostly picks up the surface speed.

Mechanical Night does not. The ball weighs 0.102 kg and the flipper 0.222 kg, so the ball is a large load on a motor with limited torque. The best shot leaves at around 720 px/s and climbs 0.89 of the table height with the stock profile, or 0.78 with the profile the game ships.

Comet is the surprising one. Its flippers are dynamic bodies on a joint. The commanded 50 rad/s is a request, and the angular velocity at the moment the ball leaves falls from about 42 rad/s near the pivot to about 11 rad/s at the tip. Hitting the ball with the end of the flipper does not give the hardest shot. Near the pivot the same flipper can send the ball up to four table heights, far more than the table needs.

Three tables, three answers to the same question, all of them written as "the flipper rotates".

## The bumper is not a bouncy wall

A bumper looks like a circular wall with a high restitution, and two of the three are written that way. Head-on, at 0.5 v_H:

- Mechanical Night multiplies the speed by exactly 1.75. The constant is right there in the collision call.
- Nova multiplies it by 2.16, a value derived from the bumper radius divided by ten, and then a velocity clamp cuts the result to 1000 px/s. At v_H the bumper actually slows the ball down, from 1202 px/s to 997. The clamp decides the speed limit, not the bumper.
- Comet does not multiply anything. When the ball leaves, the engine applies a fixed force, `BUMPER_FORCE = 200`, on top of a normal 0.56 bounce. A ball arriving slowly gets a proportionally huge kick, and a fast one a small one.

The same constant has a second life in Comet: the slingshots use it too, although a separate `SLINGSHOT_FORCE` is declared and never applied. The port keeps that, because it is how the original behaved.

There is a catch I have not resolved. In the port, that force is applied for one step, using the real frame time. At 60 Hz a 0.5 v_H entry leaves at 1.23 m/s. At 144 Hz it leaves at 0.79, and at 240 Hz at 0.66. The bumper is weaker on a faster monitor. The original Java source is not in the project, and my reference traces run at a fixed 60 Hz, so I do not know whether the original had the same dependency. It is a property of the port until I can show otherwise.

## What a wall does

A wall should be simple. Restitution is a number, and the ball loses that fraction of its speed.

In Nova it is: 0.40 at every impact speed. In Comet it is 0.56 above 0.1 m/s and zero below it. In Mechanical Night it is 0.30 above 50 px/s and close to zero below. The threshold comes from Box2D, which switches restitution off for slow contacts so that resting objects do not jitter. It is the reason a ball in Comet or Mechanical Night comes to rest on a wall instead of bouncing forever, and the reason a slow ball behaves differently from a fast one.

## The speed limit is part of the design

A ball that moves farther in one step than the thickness of a wall can jump over it. This is tunnelling.

I fired a ball at a straight wall from 1 to 80 times v_H. Comet and Mechanical Night never let it through. Nova does, once the speed passes about 3600 px/s, which is exactly the ball radius divided by the 1/240 s timestep (15 × 240). Nova avoids it with a plain clamp at 1000 px/s, applied before the collision.

That clamp is a design decision: no continuous collision detection, but a speed limit low enough that none is needed. It also shows up in the flipper experiment, where the shot leaves at about 1200 px/s and gets cut to 1000 on the next step.

I looked for tunnelling in Comet's more complicated geometry as well, but the scan I wrote produced results I did not trust, so I am not claiming any.

## The same drop, twice

Pinball amplifies small differences, and I wanted a number for it.

I dropped the ball onto the bumpers with no flipper input, then dropped it again shifted sideways by a fraction of a ball radius. Each run is perfectly repeatable: a shift of zero gives identical paths. With a shift of one tenth of a radius, Comet's two balls are a full radius apart after about 0.7 seconds, and Nova's after 0.75. Each factor of ten smaller in the initial shift buys about 0.6 seconds in Comet and 0.4 in Nova. A shift of one part in a million of a ball radius is enough to send the ball somewhere else before it drains.

In my setup the Mechanical Night ball rarely collided often enough for a small shift to grow, so I would not read that as a property of its engine. Balls also leave the table within a few seconds, which limits what this test can show for very small shifts. The slope over the first few shifts is the reliable part.

## What the numbers say about restoration

I started with the idea that preserving a pinball game meant getting the constants right: gravity, restitution, flipper speed. The constants are the easy part. What I measured instead is a set of choices that no constant describes: where the speed limit sits, whether a bounce has a threshold, whether a bumper multiplies or adds, whether a flipper delivers its commanded speed.

Those choices are what a player calls the feel of a table. They live in how the engine steps, solves and clamps, and they are lost the moment you swap the engine for a cleaner one. Reading the original code tells you what it said. Running it against a ruler like `v_H` tells you what it did.

The scripts and raw results are in the Libre Arcade repository, in `articles/pinball-physics`.
