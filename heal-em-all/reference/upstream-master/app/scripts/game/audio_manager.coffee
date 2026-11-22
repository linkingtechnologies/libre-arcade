Q = Game.Q

Q.AudioManager =
  collection: []
  muted: false

  add: (audio, options) ->
    item =
      audio: audio
      options: options

    if options?.loop == true
      alreadyAdded = @find(audio)

      if alreadyAdded == false
        @collection.push item

    if !@muted
      Q.audio.play item.audio, item.options

  remove: (audio) ->
    indexToRemove = null

    indexToRemove = @find(audio)

    if indexToRemove >= 0
      Q.audio.stop(@collection[indexToRemove].audio)
      @collection.splice(indexToRemove, 1)

  find: (audio) ->
    for item, index in @collection
      if item.audio == audio
        return index

    return false

  playAll: ->
    for item in @collection
      Q.audio.play item.audio, item.options

  stopAll: ->
    Q.audio.stop()

  clear: ->
    @collection = []

  mute: ->
    @muted = true
    @stopAll()

  unmute: ->
    @muted = false
    @playAll()
