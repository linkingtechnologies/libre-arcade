Q = Game.Q

Q.UI.RadialGradient = Q.Sprite.extend "Q.UI.RadialGradient",
  init: (p) ->
    @_super p,
      x: Q.width/2
      y: Q.height/2
      w: Q.width
      h: Q.height

    console.log @p

  draw: (ctx) ->
    rad = ctx.createRadialGradient(0, 0, @p.w/3, 0, 0, @p.w/2 + @p.w/4)
    rad.addColorStop(0, 'rgba(0,0,0,0)')
    rad.addColorStop(1, 'rgba(0,0,0,1)')
    # rad.addColorStop(0, 'rgba(255,0,0,0.5)')
    # rad.addColorStop(1, 'rgba(0,255,0,1)')
    ctx.fillStyle = rad
    ctx.fillRect(-@p.cx, -@p.cy, @p.w, @p.h)
    ctx.fill()
