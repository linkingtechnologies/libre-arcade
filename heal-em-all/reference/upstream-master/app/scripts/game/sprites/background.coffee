Q = Game.Q

Q.Sprite.extend 'Background',

  init: (p) ->
    @_super p,
      x: 0
      y: 0
      z: 0
      asset: Game.assets.map.bg
      type: Q.SPRITE_NONE

    @imgEl = @asset()

    ratio = @imgEl.width/@imgEl.height

    # background cover vertically
    @imgEl.width = Q.width + 10
    @imgEl.height = @imgEl.width * ratio

    # find background draw start point to achive viewport.centerX == imgEl.centerX
    @p.deltaX = (@imgEl.width - Q.width)/2
    @p.deltaY = (@imgEl.height - Q.height)/2

  draw: (ctx) ->
    viewport = @stage.viewport

    if viewport
      offsetX = viewport.centerX - Q.width / 2
      offsetY = viewport.centerY - Q.height / 2
    else
      offsetX = 0
      offsetY = 0

    ctx.drawImage @imgEl,
      offsetX - @p.deltaX,
      offsetY - @p.deltaY,
      @imgEl.width,
      @imgEl.height

    # ctx.drawImage @imgEl, 0, 0