Q = Game.Q

Q.UI.PlayerAvatar = Q.Sprite.extend "Q.UI.PlayerAvatar",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "hud_player"

    @p.x = @p.w/2
    @p.y = @p.h/2

  changeToZombie: ->
    @p.sheet = "hud_zombie_player"

  changeToPlayer: ->
    @p.sheet = "hud_player"

