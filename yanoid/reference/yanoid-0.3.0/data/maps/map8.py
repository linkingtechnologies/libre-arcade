# Classic diagonal line of stay bricks

SetMapName("The magic ball - by JCD")

# Add a number of bricks
for x in range(0,4,1):
    for y in range(0,10,1):
        AddBrick("brick", 300 - 24 + x * 75, 120 - 8 + y*25,
                 "basic_brick_hit()",
                 "graphics/bricks/red2_75.png")

for y in range(3,7,1):
    AddBrick("brick", 300 - 24 + -1 * 75, 120 - 8 + y*25,
             "basic_brick_hit()",
             "graphics/bricks/red2_75.png")

for y in range(3,7,1):
    AddBrick("brick", 300 - 24 + 4 * 75, 120 - 8 + y*25,
             "basic_brick_hit()",
             "graphics/bricks/red2_75.png")

def this_map_brick_hit(x,y):
   # call basic_brick_hit
   basic_brick_hit()
   # look up the new brick to display
   AddBrick("brick",x,y,"basic_brick_hit()","graphics/bricks/green2_75.png")

def this_map_brick_hit2(x,y):
   # call basic_brick_hit
   basic_brick_hit()
   # look up the new brick to display
   AddBrick("brick",x,y,"this_map_brick_hit(10,500)","graphics/bricks/green2_75.png")

def this_map_brick_hit3(x,y):
   # call basic_brick_hit
   basic_brick_hit()
   # look up the new brick to display
   AddBrick("brick",x,y,"this_map_brick_hit(800-75-10,500)","graphics/bricks/green2_75.png")

def this_map_brick_hit4():
   # call basic_brick_hit
   basic_brick_hit()
   # look up the new brick to display
   for x in range(0,800,80):
       AddBrick("brick",x,400,"basic_brick_hit()","graphics/bricks/blue2_75.png")
       AddBrick("brick",x,430,"basic_brick_hit()","graphics/bricks/yellow_stay_75.png")

AddBrick("brick", 300 - 24 + 1 * 75, 120 - 8 + 10*25,
         "this_map_brick_hit3(10,10),this_map_brick_hit(10,50)",
         "graphics/bricks/red2_75.png")

AddBrick("brick", 300 - 24 + 2 * 75, 120 - 8 + 10*25,
         "this_map_brick_hit2(800-75-10,10),this_map_brick_hit(800-75-10,50)",
         "graphics/bricks/red2_75.png")


AddBrick("brick", 300 - 24 + 1 * 75, 120 - 8 + -1*25,
         "this_map_brick_hit4()",
         "graphics/bricks/red2_75.png")


AddBrick("brick", 300 - 24 + 2 * 75, 120 - 8 + -1*25,
         "basic_brick_hit()",
         "graphics/bricks/red2_75.png")


#for t in range(0,360,30):
#    x = cos(t * factor) 
#    y = sin(t * factor)
#    AddBrick("brick", 400 - 24 + x*100, 220 - 8 + y*100,
#             "basic_brick_hit()",
#             "graphics/bricks/green2_75.png")


# Add the walls
StandardPlayField()

# Add a paddle
SetPaddle(366, 530, "graphics/paddles/square2_75.png")

# define a round start function
def RoundStart():
    AddBallDefaultAtPos(10,100,"graphics/balls/red.png")

# And, call it - probably will go
RoundStart();
