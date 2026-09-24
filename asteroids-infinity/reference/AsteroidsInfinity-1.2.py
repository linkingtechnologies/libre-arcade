#! /usr/bin/env python
# The above line makes this executible in unix systems

#    Asteroids Infinity
#    Inspired by the classic Atari arcade game "Asteroids"
#    Copyright (C) 2009  Ben Whittaker
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.

import pygame
import random
import math
import os
import sys
import string
pygame.init()

try:
    os.chdir(sys.argv[0][:sys.argv[0].rindex("AsteroidsInfinity.py")])
except:
    pass

screensize = (640, 480)
playarea = (700, 540)
viewpoint = [350, 270]
forecolor = (255, 255, 255)
backcolor = (0, 0, 0)

Objects = pygame.sprite.Group()
ProtoObjs = pygame.sprite.Group()
Saucers = pygame.sprite.Group()
Asteroids = pygame.sprite.Group()
Particles = pygame.sprite.Group()
Collidable = pygame.sprite.Group()
Bullets = pygame.sprite.Group()
ShipGroup = pygame.sprite.GroupSingle()
TextGroup = pygame.sprite.RenderUpdates()

def loadsounds():
    global explosion_sound
    global shot_sound
    global thrust_sound
    global beat1_sound
    global beat2_sound
    global life_sound
    global saucer_sound
    explosion_sound = Sound("sounds/explosion.wav")
    shot_sound = Sound("sounds/shot.wav")
    thrust_sound = Sound("sounds/thrust.wav")
    beat1_sound = Sound("sounds/beat1.wav")
    beat2_sound = Sound("sounds/beat2.wav")
    life_sound = Sound("sounds/life.wav")
    saucer_sound = Sound("sounds/saucer.wav")
    if pygame.mixer.get_init() <> None:
        pygame.mixer.set_reserved(2) # reserves channels for the thrust sound and the saucer sound
        pygame.mixer.Channel(1).set_volume(0.5)

def set_volume(volume):
    explosion_sound.set_volume(volume)
    shot_sound.set_volume(volume)
    thrust_sound.set_volume(volume)
    beat1_sound.set_volume(volume)
    beat2_sound.set_volume(volume)
    life_sound.set_volume(volume)
    saucer_sound.set_volume(volume)

def get_highscores():
    if os.access("highscores.txt", os.F_OK) == True:
        try:
            scores_file = open("highscores.txt","r")
            highscores = []
            lines = scores_file.readlines()
            scores_file.close()
            for line in lines:
                line = line.strip()
                line = line.split(":")
                if len(line) < 2:
                    break
                highscores += [(int(line[0]), line[1])]
            while len(highscores) < 10:
                highscores += [(0,"")]
            return highscores
        except:
            print "Could not open highscores and/or could not parse highscores."
            print "Using default highscores."
    highscores = [
        (8128, "PERFECT"),
        (6173, "PRIME"),
        (4540, "11BC"),
        (3798, "RAND"),
        (3141, "PI"),
        (2718, "E"),
        (1764, "LIFE^2"),
        (1024, "10^1010"),
        (525, "BAR"),
        (325, "FOO")
        ]
    return highscores

def save_highscores(highscores):
    scores_file = open("highscores.txt","w")
    for score in highscores:
        scores_file.write(str(score[0]) + ":" + score[1] + "\n")
    scores_file.close()

def get_controls():
    controls = {"left":pygame.K_LEFT, "right":pygame.K_RIGHT, "up":pygame.K_UP, "down":pygame.K_DOWN, "shoot":pygame.K_SPACE, "shield":pygame.K_LCTRL}
    if os.access("controls.txt", os.F_OK) == True:
        controls_file = open("controls.txt", "r")
        for a in ("up", "down", "left", "right", "shoot", "shield"):
            line = controls_file.readline()[:-1]
            if line.isdigit() == True:
                controls[a] = int(line)
        controls_file.close()
    return controls

def save_controls(controls):
    controls_file = open("controls.txt","w")
    for a in ("up", "down", "left", "right", "shoot", "shield"):
        controls_file.write(str(controls[a]) + "\n")
    controls_file.close()

class DummySound():
    def __init__(self, filename):
        pass
    def play(self, loops=0, maxtime=0, fade_ms=0):
        pass
    def stop(self):
        pass
    def fadeout(self, time):
        pass
    def set_volume(self, value):
        pass
    def get_volume(self):
        return 1
    def get_num_channels(self):
        return 0
    def get_length(self):
        return 0

def Sound(filename):
    if pygame.mixer.get_init() == None:
        return DummySound(filename)
    else:
        return pygame.mixer.Sound(filename)

class DummyChannel():
    def __init__(self, ID):
        pass
    def play(self, Sound, loops=0, maxtime=0, fade_ms=0):
        pass
    def stop(self):
        pass
    def set_volume(self, value):
        pass
    def get_volume(self):
        return 1
    def get_busy(self):
        return False
    def queue(self, Sound):
        pass

def Channel(ID):
    if pygame.mixer.get_init() == None:
        return DummyChannel(ID)
    else:
        return pygame.mixer.Channel(ID)

class Text(pygame.sprite.Sprite): # A class of objects for displaying text
    def __init__(self, text, font, pos, align = "left"):
        pygame.sprite.Sprite.__init__(self, TextGroup)
        self.align = align # short for alignment, and can be "left", "right", or "center"
        self.pos = pos
        self.font = font
        self.change(text)
    def change(self, text):
        self.image = self.font.render(text, 1, (forecolor)) # make the text graphic
        for a in range(2):
            self.image.blit(self.image, (0, 0)) # copy the text graphic onto itself to make it brighter
        self.text = text
        width = self.image.get_width()
        height = self.image.get_height()
        if self.align == "left":
            self.rect = pygame.Rect(self.pos[0], self.pos[1], width, height)
        elif self.align == "center":
            self.rect = pygame.Rect(self.pos[0] - width / 2, self.pos[1], width, height)
        else:
            self.rect = pygame.Rect(self.pos[0] - width, self.pos[1], width, height)

