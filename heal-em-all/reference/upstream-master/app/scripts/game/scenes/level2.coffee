Q = Game.Q

Q.scene "level2", (stage) ->

  # main map with collision
  Game.map = map = new Q.TileLayer
    type: Game.SPRITE_TILES
    layerIndex: 0
    dataAsset: Game.assets.level2.dataAsset
    sheet: Game.assets.map.sheetName
    tileW: Game.assets.map.tileSize
    tileH: Game.assets.map.tileSize
    z: 2

  stage.collisionLayer map

  # decorations
  background = new Q.TileLayer
    layerIndex: 1,
    type: Game.SPRITE_NONE
    dataAsset: Game.assets.level2.dataAsset
    sheet: Game.assets.map.sheetName
    tileW: Game.assets.map.tileSize
    tileH: Game.assets.map.tileSize
    z: 1

  stage.insert background

  # player
  Game.player = player = stage.insert new Q.Player(Q.tilePos(2.5, 9))

  # camera
  stage.add("viewport")
  Game.setCameraTo(stage, player)

  # enemies
  enemies = [
    ["Zombie", Q.tilePos(9, 6)]
    ["Zombie", Q.tilePos(8, 12, {startLeft: true})]
    ["Zombie", Q.tilePos(20, 6, {startLeft: true})]
    ["Zombie", Q.tilePos(21, 12)]
  ]

  stage.loadAssets(enemies)

  # items
  randomItems = [
    health: Q.tilePos(14.5, 15)
    key: Q.tilePos(14.5, 3)
  ,
    health: Q.tilePos(14.5, 3)
    key: Q.tilePos(14.5, 15)
  ]

  random = Math.floor(Math.random() * 2)

  items = [
    ["Key", randomItems[random].key]
    ["Door", Q.tilePos(27, 9)]
    ["Gun", Q.tilePos(14.5, 9, {bullets: 6})]
    ["Heart", randomItems[random].health]
  ]

  stage.loadAssets(items)

  # store level data for level summary
  Game.currentLevelData.health.available = stage.lists.Heart.length
  Game.currentLevelData.zombies.available = stage.lists.Zombie.length

