# Python file that defines a _very_ simple map
SetMapName("Tunnel to heaven - by JCD")

# Add a number of bricks
for y in range(90,250,20):
    AddBrick("brick-stay", 400-45-20, 20+y, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")
    AddBrick("brick-stay", 400+20, y, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")
            
for x in range(400-45-50,0,-50):
    AddBrick("brick-stay", x, 90, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")

for x in range(400+49,750,50):
    AddBrick("brick-stay", x, 250, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")

for x in range(400+20+60,750,78):
    for y in range(100, 220, 28):
        row = y % 3
        if row == 0:
            AddBrick("brick-stay-3", x, y, "basic_brick_hit()",
                     "graphics/bricks/red2_75.png")
        elif row == 1:
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/green2_75.png")
        else:
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/blue2_75.png")

for x in range(15,400-45-50,78):
    for y in range(130, 250, 28):
        row = y % 3
        if row == 0:
            AddBrick("brick-stay-3", x, y, "basic_brick_hit()",
                     "graphics/bricks/red2_75.png")
        elif row == 1:
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/green2_75.png")
        else:
            AddBrick("brick", x, y, "basic_brick_hit()",
                     "graphics/bricks/blue2_75.png")

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

