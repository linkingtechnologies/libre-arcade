# This file defines a number of functions that are related to the powerups

# This interface is probably a bit akward - I know to little python...

# This global variable can be set from the maps, and define
# the probability of spawning a powerup when RandomlySpawnPowerup
# is called, in percent. Default is 20 %, which means that in 20 % of the
# cases, a powerup is spawned
# NOTE: There are currently no way to reset this value. 

powerup_spawn_probability = 20;

# Do I need to import math, before importing random?
from math import *
from random import randrange

# The powerups are defined in here. The first number in each sublist
# is the "weight" of the powerup.
powerups = [ [9, "powerup_spawn_ball()"],

             [2, "powerup_spawn_life()"],
             [2, "powerup_spawn_remove_life()"],

             [6, "powerup_spawn_shot()"],
             [3, "powerup_spawn_super_shot()"],

             [2, "powerup_spawn_normal_paddle()"],
             [4, "powerup_spawn_wide_paddle()"],
             [3, "powerup_spawn_narrow_paddle()"],

             [1, 'powerup_spawn_point_adjust("graphics/powerups/lightblue_-1000.png", "-1000")'],
             [2, 'powerup_spawn_point_adjust("graphics/powerups/lightblue_-500.png", "-500")'],
             [3, 'powerup_spawn_point_adjust("graphics/powerups/lightblue_-100.png", "-100")'],
             [3, 'powerup_spawn_point_adjust("graphics/powerups/lightblue_100.png", "100")'],
             [2, 'powerup_spawn_point_adjust("graphics/powerups/lightblue_500.png", "500")'],
             [1, 'powerup_spawn_point_adjust("graphics/powerups/lightblue_1000.png", "1000")']

             ]

# Calculate the total weights, when loaded
totalweights = 0
for powerup in powerups:
    totalweights = totalweights + powerup[0]


# This function spawns a powerup and is the one scripts should call.
def RandomlySpawnPowerup():
    if (randrange(0, 100, 1) > (100 - powerup_spawn_probability)):
        # Spawn one from the list
        weight = randrange(0, totalweights, 1)
        sum = 0
        for powerup in powerups:
            sum = sum + powerup[0]
            if (weight <= sum):
                # Use this powerup
                eval(powerup[1])
                break
                
# Here comes the actual functions - this could be done smarter, I guess
# but for now, it will have to do...

######################################################################
# Extra ball
def powerup_spawn_ball():
    yanoid_map.PowerUp("powerup", "graphics/powerups/red_b.png",
                       "powerup_ball_hit()")
    
def powerup_ball_hit():
    PlaySound("sounds/powerup_collect.wav")
    yanoid_map.PowerUp("spawn-ball", "graphics/balls/red.png",
                       "ball_hit()")

######################################################################
# Life
def powerup_spawn_life():
    yanoid_map.PowerUp("powerup", "graphics/powerups/blue_1UP.png",
                       "powerup_life_hit()")
    
def powerup_life_hit():
    PlaySound("sounds/powerup_collect.wav")
    AdjustLives(1)

def powerup_spawn_remove_life():
    yanoid_map.PowerUp("powerup", "graphics/powerups/yellow_steallife.png",
                       "powerup_remove_life_hit()")
    
def powerup_remove_life_hit():
    PlaySound("sounds/powerup_bad.wav")
    AdjustLives(-1)

######################################################################
# Shots

# Shot (simple)
def powerup_spawn_shot():
    yanoid_map.PowerUp("powerup", "graphics/powerups/green_s.png",
                       "powerup_shot_hit()")
    
def powerup_shot_hit():
    PlaySound("sounds/powerup_collect.wav")
    EnableShot("", "graphics/shots/greenball.png", "", 20,
               1)

# Super shot
def powerup_spawn_super_shot():
    yanoid_map.PowerUp("powerup", "graphics/powerups/purple_ss.png",
                       "powerup_super_shot_hit()")
    
def powerup_super_shot_hit():
    PlaySound("sounds/powerup_collect.wav")
    EnableShot("REMOVEALL", "graphics/shots/penetrating.png",
               "", 12, 3)

######################################################################
# Normal, wide and narrow paddle
def powerup_spawn_normal_paddle():
    yanoid_map.PowerUp("powerup", "graphics/powerups/powerup_normal.png",
                       "powerup_size_paddle_hit('normal', 0)")

def powerup_spawn_wide_paddle():
    yanoid_map.PowerUp("powerup", "graphics/powerups/powerup_larger.png",
                       "powerup_size_paddle_hit('wide', 10)")

def powerup_spawn_narrow_paddle():
    yanoid_map.PowerUp("powerup", "graphics/powerups/powerup_smaller.png",
                       "powerup_size_paddle_hit('narrow', 10)")

def powerup_size_paddle_hit(size, seconds):
    if ("narrow" == size):
        PlaySound("sounds/powerup_bad.wav")
    else:
        PlaySound("sounds/powerup_collect.wav")
    yanoid_map.PowerUp("size-paddle", size, str(seconds))
    
######################################################################
# Point powerups
# Not, both pixmap and point are strings
def powerup_spawn_point_adjust(pixmap, point):
    yanoid_map.PowerUp("powerup", pixmap,
                       "powerup_point_adjust_hit("+point+")")

def powerup_point_adjust_hit(point):
    if (point < 0):
        PlaySound("sounds/powerup_bad.wav")
    else:
        PlaySound("sounds/powerup_collect.wav")
    AdjustScore(point)
        
