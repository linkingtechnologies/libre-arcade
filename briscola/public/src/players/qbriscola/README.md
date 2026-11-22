# QBriscola AI — faithful port

`QBriscolaAI.js` is a JavaScript port of the CPU decision logic implemented in
QBriscola 1.1 `Finestra`. The original Italian method and state-field names are
intentionally preserved so the JavaScript can be compared directly with the
C++ source.

The port preserves:

- rule ordering;
- original method names;
- card priorities;
- `uscite` / `brUscite` memory;
- `mazzo->getMax()` behavior;
- original heuristics without improvements.

## Accepted state

```js
const index = ai.scegliCarta({
  mano: [carta1, carta2, carta3],
  briscola,
  uscite: [],
  brUscite: [],
  cartaAvversario: null, // null when the computer leads the trick
  mazzoMax: 33
});
```

A QBriscola `Carta` has this shape:

```js
{
  seme: "denari",
  numero: 1,
  priorita: 10,
  punteggio: 11
}
```

Historical note: the original code uses `"spadi"`. The adapter translates the
engine's `"spade"` value into the value expected by the faithful port, keeping
the engine-specific mapping outside the AI.

## License and provenance

Port derived from QBriscola, Copyright (C) 2008 Betti Sorbelli Francesco and
Ciotti Roberto. The original source files declare GNU GPL v2 or later.

Reference source:
`https://sourceforge.net/p/qbriscola/code/HEAD/tree/trunk/src/finestra.cpp`
