Q = Game.Q

Q.Sprite.extend "Heart",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      z: 10
      sheet: "heart"
      type: Game.SPRITE_PLAYER_COLLECTIBLE
      sensor: true

    @p.y -= 15

    # events
    @on "sensor", @, "sensor"

  sensor: (obj) ->
    if obj.isA("Player")
      obj.updateLifePoints(1)
      Game.infoLabel.extraLifeFound()

      Q.AudioManager.add Game.audio.collected
      @destroy()

      Game.currentLevelData.health.collected += 1
