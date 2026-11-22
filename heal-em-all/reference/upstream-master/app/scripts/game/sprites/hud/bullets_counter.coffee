Q = Game.Q

Q.UI.BulletsCounter = Q.UI.Text.extend "UI.BulletsCounter",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      label: Q.state.get("bullets") + ""
      size: 34
      color: "#f2da38"
      family: "Boogaloo"

    @p.x = -@p.img.w/2 - @p.w/2 - 12

    Q.state.on "change.bullets", @, "updateLabel"

  updateLabel: (bullets) ->
    @p.label = bullets + ""
