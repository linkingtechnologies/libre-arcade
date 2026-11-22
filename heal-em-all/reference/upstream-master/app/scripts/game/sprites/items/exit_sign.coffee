Q = Game.Q

Q.Sprite.extend "ExitSign",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      z: 10
      sheet: "exit_sign"
      type: Game.SPRITE_NONE

    @p.y -= @p.h/2 - Game.assets.map.tileSize/2

