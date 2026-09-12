# Contest 0.3.0 vs release 0.3.5

This file records features that must not be backported silently into Contest mode.

| Feature | 0.3.0 contest | 0.3.5 | Port policy |
| --- | --- | --- | --- |
| Paddle inertia and ±0.4 target velocity | yes | yes | Contest behavior |
| Paddle-position and movement-dependent bounce | yes | yes | Contest behavior |
| Progressive ball speed | yes | yes, implementation changed | Use 0.3.0 algorithm |
| Multiball | yes | yes | Contest behavior |
| Wide/narrow paddle | yes | yes | Contest behavior |
| Shot / super shot | yes | yes | Contest behavior |
| Score and time bonus | yes | yes | Contest behavior |
| Python-defined maps | yes | yes | Rewrite semantically in JS |
| Nine distinct maps / eleven-stage maplist | yes | no | Preserve 0.3.0 sequence |
| `map9.py` bonus level | no | yes | Exclude from Contest mode |
| Slow-ball / speed-ball power-ups | no | yes | Exclude from Contest mode |
| Animated brick/sprite changes | no | yes | Exclude from Contest mode |
| Original SDL_Console code | yes | removed | Do not copy |
| New Yanoid console/readline/tab completion | no | yes | Exclude from Contest mode |
| Later collision-response fixes | no | yes | Document separately |

## 0.3.5 legal significance

0.3.5 is cleaner with respect to the console: the old SDL_Console source present in 0.3.0 is replaced by Yanoid-owned GPL-2.0-or-later source files. This does not change the Contest-mode target; the browser port needs no developer console and copies neither implementation.
