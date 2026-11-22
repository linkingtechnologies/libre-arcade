Q = Game.Q

Q.UI.InventoryKey = Q.Sprite.extend "Q.UI.InventoryKey",
  init: (p) ->
    @_super p,
      x: 0
      y: 0
      sheet: "hud_key_empty"

    Q.state.on "change.hasKey", @, "updateSheet"

  updateSheet: (hasKey) ->
    if hasKey == true
      @p.sheet = "hud_key_collected"
    else
      @p.sheet = "hud_key_empty"
