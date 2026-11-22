Q = Game.Q

# animations object
Q.animations "deadZombie",
  intro:
    frames: [16, 17, 18, 19, 20, 21]
    rate: 1/3
    next: "stand"
  stand:
    frames: [21]
    rate: 1

# human object and logic
Q.Sprite.extend "DeadZombie",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      vx: 0
      z: 18
      sheet: "zombie"
      sprite: "deadZombie"
      type: Game.SPRITE_NONE
      collisionMask: Game.SPRITE_TILES

    @add "2d, animation"

    # animations
    @play "intro"


