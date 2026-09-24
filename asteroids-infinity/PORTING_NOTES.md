# Asteroids Infinity — story of the web adaptation

## Why this game is different

Asteroids Infinity was created by Ben Whittaker in 2009. Its ship keeps moving when the pilot releases the thrust key, and the camera follows with a distinctive delay. The web adaptation preserves these defining ideas rather than replacing the game with a generic Asteroids clone.

## From Python to the browser

The historical game uses Python 2 and Pygame. This edition runs entirely in the browser with HTML5 Canvas 2D and plain JavaScript, without accounts, tracking, external frameworks or a backend. Its game simulation, camera, input, rendering and local scores are separate parts of the code.

The world retains its historical 700 × 540 units behind a 640 × 480 view; its wraparound boundaries, ship inertia, asteroids and flying saucers were reconstructed from the original Python source. Responsive layout, touch controls, English/Italian text and browser-local preferences are adaptations for modern devices, not original 2009 features. Score and key-setting import/export can use the historical text formats, while the browser stores its everyday settings in a different internal format.

## What is different or not yet verified

Seven optional effects are synthesized locally with Web Audio. They do not reproduce or contain the original WAV recordings. The historical font and recordings are not included because separate reuse rights have not been established. The original game also used Python's random generator and Pygame's update timing, so identical random sequences and complete audiovisual parity have not been certified. The original Python 2/Pygame application has not been executed natively in this audit environment.

## Historical sources and credits

Original game and design: **Ben Whittaker (2009)**, source and project: https://sourceforge.net/projects/asteroidsinf/ . HTML5 port and newly synthesized audio: **Libre Arcade contributors (2026)**. The original code is licensed GPL version 3 or later; see `THIRD_PARTY_NOTICES.md` and `LICENSE` for the distribution notices.

This is a project background note, **not a changelog**. Release-by-release technical test reports stay with the internal audit materials, not in the player interface.
