# Solver source references used through M6

The preservation oracle is authoritative: it executes the native physics code inside the untouched Comet Pinball 1.1.0 JAR.

For algorithm archaeology, M5/M6 also consulted the zlib-licensed Box2D 2.2.1 source preserved in the `kripken/box2d.js` repository, in particular:

- `Box2D_v2.2.1/Box2D/Common/b2Settings.h`
- `Box2D_v2.2.1/Box2D/Dynamics/Contacts/b2ContactSolver.cpp`
- `Box2D_v2.2.1/Box2D/Dynamics/b2Island.cpp`
- `Box2D_v2.2.1/Box2D/Dynamics/Joints/b2RevoluteJoint.cpp`
- `Box2D_v2.2.1/Box2D/Dynamics/b2World.cpp`

Relevant source URLs:

- https://github.com/kripken/box2d.js/blob/master/Box2D_v2.2.1/Box2D/Common/b2Settings.h
- https://github.com/kripken/box2d.js/blob/master/Box2D_v2.2.1/Box2D/Dynamics/Contacts/b2ContactSolver.cpp
- https://github.com/kripken/box2d.js/blob/master/Box2D_v2.2.1/Box2D/Dynamics/b2Island.cpp
- https://github.com/kripken/box2d.js/blob/master/Box2D_v2.2.1/Box2D/Dynamics/Joints/b2RevoluteJoint.cpp
- https://github.com/kripken/box2d.js/blob/master/Box2D_v2.2.1/Box2D/Dynamics/b2World.cpp

M5 used these sources to understand skin/slop, restitution threshold, Baumgarte correction, accumulated impulses, warm starting and the sequential contact solver.

M6 additionally uses them to reconstruct the island ordering (joint constraints before contact constraints on each velocity iteration), revolute-joint accumulated impulses/limit solve, and the historical TOI settings (`toiBaugarte=.75`, 20 position iterations, warm starting off for the TOI substep).

Important qualification: Comet embeds libGDX `0.9.9-SNAPSHOT` native libraries, but the old binary does not expose a trustworthy human-readable Box2D revision string in this audit. Repository labels alone therefore do not prove the exact embedded revision. Numeric traces generated from Comet's own preserved JAR remain the parity authority.
