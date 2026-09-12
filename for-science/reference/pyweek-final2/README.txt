============
For Science!
============

Dr X and his arch-enemy Dr Z have competed for world domination over the years,
until now. It's time to find out who's the Master Evil Genius. For science!

This is reidrac's entry for PyWeek 16 (April 2013).


Game Mechanics
==============

This is a "match 3" turn based puzzle game with a strategy component.

Each player must match 3 or more cells in order to obtain money, attacks and
shield repairs. The attacks can be used to destroy their opponent's base.

Only *one* of these action will be performed each turn:

- Swap two cells until there's a match or the turn times out.
- Use an attack. This is possible after obtaining the attack and enough money
  to use it.
- Repair shield. Again this is possible after obtaining the shield and enough
  money to use it.

When one player base is destroyed, the game is over and the opponent wins.


Controls
========

Use the mouse.

After selecting a cell, click again on it or out of the board to deselect it.

To leave any screen, use ESC.

Switch to fulscreen/back to window mode with CTRL + f (CMD + f in Mac).


Requirements
============

You don't need to install the game, just run *forscience*. Pyglet and Cocos2d
have been included in the package for your convenience.

Your system requires:

- Python 2.6 (or later, Python 3 not supported)
- AVbin (version 11 recommended)
- OpenAL (optional, recommended in Linux)

IMPORTANT: Cocos2d seems to have a bug requiring SDL even if I don't use it.
The Cocos2d version in this package has been patched and hopefully won't require
SDL at all!

If you really want to install the game you'll need:

- setuptools
- Pyglet 1.2 (alpha1)
- Cocos2d 0.5.5

Try running:

    python setup.py install

To install the alpha version of Pyglet 1.2 you can run:

    pip install http://pyglet.googlecode.com/files/pyglet-1.2alpha1.tar.gz


License
=======

This is free software under the terms of GPL version 3. Please check COPYING
file for further details.

Third party content not covered by the GPL:

- Game background derived from "NASA Blue Marble 2007 East"
  Copyright 2007 NASA/Goddard Space Flight Center/Reto Stöckli - CC BY 2.0

- Russo One font
  Copyright 2011-2012, Jovanny Lemonad (jovanny.ru) - OFL 1.1

- Droid Sans Mono font
  Copyright (C) 2008 The Android Open Source Project
  Licensed under the Apache License, Version 2.0

- Cow Moo recorded by BuffBill84 - Attribution 3.0


Author
======

- Juan J. Martinez <jjm@usebox.net>

