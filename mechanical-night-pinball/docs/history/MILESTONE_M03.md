# Milestone M0.3 — Follow camera

The physical playfield remains **428 × 822**. Only the visible camera changes.

## Camera viewport

- visible logical viewport: **428 × 600**;
- vertical camera range: `0..222` logical pixels;
- smooth exponential follow, independent of display refresh rate;
- vertical dead-zone prevents constant micro-scrolling;
- velocity look-ahead gives more view in the ball's travel direction;
- bottom settles on the launcher/flipper area when the ball is resting there;
- tunnel transitions begin moving towards the exit before the ball reappears;
- HUD, touch controls and game-over overlay remain screen-space and never scroll.

This is intentionally closer to the historical Flash presentation, whose stage was shorter than the complete playfield.

No physics coordinates, collision geometry or scoring rules were changed in this milestone.
