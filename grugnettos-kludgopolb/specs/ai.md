# KludgopolB AI preservation notes

The original Java implementation uses one `PlayerCPU` class configured into seven named profiles. They are not seven unrelated algorithms; they are parameterisations of a shared heuristic system.

The restoration keeps those profile values verbatim in `src/players/profiles.js`.

The original valuation system is board-aware: site value includes rent multiplied by empirical landing frequency; service value assumes E(2d6)=7; set completion contributes an additional calculated gain. This makes the agents suitable for testing on a new board without hard-coding original property names.

`buytendancy` exists in the original `PlayerCPU` class but is never assigned or consumed elsewhere in the recovered source. It is preserved as an archaeological note rather than invented into the JS behaviour.
