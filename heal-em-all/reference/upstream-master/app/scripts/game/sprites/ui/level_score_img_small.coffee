Q = Game.Q

Q.UI.LevelScoreImgSmall = Q.Sprite.extend "Q.UI.LevelScoreImgSmall",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "ui_level_score_small"
