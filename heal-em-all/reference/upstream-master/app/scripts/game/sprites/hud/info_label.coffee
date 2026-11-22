Q = Game.Q

Q.UI.InfoLabel = Q.UI.Text.extend "UI.InfoLabel",
  init: (p, defaultProps) ->
    @_super p,
      x: 0
      y: 0
      label: ""
      color: "#222221"
      size: 24
      family: "Boogaloo"

  afterLabelChange: ->
    @calcSize()
    @p.container.p.x = @p.offsetLeft + @p.w/2 + 10
    @p.container.fit(5, 10)
    Q._generatePoints(@)

  intro: ->
    @p.label = "I need to find the way out of here"
    @afterLabelChange()

  keyNeeded: ->
    @p.label = "I need the key"
    @afterLabelChange()

  doorOpen: ->
    @p.label = "Nice! Now I need to 'jump' inside the door"
    @afterLabelChange()

  gunFound: ->
    @p.label = "I found the gun, I can shoot pressing Spacebar"
    @afterLabelChange()

  outOfBullets: ->
    @p.label = "I'm out of ammo"
    @afterLabelChange()

  keyFound: ->
    @p.label = "I found the key, now I need to find the the door"
    @afterLabelChange()

  clear: ->
    @p.label = ""
    @afterLabelChange()

  lifeLevelLow: ->
    @p.label = "I need to be more careful"
    @afterLabelChange()

  extraLifeFound: ->
    @p.label = "I feel better now!"
    @afterLabelChange()

  lifeLost: ->
    @p.label = "That hurts!"
    @afterLabelChange()

  zombieModeOn: ->
    @p.label = "I was bitten. I'm turning. Nooo!"
    @afterLabelChange()

  zombieModeOnNext: ->
    @p.label = "I need to kill myself"
    @afterLabelChange()

  zombieModeOff: ->
    @p.label = "Ok, back to business"
    @afterLabelChange()


