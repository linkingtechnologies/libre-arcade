Q = Game.Q

# animations object
Q.animations "bullet",
  fly:
    frames: [0, 1, 2, 3, 4, 5]
    rate: 0.3

Q.Sprite.extend "Bullet",
  init: (p) ->
    @_super p,
      range: Q.width/2
      sheet: "bullet"
      sprite: "bullet"
      speed: 700
      gravity: 0
      type: Game.SPRITE_BULLET
      collisionMask: Game.SPRITE_TILES | Game.SPRITE_ENEMY

    @add "2d, animation"

    @play "fly"

    @p.initialX = @p.x
    @p.initialY = @p.y

    @on "hit", @, "collision"

  step: (dt) ->
    if @p.direction == "left"
      @p.vx = -@p.speed
      @p.flip = "x"
    else
      @p.vx = @p.speed
      @p.flip = false

    if @p.x > Game.map.width || @p.x < 0
      @die()

    if @p.x > @p.initialX + @p.range or @p.x < @p.initialX - @p.range
      @die()

  collision: (col) ->
    @p.x -= col.separate[0]
    @p.y -= col.separate[1]

    # difference for level statistics
    if col.obj.isA("Zombie")
      @destroy()
    else
      @die()

  die: ->
    Game.currentLevelData.bullets.waisted += 1
    @destroy()

