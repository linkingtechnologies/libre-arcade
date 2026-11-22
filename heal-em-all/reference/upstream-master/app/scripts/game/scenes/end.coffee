Q = Game.Q

Q.scene "end", (stage) ->

  # some math
  marginY = Q.height * 0.25

  # audio
  Q.AudioManager.stopAll()

  # add title
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: marginY/2
    label: "The End"
    color: "#f2da38"
    family: "Jolly Lodger"
    size: 100

  # message
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: Q.height/2
    label: "You did it!\nIf you like the game, follow us on twitter.\nAlso please give us some feedback.\nThanks for your time!"
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
    label: "Back to all levels"
    keyActionName: "confirm"
    type: Q.SPRITE_UI | Q.SPRITE_DEFAULT

  button.on "click", (e) ->
    Game.stageLevelSelectScreen()
