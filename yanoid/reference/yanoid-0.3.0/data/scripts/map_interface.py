# This file defines a number of helper functions to be used by map defining code

# SetMapName(string name)
# Defines a string to be shown to the user, with the name of
# the map, and possibly the creator
def SetMapName(name):
    yanoid_map.MapName(name)

# AddBrick(string type, int x, int y, string hitfunction, string pixmap)
# Adds a brick of type type at x, y, with pixmap pixmap.
def AddBrick(type, x, y, hitfunction, pixmap):
    "Add a brick to the current map"
    yanoid_map.AddObject(type, hitfunction, x, y, 0, 0, pixmap)

# AddEntity(string type, int x, int y, int w, int h, string hitfunction)
# Adds a static (simple object, no pixmap) at x,y having size w,h
def AddEntity(type, x, y, w, h, hitfunction):
    "Add a static (simple object, no pixmap) to the current map"
    yanoid_map.AddObject(type, hitfunction, x, y, w, h, "")

# AddBallDefault(string pixmap)
# Adds a ball at a default position
def AddBallDefault(pixmap):
    "Adds a ball at a default position"
    yanoid_map.AddObject("default-ball", "ball_hit()", 0, 0, 0, 0, pixmap)

# AddBallDefault(string pixmap)
# Adds a ball at a default position
def AddBallDefaultAtPos(x, y, pixmap):
    "Adds a ball at a default position"
    yanoid_map.AddObject("default-ball", "ball_hit()", x, y, 0, 0, pixmap)

# SetPaddle(int x, int y, string pixmap)
# Creates and sets the paddle for the current map
# Will expose more attributes later
def SetPaddle(x, y, pixmap):
    "Creates and sets a paddle for the current map"
    yanoid_map.SetPaddle(x, y, "FreeMotion", 0.0, 0.0, pixmap)

# AddBall(string pixmap)
# Creates a ball at the position of the current entity
# Meant to be called from a hitfunction
def AddBall(pixmap):
    "Adds a ball at the position of the current entity"
    yanoid_map.PowerUp("spawn-ball", pixmap, "ball_hit()")
    
# This creates a "standard" playfield.

def StandardPlayField():
    # Left wall
    AddEntity("static", -50, -50, 51, 700, "static_hit()")
    # Right wall
    AddEntity("static", 799, -50, 51, 700, "static_hit()")
    # Top
    AddEntity("static", 1, -10, 798, 11, "static_hit()")
    # Bottom
    AddEntity("hole", 1, 599, 798, 100, "")    
    #AddEntity("static", 1, 550, 798, 50, "static_hit()")    
    
