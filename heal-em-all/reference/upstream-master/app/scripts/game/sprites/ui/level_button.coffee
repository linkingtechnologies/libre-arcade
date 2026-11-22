Q = Game.Q

Q.UI.LevelButton = Q.UI.Button.extend "UI.LevelButton",
  init: (p) ->
    @_super p,
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
      sheet: "ui_level_button"
      fontColor: "#595f5f"
      font: "400 70px Jolly Lodger"

    @p.label = @p.level

    @p.sheetW = 172
    @p.sheetH = 130

    @p.cx = @p.sheetW/2
    @p.cy = @p.sheetH/2

    if @p.enabled == false
      @p.sheet = "ui_level_button_locked"
      @p.label = false

    @on 'click', =>
      if @p.enabled
        if @p.level > 1
          Game.stageLevel(@p.level)
        else
          Game.stageControlsScreen()

      else
        Game.trackEvent("Level Button", "clicked", "locked")
