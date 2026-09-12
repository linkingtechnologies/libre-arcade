# Classic diagonal line of stay bricks

SetMapName("Bucket of candy - by JCD")

# Add a number of bricks
x = 400
for y in range(100, 100+20*13, 20):
    AddBrick("brick-stay", x-2*45, y, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")
    AddBrick("brick-stay", x+2*45, y, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")

for x2 in range(x-2*45,x+100,45):
    AddBrick("brick-stay", x2, 100+20*13, "stay_brick_hit()",
             "graphics/bricks/gray_weird_48.png")


for y in range(100, 100+20*12, 25):
    AddBrick("brick", x - 12, y, "basic_brick_hit()",
             "graphics/bricks/red2_75.png")

# Add the walls
StandardPlayField()

# Add a paddle
SetPaddle(366, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefault("graphics/balls/red.png")

# And, call it - probably will go
RoundStart();
