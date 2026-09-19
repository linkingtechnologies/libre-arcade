from numpy import *
from math import *

import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

from DfConstants import *
from DfArrow import *
from DfDisk import *
from DfLevelData import *
from DfSoundManager import SoundManager


class World:
	def __init__(self, iLevel):
		self.bInit = False
		
		if createLevel(iLevel) == -1:
			return
			
		self.bInit = True
			
		self.objectList = getObjectListForLevel(iLevel)
		self.holeList = getHoleListForLevel(iLevel)
		self.diskList = [Disk(getDiskPosForWorld(iLevel, i), self) for i in range(getNumDisksForWorld(iLevel))]
		self.arrowList = [[calculateArrow(((i + 1) * VECTOR_POINT_SPACING, (j + 1) * VECTOR_POINT_SPACING), self.objectList) for j in range(getWorldY(iLevel))] for i in range(getWorldX(iLevel))]
		self.wallObjectList = getWallListForLevel(iLevel)
		self.winPos = getWinPosForLevel(iLevel)

		
		self.bFinished = False
		
		self.iLevel = iLevel
		self.x = getWorldX(iLevel)
		self.y = getWorldY(iLevel)
		
		self.arrowDList = glGenLists(1)
		
		glNewList(self.arrowDList, GL_COMPILE)
		glBegin(GL_LINE_STRIP)
		for i in range(len(ARRROW_COORDS)):
			glVertex2f(ARRROW_COORDS[i][0], ARRROW_COORDS[i][1])
		glEnd()
		glEndList()
		
		self.borderDList = glGenLists(1)
		glNewList(self.borderDList, GL_COMPILE)
		glColor4f(*BORDER_COLOR)
		glBegin(GL_QUADS)
		# Bottom
		glVertex2f(0.0, 0.0)
		glVertex2f(SCREEN_RES[0], 0.0)
		glVertex2f(SCREEN_RES[0], BORDER_WIDTH)
		glVertex2f(0.0, BORDER_WIDTH)
		
		# Top
		glVertex2f(0.0, SCREEN_RES[1])
		glVertex2f(SCREEN_RES[0], SCREEN_RES[1])
		glVertex2f(SCREEN_RES[0], SCREEN_RES[1] - BORDER_WIDTH)
		glVertex2f(0.0, SCREEN_RES[1] - BORDER_WIDTH)
		
		# Left
		glVertex2f(0.0, 0.0)
		glVertex2f(BORDER_WIDTH, 0.0)
		glVertex2f(BORDER_WIDTH, SCREEN_RES[1])
		glVertex2f(0.0, SCREEN_RES[1])
		
		# Right
		glVertex2f(SCREEN_RES[0], 0.0)
		glVertex2f(SCREEN_RES[0] - BORDER_WIDTH, 0.0)
		glVertex2f(SCREEN_RES[0] - BORDER_WIDTH, SCREEN_RES[1])
		glVertex2f(SCREEN_RES[0], SCREEN_RES[1])
		glEnd()
		glEndList()	


		self.endTargetDList = glGenLists(1)
		
		glNewList(self.endTargetDList, GL_COMPILE)
		for j in range(4):
			if j % 2:
				glColor4f(*END_COLOR_1)
			else:
				glColor4f(*END_COLOR_2)		
		
			glBegin(GL_TRIANGLE_STRIP)	
			for i in range(46):
				angle = (i + (j * 45)) * pi / 90 
				
				glVertex2f(0.0, 0.0)
				glVertex2f(END_RADIUS * cos(angle), END_RADIUS * sin(angle))
		
			
			glEnd()
		glEndList()				
		
		
	def drawVectorFeild(self, bPreview):
		oldStrength = -1
		oldFixedProp = -1
		glPushMatrix()
		
		for arrowSubList in self.arrowList:
			glTranslatef(VECTOR_ARROW_SPACING, 0.0, 0.0)
			glPushMatrix()
			for arrow in arrowSubList:
				glTranslatef(0.0, VECTOR_ARROW_SPACING, 0.0)
				
				pos = arrow.getPos()

				strength = arrow.getStrength()
				
				# Floating point stuff
				if strength > 0.00001:
					fixedProp = arrow.getFixedProportion()
					if fixedProp != oldFixedProp:
						glColor3f(float(1.0 - 2 * fixedProp), 0.0, float(fixedProp))	
						
					normVec = arrow.getNormVec()
				
					if strength != oldStrength:
						if bPreview:
							glLineWidth(float(strength) / 2)
						else:
							glLineWidth(float(strength))
					
					glPushMatrix()
					glRotatef(arrow.getAngle(), 0.0, 0.0, 1.0)
					
					glCallList(self.arrowDList)
					glPopMatrix()
					
					oldFixedProp = fixedProp
					
				else:
					if strength != oldStrength:
						glColor3f(1.0, 0.0, 0.0)
					glBegin(GL_POINTS)
					glVertex2f(0.0, 0.0)
					glEnd()
					
					oldFixedProp = 0
					
				oldStrength = strength
			glPopMatrix()		

					
		glPopMatrix()
		
	def drawBorder(self):
		glCallList(self.borderDList)
		
	def drawWalls(self):
		for wall in self.wallObjectList:
			wall.draw()
	def drawEndTarget(self):
		glPushMatrix()
		glTranslatef(self.winPos[0], self.winPos[1], 0.0)
		glCallList(self.endTargetDList)
		glPopMatrix()
		
	def drawHoles(self):
		for hole in self.holeList:
			hole.draw()
				
	def getVectorAtPoint(self, point):
		# Fairly sure this works
		result = zeros(2, "f")
		
		pointX = float(point[0])
		pointY = float(point[1])
		
		x = fmod(pointX, VECTOR_POINT_SPACING) / VECTOR_POINT_SPACING
		y = fmod(pointY, VECTOR_POINT_SPACING) / VECTOR_POINT_SPACING
	
		#point = point / VECTOR_POINT_SPACING
		pointX /= VECTOR_POINT_SPACING
		pointY /= VECTOR_POINT_SPACING
		# Offset
		pointX -= 1
		pointY -= 1
		
		result += self.arrowList[int(floor(pointX))][int(floor(pointY))].getVec() * (1 - x) * (1 - y)
		if ceil(pointX) < self.x and ceil(pointX) >= 0:
			result += self.arrowList[int(ceil(pointX))][int(floor(pointY))].getVec() * x * (1 - y)
			if ceil(pointY) < self.y and ceil(pointY) >= 0:
				result += self.arrowList[int(ceil(pointX))][int(ceil(pointY))].getVec() * x * y
		if ceil(pointY) < self.y and ceil(pointY) >= 0:
			result += self.arrowList[int(floor(pointX))][int(ceil(pointY))].getVec() * (1 - x) * y

				
		return result
		
	def getWallList(self):
		return self.wallObjectList
		
	def checkVictoryForDisk(self, point):
		if sqrt(sum((point - self.winPos) ** 2)) <= DISK_RADIUS + END_RADIUS:
			return True
		return False
		
	def checkVictory(self):
		for disk in self.diskList:
			if not disk.isFinished():
				return
				
		self.finishLevel()
				
	def finishLevel(self):	
		self.bFinished = True
		
	def isFinished(self):
		return self.bFinished
		
	def rotate(self, bClockWise):
		if bClockWise:
			rot = -ROT_INC
		else:
			rot = ROT_INC
	
		cosRot = cos(rot)
		sinRot = sin(rot)
	
		rotArray = matrix(([cosRot, sinRot], [-sinRot, cosRot]))	
		
		for arrowSubList in self.arrowList:
			for arrow in arrowSubList:
				rotVec = arrow.getRotVec()
				if rotVec.any():
					arrow.changeRotVecDirection(array(rotVec * rotArray)[0])
		
	def update(self, bPreview = False):
		arrowList = self.arrowList
	
		wallList = []
		for wallObject in self.wallObjectList:
			wallObject.update()
			if wallObject.isGenerator():
				wallList += wallObject.getChildWalls()
			else:
				wallList.append(wallObject)
	
		if not bPreview:
			for disk in self.diskList:
				if not disk.isFinished():
					disk.update(self.holeList, wallList)
				
		for object in self.objectList:
			if object.isMoving():
				if object.isFixed():
					getEffectOnPoint = object.getEffectOnPoint
					for arrowSubList in arrowList:
						for arrow in arrowSubList:
							arrow.setRemoveFixedVec(getEffectOnPoint(arrow.getPos(), True))						
				
		for object in self.objectList:
			object.update()
			
		for object in self.objectList:
			if object.isMoving():
				if object.isFixed():
					getEffectOnPoint = object.getEffectOnPoint
					for arrowSubList in arrowList:
						for arrow in arrowSubList:
							arrow.setFixedVec(getEffectOnPoint(arrow.getPos(), True))				
			
		if not bPreview:
			self.checkVictory()

	def draw(self, bPreview = False):
		self.drawVectorFeild(bPreview)
		self.drawWalls()
		self.drawBorder()
		self.drawHoles()
		self.drawEndTarget()
		
		if not bPreview:
			for disk in self.diskList:
				if not disk.isFinished():
					disk.draw()
			
	def genNextLevel(self):
		world = World(self.iLevel + 1)
		SoundManager().playLevelEnd()
		if world.bInit:
			return World(self.iLevel + 1)
		else:
			return None
			
