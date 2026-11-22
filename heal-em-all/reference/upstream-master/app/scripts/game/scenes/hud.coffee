Q = Game.Q

Q.scene "hud", (stage) ->

  # stage.insert new Q.UI.RadialGradient()
  stage.insert new Q.UI.LinearGradient()

  # doctor's comments
  Game.playerAvatar = playerAvatar = stage.insert new Q.UI.PlayerAvatar
    z: 10

  infoContainer = stage.insert new Q.UI.Container
    y: 40
    z: 10
    fill: "#fff"

  Game.infoLabel = infoContainer.insert new Q.UI.InfoLabel
    container: infoContainer
    offsetLeft: playerAvatar.p.w

  # enemies counter
  enemiesContainer = stage.insert new Q.UI.Container
    y: 40
    z: 10
    fill: "#232322"

  enemiesContainer.insert new Q.UI.EnemiesCounter()
  enemiesContainer.fit(0, 8)
  enemiesContainer.p.x = Q.width - enemiesContainer.p.w/2 - 60

  stage.insert new Q.UI.EnemiesAvatar
    z: 12

  # bullets counter
  bulletsContainer = stage.insert new Q.UI.Container
    y: 40
    z: 10
    fill: "#232322"

  bulletsImg = bulletsContainer.insert new Q.UI.BulletsImg()
  bulletsContainer.insert new Q.UI.BulletsCounter
    img: bulletsImg.p

  bulletsContainer.fit(0, 8)
  bulletsContainer.p.x = enemiesContainer.p.x - enemiesContainer.p.w/2 - bulletsContainer.p.w/2 - 20 + 30

  # health counter
  healthContainer = stage.insert new Q.UI.Container
    y: 40
    z: 10
    fill: "#232322"

  Game.healthImg = healthImg = healthContainer.insert new Q.UI.HealthImg()
  healthContainer.insert new Q.UI.HealthCounter
    img: healthImg.p

  healthContainer.fit(0, 8)
  healthContainer.p.x = bulletsContainer.p.x - bulletsContainer.p.w/2 - healthContainer.p.w/2 - 20

  # inventory key
  keyContainer = stage.insert new Q.UI.Container
    y: 40
    z: 10
    fill: "#232322"

  keyImg = keyContainer.insert new Q.UI.InventoryKey()

  keyContainer.fit(5, 8)
  keyContainer.p.x = healthContainer.p.x - healthContainer.p.w/2 - keyContainer.p.w/2 - 34


  # buttons
  stage.insert new Q.UI.PauseButton()
  stage.insert new Q.UI.MenuButton()

