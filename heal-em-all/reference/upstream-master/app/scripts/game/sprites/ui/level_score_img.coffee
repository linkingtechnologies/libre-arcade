Q = Game.Q

Q.UI.LevelScoreImg = Q.Sprite.extend "Q.UI.LevelScoreImg",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "ui_level_score"

    if @p.empty
      @p.sheet = "ui_level_score_empty"

