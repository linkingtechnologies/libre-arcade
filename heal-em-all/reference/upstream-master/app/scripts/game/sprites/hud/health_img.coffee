Q = Game.Q

Q.UI.HealthImg = Q.Sprite.extend "Q.UI.HealthImg",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "hud_health"

  changeToHalf: ->
    @p.sheet = "hud_health_half"