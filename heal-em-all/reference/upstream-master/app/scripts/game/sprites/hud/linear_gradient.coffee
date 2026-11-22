Q = Game.Q

Q.UI.LinearGradient = Q.Sprite.extend "Q.UI.LinearGradient",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      z: 0
      asset: Game.assets.gradient

  draw: (ctx) ->
    img = @asset()
    ptrn = ctx.createPattern(img, 'repeat')
    ctx.fillStyle = ptrn
    ctx.fillRect(0, 0, Q.width, @p.h)
