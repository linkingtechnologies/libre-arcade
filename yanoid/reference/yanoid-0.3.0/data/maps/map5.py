# Classic diagonal line of stay bricks

SetMapName("Diagonal Frustration - by MBD")

# Add a number of bricks
width = 79
height = 29
xoffset = 6
yoffset = 50

for xc in range(0, 10, 1):
    for yc in range(0, 9, 1):
        row = yc % 3
        x = xoffset + xc * width
        y = yoffset + yc * height
        if (xc == yc):
            AddBrick("brick-stay", x, y, "stay_brick_hit()",
                     "graphics/bricks/gray_stay_75.png")
        else:
            if row == 0:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/blue_75.png")
            elif row == 1:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/green_75.png")
            else:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/red_75.png")
            
# Add the walls
StandardPlayField()

# Add a paddle
SetPaddle(366, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefault("graphics/balls/red.png")

# And, call it - probably will go
RoundStart();
