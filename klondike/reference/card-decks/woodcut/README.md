# Woodcut playing cards

A French-suited 52-card deck in SVG, plus two jokers and a back. CC0.

![The full deck](preview.png)

### Faces

<p>
<img width="115" src="cards/JS.svg"> <img width="115" src="cards/QS.svg"> <img width="115" src="cards/KS.svg"> <img width="115" src="cards/JH.svg"> <img width="115" src="cards/QH.svg"> <img width="115" src="cards/KH.svg">
</p>
<p>
<img width="115" src="cards/JD.svg"> <img width="115" src="cards/QD.svg"> <img width="115" src="cards/KD.svg"> <img width="115" src="cards/JC.svg"> <img width="115" src="cards/QC.svg"> <img width="115" src="cards/KC.svg">
</p>
<p>
<img width="115" src="cards/joker-1.svg"> <img width="115" src="cards/joker-2.svg"> <img width="115" src="cards/AS.svg"> <img width="115" src="cards/back.svg"> <img width="115" src="bonus/imperial-bower.svg"> <img width="115" src="bonus/dodal-fool.svg">
</p>

### Colori

<p>
<img width="115" src="colori/KH.svg"> <img width="115" src="colori/QS.svg"> <img width="115" src="colori/JC.svg"> <img width="115" src="colori/QD.svg"> <img width="115" src="colori/joker-1.svg"> <img width="115" src="colori/joker-2.svg">
</p>

`colori/` holds the twelve courts and both jokers in full stencil colour —
each ink pulled as its own plate from the scans and stacked beneath the
keyline. (The number cards, aces and back are original vector work and
already carry their colour.) Small red ovals are library ownership stamps,
left in place.

Court cards and jokers are traced from public-domain scans of historical decks
(1650–1860s). Number cards, aces, frames, and the back are original vector
work. Everything is flat single-colour path data; retint with a find-and-replace.

```
cards/       AS.svg … KC.svg (rank + suit initial), joker-1.svg, joker-2.svg, back.svg
bonus/       two extra traced cards, not part of the standard deck
sources/     traced artwork as SVG fragments + the tracing recipe (PIPELINE.md)
tools/       generate.mjs — rebuilds cards/ and bonus/ from the fragments
```

Cards are `viewBox="0 0 250 350"`, self-contained. Rebuild: `node tools/generate.mjs`.

## Sources

| Cards | Source | Date | Scan |
|---|---|---|---|
| K♠ Q♠ J♠ · K♥ Q♥ J♥ · K♦ J♦ · K♣ Q♣ | “Great Mogul” deck, Meiffre Neveu & Cie (single-headed English pattern, stencilled woodcut) | c. 1850s | [Gallica](https://gallica.bnf.fr/ark:/12148/btv1b10525043c) · [Commons](https://commons.wikimedia.org/wiki/Category:Great_Mogul_-_cartes_d%27un_jeu_au_portrait_anglais_-_estampe_-_btv1b10525043c) |
| Q♦ | English-pattern deck, Adolphe Thomas | c. 1850s | [Gallica](https://gallica.bnf.fr/ark:/12148/btv1b10509201b) · [Commons](https://commons.wikimedia.org/wiki/Category:Jeu_de_cartes_au_portrait_anglais_de_fabrication_fran%C3%A7aise_-_jeu_de_cartes,_estampe_-_btv1b10509201b) |
| J♣ | Anonymous single-headed English-pattern card | 19th c. | [Commons](https://commons.wikimedia.org/wiki/File:Jopek_Trefl_z_Wzoru_AngloAmeryka%C5%84skiego_Jednog%C5%82owego.png) |
| joker-1 | “Le Fov”, Jean Noblet tarot, Paris | c. 1650 | [Gallica, f. 43](https://gallica.bnf.fr/ark:/12148/btv1b105109641/f43.item) |
| joker-2 | “Der Narr”, Troccas tarot, Switzerland | 19th c. | [Commons](https://commons.wikimedia.org/wiki/File:Troccas-0-der-narr.jpg) |
| bonus/imperial-bower | Samuel Hart & Co., New York — the earliest known joker | c. 1863 | [Commons](https://commons.wikimedia.org/wiki/File:Imperial_Bower.png) |
| bonus/dodal-fool | “Le Fol”, Jean Dodal tarot, Lyon (low-res source, kept for reference) | c. 1701 | [Commons](https://commons.wikimedia.org/wiki/File:Jean_Dodal_Tarot_trump_Fool.jpg) |

All scans are marked public domain at their hosts. The ♥/♦ symbols on the red
courts were printed only on the red stencil plate; they are traced from that
plate in a second pass, so those shapes are also original. Method and per-card
thresholds: [`sources/PIPELINE.md`](sources/PIPELINE.md).

## License

[CC0 1.0](LICENSE). The sources' copyrights expired long ago; this
repository's own contributions are dedicated to the public domain.

First made for [Dicebox](https://dicebox.cc).
