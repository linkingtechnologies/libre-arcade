# BriscolaBot upstream reference

Project: BriscolaBot
Author/repository owner: LetteraUnica / Lorenzo Cavuoti
Source: https://github.com/LetteraUnica/BriscolaBot
License: MIT
Model: pretrained_models/briscola-bot-v3.onnx

Relevant upstream source files:
- src/envs/two_player_briscola/TwoPlayerBriscola.py
- src/envs/two_player_briscola/BriscolaConstants.py
- src/agents/NNAgent.py
- src/ui/controller/BriscolaController.py
- pretrained_models/briscola-bot-v3.onnx

BriscoLab does not rewrite the trained model. The browser adapter translates
our public PlayerObservation into the upstream model observation format.
