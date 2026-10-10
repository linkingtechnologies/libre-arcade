# Al Sweigart — Four-In-A-Row provenance

Childsplay `fourrow.py` explicitly names this upstream:

- Title: Four-In-A-Row (a Connect Four clone)
- Author: Al Sweigart
- Historical publication: 2011
- Source/book page: https://inventwithpython.com/pygame/chapter10.html
- Downloads page: https://inventwithpython.com/pygame/downloads/
- Source header license: “Simplified BSD”, i.e. BSD-2-Clause / FreeBSD-style license.

The upstream algorithm supplies the recursive `getPotentialMoves()` family. Childsplay adds its six-level policy, random-move probabilities, framework integration, scoring/UI integration, and centre-biased first CPU move.

For redistribution, retain attribution to Al Sweigart and the applicable BSD notice in addition to the GPL notice for the Childsplay-derived port.
