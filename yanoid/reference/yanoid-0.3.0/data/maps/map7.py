# Classic diagonal line of stay bricks

SetMapName("Umbrella - by JCD")

# Add a number of bricks
from math import *
factor = pi / 180.0

for t in range(180,370,15):
    x = cos(t * factor) * 3.6
    y = sin(t * factor) * 1.4
    AddBrick("brick", 400 - 38 + x*100, 220 - 8 + y*100,
             "basic_brick_hit()",
             "graphics/bricks/green2_75.png")

for y in range(105,350,30):
    AddBrick("brick", 400-75/2, y,
             "basic_brick_hit()",
             "graphics/bricks/red2_75.png")

AddBrick("brick-stay", 400-75/2, 375,
         "stay_brick_hit()",
         "graphics/bricks/blue2_75.png")

AddBrick("brick-stay", 400-75, 375 + 30,
         "stay_brick_hit()",
         "graphics/bricks/blue2_75.png")

AddBrick("brick-stay", 400-75/2-80, 375,
         "stay_brick_hit()",
         "graphics/bricks/blue2_75.png")

# Add the walls
StandardPlayField()

# Add a paddle
SetPaddle(366, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefaultAtPos(100,450,"graphics/balls/red.png")

# And, call it - probably will go
RoundStart();