def wrap(num, start, end):
    while num < start:
        num += end - start
    while num > end:
        num -= end - start
    return num

def explosion(pos, rel_speed, particles, added_speed = 200):
    for a in range(0, particles):
        angle = random.uniform(0, math.pi * 2)
        speed = random.uniform(0, added_speed)
        Particle(pos, (rel_speed[0] + math.sin(angle) * speed, rel_speed[1] + math.cos(angle) * speed))
    explosion_sound.play()

class Obj(pygame.sprite.Sprite):
    angle = 0
    spin = 0
    def __init__(self, pos, speed, groups = []):
        pygame.sprite.Sprite.__init__(self, groups + [Objects])
        self.pos = list(pos)
        self.speed = list(speed)
        self.set_pos_screen()
        #self.image = image
        #self.image.set_colorkey((66, 66, 66))
        #self.rect = pygame.Rect((self.pos[0] - self.image.get_width() / 2, self.pos[1] - self.image.get_height() / 2), image.get_size())
    def update(self):
        self.angle += self.spin / fps
        self.pos[0] += self.speed[0] / fps
        self.pos[1] += self.speed[1] / fps
        if self.pos[0] > playarea[0]:
            self.pos[0] -= playarea[0]
        elif self.pos[0] < 0:
            self.pos[0] += playarea[0]
        if self.pos[1] > playarea[1]:
            self.pos[1] -= playarea[1]
        elif self.pos[1] < 0:
            self.pos[1] += playarea[1]
        self.set_pos_screen()
        #self.pos_screen = (self.rect.x + self.rect.w / 2, self.rect.y + self.rect.h / 2)
##    def render(self):
##        render_pos = (self.image.get_height() / 2, self.image.get_width() / 2)
##        temp_points = []
##        for point in self.image_points:
##            temp_points.append((math.sin(point[0] + self.angle) * point[1] + render_pos[0], math.cos(point[0] + self.angle) * point[1] + render_pos[1]))
##        self.image.fill((66, 66, 66))
##        pygame.draw.polygon(self.image, (0, 0, 0), temp_points)
##        pygame.draw.aalines(self.image, (255, 255, 255), 1, temp_points)
##
##        #pygame.draw.circle(self.image, (100, 100, 100), render_pos, self.radius, 1)
    def set_pos_screen(self):
        self.pos_screen = [self.pos[0] - viewpoint[0], self.pos[1] - viewpoint[1]]
        max_radius_x = (playarea[0] - screensize[0]) / 2
        max_radius_y = (playarea[1] - screensize[1]) / 2
        #if self.pos_screen[0] - max_radius_x > screensize[0]:
        #    self.pos_screen[0] -= playarea[0]
        #elif self.pos_screen[0] + max_radius_x < 0:
        #    self.pos_screen[0] += playarea[0]
        #if self.pos_screen[1] - max_radius_y > screensize[1]:
        #    self.pos_screen[1] -= playarea[1]
        #elif self.pos_screen[1] + max_radius_y < 0:
        #    self.pos_screen[1] += playarea[1]
        self.pos_screen[0] = wrap(self.pos_screen[0], -max_radius_x, screensize[0] + max_radius_x)
        self.pos_screen[1] = wrap(self.pos_screen[1], -max_radius_y, screensize[1] + max_radius_y)
    def draw(self, surface):
        render_pos = (self.pos_screen[0], self.pos_screen[1])
        dirtyrects = []
        for points_list in self.image_points:
            color = forecolor
            if len(points_list[0]) > 2:
                color = points_list[0]
                points_list = points_list[1:]
            temp_points = []
            for point in points_list:
                temp_points.append((math.sin(point[0] + self.angle) * point[1] + render_pos[0], math.cos(point[0] + self.angle) * point[1] + render_pos[1]))
            pygame.draw.polygon(surface, backcolor, temp_points)
            dirtyrects.append(pygame.draw.aalines(surface, color, 1, temp_points).inflate(2, 2))
            #pygame.draw.circle(surface, (100, 100, 100), render_pos, self.radius, 1)
        return dirtyrects

class Asteroid(Obj):
    def __init__(self, pos, speed, size, groups = []):
        self.size = size
        self.radius = 3 * pow(2, size)
        self.spin = random.uniform(math.pi * -2, math.pi * -2)
        #image = pygame.Surface((self.radius * 4, self.radius * 4))
        self.image_points = [[]]
        for a in range(0, 10):
            angle = a * math.pi / 5 + random.uniform(0, math.pi / 5)
            dist = random.uniform(self.radius * 0.7, self.radius * 1.4)
            self.image_points[0].append((angle, dist))
        Obj.__init__(self, pos, speed, groups + [Asteroids, Collidable])
        self.collision_type = "hard"
        #self.render()
    def collide(self, victim):
        global score
        if victim.collision_type == "Explosive":
            #for a in range(50):
            #    angle = random.uniform(0, math.pi * 2)
            #    speed = random.uniform(0, 10)
            #    Particle(self.pos, (self.speed[0] + math.sin(angle) * speed, self.speed[1] + math.cos(angle) * speed))
            explosion(self.pos, self.speed, 50)
            for a in range(2):
                if self.size > 1:
                    angle = random.uniform(0, math.pi * 2)
                    speed = random.uniform(0, 100)
                    Asteroid(self.pos, (self.speed[0] + math.sin(angle) * speed, self.speed[1] + math.cos(angle) * speed), self.size - 1)
            raise_score(25 * pow(2, 3 - self.size), victim)
            if random.randint(0, 50) == 0:
                if random.randint(1, 3) == 1:
                    SmallSaucer((random.randint(0, screensize[0]), random.randint(0, screensize[1])))
                else:
                    BigSaucer((random.randint(0, screensize[0]), random.randint(0, screensize[1])))
            self.kill()

