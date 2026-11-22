# main game object
window.Game =
  init: ->
    # engine instance
    @Q = Q = Quintus
      development: true
      audioSupported: [ 'ogg', 'mp3' ]

    # Q.debug = true
    # Q.debugFill = true

    # main setup
    Q.include "Sprites, Scenes, Input, Touch, UI, 2D, Anim, Audio"
    Q.setup
      # width: 640
      # height: 320
      maximize: true
      upsampleWidth: 640
      upsampleHeight: 320
    Q.controls().touch() # touch on screen buttons are rendered when level initialized
    Q.enableSound()

    # game progress
    Game.storageKeys =
      availableLevel: "zombieGame:availableLevel"
      levelProgress: "zombieGame:levelProgress"
    Game.availableLevel = localStorage.getItem(Game.storageKeys.availableLevel) || 1

    # used for collision detection
    @SPRITE_NONE = 0
    @SPRITE_PLAYER = 1
    @SPRITE_TILES = 2
    @SPRITE_ENEMY = 4
    @SPRITE_BULLET = 8
    @SPRITE_PLAYER_COLLECTIBLE = 16
    @SPRITE_HUMAN = 32
    @SPRITE_ZOMBIE_PLAYER = 64
    @SPRITE_ALL = 0xFFFF

    # rest of init
    @prepareAssets()
    @initStats()
    @initUnloadEvent()

    # helpers
    Q.tilePos = (col, row, otherParams = {}) ->
      position =
        x: col * Game.assets.map.tileSize + Game.assets.map.tileSize/2
        y: row * Game.assets.map.tileSize + Game.assets.map.tileSize/2

      Q._extend position, otherParams

    return

  # one place of defining assets
  prepareAssets: ->
    # all assets, only file names
    @assets =
      characters:
        dataAsset: "characters.json"
        sheet: "characters.png"
      items:
        dataAsset: "items.json"
        sheet: "items.png"
      hud:
        dataAsset: "hud.json"
        sheet: "hud.png"
      others:
        dataAsset: "others.json"
        sheet: "others.png"
      bullet:
        dataAsset: "bullet.json"
        sheet: "bullet.png"
      map:
        sheet: "map_tiles.png"
      gradient: "gradient-top.png"

      level1:
        dataAsset: "level1.tmx"
      level2:
        dataAsset: "level2.tmx"
      level3:
        dataAsset: "level3.tmx"
      level4:
        dataAsset: "level4.tmx"
      level5:
        dataAsset: "level5.tmx"
      level6:
        dataAsset: "level6.tmx"

    # audio
    @audio =
      zombieMode: "zombie_mode.mp3"
      playerBg: "player_bg.mp3"
      zombieNotice: "zombie_notice.mp3"
      gunShot: "gun_shot.mp3"
      collected: "collected.mp3"
      playerHit: "player_hit.mp3"
      humanCreated: "human_created.mp3"

    Game.isMuted = false

    # convert to array for Q.load
    assetsAsArray = []
    @objValueToArray(@assets, assetsAsArray)

    # now we can add metadata
    @assets.map.sheetName = "tiles"
    @assets.map.tileSize = 70

    # convert @audio to array
    audioAsArray = []
    @objValueToArray(@audio, audioAsArray)

    # merge assets and audio for Q.load
    @assets.all = assetsAsArray.concat(audioAsArray)

  # helper to conver obj to array
  objValueToArray: (obj, array) ->
    for key, value of obj
      if typeof value == 'string'
        array.push value
      else
        @objValueToArray(value, array)

  initStats: ->
    @Q.stats = stats = new Stats()
    stats.setMode(0) # 0: fps, 1: ms

    # Align top-left
    # stats.domElement.style.position = 'absolute'
    # stats.domElement.style.left = '0px'
    # stats.domElement.style.top = '140px'

    # document.body.appendChild( stats.domElement )

  stageLevel: (number = 1) ->
    Q = @Q

    Q.state.reset
      enemiesCounter: 0
      lives: 3
      bullets: 0
      hasKey: false
      hasGun: false
      currentLevel: number # for saving the progress

    Game.currentLevelData = # for level summary
      zombies:
        healed: 0
        available: 0
      health:
        collected: 0
        available: 0
      bullets:
        waisted: 0
        available: 0
      zombieModeFound: false

    Q.input.touchControls() # render onscreen touch buttons

    Q.clearStages()
    Q.stageScene "level" + number,
      sort: true
    Q.stageScene "hud", 1,
      sort: true

    # the story
    Game.infoLabel.intro()

    # for analytics
    Game.currentScreen = "level" + number

  stageLevelSelectScreen: ->
    @Q.input.disableTouchControls()

    # reset current level state
    @Q.state.set "currentLevel", 0

    @Q.clearStages()
    @Q.stageScene "levelSelect"

    # for analytics
    Game.currentScreen = "levelSelect"

  stageEndLevelScreen: ->
    @Q.input.disableTouchControls()

    @Q.clearStages()
    @Q.stageScene "levelSummary", Game.currentLevelData

    # for analytics
    Game.currentScreen = "levelSummary for level" + @Q.state.get("currentLevel")

  stageStartScreen: ->
    @Q.clearStages()
    @Q.stageScene "start"

    # for analytics
    Game.currentScreen = "start"

  stageEndScreen: ->
    @Q.input.disableTouchControls()
    @Q.clearStages()
    @Q.stageScene "end"

    # for analytics
    Game.currentScreen = "end"

    # track events
    Game.trackEvent("End Screen", "displayed")

  stageControlsScreen: ->
    @Q.clearStages()
    @Q.stageScene "controls"

    # for analytics
    Game.currentScreen = "controls"

  stageGameOverScreen: ->
    @Q.clearStages()
    @Q.stageScene "gameOver"

    # for analytics
    Game.currentScreen = "gameOver"

    # track events
    Game.trackEvent("Game Over Screen", "displayed")

  setCameraTo: (stage, toFollowObj) ->
    stage.follow toFollowObj,
      x: true
      y: true
    ,
      minX: 0
      maxX: Game.map.p.w
      minY: 0
      maxY: Game.map.p.h

  trackEvent: (category, action, label, value) ->
    if !label?
      ga 'send', 'event', category, action
    else if !value?
      ga 'send', 'event', category, action, label.toString()
      # console.log('_gaq.push', category + ' | ', action + ' | ', label.toString())
    else
      ga 'send', 'event', category, action, label.toString(), parseInt(value, 10)
      # console.log('_gaq.push', category + ' | ', action + ' | ', label.toString() + ' | ', parseInt(value, 10))

  initUnloadEvent: ->
    window.addEventListener "beforeunload", (e) ->
      Game.trackEvent("Unload", "Current Screen", Game.currentScreen)

# init game
Game.init()
