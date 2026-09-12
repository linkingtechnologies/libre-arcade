# Load the bricks code

scripts = [ "objects/basic_brick.py",
            "objects/powerups.py" ]

for script in scripts:
    put_console("Executing " + yanoid.resolve(script))
    runthis = "execfile('" + yanoid.resolve(script) + "')"
    eval(runthis)

# Define a number of smaller functions here.
def static_hit():
    PlaySound("sounds/bang_on_metal.wav")

def paddle_hit():
    PlaySound("sounds/bang_on_metal.wav")

def ball_hit():
    a = 0

def power_up_add_ball_hit():
    AddBall("graphics/balls/red.png")

def stay_brick_hit():
    PlaySound("sounds/peep.wav")
