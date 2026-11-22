Q = Game.Q

Q.scene "level6", (stage) ->

  # bg image
  # stage.insert new Q.Background()

  # main map with collision
  Game.map = map = new Q.TileLayer
    type: Game.SPRITE_TILES
    layerIndex: 0
    dataAsset: Game.assets.level6.dataAsset
    sheet: Game.assets.map.sheetName
    tileW: Game.assets.map.tileSize
    tileH: Game.assets.map.tileSize
    z: 2

  stage.collisionLayer map

  # decorations
  background = new Q.TileLayer
    layerIndex: 1,
    type: Game.SPRITE_NONE
    dataAsset: Game.assets.level6.dataAsset
    sheet: Game.assets.map.sheetName
    tileW: Game.assets.map.tileSize
    tileH: Game.assets.map.tileSize
    z: 1

  stage.insert background

  # player
  Game.player = player = stage.insert new Q.Player(Q.tilePos(49.5, 21))

  # camera
  stage.add("viewport")
  Game.setCameraTo(stage, player)

  # enemies by columns
  enemies = [
    ["Zombie", Q.tilePos(17, 15)]
    ["Zombie", Q.tilePos(16, 21, {startLeft: true})]
    ["Zombie", Q.tilePos(17, 27)]

    ["Zombie", Q.tilePos(27, 9, {startLeft: true})]
    ["Zombie", Q.tilePos(28, 15)]
    ["Zombie", Q.tilePos(27, 27, {startLeft: true})]
    ["Zombie", Q.tilePos(28, 33)]

    ["Zombie", Q.tilePos(38, 9)]
    ["Zombie", Q.tilePos(39, 21, {startLeft: true})]
    ["Zombie", Q.tilePos(39, 33)]

    ["Zombie", Q.tilePos(50, 9)]
    ["Zombie", Q.tilePos(49, 15, {startLeft: true})]
    ["Zombie", Q.tilePos(50, 27)]
    ["Zombie", Q.tilePos(49, 33, {startLeft: true})]

    ["Zombie", Q.tilePos(61, 9)]
    ["Zombie", Q.tilePos(60, 21, {startLeft: true})]
    ["Zombie", Q.tilePos(60, 33)]

    ["Zombie", Q.tilePos(72, 9)]
    ["Zombie", Q.tilePos(71, 15, {startLeft: true})]
    ["Zombie", Q.tilePos(72, 21)]
    ["Zombie", Q.tilePos(71, 27, {startLeft: true})]
    ["Zombie", Q.tilePos(72, 33)]

    ["Zombie", Q.tilePos(80, 15)]
    ["Zombie", Q.tilePos(85, 27)]
  ]

  stage.loadAssets(enemies)


  # items
  doorKeyPositions = [
    door: Q.tilePos(50, 3)
    sign: Q.tilePos(48, 3)
    key: Q.tilePos(49.5, 39)
    heart1: Q.tilePos(5, 21)
    heart2: Q.tilePos(94, 21)
  ,
    door: Q.tilePos(49, 39)
    sign: Q.tilePos(51, 39)
    key: Q.tilePos(49.5, 3)
    heart1: Q.tilePos(5, 21)
    heart2: Q.tilePos(94, 21)
  ,
    door: Q.tilePos(4, 21)
    sign: Q.tilePos(6, 21)
    key: Q.tilePos(94, 21)
    heart1: Q.tilePos(49.5, 39)
    heart2: Q.tilePos(49.5, 3)
  ,
    door: Q.tilePos(95, 21)
    sign: Q.tilePos(93, 21)
    key: Q.tilePos(5, 21)
    heart1: Q.tilePos(49.5, 39)
    heart2: Q.tilePos(49.5, 3)
  ]

  bullets = 26
  gunPositions = [
    Q.tilePos(27.5, 9, {bullets: bullets})
    Q.tilePos(27.5, 33, {bullets: bullets})
    Q.tilePos(71.5, 9, {bullets: bullets})
    Q.tilePos(71.5, 33, {bullets: bullets})
  ]

  random = Math.floor(Math.random() * 4)

  items = [
    ["Key", doorKeyPositions[random].key]
    ["Door", doorKeyPositions[random].door]
    ["ExitSign", doorKeyPositions[random].sign]
    ["Gun", gunPositions[random]]
    ["Heart", doorKeyPositions[random].heart1]
    ["Heart", doorKeyPositions[random].heart2]

    ["Heart", Q.tilePos(4.5, 6)]
    ["Heart", Q.tilePos(7.5, 39)]
    ["Heart", Q.tilePos(94.5, 7)]
    ["Heart", Q.tilePos(92.5, 37)]
  ]

  stage.loadAssets(items)

  # store level data for level summary
  Game.currentLevelData.health.available = stage.lists.Heart.length
  Game.currentLevelData.zombies.available = stage.lists.Zombie.length
