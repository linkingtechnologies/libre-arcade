Q = Game.Q

Q.Sprite.extend "Gun",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      z: 10
      sheet: "gun"
      type: Game.SPRITE_PLAYER_COLLECTIBLE
      sensor: true
      bullets: 6

    @p.y -= 15

    # events
    @on "sensor", @, "sensor"

  sensor: (obj) ->
    if obj.isA("Player")
      Q.state.set "hasGun", true
      obj.add("gun")
      Game.infoLabel.gunFound()

      # number of bullets depends of the gun
      obj.p.noOfBullets = @p.bullets
      Q.state.set "bullets", @p.bullets
      Game.currentLevelData.bullets.available = @p.bullets

      Q.AudioManager.add Game.audio.collected
      @destroy()