class Ship(Obj):
    def __init__(self, pos, speed, radius, movement_keys, groups = []):
        self.radius = radius
        self.movement_keys = movement_keys
        #image = pygame.Surface((self.radius * 4, self.radius * 4))
##        self.image_points = [[
##            (0, radius * 1.3),
##            (math.pi / 3, radius),
##            (math.pi * 5 / 6, radius * 1.2),
##            (math.pi, radius / 2),
##            (math.pi * 7 / 6, radius * 1.2),
##            (math.pi * 5 / 3, radius)
##            ]]
        self.normal_points = [[
                (0, radius * 1.3),
                (math.pi / 2, radius / 2),
                (math.pi / 2, radius * 1.2),
                (math.pi * 5 / 6, radius),
                (math.pi * 7 / 6, radius), 
                (math.pi * 3 / 2, radius * 1.2),
                (math.pi * 3 / 2, radius / 2)
            ]]
        self.shield_points = [(math.pi / 10 * a, self.radius * 1.5) for a in range(20)]
        self.image_points = self.normal_points
        Obj.__init__(self, pos, speed, groups + [Collidable])
        self.collision_type = "Explosive"
        #self.render()
        self.gunheat = 0
        self.reloading = 0
        self.bullets = pygame.sprite.Group()
        self.activate_shield(2)
        self.shield = 5
    def control(self, keys):
        self.thrustvolume = 0
        self.spin = 0
        if keys[self.movement_keys["left"]] == 1:
            self.spin += math.pi
            if random.random() < 20 / fps:
                self.exaust(math.pi, (math.pi * 1 / 2, self.radius * 1.2), 1)
            self.thrustvolume = 0.25
        if keys[self.movement_keys["right"]] == 1:
            self.spin -= math.pi
            if random.random() < 20 / fps:
                self.exaust(math.pi, (math.pi * 3 / 2, self.radius * 1.2), 1)
            self.thrustvolume = 0.25
        if keys[self.movement_keys["down"]] == 1:
            self.speed[0] -= math.sin(self.angle) * 400 / 3 / fps
            self.speed[1] -= math.cos(self.angle) * 400 / 3 / fps
            if random.random() < 20 / fps:
                self.exaust(math.pi, (math.pi * 1 / 2, self.radius * 1.2), 1)
                self.exaust(math.pi, (math.pi * 3 / 2, self.radius * 1.2), 1)
            self.thrustvolume = 0.75
        if keys[self.movement_keys["up"]] == 1:
            self.speed[0] += math.sin(self.angle) * 800 / 3 / fps
            self.speed[1] += math.cos(self.angle) * 800 / 3 / fps
            if random.random() < 60 / fps:
                self.exaust(0, (0, -self.radius / 2), 1)
            self.thrustvolume = 1
        Channel(0).set_volume(self.thrustvolume)
        Channel(0).queue(thrust_sound)
        if keys[self.movement_keys["shoot"]] == 1 and self.gunheat < 40 and self.reloading <=  0:
            Bullet(self.pos, (self.speed[0] + math.sin(self.angle) * 400, self.speed[1] + math.cos(self.angle) * 400), self.angle, 4, creator = self, groups = [self.bullets])
            self.gunheat += 10
            self.reloading += 1
        if self.reloading > 0:
            self.reloading -= 20.0 / fps
        if self.gunheat > 0:
            self.gunheat -= 20.0 / fps
        if self.start_shield > 0:
            self.start_shield -= 1.0 / fps
        elif self.collision_type == "Hard":
            self.collision_type = "Explosive"
            self.image_points = self.normal_points
        if keys[self.movement_keys["shield"]] == 1 and self.shield > 0:
            if self.shield > 5:
                self.shield = 5.0
            self.collision_type = "Hard"
            s = self.shield / 5
            self.image_points = [[[int(s * forecolor[n] + (1 - s) * backcolor[n]) for n in (0,1,2)]] + self.shield_points] + self.normal_points
            self.shield -= 2.5 / fps
        elif self.shield < 5:
            self.shield += 0.5 / fps
            self.collision_type = "Explosive"
            self.image_points = self.normal_points
    def exaust(self, rel_angle, rel_pos, amount):
        for a in range(amount):
            angle = self.angle + rel_angle + random.uniform(math.pi / -12, math.pi / 12)
            speed = random.uniform(100, 200)
            pos = [self.pos[0] + math.sin(rel_pos[0] + self.angle) * rel_pos[1], self.pos[1] + math.cos(rel_pos[0] + self.angle) * rel_pos[1]]
            Particle(pos, (self.speed[0] + math.sin(angle) * -speed, self.speed[1] + math.cos(angle) * -speed))
    def activate_shield(self, timer):
        self.start_shield = timer
        self.collision_type = "Hard"
        self.image_points = [self.shield_points] + self.normal_points
    def collide(self, victim):
        if victim not in self.bullets.sprites() and self.collision_type == "Explosive":
            for a in range(0, 7):
                angle = random.uniform(0, math.pi * 2)
                speed = random.uniform(0, 200)
                Stick(self.pos, (self.speed[0] + math.sin(angle) * speed, self.speed[1] + math.cos(angle) * speed), 7)
            explosion(self.pos, self.speed, 25)
            self.kill()

