# BriscolaBot v3 adapter

This player integrates the pretrained PPO agent from LetteraUnica/BriscolaBot.
The upstream project and model are MIT-licensed.

The adapter reproduces the upstream 162-float observation layout from
`TwoPlayerBriscola.observe()` and the 40-action legal mask. The actual ONNX
export accepts a single `float32[1,202]` tensor: observation first, action mask
last. It returns an `int64[1]` selected card action.

The original model is bundled locally at:
`assets/models/briscolabot/briscola-bot-v3.onnx`

Inference runs in the browser through ONNX Runtime Web and is lazy-loaded only
when this player is selected. The model graph already performs legal masking and
its own `Multinomial` policy sampling; the adapter therefore uses the returned
scalar action directly and the Briscola engine validates it before play.

The ONNX graph is stateless. A single inference session is cached and reused for
the whole game.
