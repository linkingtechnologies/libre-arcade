Q = Game.Q

Q.scene "levelSummary", (stage) ->

  # some math
  marginY = Q.height * 0.25

  marginXinP = 20 # %
  gutterXinP = 8 # %
  columnsNo = 2

  # layout math
  columnInP = (100 - (marginXinP * 2) - (columnsNo - 1) * gutterXinP)/columnsNo  # 24%

  marginX = Q.width * marginXinP * 0.01
  gutterX = Q.width * gutterXinP * 0.01
  columnWidth = Q.width * columnInP * 0.01

  # audio
  Q.AudioManager.stopAll()

  # add title
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: marginY/2
    label: "Well done!"
    color: "#f2da38"
    family: "Jolly Lodger"
    size: 100

  # add level summary
  summaryContainer = stage.insert new Q.UI.Container
    x: marginX + columnWidth/2
    y: Q.height/2

  lineHeight = 50

  if stage.options.health
    summaryContainer.insert new Q.UI.Text
      x: 0
      y: -lineHeight * 2
      label: "Health collected: " + stage.options.health.collected + "/" + stage.options.health.available
      color: "#c4da4a"
      family: "Boogaloo"
      size: 36

  if stage.options.zombies
    summaryContainer.insert new Q.UI.Text
      x: 0
      y: -lineHeight
      label: "Zombies healed: " + stage.options.zombies.healed + "/" + stage.options.zombies.available
      color: "#c4da4a"
      family: "Boogaloo"
      size: 36

  if stage.options.bullets
    summaryContainer.insert new Q.UI.Text
      x: 0
      y: 0
      label: "Bullets wasted: " + stage.options.bullets.waisted + "/" + stage.options.bullets.available
      color: "#c4da4a"
      family: "Boogaloo"
      size: 36

  if stage.options.zombieModeFound?
    summaryContainer.insert new Q.UI.Text
      x: 0
      y: lineHeight
      label: "Zombie Mode: " + if stage.options.zombieModeFound then "done" else "not found"
      color: "#c4da4a"
      family: "Boogaloo"
      size: 36


  # button next
  buttonNext = stage.insert new Q.UI.Button
    y: Q.height - marginY
    w: Q.width/4
    h: 70
    fill: "#c4da4a"
    radius: 10
    fontColor: "#353b47"
    font: "400 58px Jolly Lodger"
    label: "Play next"
    keyActionName: "confirm"
    type: Q.SPRITE_UI | Q.SPRITE_DEFAULT

  buttonNext.p.x = Q.width/2 + buttonNext.p.w/2 + 40

  buttonNext.on "click", (e) ->
    # last level just finished
    if Q.state.get("currentLevel") == 6
      Game.stageEndScreen()
      return

    Game.stageLevel(Q.state.get("currentLevel") + 1)

  # button back
  buttonBack = stage.insert new Q.UI.Button
    y: Q.height - marginY
    w: Q.width/4
    h: 70
    fill: "#f2da38"
    radius: 10
    fontColor: "#353b47"
    font: "400 58px Jolly Lodger"
    label: "All levels"
    type: Q.SPRITE_UI | Q.SPRITE_DEFAULT

  buttonBack.p.x = Q.width/2 - buttonBack.p.w/2 - 40

  buttonBack.on "click", (e) ->
    Game.stageLevelSelectScreen()

  # save progress in game
  if Q.state.get("currentLevel") >= Game.availableLevel
    Game.availableLevel = Q.state.get("currentLevel") + 1
    localStorage.setItem(Game.storageKeys.availableLevel, Game.availableLevel)


  # count stars
  score = stage.options.zombies.healed/stage.options.zombies.available
  stars = 0

  if score <= 0.5
    stars = 1
  else if score > 0.5 && score < 0.9
    stars = 2
  else
    stars = 3

  # save only if better than previous
  previousStars = localStorage.getItem(Game.storageKeys.levelProgress + ":" + Q.state.get("currentLevel"))
  if previousStars < stars
    localStorage.setItem(Game.storageKeys.levelProgress + ":" + Q.state.get("currentLevel"), stars)

  # insert stars on the screen
  starsContainer = stage.insert new Q.UI.Container
    x: summaryContainer.p.x + gutterX + columnWidth
    y: Q.height/2

  x = -80 - 20 # width of LevelScoreImg - margin between stars

  for index in [1..3]
    empty = if stars >= index then false else true

    scoreImg = starsContainer.insert new Q.UI.LevelScoreImg
      x: x
      y: -lineHeight/2
      empty: empty

    x += scoreImg.p.w + 20


  # track events
  Game.trackEvent("levelSummary:" + Q.state.get("currentLevel"), "score", score)
  Game.trackEvent("levelSummary:" + Q.state.get("currentLevel"), "stars", stars)

  Game.trackEvent("levelSummary:" + Q.state.get("currentLevel"), "Zombie Mode", stage.options.zombieModeFound)
  Game.trackEvent("levelSummary:" + Q.state.get("currentLevel"), "Health collected", stage.options.health.collected + "/" + stage.options.health.available)
  Game.trackEvent("levelSummary:" + Q.state.get("currentLevel"), "Zombies healed", stage.options.zombies.healed + "/" + stage.options.zombies.available)
  Game.trackEvent("levelSummary:" + Q.state.get("currentLevel"), "Bullets waisted", stage.options.bullets.waisted + "/" + stage.options.bullets.available)

