Q = Game.Q

Q.scene "gameOver", (stage) ->

  # some math
  marginY = Q.height * 0.25

  # audio
  Q.AudioManager.stopAll()

  # add title
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: marginY/2
    label: "Game Over"
    color: "#f2da38"
    family: "Jolly Lodger"
    size: 100

  # message
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: Q.height/2
    label: "Looks like these zombies cannot hope for your help :/\nBe better next time!"
    color: "#c4da4a"
    family: "Boogaloo"
    size: 36
    align: "center"

  # button
  button = stage.insert new Q.UI.Button
    x: Q.width/2
    y: Q.height - marginY/2
    w: Q.width/3
    h: 70
    fill: "#c4da4a"
    radius: 10
    fontColor: "#353b47"
    font: "400 58px Jolly Lodger"
    label: "All levels"
    keyActionName: "confirm"
    type: Q.SPRITE_UI | Q.SPRITE_DEFAULT

  button.on "click", (e) ->
    Game.stageLevelSelectScreen()
