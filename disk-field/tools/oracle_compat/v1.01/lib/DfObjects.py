from math import *
from copy import deepcopy

from numpy import *
import pygame
from OpenGL.GL import *
from OpenGL.GLU import *

from DfConstants import *
from DfVector import *

import random

def roundToGap(pos):
	for i in range(2):
		offset = pos[i] % (VECTOR_ARROW_SPACING / 2)
		if offset > VECTOR_ARROW_SPACING / 4:
			pos[i] -= VECTOR_ARROW_SPACING / 2 - offset
		elif offset != 0:
			pos[i] -= offset
			
	if pos[0] % VECTOR_ARROW_SPACING != pos[1] % VECTOR_ARROW_SPACING:
		pos[1] += VECTOR_ARROW_SPACING / 2

	return pos
	
def round1DToGap(pos, bIntermediate):
	if bIntermediate:
		offset = pos % (VECTOR_ARROW_SPACING / 2)
		if offset > VECTOR_ARROW_SPACING / 4:
			pos -= VECTOR_ARROW_SPACING / 2 - offset
		elif offset != 0:
			pos -= offset	
	else:
		offset = pos % (VECTOR_ARROW_SPACING) + VECTOR_ARROW_SPACING / 2
		
		if offset > VECTOR_ARROW_SPACING / 2:
			pos += VECTOR_ARROW_SPACING - offset
		elif offset != 0:
			pos -= offset			
	
	return pos

class Object:
	def __init__(self, strength, orientation, bFixed):
		self.strength = strength
		self.orientation = orientation
		self.bFixed = bFixed
		
	def update(self):
		return
		
	def isMoving(self):
		return False
		
	def isFixed(self):
		return self.bFixed	
		
class RSquaredObject(Object):
	def __init__(self, pos, strength, orinetation, bFixed):
		Object.__init__(self, strength, orinetation, bFixed)
		self.pos = roundToGap(array(pos, "f"))

	def getEffectOnPoint(self, point, bFixed):
		if self.bFixed == bFixed:
			point = array(point, "f")
			relVec = rotateVector(self.pos - point, self.orientation)
			
			distanceSq = float(sum(relVec ** 2))
			
			if distanceSq:
				return relVec * self.strength / distanceSq
			else:
				return zeros(2, "f")		
		else:
			return array((0, 0), "f")
		
	def move(self, x, y):
		self.pos[0] += x
		self.pos[1] += y
		
	def getPos(self):
		return self.pos
			
class GravityWell(RSquaredObject):
	def __init__(self, pos, strength, bFixed):
		RSquaredObject.__init__(self, pos, strength, 0, bFixed)
		
class Repeller(RSquaredObject):
	def __init__(self, pos, strength, bFixed):
		RSquaredObject.__init__(self, pos, strength, pi, bFixed)		
		
class Spinner(RSquaredObject):
	def __init__(self, pos, strength, bClockwise, bFixed):
		if bClockwise:
			angle = pi / 2
		else:
			angle = 3 * pi / 2
	
		RSquaredObject.__init__(self, pos, strength, angle, bFixed)		
		
