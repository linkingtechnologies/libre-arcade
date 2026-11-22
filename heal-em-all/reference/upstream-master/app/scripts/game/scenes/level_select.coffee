Q = Game.Q

Q.scene "levelSelect", (stage) ->

  # audio
  Q.AudioManager.stopAll()
  Q.AudioManager.clear()

  # layout params
  marginXinP = 20 # %
  marginYinP = 20 # %
  gutterXinP = 8 # %
  gutterYinP = 14 # %
  columnsNo = 3

  # layout math
  columnInP = (100 - (marginXinP * 2) - (columnsNo - 1) * gutterXinP)/columnsNo  # 24%

  marginX = Q.width * marginXinP * 0.01
  gutterX = Q.width * gutterXinP * 0.01
  columnWidth = Q.width * columnInP * 0.01

  marginY = Q.height * marginYinP * 0.01
  gutterY = Q.height * gutterYinP * 0.01
  rowHeight = Q.height * 0.22 # 22%

  # init params
  x = marginX + columnWidth/2
  y = marginY + rowHeight/2
  w = columnWidth
  h = rowHeight

  # add level buttons
  for item in [0..5]

    if item % columnsNo == 0
      x = marginX + columnWidth/2

      if item > 0
        y += rowHeight + gutterY

    enabled = if item + 1 <= Game.availableLevel then true else false

    # put button into container
    container = stage.insert new Q.UI.Container
      x: x
      y: y

    x += columnWidth + gutterX

    container.insert new Q.UI.LevelButton
      level: item + 1
      x: 0
      y: 0
      w: w
      h: h
      enabled: enabled

    # add progress stars
    level = item + 1
    stars = localStorage.getItem(Game.storageKeys.levelProgress + ":" + level)

    if stars
      starsX = -60
      starsY = [34, 50, 40]

      for i in [1..stars]
        container.insert new Q.UI.LevelScoreImgSmall
          x: starsX
          y: starsY[i-1]

        starsX += 60


  # end of adding level buttons


  # add title
  stage.insert new Q.UI.Text
    x: Q.width/2
    y: marginY/2
    label: "Everything begins here!"
    color: "#f2da38"
    family: "Jolly Lodger"
    size: 60

  # authors
  authors = stage.insert new Q.UI.Authors()

  # audio button
  audioButton = stage.insert new Q.UI.AudioButton
    y: marginY/2

  audioButton.p.x = Q.width - marginX - audioButton.p.w/2
