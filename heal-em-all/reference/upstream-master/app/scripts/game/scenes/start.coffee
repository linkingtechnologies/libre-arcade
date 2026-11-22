Q = Game.Q

Q.scene "start", (stage) ->

  # add title
  titleContainer = stage.insert new Q.UI.Container
    x: Q.width/2
    y: Q.height/2

  titleContainer.insert new Q.UI.Text
    x: 0
    y: -100
    label: "Heal'em All"
    color: "#f2da38"
    family: "Jolly Lodger"
    size: 120

  titleContainer.insert new Q.UI.Text
      x: 0
      y: -20
      label: "There's a cure for zombies"
      color: "#ec655d"
      family: "Jolly Lodger"
      size: 40

  titleContainer.fit()

  # authors
  authors = stage.insert new Q.UI.Authors()

  # button
  button = titleContainer.insert new Q.UI.Button
    x: 0
    y: 80
    w: Q.width/3
    h: 70
    fill: "#c4da4a"
    radius: 10
    fontColor: "#353b47"
    font: "400 58px Jolly Lodger"
    label: "Continue"
    keyActionName: "confirm"
    type: Q.SPRITE_UI | Q.SPRITE_DEFAULT

  button.on "click", (e) ->
    Game.stageLevelSelectScreen()
