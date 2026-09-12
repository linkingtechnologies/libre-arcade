# This script defines a number of interfaces to be used when the
# scripts need to change the game state.

# AdjustScore(int dscore)
# Add dscore (can be negative) to the current score
def AdjustScore(dscore):
    "Adjust the current score"
    yanoid_game.AdjustScore(dscore)

# AdjustLives(int dlives)
# Add dlives (can be negative) to the current number of lives
def AdjustLives(dlives):
    "Adjust the current number of lives"
    yanoid_game.AdjustLives(dlives)

# EnableShot(string type, string pixmap, int time_to_shot,
#            int time_between_shots)
# Enable shots, type should be "" or "REMOVEALL"
# pixmap is the pix to use, time is the time it last in seconds
def EnableShot(type, pixmap, hitfunction, time_to_shot,
               time_between):
    "Enable shots with type, pixmap and time"
    yanoid_game.EnableShot(type, pixmap, hitfunction,
                           time_to_shot*1000, time_between*1000)

# AddMap
# Add a mapname to the list of maps in the game
def AddMap(mapname):
    "Add a map to the list of maps in the game"
    yanoid_game.AddMap(mapname)

