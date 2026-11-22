Q = Game.Q

Q.UI.PauseButton = Q.UI.Button.extend "UI.PauseButton",
  init: (p) ->
    @_super p,
      x: Q.width - 30
      y: 110
      z: 100
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
      sheet: "hud_pause_button"
      isPaused: false
      keyActionName: "pause" # button that will trigger click event

    pausedScreen = new Q.UI.Container
      x: Q.width/2,
      y: Q.height/2,
      w: Q.width,
      h: Q.height
      z: 50
      fill: "rgba(0,0,0,0.5)"

    pausedText = new Q.UI.Text
      x: 0
      y: 0
      label: "Paused"
      color: "#f2da38"
      family: "Jolly Lodger"
      size: 100

    @on 'click', =>
      if !@isPaused
        Q.stage().pause()
        Q.AudioManager.stopAll()
        @isPaused = true

        @stage.insert pausedScreen
        pausedScreen.insert pausedText

        Game.trackEvent("Pause Button", "clicked", "on")

      else
        Q.stage().unpause()
        if !Game.isMuted
          Q.AudioManager.playAll()

        @isPaused = false

        @stage.remove pausedScreen

        Game.trackEvent("Pause Button", "clicked", "off")

