Q = Game.Q

Q.UI.Authors = Q.UI.Text.extend "UI.Authors",
  init: (p) ->
    @_super p,
      label: "created by @krzysu and @pawelmadeja, follow us for updates"
      color: "#c4da4a"
      family: "Boogaloo"
      size: 22

    @p.x = Q.width/2
    @p.y = Q.height - @p.h/2

