# Python file that defines a _very_ simple map

SetMapName("Buckets of balls - by MBD")

# Add a number of bricks
for x in range(6, 750, 79):
    for y in range(91, 250, 29):
        if (y != 207):
            row = y % 3
            if row == 0:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/blue_75.png")
            elif row == 1:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/green_75.png")
            else:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/red_75.png")
        else:
            if (x % 2 == 1):
                AddBrick("brick-stay-3", x, y, "basic_brick_hit()",
                         "graphics/bricks/yellow_stay_75.png")
            else:
                AddBrick("brick", x + 13, y + 5,
                         "power_up_add_ball_hit()",
                         "graphics/powerups/red_b.png")
                
            
# Add the walls
StandardPlayField()

# Add a number of stay bricks
for x in range (401, 750, 79):
    for y in range (500, 320, -29):
        if (x == 401 or y == 500):
            AddBrick("brick-stay", x, y, "stay_brick_hit()",
                     "graphics/bricks/gray_stay_75.png")
        else:
            row = y % 3
            if row == 0:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/blue_75.png")
            elif row == 1:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/green_75.png")
            else:
                AddBrick("brick", x, y, "basic_brick_hit()",
                         "graphics/bricks/red_75.png")



# Add a paddle
SetPaddle(188, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefault("graphics/balls/red.png")

# And, call it - probably will go
RoundStart();
