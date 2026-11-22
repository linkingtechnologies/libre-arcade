Q = Game.Q

Q.UI.EnemiesAvatar = Q.Sprite.extend "Q.UI.EnemiesAvatar",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "hud_zombie"

    @p.x = Q.width - @p.w/2
    @p.y = @p.h/2 + 8