class AreaObject(Object):
	def __init__(self, strength, orientation, areaRect, bFixed, bFuzzy):
		Object.__init__(self, strength, orientation, bFixed)
		self.areaRect = areaRect
		
		self.bFuzzy = bFuzzy
		if bFuzzy:
			self.fuzzyRect = areaRect.move(-VECTOR_ARROW_SPACING, -VECTOR_ARROW_SPACING)
			self.fuzzyRect.width += 2 * VECTOR_ARROW_SPACING
			self.fuzzyRect.height += 2 * VECTOR_ARROW_SPACING
		
		self.vector = rotateVector(array((1, 0), "f"), self.orientation) * self.strength
		
	def getEffectOnPoint(self, point, bFixed):
		if self.bFixed == bFixed:
			if self.areaRect.collidepoint(point):
				return self.vector
			elif self.bFuzzy and self.fuzzyRect.collidepoint(point):
				top = self.areaRect.bottom
				bottom = self.areaRect.top
			
				if point[0] < self.areaRect.left:
					if point[1] > top:
						mod = (1 - (sqrt((self.areaRect.left - point[0]) ** 2 + (top - point[1]) ** 2) / VECTOR_ARROW_SPACING))
					elif point[1] < bottom:
						mod = (1 - (sqrt((self.areaRect.left - point[0]) ** 2 + (bottom - point[1]) ** 2) / VECTOR_ARROW_SPACING))
					else:
						mod = (1 - (float(self.areaRect.left - point[0]) /  VECTOR_ARROW_SPACING))
				elif point[0] >= self.areaRect.right:
					if point[1] > top:
						mod = (1 - (sqrt((self.areaRect.right - point[0]) ** 2 + (point[1] - top) ** 2) / VECTOR_ARROW_SPACING))
					elif point[1] < bottom:
						mod = (1 - (sqrt((self.areaRect.right - point[0]) ** 2 + (bottom - point[1]) ** 2) / VECTOR_ARROW_SPACING))
					else:
						mod = (1 - (float(point[0] - self.areaRect.right) /  VECTOR_ARROW_SPACING))
				elif point[1] >= top:
					mod = (1 - (float(point[1] - top) /  VECTOR_ARROW_SPACING))
				elif point[1] <= bottom:
					mod = (1 - (float(bottom - point[1]) /  VECTOR_ARROW_SPACING))
				if mod <= 0:
					return array((0, 0), "f")
				elif mod > 1:
					print("ERROR: getEffectOnPoint", mod)

				return self.vector * mod
						
		return array((0, 0), "f")
		
	def move(self, x, y):
		self.areaRect.move_ip(x, y)
		if self.bFuzzy:
			self.fuzzyRect.move_ip(x, y)
		
	def getPos(self):
		return self.areaRect.topleft
			
class DefaultGravity(AreaObject):
	def __init__(self):
		AreaObject.__init__(self, 0.03, -pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), True, False)
	
		
class MovingObject(Object):
	def __init__(self, object, startX = -1, endX = -1, xVel = 0, startY = -1, endY = -1, yVel = 0.0, fRotSpeed = 0.0):
		self.object = object
		if xVel:
			self.startX = round1DToGap(startX, True)
			self.endX = round1DToGap(endX, True)
		else:
			self.startX = round1DToGap(startX, False)
			self.endX = round1DToGap(endX, False)		
		self.xVel = xVel
		
		if yVel:
			self.startY = round1DToGap(startY, True)
			self.endY = round1DToGap(endY, True)
		else:
			self.startY = round1DToGap(startY, False)
			self.endY = round1DToGap(endY, False)	
		
		self.yVel = yVel
		
		self.fRotSpeed = fRotSpeed
		self.getEffectOnPoint = self.object.getEffectOnPoint
		self.isFixed = self.object.isFixed
		
	#def getEffectOnPoint(self, point, bFixed):
	#	return self.object.getEffectOnPoint(point, bFixed)
		
	def isMoving(self):
		return self.xVel or self.yVel or self.fRotSpeed or self.fFadePerTick
		
	#def isFixed(self):
	#	return self.object.isFixed()
		
	def update(self):
		pos = self.object.getPos()
		
		if (self.xVel < 0 and pos[0] <= self.startX) or (self.xVel > 0 and pos[0] >= self.endX):
			self.xVel = -self.xVel
			
		if (self.yVel < 0 and pos[1] <= self.startY) or (self.yVel > 0 and pos[1] >= self.endY):
			self.yVel = -self.yVel
	
		self.object.move(self.xVel, self.yVel)
		
		self.object.vector = rotateVector(self.object.vector, self.fRotSpeed)

		
