Q = Game.Q

Q.UI.EnemiesCounter = Q.UI.Text.extend "UI.EnemiesCounter",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      label: Q.state.get("enemiesCounter") + ""
      size: 34
      color: "#c4da4a"
      family: "Boogaloo"

    @p.w = 60

    Q.state.on "change.enemiesCounter", @, "updateLabel"

  updateLabel: (enemiesCounter) ->
    @p.label = enemiesCounter + ""