class Saucer(Obj):
    def __init__(self, pos, radius, groups = []):
        Obj.__init__(self, pos, [0, 0], groups + [Particles, ProtoObjs, Saucers])
        self.remove(Objects)
        self.real_radius = radius
        self.radius = 0.5
        self.make_image_points(self.radius)
        self.collision_type = "Explosive"
        angle = random.uniform(0, math.pi * 2)
        speed = random.randint(40, 160)
        self.speed[0] += math.sin(angle) * speed
        self.speed[1] += math.cos(angle) * speed
        self.bullets = pygame.sprite.Group()
        if Saucers.sprites() == [self]:
            #print 1
            Channel(1).play(saucer_sound, -1)
        #else:
            #print 0
    def update(self):
        global viewpoint
        if self.radius < self.real_radius:
            self.radius *= 7**(1 / fps)
            self.make_image_points(self.radius)
        else:
            self.radius = self.real_radius
            self.remove(ProtoObjs)
            self.add(Objects)
            self.add(Collidable)
        if random.random() > 0.35**(1/fps):
            self.speed = list(viewpointspeed)
            angle = random.uniform(0, math.pi * 2)
            speed = random.randint(40, 160)
            self.speed[0] += math.sin(angle) * speed
            self.speed[1] += math.cos(angle) * speed
            # The following commented out chunk off code was an attempt to make saucers avoid asteroids. It didn't work.
##            for a in range(10):
##                self.speed = list(viewpointspeed)
##                angle = random.uniform(0, math.pi * 2)
##                speed = random.randint(40, 160)
##                self.speed[0] += math.sin(angle) * speed
##                self.speed[1] += math.cos(angle) * speed
##                danger = 0
##                for asteroid in Asteroids.sprites():
##                    rel_speed = (asteroid.speed[0] - self.speed[0], asteroid.speed[1] - self.speed[1])
##                    rel_pos = (wrap(asteroid.pos[0] - self.pos[0], -playarea[0]/2, playarea[0]/2), wrap(asteroid.pos[1] - self.pos[1], -playarea[1]/2, playarea[1]/2))
##                    rel_angle = math.atan2(rel_pos[0], rel_pos[1]) - 180
##                    clearance = math.atan2(asteroid.radius + self.radius, math.hypot(rel_pos[0], rel_pos[1]))
##                    #print clearance
##                    ras = math.atan2(rel_speed[0], rel_speed[1])
##                    #print ras
##                    #angle = rel_angle
##                    #speed = 200
##                    #Stick(self.pos, (self.speed[0] + math.sin(angle) * speed, self.speed[1] + math.cos(angle) * speed), 5)
##                    if wrap(rel_angle - clearance, ras - math.pi, ras + math.pi) < ras < wrap(rel_angle + clearance, ras - math.pi, ras + math.pi):
##                        danger = 1
##                        #print "not there"
##                        if a == 9:
##                            print "Aaaaaaaa!!!!!"
##                            break
##                if danger == 0:
##                    break
        Obj.update(self)
    def collide(self, victim):
        if victim not in self.bullets.sprites():
            explosion(self.pos, self.speed, 25)
            for a in range(0, 10):
                angle = random.uniform(0, math.pi * 2)
                speed = random.uniform(0, 200)
                Stick(self.pos, (self.speed[0] + math.sin(angle) * speed, self.speed[1] + math.cos(angle) * speed), self.radius / 2)
            self.kill()
    def make_image_points(self, r):
        self.image_points = [[
                (math.pi / 2, r * 4 / 3),
                (math.pi / 4, r * 3 / 4),
                (-math.pi / 4, r * 3 / 4),
                (-math.pi / 2, r * 4 / 3)
            ], [
                (math.pi * 3 / 4, r * 3 / 4),
                (math.pi / 2, r * 4 / 3),
                (-math.pi / 2, r * 4 / 3),
                (-math.pi * 3 / 4, r * 3 / 4)
            ], [
                (math.pi * 11 / 12, r),
                (math.pi * 3 / 4, r * 3 / 4),
                (-math.pi * 3 / 4, r * 3 / 4),
                (-math.pi * 11 / 12, r)
            ]]
    def kill(self):
        pygame.sprite.Sprite.kill(self)
        if Saucers.sprites() == []:
            Channel(1).stop()

class BigSaucer(Saucer):
    def __init__(self, pos):
        Saucer.__init__(self, pos, 15)
    def update(self):
        Saucer.update(self)
        if random.random() > 0.6**(1/fps) and Objects in self.groups():
            angle = random.uniform(0, math.pi * 2)
            speed = (self.speed[0] + math.sin(angle) * 400, self.speed[1] + math.cos(angle) * 400)
            Bullet([self.pos[0], self.pos[1]], speed, angle, 4, creator = self, groups = [self.bullets])
    def collide(self, victim):
        global score
        Saucer.collide(self, victim)
        raise_score(250, victim)

