Q = Game.Q

Q.UI.BulletsImg = Q.Sprite.extend "Q.UI.BulletsImg",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "hud_bullets"

