Q = Game.Q

Q.Sprite.extend "Key",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      z: 10
      sheet: "key"
      type: Game.SPRITE_PLAYER_COLLECTIBLE
      sensor: true
      # range: 6
      # speed: 6
      # gravity: 0

    @p.y -= 15

    # @add("2d")
    # @p.initialY = @p.y
    # @p.vy = @p.speed

    # events
    @on "sensor", @, "sensor"

  sensor: (obj) ->
    if obj.isA("Player")
      Q.state.set "hasKey", true
      Game.infoLabel.keyFound()

      Q.AudioManager.add Game.audio.collected
      @destroy()

  # step: (dt) ->
  #   if @p.initialY + @p.range < @p.y
  #     @p.vy = -@p.speed

  #   if @p.initialY - @p.range > @p.y
  #     @p.vy = @p.speed