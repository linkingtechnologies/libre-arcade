# This script is the most "basic" of all the scripts in yanoid.
# It defines a number of functions for basic communication between the
# main program and the interprenter, and loads a number of other
# scripts in the different subdirectories.

# NOTE: All modules that the main program exports, MUST be exported
# prior to running this script.

######################################################################
# Define console interaction functions
######################################################################

# Define a function to put a python object that can be converted into
# a string - such as a string or a number - onto the console
def put_console(a):
    "Wrapper to put a string printable on the yanoid console"
    yanoid.puts_console(str(a))

# A simple help function - will probably go.
def help():
    "Print some help"
    put_console("")
    put_console("Interprenter help(TM)")
    put_console("---------------------")
    put_console("Try one of the following commands")
    put_console("(remember the i in front and trailing())")
    put_console("put_console(a) - where a is a python expression")
    put_console("yanoid.yreload() - reloads scripts/yanoid.py")
    put_console("                   note the _y_")
    put_console("examples:")
    put_console("  i a = [ 'this', 'is', 'a', 'list' ]")
    put_console("  i put_console(a)")
    put_console("  i yanoid.yreload()")


######################################################################
# Load the different submodules.
######################################################################

# A list of python scripts to run
# We collect them here
default_scripts = [ "scripts/map_interface.py",
                    "scripts/game_interface.py",
                    "scripts/client_interface.py",
                    "objects/default.py"
                    ]

# OK; this is weird, but I was totally unable to get the
# execfile to work otherwise....
for script in default_scripts:
    put_console("Executing " + yanoid.resolve(script))
    runthis = "execfile('" + yanoid.resolve(script) + "')"
    eval(runthis)

# This should probably not go here, but for now I need to put i here to
# fix dependcies (client_interface needs to be loaded)

# This preloads sounds to make sure that it does not lag the first
# time it is played
sounds = [ "sounds/pop.wav",
           "sounds/powerup_collect.wav",
           "sounds/fire.wav",
           "sounds/peep.wav",
	   "sounds/bang_on_metal.wav"]

for sound in sounds:
    put_console("Caching sound " + yanoid.resolve(sound))
    LoadSound(sound)
