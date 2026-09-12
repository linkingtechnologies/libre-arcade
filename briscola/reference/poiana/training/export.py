import torch as th
from typing import Tuple

from stable_baselines3 import DQN
from stable_baselines3.common.policies import BasePolicy


class OnnxableSB3Policy(th.nn.Module):
    def __init__(self, policy: BasePolicy):
        super().__init__()
        self.policy = policy

    def forward(self, observation: th.Tensor) -> Tuple[th.Tensor, th.Tensor, th.Tensor]:
        # NOTE: Preprocessing is included, but postprocessing
        # (clipping/inscaling actions) is not,
        # If needed, you also need to transpose the images so that they are channel first
        # use deterministic=False if you want to export the stochastic policy
        # policy() returns `actions, values, log_prob` for PPO
        return self.policy(observation, deterministic=True)


def export_onnx(name):
    model = DQN.load(f"../checkpoints/{name}.zip", device="cpu")

    onnx_policy = OnnxableSB3Policy(model.policy)

    observation_size = model.observation_space.shape
    dummy_input = th.randn(1, *observation_size)
    th.onnx.export(
        onnx_policy,
        dummy_input,
        f"{name}.onnx",
        opset_version=17,
        input_names=["input"],
    )

    import onnx
    import onnxruntime as ort
    import numpy as np

    onnx_path = f"{name}.onnx"
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)

    observation = np.zeros((1, *observation_size)).astype(np.float32)
    print(observation.shape)
    ort_sess = ort.InferenceSession(onnx_path)
    actions = ort_sess.run(None, {"input": observation})

    print(actions)

    # Check that the predictions are the same
    with th.no_grad():
        print(model.policy(th.as_tensor(observation), deterministic=True))


if __name__ == '__main__':
    export_onnx('true-bird')