class Wall:
	def genDisplayList(self):
		self.wallDList = glGenLists(1)
		
		glNewList(self.wallDList, GL_COMPILE)
		if self.isCrumble():
			glColor4f(*WALL_CRUMBLE_COLOUR)
		elif self.isKillerWall():
			glColor4f(*WALL_KILLER_COLOUR)
		else:
			glColor4f(*WALL_COLOUR)
		glBegin(GL_QUADS)
		glVertex2f(self.left, self.top)
		glVertex2f(self.right, self.top)
		glVertex2f(self.right, self.bottom)
		glVertex2f(self.left, self.bottom)
		glEnd()	
		glEndList()
		
	def draw(self):
		if not self.wallDList:
			self.genDisplayList()
		if self.bAlive:
			glCallList(self.wallDList)

	def move(self, x, y):
		self.move_ip(x, y)
		
	def getPos(self):
		return self.topleft	
		
	def update(self):
		return
		
	def getFadeIndex(self):
		return self.fadeIndex
		
	def isCrumble(self):
		return self.bCrumble
		
	def crumble(self):
		self.bAlive = False
		
	def isAlive(self):
		return self.bAlive
		
	def isKillerWall(self):
		return self.bKiller
		
	def isGenerator(self):
		return False
		
	def getSpeed(self):
		return array((0, 0), "f")
		
class MovingWall(pygame.Rect, Wall):
	def __init__(self, object, startX = -1, endX = -1, xVel = 0, startY = -1, endY = -1, yVel = 0, fadeIndex = -1, bCrumble = False, bKiller = False):
		self.object = object
		if xVel:
			self.startX = round1DToGap(startX, True)
			self.endX = round1DToGap(endX, True)
			if object.__class__ == VWall:
				self.startX += WALL_WIDTH / 2
				self.endX += WALL_WIDTH / 2			
		else:
			self.startX = round1DToGap(startX, False)
			self.endX = round1DToGap(endX, False)			
		self.xVel = xVel

		if yVel:
			self.startY = round1DToGap(startY, True)
			self.endY = round1DToGap(endY, True)
			# A bit hacky
			if object.__class__ == HWall:
				self.startY += WALL_WIDTH / 2
				self.endY += WALL_WIDTH / 2
		else:
			self.startY = round1DToGap(startY, False)
			self.endY = round1DToGap(endY, False)			
		self.yVel = yVel

		self.fadeIndex = fadeIndex
		self.bCrumble = bCrumble
		self.bAlive = True	
		self.bKiller = bKiller
		
		self.wallDList = None		
		
		pygame.Rect.__init__(self, self.object)

	def draw(self):
		if self.isCrumble():
			glColor4f(*WALL_CRUMBLE_COLOUR)
		elif self.isKillerWall():
			glColor4f(*WALL_KILLER_COLOUR)
		else:
			glColor4f(*WALL_COLOUR)
		glBegin(GL_QUADS)
		glVertex2f(self.left, self.top)
		glVertex2f(self.right, self.top)
		glVertex2f(self.right, self.bottom)
		glVertex2f(self.left, self.bottom)
		glEnd()	
		
	def update(self):
		pos = self.getPos()
		
		bSwitch = False
		
		if (self.xVel < 0 and pos[0] <= self.startX) or (self.xVel > 0 and pos[0] >= self.endX):
			self.xVel = -self.xVel
			bSwitch = True
			
		if (self.yVel < 0 and pos[1] <= self.startY) or (self.yVel > 0 and pos[1] >= self.endY):
			self.yVel = -self.yVel
			bSwitch = True
	
		self.move_ip(self.xVel, self.yVel)
		
		return bSwitch
		
	def getSpeed(self):
		return array((self.xVel, self.yVel), "f")
		
	def getCopy(self):
		return MovingWall(self.object, self.startX, self.endX, self.xVel, self.startY, self.endY, self.yVel, self.fadeIndex, self.bCrumble, self.bKiller)
			
