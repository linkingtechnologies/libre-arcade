Q = Game.Q

Q.UI.HealthCounter = Q.UI.Text.extend "UI.HealthCounter",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      label: Q.state.get("lives") + ""
      size: 34
      color: "#ec655d"
      family: "Boogaloo"

    @p.x = -@p.img.w/2 - @p.w/2 - 6

    Q.state.on "change.lives", @, "updateLabel"

  updateLabel: (lives) ->
    @p.label = lives + ""