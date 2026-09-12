# BriscolaBot v3 ONNX model

The bundled file `assets/models/briscolabot/briscola-bot-v3.onnx` is the upstream
pretrained BriscolaBot v3 ONNX model supplied by the BriscolaBot project.

Verified model signature from the actual ONNX graph:

- input: `input`, `float32[1,202]`
- layout: first 162 values = observation; final 40 values = legal-action mask
- output: `action`, `int64[1]`
- actor: 162 -> 256 -> 256 -> 40, Mish activations
- parameters: 117,800 float32 values
- producer: PyTorch 2.0.0
- ONNX opset: 14
- file size: 474,612 bytes
- SHA-256: `ab6fed4667cb9ddbacdd394d717108233ab2dbdced7ee4440d0bdfbce1cb53d2`
- action selection: masked logits followed by ONNX `Multinomial`

The model is used unmodified by the browser runtime.