class HWall(pygame.Rect, Wall):
	def __init__(self, startX, endX, y, fadeIndex = -1, bCrumble = False, bCorner = False, bTrim = False, bKiller = False):
		startX = round1DToGap(startX, True)
		endX = round1DToGap(endX, True)
		y = round1DToGap(y, False)
		
		if bCorner:
			startX -= WALL_WIDTH / 2
			endX += WALL_WIDTH / 2
		if bTrim:
			startX += WALL_WIDTH / 2
			endX -= WALL_WIDTH / 2			
		
		self.fadeIndex = fadeIndex
		self.bCrumble = bCrumble
		self.bAlive = True
		self.bKiller = bKiller

		pygame.Rect.__init__(self, startX, y + WALL_WIDTH / 2, endX - startX, -WALL_WIDTH)
		
		self.wallDList = None

class VWall(pygame.Rect, Wall):
	def __init__(self, x, startY, endY, fadeIndex = -1, bCrumble = False, bCorner = False, bTrim = False, bKiller = False):
		x = round1DToGap(x, False)
		startY = round1DToGap(startY, True)
		endY = round1DToGap(endY, True)
		
		if bCorner:
			startY -= WALL_WIDTH / 2
			endY += WALL_WIDTH / 2
		if bTrim:
			startY += WALL_WIDTH / 2
			endY -= WALL_WIDTH / 2					

		self.fadeIndex = fadeIndex
		self.bCrumble = bCrumble
		self.bAlive = True
		self.bKiller = bKiller
		
		pygame.Rect.__init__(self, x - WALL_WIDTH / 2, endY, WALL_WIDTH, startY - endY)	
		
		self.wallDList = None
		
class BlackHole:
	def __init__(self, pos, target):
		self.pos = array(pos)
		self.target = array(target)
		self.radius = BLACK_HOLE_RADIUS
		
		self.blackDList = glGenLists(1)
		glNewList(self.blackDList, GL_COMPILE)
		glColor3f(0.0, 0.0, 0.0)
		glBegin(GL_POLYGON)
		for i in range(90):
			rad = i * 4 * pi / 180
			glVertex2f(cos(rad) * self.radius, sin(rad) * self.radius)
		glEnd()
		glEndList()
		
		self.whiteDList = glGenLists(1)
		glNewList(self.whiteDList, GL_COMPILE)
		glColor3f(1.0, 1.0, 1.0)
		glBegin(GL_POLYGON)
		for i in range(90):
			rad = i * 4 * pi / 180
			glVertex2f(cos(rad) * self.radius, sin(rad) * self.radius)
		glEnd()
		glEndList()		
		
	def getPos(self):
		return self.pos
		
	def getTarget(self):
		return self.target
	
	def getRadius(self):
		return self.radius
			
	def draw(self):
		glPushMatrix()
		glTranslatef(float(self.pos[0]), float(self.pos[1]), 0.0)
		glCallList(self.blackDList)
		glPopMatrix()
		glPushMatrix()
		glTranslatef(float(self.target[0]), float(self.target[1]), 0.0)
		glCallList(self.whiteDList)
		glPopMatrix()		
		
class WallGenerator:
	def __init__(self, wallList, frequency):
		self.wallList = wallList
		self.frequency = frequency
		
		self.activeWallList = []
		
		self.iTick = 0
		
	def isGenerator(self):
		return True

	def getChildWalls(self):
		return self.activeWallList
		
	def update(self):
		for wall in self.activeWallList:
			if wall.update():
				self.activeWallList.remove(wall)
		if not (self.iTick % self.frequency):
			spawnWall = random.choice(self.wallList)
			
			self.activeWallList.append(spawnWall.getCopy())
		
		
		self.iTick += 1
		
	def draw(self):
		for wall in self.activeWallList:
			wall.draw()

		
	