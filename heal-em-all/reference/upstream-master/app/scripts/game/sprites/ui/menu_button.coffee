Q = Game.Q

Q.UI.MenuButton = Q.UI.Button.extend "UI.MenuButton",
  init: (p) ->
    @_super p,
      x: Q.width - 30
      y: 170
      z: 100
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
      sheet: "hud_back_button"
      keyActionName: "escape" # button that will trigger click event

    @on 'click', =>
      Game.stageLevelSelectScreen()

      Game.trackEvent("Menu Button", "clicked")