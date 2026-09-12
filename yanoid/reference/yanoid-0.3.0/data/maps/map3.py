# Python file that defines map3

SetMapName("VV - by JDC")

# Add a number of bricks
for x in range(1, 9):
        AddBrick("brick", 400-x*40, 50+x*25, "basic_brick_hit()",
                 "graphics/bricks/red2_75.png")
        AddBrick("brick", 400+x*40, 50+x*25, "basic_brick_hit()",
                 "graphics/bricks/red2_75.png")
        AddBrick("brick-stay-3", 400-x*40, 150+x*25, "basic_brick_hit()",
                 "graphics/bricks/gray_75.png")
        AddBrick("brick-stay-3", 400+x*40, 150+x*25, "basic_brick_hit()",
                 "graphics/bricks/gray_75.png")

AddBrick("brick", 400, 50, "basic_brick_hit()",	
                 "graphics/bricks/red2_75.png")
AddBrick("brick-stay-3", 400, 150, "basic_brick_hit()",
	 "graphics/bricks/green2_75.png")

for x in range(1, 3):
        AddBrick("brick", 400-x*40, 250+x*25, "basic_brick_hit()",
                 "graphics/bricks/blue2_75.png")
        AddBrick("brick", 400+x*40, 250+x*25, "basic_brick_hit()",
                 "graphics/bricks/blue2_75.png")

AddBrick("brick", 400, 250, "basic_brick_hit()",
         "graphics/bricks/blue2_75.png")

for x in range(-3, 4):
        AddBrick("brick-stay", 410-x*40, 325, "stay_brick_hit()",
                 "graphics/bricks/gray_weird_48.png")
            
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
