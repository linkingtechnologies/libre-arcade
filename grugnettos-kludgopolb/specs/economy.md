# Grugnetto Board economy v1

This economy is intentionally original. No price, revenue or development table is copied from the recovered KludgopolB regional boards or any third-party commercial board game.

## Pricing model

The board has four worlds with four purchasable Places each. A complete world's acquisition cost is kept close to **600 Grugnetto Coins**, so no world is automatically the cheap or expensive tier.

Within each world, each Place has a simple prestige factor (0.75 / 0.90 / 1.10 / 1.30). That factor is combined with the Place's empirically measured landing frequency. The result is normalized within its world and rounded to 5 coins.

This creates prices from **95 to 215 coins** without reproducing the progressive street-price ladder found in the recovered regional boards.

## Landing-frequency calibration

`npm run landing -- --runs 500 --turns 4000` performs 2,000,000 seeded simulated turns. It models 2d6, doubles, Base Camp and the two event decks. The resulting normalized `landingWeight` is stored on purchasable spaces and is also consumed by the preserved KludgopolB CPU valuation code.

## Revenue

Base revenue starts around 8.5% of list price, corrected by empirical landing probability so high-traffic spaces are not automatically dominant. Values are rounded for readability.

A complete world doubles undeveloped revenue, as in the preserved engine behavior. Four purchased Embellishments use the v1 revenue curve:

`1x / 3x / 10x / 24x / 50x`

The intentionally steep final levels make completed worlds decisive enough for AI-vs-AI games to terminate instead of stalling indefinitely.

Embellishment cost is approximately 45% of list price, rounded to 5 coins.

## Current validation

Three independent 100-game batches (seeds 50000, 60000 and 70000) using Zilla, Queen, Wallace and Hans produced:

- natural one-survivor completion: **99%, 98%, 96%**;
- mean turns: **247.0, 297.8, 417.6**;
- combined completion rate: **97.7%**;
- combined mean duration: **320.8 turns**.

Full-game revenue by world is deliberately treated as a diagnostic, not as an automatic tuning target: it varies strongly according to which CPU completes a world and when trading succeeds. Geometry/landing frequency is the stable input used for the economy itself.

## Current Place table

| World | Place | Price | Embellishment | Base revenue | Landing weight |
|---|---|---:|---:|---:|---:|
| Prato di Casa | Sentiero dei Fiori | 115 | 50 | 10 | 0.9764 |
| Prato di Casa | Mulino del Prato | 125 | 55 | 12 | 0.8698 |
| Prato di Casa | Stagno delle Rane | 140 | 65 | 15 | 0.8102 |
| Prato di Casa | Collina del Vento | 215 | 95 | 18 | 1.0363 |
| Bosco degli Scoiattoli | Radura delle Ghiande | 105 | 45 | 11 | 0.8204 |
| Bosco degli Scoiattoli | Radice Grande | 130 | 60 | 13 | 0.8560 |
| Bosco degli Scoiattoli | Ponticello dei Tronchi | 160 | 70 | 16 | 0.8446 |
| Bosco degli Scoiattoli | Bosco dei Funghi | 205 | 90 | 19 | 0.9278 |
| Dune Dorate | Oasi delle Dune | 95 | 45 | 8 | 0.9698 |
| Dune Dorate | Sentiero dei Cactus | 125 | 55 | 10 | 1.0913 |
| Dune Dorate | Canyon Dorato | 175 | 80 | 12 | 1.2344 |
| Dune Dorate | Arco di Sabbia | 205 | 90 | 14 | 1.2079 |
| Miniera di Pietra | Ingresso della Miniera | 120 | 55 | 9 | 1.1691 |
| Miniera di Pietra | Sala dei Carrelli | 125 | 55 | 10 | 1.0251 |
| Miniera di Pietra | Pozzo delle Torce | 160 | 70 | 13 | 1.0702 |
| Miniera di Pietra | Cuore della Miniera | 190 | 85 | 15 | 1.0732 |
