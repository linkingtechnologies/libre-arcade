# Python file that defines a _very_ simple map

SetMapName("Circular Paths - by MBD")

# Add a number of bricks
for x in range(400-60, 400 + 75, 75):
    for y in range(220-2*25, 220+2*25, 25):
        AddBrick("brick", x, y, "basic_brick_hit()",
                 "graphics/bricks/red2_75.png")

from math import *
factor = pi / 180.0

# Add a kind of circle of bricks.
for t in range(0, 360, 30):
    x = cos(t * factor) * 1.7
    y = sin(t * factor)
    AddBrick("brick", 400 - 24 + x*100, 220 - 8 + y*100,
             "basic_brick_hit()",
             "graphics/bricks/red_75.png") 
    AddBrick("brick", 400 - 24 + x*150, 220 - 8 + y*150,
             "basic_brick_hit()",
             "graphics/bricks/blue_75.png") 
    AddBrick("brick", 400 - 24 + x*200, 220 - 8 + y*200,
             "basic_brick_hit()",
             "graphics/bricks/green_75.png") 
            
# Add the walls
AddEntity("static", -10, -10, 11, 620, "static_hit()")
AddEntity("static", 799, -10, 10, 620, "static_hit()")
AddEntity("static", 1, -10, 798, 11, "static_hit()")
AddEntity("hole", 1, 550, 798, 50, "")

# Add a paddle
SetPaddle(400, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefault("graphics/balls/red.png")

# And, call it - probably will go
RoundStart();
