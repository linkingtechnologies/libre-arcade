# Python file that defines a _very_ simple map

SetMapName("Classic 1 - by MBD")

# Add a number of bricks
for x in range(6, 750, 79):
    for y in range(91, 278, 29):
        row = y % 7
        if (row == 0 or row == 6):
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/blue2_75.png")
        elif (row == 1 or row == 5):
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/green2_75.png")
        elif (row == 2 or row == 4):
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/red2_75.png")
        else:
            AddBrick("brick-stay-3", x, y, "basic_brick_hit()",
                     "graphics/bricks/yellow_stay_75.png")
                
            
# Add the walls
StandardPlayField()

# Add a paddle
SetPaddle(366, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefault("graphics/balls/red.png")

# And, call it - probably will go
RoundStart();


