# Markus Thill Connect-Four source record

- Repository: `https://github.com/MarkusThill/Connect-Four.git`
- Preserved commit: `2a58844594ac022846385dd3ddc8bbbf0a26eae5`
- Commit date: 2019-07-24
- License: MIT
- Principal author: Markus Thill (`diedackel`)
- Selected trained agent: `C4.TCL-EXP-lam0.0`, exported 2015-05-05

The preserved subset contains the complete Java source tree except generated documentation and large unrelated alpha-beta opening-book databases. It also contains the original selected trained-weight archive and its format documentation. Those omissions do not affect the TD agent, its training implementation or reproducibility of the browser conversion.

The project explicitly supports reinforcement learning with n-tuple systems, TD learning, eligibility traces, adaptive step-size methods and optional lookahead. ConnectLab ports the inference path; it does not retrain or alter the historical weights.
