# This file implements a basic_brick object

def basic_brick_hit():
    AdjustScore(10)
    PlaySound("sounds/pop.wav")
    RandomlySpawnPowerup()
