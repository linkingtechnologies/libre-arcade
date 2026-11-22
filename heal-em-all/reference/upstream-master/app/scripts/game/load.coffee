Q = Game.Q

Q.load Game.assets.all,
  ->
    # prepare sheets
    Q.sheet Game.assets.map.sheetName, Game.assets.map.sheet,
      tileW: Game.assets.map.tileSize
      tileH: Game.assets.map.tileSize

    Q.compileSheets Game.assets.characters.sheet, Game.assets.characters.dataAsset
    Q.compileSheets Game.assets.items.sheet, Game.assets.items.dataAsset
    Q.compileSheets Game.assets.hud.sheet, Game.assets.hud.dataAsset
    Q.compileSheets Game.assets.others.sheet, Game.assets.others.dataAsset
    Q.compileSheets Game.assets.bullet.sheet, Game.assets.bullet.dataAsset

    # first stage
    Game.stageStartScreen()

  , {
    progressCallback: (loaded, total) ->
      element = document.getElementById("loading-progress")
      element.style.width = Math.floor(loaded/total*100) + "%"

      if loaded == total
        container = document.getElementById("loading")
        container.parentNode.removeChild(container)
  }

