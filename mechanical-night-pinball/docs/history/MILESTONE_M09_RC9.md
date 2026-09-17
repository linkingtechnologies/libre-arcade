# M0.9 RC9 — State Machine Diagnostic

RC9 adds an opt-in diagnostic console for validating the parallel gameplay state machines.

Open the game with:

```
?debug=states
```

The diagnostic panel shows live state for multiplier, Ramp Key / third ramp, the two-ramp extra-ball event, peg recovery, tunnel, ball/life state, flippers and launcher. Its buttons inject events through the same transition methods used by physical sensor contacts.

The normal player UI is unchanged when the query parameter is absent.

## Intended workflow

1. Reset.
2. Trigger a challenge one transition at a time.
3. Compare the live state bank against the expected transition.
4. Repeat the same sequence through normal play to validate physical reachability.

The automatic `state-machines.mjs` suite covers all challenge-state transitions independently of ball geometry.