class SmallSaucer(Saucer):
    def __init__(self, pos):
        Saucer.__init__(self, pos, 10)
    def update(self):
        Saucer.update(self)
        if ShipGroup.sprite <> None:
            target = ShipGroup.sprite
        elif Asteroids.sprites() <> []:
            target = Asteroids.sprites()[0]
        if random.random() > 0.6**(1/fps) and Objects in self.groups():
            angle = math.atan2(target.pos_screen[0] - self.pos_screen[0], target.pos_screen[1] - self.pos_screen[1]) + random.uniform(math.pi / -4, math.pi / 4)
            speed = (self.speed[0] + math.sin(angle) * 400, self.speed[1] + math.cos(angle) * 400)
            Bullet([self.pos[0], self.pos[1]], speed, angle, 4, creator = self, groups = [self.bullets])
    def collide(self, victim):
        global score
        Saucer.collide(self, victim)
        raise_score(1000, victim)

class Particle(Obj):
    def __init__(self, pos, speed, groups = []):
        #image = pygame.Surface((1, 1))
        #image.fill((200, 200, 200))
        Obj.__init__(self, pos, speed, groups + [Particles])
    def update(self):
        if random.random() > 0.35**(1/fps):
            self.kill()
        Obj.update(self)
    def draw(self, surface):
        pos_screen_int = [int(self.pos_screen[0]), int(self.pos_screen[1])]
        surface.set_at(pos_screen_int, forecolor)
        return [pygame.Rect(pos_screen_int, (1, 1))]

class Stick(Obj):
    def __init__(self, pos, speed, radius, groups = []):
        self.radius = radius
        #image = pygame.Surface((radius * 2, radius * 2))
        self.spin = random.uniform(math.pi * -2, math.pi * 2)
        self.image_points = [[(0, 0), (0, radius), (math.pi, radius)]]
        Obj.__init__(self, pos, speed, groups + [Particles])
    def update(self):
        if random.random() > 0.50**(1/fps):
            self.kill          ()
        Obj.update(self)

class Bullet(Obj):
    def __init__(self, pos, speed, angle, radius, creator = None, groups = []):
        self.creator = creator
        self.radius = radius
        self.angle = angle
        #image = pygame.Surface((radius * 2, radius * 2))
        self.image_points = [[(0, radius), (math.pi * 8 / 9, radius), (math.pi * 10 / 9, radius)]]
        self.collision_type = "Explosive"
        Obj.__init__(self, pos, speed, groups + [Collidable, Bullets])
        #self.render()
        self.lifetime = 1
        shot_sound.play()
    def update(self):
        self.lifetime -= 1.0 / fps
        if self.lifetime <= 0:
            self.kill()
        Obj.update(self)
    def collide(self, victim):
        if victim <> self.creator:
            if not (Bullets in victim.groups() and victim.creator == self.creator):
                explosion(self.pos, [(self.speed[a] + victim.speed[a]) / 2 for a in range(2)], 25, 100)
                self.kill()

def raise_score(amount, attacker = None):
    global score
    if attacker == None:
        score += amount
    elif attacker == ShipGroup.sprite:
        score += amount
    elif attacker.__class__ == Bullet and attacker.creator == ShipGroup.sprite:
        score += amount

