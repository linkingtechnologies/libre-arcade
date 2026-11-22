Q = Game.Q

Q.scene "controls", (stage) ->

  # some math
  marginY = Q.height * 0.25

  marginXinP = 20 # %
  gutterXinP = 8 # %
  columnsNo = 3

  # layout math
  columnInP = (100 - (marginXinP * 2) - (columnsNo - 1) * gutterXinP)/columnsNo  # 24%

  marginX = Q.width * marginXinP * 0.01
  gutterX = Q.width * gutterXinP * 0.01
  columnWidth = Q.width * columnInP * 0.01

  # audio
  Q.AudioManager.stopAll()
  Q.AudioManager.clear()

  # add title
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: marginY/2
    label: "How to heal’em in three steps"
    color: "#f2da38"
    family: "Jolly Lodger"
    size: 60

  # add 3 columns
  column1Container = stage.insert new Q.UI.Container
    x: marginX + columnWidth/2
    y: Q.height/2

  column2Container = stage.insert new Q.UI.Container
    x: column1Container.p.x + gutterX + columnWidth
    y: Q.height/2

  column3Container = stage.insert new Q.UI.Container
    x: column2Container.p.x + gutterX + columnWidth
    y: Q.height/2

  # add 1 step
  step1text1 = column1Container.insert new Q.UI.Text
    x: 0
    y: -140
    label: "1st"
    color: "#ec655d"
    family: "Boogaloo"
    size: 26

  step1text2 = column1Container.insert new Q.UI.Text
    x: 0
    y: -100
    label: "Move with arrows"
    color: "#9ca2ae"
    family: "Boogaloo"
    size: 30

  column1Container.insert new Q.Sprite
    x: 0
    y: 0
    sheet: "ui_controls_1"

  # add 2 step
  column2Container.insert new Q.UI.Text
    x: 0
    y: step1text1.p.y
    label: "2nd"
    color: "#ec655d"
    family: "Boogaloo"
    size: 26

  column2Container.insert new Q.UI.Text
    x: 0
    y: step1text2.p.y
    label: "Find Healing Gun"
    color: "#9ca2ae"
    family: "Boogaloo"
    size: 30

  column2Container.insert new Q.Sprite
    x: 0
    y: 0
    sheet: "ui_controls_2"

  # add 3 step
  column3Container.insert new Q.UI.Text
    x: 0
    y: step1text1.p.y
    label: "3rd"
    color: "#ec655d"
    family: "Boogaloo"
    size: 26

  column3Container.insert new Q.UI.Text
    x: 0
    y: step1text2.p.y
    label: "Use your Gun!"
    color: "#9ca2ae"
    family: "Boogaloo"
    size: 30

  column3Container.insert new Q.Sprite
    x: 0
    y: 0
    sheet: "ui_controls_3"

  # button
  button = stage.insert new Q.UI.Button
    x: Q.width/2
    y: Q.height - marginY
    w: Q.width/2
    h: 70
    fill: "#c4da4a"
    radius: 10
    fontColor: "#353b47"
    font: "400 58px Jolly Lodger"
    label: "Give me some zombies"
    keyActionName: "confirm"
    type: Q.SPRITE_UI | Q.SPRITE_DEFAULT

  button.on "click", (e) ->
    Game.stageLevel(1)

