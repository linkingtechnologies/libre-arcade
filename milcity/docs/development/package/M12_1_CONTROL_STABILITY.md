# MilCity M12.1 — control stability hotfix

M12 rebuilt the entire City/Military button grid during every 10 FPS render. In a real browser this could replace a button after pointer-down but before the click event, making action selection intermittent or apparently impossible.

M12.1 separates visual rendering from control refresh:

- the 10 FPS presentation loop calls `render(false)` and updates only the canvas;
- the control panel refreshes on simulation ticks and explicit user actions;
- City/Military tabs and action buttons are structurally rebuilt only when language or mode changes;
- ordinary status refreshes update classes/text state without replacing interactive buttons.

No gameplay rule or simulation behavior is changed.
