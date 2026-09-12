# Canonical card model

BriscoLab uses four suits:

```text
denari, coppe, spade, bastoni
```

Ranks are integers `1..10`. Canonical card IDs are:

```text
<suit>-<rank>
```

Example:

```text
denari-3
```

A canonical card object contains:

```js
{
  id: "denari-3",
  suit: "denari",
  rank: 3,
  points: 10,
  strength: 9
}
```

Point values are: Ace 11, Three 10, King 4, Knight 3, Jack 2, all others 0.
Within a suit, strength is Ace > Three > King > Knight > Jack > 7 > 6 > 5 > 4 > 2.

Adapters may translate this representation into legacy encodings, but the engine
card model must remain independent from regional artwork and upstream numeric
card schemes.
