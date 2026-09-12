# Rules profiles

BattleLab keeps fleet profiles explicit because historical programs differ.

## Classic five-ship profile

Used for the Warboats 0.51 and Bataille Navale OS4 AI comparison:

- lengths: `5, 4, 3, 3, 2`;
- board: 10x10;
- occupied cells: 17.

Warboats only rejects overlap and out-of-bounds placement; adjacent/touching ships are legal. This is significant because touching ships can trigger a historical Level-2 targeting stall.
