Q = Game.Q

# animations object
Q.animations "human",
  intro:
    frames: [0, 1, 2, 3]
    rate: 0.7
    next: "stand"
  stand:
    frames: [4, 5, 6]
    rate: 1/3
  outro:
    frames: [3, 2, 1, 0]
    rate: 0.8
    loop: false
    trigger: "outro"

# human object and logic
Q.Sprite.extend "Human",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      vx: 0
      z: 20
      timeInvincible: 4
      sheet: "human"
      sprite: "human"
      type: Game.SPRITE_HUMAN
      collisionMask: Game.SPRITE_TILES
      sensor: true

    @add "2d, animation"

    # animations
    @play "intro"

    # audio
    Q.AudioManager.add Game.audio.humanCreated

    # events
    @on "sensor", @, "sensor"
    @on "outro", @, "die"

  step: (dt) ->
    if @p.timeInvincible > 0
      @p.timeInvincible = Math.max(@p.timeInvincible - dt, 0)

  sensor: (obj) ->
    if obj.isA("Zombie") && @p.timeInvincible == 0
      # turn to zombie again
      obj.play("attack", 10)
      @play("outro")

    if obj.isA("ZombiePlayer")
      @play("outro")
      @p.zombiePlayerSensor = true

  die: ->
    @destroy()

    randomBool = Math.floor(Math.random() * 2)
    zombie = @stage.insert new Q.Zombie
      x: @p.x
      y: @p.y
      startLeft: randomBool

    if !@p.zombiePlayerSensor
      zombie.p.wasHuman = true
