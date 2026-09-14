# UI v0.28 — mobile setup + audio fallback

## Mobile setup

On viewports up to 610px wide, opening **Prepara la partita** promotes the setup card to a viewport-bounded overlay. The page behind it is locked; the player roster is the only scrolling region. Player count, New Game/Continue, Audio and Reduced motion remain reachable without document scrolling.

## Audio

Normal tactile cues no longer depend exclusively on Web Audio. Project-generated PCM WAV files are bundled locally for dice, four pawn-step variants, unlock and victory. Web Audio remains available for special-tile tones. `AudioEngine.unlock()` primes the media path from a direct user gesture and also attempts to resume `AudioContext`; either path can satisfy audio readiness.

No gameplay RNG is consumed by sound playback or pitch variation.