def main():
    global viewpoint
    global viewpointspeed
    global score
    global fps
    font = pygame.font.Font("font/Vectorb.ttf", 20)
    small_font = pygame.font.Font("font/Vectorb.ttf", 10)
    large_font = pygame.font.Font("font/Vectorb.ttf", 40)
    loadsounds()
    screen = pygame.display.set_mode(screensize)
    screen.fill(backcolor)
    pygame.display.flip()
    fullscreen = 0
    pygame.display.set_caption("Asteroids Infinity")
    volume = 100
    clock = pygame.time.Clock()
    highscores = get_highscores()
    controls = get_controls()
    #    Asteroid([random.randint(0, 1000), random.randint(0, 1000)], (random.randint(-5, 5), random.randint(-5, 5)), 3)
    #Ship([playarea[0] / 2, playarea[1] / 2], [0, 0], 10, {"left":pygame.K_LEFT, "right":pygame.K_RIGHT, "up":pygame.K_UP, "down":pygame.K_DOWN, "shoot":pygame.K_SPACE, "shield":pygame.K_LCTRL}, groups = [ShipGroup])
    viewpointspeed = [0, 0]
    score = 0
    lives = 0
    #lives_text = font.render("Lives : " + str(lives), 1, (255, 255, 255))
    lives_text = Text("Lives : " + str(lives), font, (5, 5))
    level_text = Text("Level N/A", font, (screensize[0] / 2, 5), align = "center")
    score_text = Text("", font, (screensize[0] - 5, 5), align = "right")
    fps_counter = 0
    respawn_time = 2
    running = 1
    for a in range(random.randrange(1, 10)):
        Asteroid((random.randint(0, playarea[0]), random.randint(0, playarea[1])), (random.randint(-100, 100), random.randint(-100, 100)), random.randint(1, 3))
    lastbeat = pygame.time.get_ticks()
    beattype = 1
    mode = "menustart"
    olddirtyrects = []
    while running == 1:
        fps = 1000.0 / clock.tick(100)
        if fps_counter == 1:
            fps_text.change("FPS : " + str(clock.get_fps()))
        keys = pygame.key.get_pressed()
        #if keys[pygame.K_ESCAPE] == True:
        #    break
        events = pygame.event.get()
        for event in events:
            if event.type == pygame.QUIT:
                running = 0
            elif event.type == pygame.KEYDOWN:
                #print event.unicode
                if event.key == pygame.K_ESCAPE:
                    if mode == "play":
                        mode = "gameoverstart"
                    elif mode == "menu":
                        running = 0
                    elif mode == "controls" or mode == "setcontrol":
                        for text in controls_text + menu_items:
                            text.kill()
                        mode = "optionsstart"
                    elif mode <> "gameover":
                        for text in menu_items:
                            text.kill()
                        if mode == "sethighscore":
                            name_text.kill()
                        mode = "menustart"
                if event.key == pygame.K_p and mode == "play": # Pause
                    pause_text1 = Text("PAUSED", large_font, (screensize[0] / 2, screensize[1] / 2 - 65), align = "center")
                    pause_text2 = Text("Press any key to continue", font, (screensize[0] / 2, screensize[1] / 2 + 20), align = "center")
                    TextGroup.draw(screen)
                    pygame.display.flip()
                    while 1:
                        event = pygame.event.wait()
                        if event.type == pygame.KEYDOWN:
                            pause_text1.kill()
                            pause_text2.kill()
                            break
                        if event.type == pygame.QUIT:
                            running = 0
                            break
                    clock.tick()
                if mode == "menu" or mode == "options" or mode == "controls":
                    if event.key == pygame.K_UP or event.key == pygame.K_DOWN:
                        menu_items[selected].change(menu_items[selected].text[1:-1])
                        if event.key == pygame.K_UP:
                            if selected == 0:
                                selected = len(menu_items) - 1
                            else:
                                selected -= 1
                        else:
                            if selected == len(menu_items) - 1:
                                selected = 0
                            else:
                                selected += 1
                        menu_items[selected].change("<" + menu_items[selected].text + ">")
                if mode == "menu":
                    if event.key == pygame.K_RETURN:
                        if selected == 0:
                            for item in menu_items:
                                item.kill()
                            mode = "playstart"
                        elif selected == 1:
                            for item in menu_items:
                                item.kill()
                            mode = "highscoresstart"
                        elif selected == 2:
                            for item in menu_items:
                                item.kill()
                            mode = "optionsstart"
                        elif selected == 3:
                            running = 0
                        title_text.kill()
                if mode == "options":
                    if event.key == pygame.K_RETURN:
                        if selected == 0:
                            if fullscreen == 0:
                                pygame.display.set_mode(screensize, pygame.FULLSCREEN)
                                pygame.mouse.set_visible(False)
                                screen.fill((backcolor))
                                pygame.display.flip()
                                fullscreen = 1
                                menu_items[0].change("<WINDOWED>")
                            else:
                                pygame.display.set_mode(screensize)
                                pygame.mouse.set_visible(True)
                                screen.fill((backcolor))
                                pygame.display.flip()
                                fullscreen = 0
                                menu_items[0].change("<FULLSCREEN>")
                        elif selected == 2:
                            if fps_counter == 0:
                                fps_counter = 1
                                fps_text = Text("", small_font, (2, screensize[1] - 13))
                                menu_items[2].change("<FPS COUNTER OFF>")
                            else:
                                fps_counter = 0
                                fps_text.kill()
                                menu_items[2].change("<FPS COUNTER ON>")
                        elif selected == 3:
                            for item in menu_items:
                                item.kill()
                            mode = "controlsstart"
                        elif selected == 4:
                            for item in menu_items:
                                item.kill()
                            mode = "menustart"
                    if selected == 1:
                        if event.key == pygame.K_LEFT and volume > 0:
                            volume -= 10
                            set_volume(volume / 100.0)
                            menu_items[1].change("<VOLUME: " + str(volume) + "%>")
                        elif event.key == pygame.K_RIGHT and volume < 100:
                            volume += 10
                            set_volume(volume / 100.0)
                            menu_items[1].change("<VOLUME: " + str(volume) + "%>")
                if mode == "controls":
                    if event.key == pygame.K_RETURN:
                        if selected < 6:
                            menu_items[selected].change("< >")
                            mode = "setcontrol"
                        if selected == 6:
                            for text in controls_text + menu_items:
                                text.kill()
                            mode = "optionsstart"
                elif mode == "setcontrol":
                    menu_items[selected].change("<" + pygame.key.name(event.key) + ">")
                    if selected == 0:
                        controls["up"] = event.key
                    elif selected == 1:
                        controls["down"] = event.key
                    elif selected == 2:
                        controls["left"] = event.key
                    elif selected == 3:
                        controls["right"] = event.key
                    elif selected == 4:
                        controls["shoot"] = event.key
                    elif selected == 5:
                        controls["shield"] = event.key
                    save_controls(controls)
                    mode = "controls"
                if mode == "sethighscore":
                    if event.unicode in string.printable[:95] and len(name) < 10:
                        name += event.unicode
                        name_text.change(name + "_")
                    elif event.key == pygame.K_BACKSPACE:
                        name = name[:-1]
                        name_text.change(name + "_")
                    elif event.key == pygame.K_RETURN:
                        highscores += [(score, name.upper())]
                        highscores.sort(reverse = True)
                        highscores = highscores[:10]
                        save_highscores(highscores)
                        for text in menu_items:
                            text.kill()
                        name_text.kill()
                        mode = "highscoresstart"
                if mode == "gameover":
                    for text in gameover_text:
                        text.kill()
                    mode = "highscorecheck"
                if mode == "highscores":
                    for text in menu_items:
                        text.kill()
                    mode = "menustart"
            if event.type == pygame.MOUSEBUTTONDOWN and event.pos == (0, 0):
                pygame.display.set_mode(screensize)
                pygame.mouse.set_visible(True)
                fullscreen = 0
                if mode == "options":
                    menu_items[0].change("<FULLSCREEN>")
                
        #pygame.event.pump()
        a = 0
        if Asteroids.sprites() == []:
            if mode == "play":
                level += 1
                for obj in Objects.sprites():
                    obj.speed[0] -= viewpointspeed[0]
                    obj.speed[1] -= viewpointspeed[1]
                for a in range(level):
                    Asteroid([random.randint(0, playarea[0]), random.randint(0, playarea[1])], (random.randint(-100, 100), random.randint(-100, 100)), 3)
                #level_text = font.render("Level " + str(level), 1, (255, 255, 255))
                level_text.change("Level " + str(level))
                if ShipGroup.sprite <> None:
                    ShipGroup.sprite.activate_shield(2)
                    viewpointspeed = [0, 0]
            else:
                for a in range(random.randrange(1, 10)):
                    Asteroid((random.randint(0, playarea[0]), random.randint(0, playarea[1])), (random.randint(-100, 100), random.randint(-100, 100)), random.randint(1, 3))
                viewpointspeed = [0, 0]
                    
        while a < len(Collidable.sprites()):
            obj1 = Collidable.sprites()[a]
            pos1 = list(obj1.pos)
            for obj2 in Collidable.sprites()[a + 1:]:
                pos2 = list(obj2.pos)
                if pos1[0] - pos2[0] > playarea[0] / 2:
                    pos1[0] -= playarea[0]
                if pos2[0] - pos1[0] > playarea[0] / 2:
                    pos2[0] -= playarea[0]
                if pos1[1] - pos2[1] > playarea[1] / 2:
                    pos1[1] -= playarea[1]
                if pos2[1] - pos1[1] > playarea[1] / 2:
                    pos2[1] -= playarea[1]
                if math.hypot(pos1[0] - pos2[0], pos1[1] - pos2[1]) < obj1.radius + obj2.radius:
                    obj1.collide(obj2)
                    obj2.collide(obj1)
                if obj1.groups() == []:
                    break
            a += 1
        if mode == "menustart":
            title_text = Text("ASTEROIDS INFINITY", large_font, (screensize[0] / 2, screensize[1] / 2 - 180), align = "center")
            menu_items = (
                Text("<PLAY>", large_font, (screensize[0] / 2, screensize[1] / 2 - 80), align = "center"),
                Text("HIGHSCORES", large_font, (screensize[0] / 2, screensize[1] / 2), align = "center"),
                Text("OPTIONS", large_font, (screensize[0] / 2, screensize[1] / 2 + 80), align = "center"),
                Text("QUIT", large_font, (screensize[0] / 2, screensize[1] / 2 + 160), align = "center")
                )
            selected = 0
            mode = "menu"
        if mode == "optionsstart":
            if fullscreen == 0:
                item0 = "<FULLSCREEN>"
            else:
                item0 = "<WINDOWED>"
            item1 = "VOLUME: " + str(volume) + "%"
            if fps_counter == 0:
                item2 = "FPS COUNTER ON"
            else:
                item2 = "FPS COUNTER OFF"
            menu_items = (
                Text(item0, large_font, (screensize[0] / 2, screensize[1] / 2 - 180), align = "center"),
                Text(item1, large_font, (screensize[0] / 2, screensize[1] / 2 - 100), align = "center"),
                Text(item2, large_font, (screensize[0] / 2, screensize[1] / 2 - 20), align = "center"),
                Text("CONTROLS", large_font, (screensize[0] / 2, screensize[1] / 2 + 60), align = "center"),
                Text("BACK", large_font, (screensize[0] / 2, screensize[1] / 2 + 140), align = "center")
                )
            selected = 0
            mode = "options"
        if mode == "controlsstart":
            controls_text = (
                Text("UP: ", font, (screensize[0] / 2, screensize[1] / 2 - 140), align = "right"),
                Text("DOWN: ", font, (screensize[0] / 2, screensize[1] / 2 - 100), align = "right"),
                Text("LEFT: ", font, (screensize[0] / 2, screensize[1] / 2 - 60), align = "right"),
                Text("RIGHT: ", font, (screensize[0] / 2, screensize[1] / 2 - 20), align = "right"),
                Text("SHOOT: ", font, (screensize[0] / 2, screensize[1] / 2 + 20), align = "right"),
                Text("SHIELD: ", font, (screensize[0] / 2, screensize[1] / 2 + 60), align = "right")
                )
            menu_items = (
                Text("<" + pygame.key.name(controls["up"]) + ">", font, (screensize[0] / 2, screensize[1] / 2 - 140), align = "left"),
                Text(pygame.key.name(controls["down"]), font, (screensize[0] / 2, screensize[1] / 2 - 100), align = "left"),
                Text(pygame.key.name(controls["left"]), font, (screensize[0] / 2, screensize[1] / 2 - 60), align = "left"),
                Text(pygame.key.name(controls["right"]), font, (screensize[0] / 2, screensize[1] / 2 - 20), align = "left"),
                Text(pygame.key.name(controls["shoot"]), font, (screensize[0] / 2, screensize[1] / 2 + 20), align = "left"),
                Text(pygame.key.name(controls["shield"]), font, (screensize[0] / 2, screensize[1] / 2 + 60), align = "left"),
                Text("BACK", large_font, (screensize[0] / 2, screensize[1] / 2 + 100), align = "center")
                )
            selected = 0
            setting_key = 0
            mode = "controls"
        if mode == "highscoresstart":
            menu_items = [Text("HIGHSCORES", large_font, (screensize[0] / 2, 40), align = "center")]
            a = -130
            n = 1
            for highscore in highscores:
                menu_items.append(Text(str(n) + ". ", font, (200, screensize[1] / 2 + a), align = "right"))
                menu_items.append(Text(highscore[1], font, (200, screensize[1] / 2 + a), align = "left"))
                menu_items.append(Text(str(highscore[0]), font, (screensize[0] - 150, screensize[1] / 2 + a), align = "right"))
                a += 30
                n += 1
            menu_items.append(Text("PRESS ANY KEY TO CONTINUE", font, (screensize[0] / 2, screensize[1] - 60), align = "center"))
            mode = "highscores"
        if mode == "highscorecheck":
            if score > highscores[-1][0]:
                menu_items = []
                menu_items.append(Text("YOU SET A NEW HIGHSCORE WITH " + str(score) + " POINTS", font, (screensize[0] / 2, screensize[1] / 2 - 40), align = "center"))
                menu_items.append(Text("PLEASE ENTER YOUR NAME", font, (screensize[0] / 2, screensize[1] / 2), align = "center"))
                name_text = Text("_", font, (screensize[0] / 2, screensize[1] / 2 + 40), align = "center")
                name = ""
                mode = "sethighscore"
            else:
                mode = "highscoresstart"
        if mode == "playstart":
                for sprite in Collidable.sprites():
                    sprite.kill() 
                Ship([random.randint(0, playarea[0]), random.randint(0, playarea[0])], [0, 0], 10, controls, groups = [ShipGroup])
                viewpoint = [playarea[0] / 2 - screensize[0] /2, playarea[1] / 2 - screensize[1] /2]
                viewpointspeed = [0, 0]
                score = 0
                lives = 4
                lives_text.change("Lives : " + str(lives))
                level = 0
                next_life = 10000
                mode = "play"
        if mode == "play":
            if score >= next_life:
                lives += 1
                lives_text.change("Lives : " + str(lives))
                life_sound.play()
                next_life += 10000
            if ShipGroup.sprite <> None:
                ship = ShipGroup.sprite
                ship.control(keys)
                #viewpoint[0] = ship.pos[0] - screensize[0] / 2 + ship.speed[0] / fps
                #viewpoint[1] = ship.pos[1] - screensize[1] / 2 + ship.speed[1] / fps
                rel_x = wrap(viewpoint[0] - ship.pos[0], -playarea[0], 0) + screensize[0] / 2
                rel_y = wrap(viewpoint[1] - ship.pos[1], -playarea[1], 0) + screensize[1] / 2
                px = math.fabs(rel_x / (screensize[0] / 8))
                if px > 1: px = 1.0
                py = math.fabs(rel_y / (screensize[1] / 8))
                if py > 1: py = 1.0
                viewpointspeed[0] -= (viewpointspeed[0] - ship.speed[0]) * (1 - ((1-px)**(1 / fps)))
                viewpointspeed[1] -= (viewpointspeed[1] - ship.speed[1]) * (1 - ((1-py)**(1 / fps)))
                p = (1 - (0.1**(1 / fps)))
                viewpoint[0] += -rel_x * p
                viewpoint[1] += -rel_y * p
                viewpoint[0] = wrap(viewpoint[0], 0, playarea[0])
                viewpoint[1] = wrap(viewpoint[1], 0, playarea[1])
                #if not -screensize[0] / 4 < rel_x < screensize[0] / 4:
                #    viewpointspeed[0] = ship.speed[0]
                #if not -screensize[1] / 4 < rel_y < screensize[1] / 4:
                #    viewpointspeed[1] = ship.speed[1]
            elif lives == 0:
                mode = "gameoverstart"
            elif respawn_time <= 0:
                Ship([random.randint(0, playarea[0]), random.randint(0, playarea[1])], [0, 0], 10, controls, groups = [ShipGroup])
                lives -= 1
                #lives_text = font.render("Lives : " + str(lives), 1, (255, 255, 255))
                lives_text.change("Lives : " + str(lives))
                respawn_time = 2
            else:
                respawn_time -= 1.0 / fps
        else:
            if random.random() > 0.98**(1/fps):
                if random.randint(1, 3) == 1:
                    SmallSaucer((random.randint(0, screensize[0]), random.randint(0, screensize[1])))
                else:
                    BigSaucer((random.randint(0, screensize[0]), random.randint(0, screensize[1])))
        if mode == "gameoverstart":
            if ShipGroup.sprite <> None:
                ShipGroup.sprite.kill()
            gameover_text = (
                Text("GAME OVER", large_font, (screensize[0] / 2, screensize[1] / 2 - 40), align = "center"),
                Text("Press any key to continue", font, (screensize[0] / 2, screensize[1] / 2 + 10), align = "center")
                )
            mode = "gameover"
        if pygame.time.get_ticks() >= lastbeat + 10000 / (len(Asteroids.sprites()) + 10):
            lastbeat = pygame.time.get_ticks()
            if beattype == 1:
                beat1_sound.play()
                beattype = 2
            else:
                beat2_sound.play()
                beattype = 1
        viewpoint[0] += viewpointspeed[0] / fps
        viewpoint[1] += viewpointspeed[1] / fps
        Objects.update()
        ProtoObjs.update()
        screen.fill((backcolor))
        #Objects.draw(screen)
        dirtyrects = []
        for sprite in ProtoObjs.sprites():
            dirtyrects += sprite.draw(screen)
        for sprite in Objects.sprites():
            dirtyrects += sprite.draw(screen)
        #screen.blit(level_text, (screensize[0] / 2 - level_text.get_width() / 2, 5))
        #score_text = font.render(str(score), 1, (255, 255, 255))
        score_text.change(str(score))
        #screen.blit(score_text, (screensize[0] - score_text.get_width() - 5, 5))
        #screen.blit(lives_text, (5, 5))
        dirtyrects += TextGroup.draw(screen)
        pygame.display.update(dirtyrects + olddirtyrects)
        olddirtyrects = dirtyrects
main()
pygame.quit()
