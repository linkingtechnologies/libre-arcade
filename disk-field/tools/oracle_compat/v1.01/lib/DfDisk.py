from numpy import *
from math import *

from OpenGL.GL import *
from OpenGL.GLU import *
import pygame

from DfConstants import *
from DfSoundManager import SoundManager

class Disk:
	def __init__(self, pos, world):
		self.world = world
	
		self.startPos = array(pos, "f")
		self.pos = array(pos, "f")
		self.rotation = 0
		
		self.speed = array((0, 0), "f")
		self.realSpeed = array((0, 0), "f")
		self.angularV = 0
		
		self.scale = 1
		
		self.bBlades = False
		
		self.radius = DISK_RADIUS
		self.radiusSq = self.radius ** 2
		self.mass = DISK_MASS
		self.MoI = 0.5 * self.mass * (self.radius ** 2)
		self.holeStep = 0
		
		self.bFinished = False
		
		self.drawDList = glGenLists(1)
		
		self.generateDList()
					   
		
	def getRotation(self):
		return self.rotation
		
	def getRadius(self):
		return self.radius
		
	def generateDList(self):
		if (self.bBlades):
			glNewList(self.drawDList, GL_COMPILE)
			for j in range(4):
				if j % 2:
					glColor4f(*DISK_COLOR_1)
				else:
					glColor4f(*DISK_COLOR_2)		
			
				glBegin(GL_TRIANGLE_STRIP)	
				for i in range(46):
					angle = (i + (j * 45)) * pi / 90 
					
					glVertex2f(0.0, 0.0)
					glVertex2f(self.radius * 0.75 * cos(angle), self.radius * 0.75 * sin(angle))
			
				
				glEnd()
				
				glColor4f(*BLADE_COLOR)
					
				glBegin(GL_TRIANGLE_STRIP)	
				for i in range(23):
					angle = (i + (j * 45)) * pi / 90
						
					glVertex2f(self.radius * 0.75 * cos(angle), self.radius * 0.75 * sin(angle))
					glVertex2f(self.radius * cos(angle), self.radius * sin(angle))
					
				glEnd()			
				
			glEndList()
		else:
			glNewList(self.drawDList, GL_COMPILE)
			for j in range(4):
				if j % 2:
					glColor4f(*DISK_COLOR_1)
				else:
					glColor4f(*DISK_COLOR_2)		
			
				glBegin(GL_TRIANGLE_STRIP)	
				for i in range(46):
					angle = (i + (j * 45)) * pi / 90 
					
					glVertex2f(0.0, 0.0)
					glVertex2f(self.radius * cos(angle), self.radius * sin(angle))
			
				glEnd()			
			glEndList()			
		
	def shrink(self):
		self.radius /= 2.0
		self.radiusSq = self.radius ** 2
		self.mass /= 4.0
		self.MoI = 0.5 * self.mass * (self.radius ** 2)	

		self.generateDList()
		
	def grow(self):
		self.radius *= 2.0
		self.radiusSq = self.radius ** 2
		self.mass *= 4.0
		self.MoI = 0.5 * self.mass * (self.radius ** 2)	

		self.generateDList()
		
	def giveBlades(self):
		self.bBlades = True
		self.radius /= 0.75
		self.radiusSq = self.radius ** 2		
		self.generateDList()
		
	def isBlades(self):
		return self.bBlades
		
	def isFinished(self):
		return self.bFinished
		
	def doThud(self, oldSpeed, oldPos, oldAngularV, collisionNormal):
		if not SoundManager().isSoundOn():
			return 
			
		linEnergyBefore = 0.5 * self.mass * dot(oldSpeed, collisionNormal) ** 2
					   
		linEnergyAfter = 0.5 * self.mass * dot(self.pos - oldPos, collisionNormal) ** 2
		
		if linEnergyBefore - linEnergyAfter > 0:
			if pygame.mixer.find_channel():	
				SoundManager().playThudSound((linEnergyBefore - linEnergyAfter) / 15.0)
		
	def reset(self):
		self.pos = self.startPos.copy()
		self.speed = array((0, 0), "f")
		
	def checkCrumble(self, wall, collisionVector):

		if wall.isCrumble() and 0.5 * self.MoI * self.angularV ** 2 > MIN_ROT_ENERGY_FOR_BREAK and\
								-0.5 * self.mass * dot(self.speed, collisionVector) > MIN_LIN_ENERGY_FOR_BREAK:
			wall.crumble()		
			self.speed *= BREAK_SPEED_FAC
			self.angularV *= BREAK_ANG_VEL_FAC
			return True
		return False
		
	def update(self, holeList, wallList, bCollsionOnly = False):
		if self.holeStep:		
			if self.holeStep == 30:
				self.scale = 0.5		
			elif self.holeStep == 29:
				self.scale = 0					
			elif self.holeStep == 4:
				self.pos = self.hole.getTarget().copy()
				SoundManager().playWhiteHoleSound()
			elif self.holeStep == 3:
				self.scale = 0			
			elif self.holeStep == 2:
				self.scale = 0.5							
			elif self.holeStep == 1:
				self.scale = 1
		
			self.holeStep -= 1
			return
	
		bCollision = False	
		
		oldSpeed = self.realSpeed
		oldPos = self.pos.copy()
		oldAngularV = self.angularV
		
		if not bCollsionOnly:
			self.speed *= 0.9
			self.angularV *= 0.99
			
		
			self.speed += self.world.getVectorAtPoint(self.pos) / self.mass
			
			self.angularV += self.world.getVectorAtPoint(array((self.pos[0] + self.radius, self.pos[1])))[1] / self.MoI
			self.angularV -= self.world.getVectorAtPoint(array((self.pos[0] - self.radius, self.pos[1])))[1] / self.MoI
			self.angularV -= self.world.getVectorAtPoint(array((self.pos[0], self.pos[1] + self.radius)))[0] / self.MoI
			self.angularV += self.world.getVectorAtPoint(array((self.pos[0], self.pos[1] - self.radius)))[0] / self.MoI
				
			self.pos += self.speed
			self.rotation += self.angularV
		
		# Check for out of bounds
		if self.pos[0] <= BORDER_WIDTH + self.radius:
			collisionNormal = array((-1, 0), "f")
			# Simple reflection of x speed
			self.speed[0] = -self.speed[0] * COLLISION_LOSS
			
			tangSpeed = self.speed[1]
			angVel = self.angularV

			self.speed[1] -= (tangSpeed - (self.radius * angVel)) / 32
			self.angularV += (tangSpeed - (self.radius * angVel)) / 32
			
			self.pos[0] = BORDER_WIDTH + self.radius
			
			bCollision = True
			self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
			
		elif self.pos[0] >= SCREEN_RES[0] - BORDER_WIDTH - self.radius:
			collisionNormal = array((1, 0), "f")
			self.speed[0] = -self.speed[0] * COLLISION_LOSS
			
			tangSpeed = self.speed[1]
			angVel = self.angularV
			
			self.speed[1] += (tangSpeed + (self.radius * angVel)) / 32
			self.angularV -= (tangSpeed + (self.radius * angVel)) / 32
			
			self.pos[0] = SCREEN_RES[0] - BORDER_WIDTH - self.radius
			
			bCollision = True
			self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
				
		if self.pos[1] <= BORDER_WIDTH + self.radius:
			collisionNormal = array((0, 1), "f")
			self.speed[1] = -self.speed[1] * COLLISION_LOSS
			
			tangSpeed = self.speed[0]
			angVel = self.angularV
			
			self.speed[0] += (tangSpeed + (self.radius * angVel)) / 32
			self.angularV -= (tangSpeed + (self.radius * angVel)) / 32
			
			self.pos[1] = BORDER_WIDTH + self.radius
			
			bCollision = True
			self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
				
		elif self.pos[1] >= SCREEN_RES[1] - BORDER_WIDTH - self.radius:
			collisionNormal = array((0, -1), "f")
			self.speed[1] = -self.speed[1] * COLLISION_LOSS
			
			tangSpeed = self.speed[0]
			angVel = self.angularV
			
			self.speed[0] -= (tangSpeed - (self.radius * angVel)) / 32
			self.angularV += (tangSpeed - (self.radius * angVel)) / 32	
			
			self.pos[1] = SCREEN_RES[1] - BORDER_WIDTH - self.radius
			
			bCollision = True
			self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
			
		for wall in wallList:
			if not wall.isAlive():
				continue
			# Find closest point to centre of circle
			# Check against radius
			# Find vector of centre -> point
			
			if self.pos[0] < wall.left:
				if self.pos[1] < wall.bottom:
					# Possible bottom left impact. Must be with corner.
					collisionVector = array(wall.bottomleft, "f") - self.pos + array((1, 1))
					collisionVectorMagSq = sum(collisionVector ** 2)
					if collisionVectorMagSq < self.radiusSq:
						#print "bottomleft"
						# Collision!
						self.pos = array(wall.bottomleft, "f") - self.radiusSq * collisionVector / collisionVectorMagSq
						
						# See http://planetmath.org/encyclopedia/DerivationOf2DReflectionMatrix.html
						xy2 = 2 * collisionVector[0] * collisionVector[1]
						uxSq = collisionVector[0] ** 2
						uySq = collisionVector[1] ** 2
						reflectionMatrix = (1.0 / collisionVectorMagSq) * matrix(((uxSq - uySq, xy2), (xy2, uySq - uxSq)))
						
						#speedMag = sqrt(sum(speedMag ** 2))
						#collisionVectorMag = sqrt(collisionVector)
						
						#tangSpeed = self.speed * dot(self.speed / speedMag, collisionVector / collisionVectorMag)
						#angVel = self.angularV
						
						#self.speed += (tangSpeed + (self.radius * angVel) * collisionVector / collisionVectorMag) / 32
						#self.angularV -= (tangSpeed - (self.radius * angVel) * collisionVector / collisionVectorMag) / 32				
						
						self.speed = -array(self.speed * reflectionMatrix)[0] * COLLISION_LOSS
						
						bCollision = True
						self.doThud(oldSpeed, oldPos, oldAngularV, collisionVector / sqrt(float(collisionVectorMagSq)))
						if wall.isKillerWall():
							self.reset()
				
				elif self.pos[1] > wall.top:
					# Possible top left impact. Must be with corner.
					collisionVector = array(wall.topleft, "f") - self.pos + array((1, -1))
					collisionVectorMagSq = sum(collisionVector ** 2)
					if collisionVectorMagSq < self.radiusSq:
						#print "topleft"
						self.pos = array(wall.topleft, "f") - self.radiusSq * collisionVector / collisionVectorMagSq
						
						xy2 = 2 * collisionVector[0] * collisionVector[1]
						uxSq = collisionVector[0] ** 2
						uySq = collisionVector[1] ** 2
						reflectionMatrix = (1.0 / collisionVectorMagSq) * matrix(((uxSq - uySq, xy2), (xy2, uySq - uxSq)))
						
						self.speed = -array(self.speed * reflectionMatrix)[0] * COLLISION_LOSS	

						bCollision = True
						self.doThud(oldSpeed, oldPos, oldAngularV, collisionVector / sqrt(float(collisionVectorMagSq)))
						if wall.isKillerWall():
							self.reset()
								
				# Direct impact on LHS
				elif self.pos[0] + self.radius > wall.left and self.pos[0] < wall.centerx:
					#print "left"
					collisionNormal = array((-1, 0), "f")
					#print "Left direct"
					self.speed[0] = -self.speed[0] * COLLISION_LOSS
					
					tangSpeed = self.speed[1]
					angVel = self.angularV
					
					self.speed[1] += (tangSpeed + (self.radius * angVel)) / 32
					self.angularV -= (tangSpeed + (self.radius * angVel)) / 32
					
					self.pos[0] = wall.left - self.radius
					
					self.speed += wall.getSpeed() / 32
					self.angularV += wall.getSpeed()[1] / 32						
					
					bCollision = True
					self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
					if wall.isKillerWall():
						self.reset()				
				
			elif self.pos[0] > wall.right:			
				if self.pos[1] < wall.bottom:
					# Possible bottom right impact. Must be with corner.
					collisionVector = array(wall.bottomright, "f") - self.pos + array((-1, 1))
					collisionVectorMagSq = sum(collisionVector ** 2)
					if collisionVectorMagSq < self.radiusSq:
						#print "bottom right"
						self.pos = array(wall.bottomright, "f") - self.radiusSq * collisionVector / collisionVectorMagSq
					
						xy2 = 2 * collisionVector[0] * collisionVector[1]
						uxSq = collisionVector[0] ** 2
						uySq = collisionVector[1] ** 2
						reflectionMatrix = (1.0 / collisionVectorMagSq) * matrix(((uxSq - uySq, xy2), (xy2, uySq - uxSq)))
						
						self.speed = -array(self.speed * reflectionMatrix)[0] * COLLISION_LOSS	
						
						bCollision = True
						self.doThud(oldSpeed, oldPos, oldAngularV, collisionVector / sqrt(float(collisionVectorMagSq)))
						if wall.isKillerWall():
							self.reset()
								
				elif self.pos[1] > wall.top:
					# Possible top right impact. Must be with corner.
					collisionVector = array(wall.topright, "f") - self.pos + array((-1, -1))
					collisionVectorMagSq = sum(collisionVector ** 2)
					if collisionVectorMagSq < self.radiusSq:
						#print "top right"
						self.pos = array(wall.topright, "f") - self.radiusSq * collisionVector / collisionVectorMagSq
						
						xy2 = 2 * collisionVector[0] * collisionVector[1]
						uxSq = collisionVector[0] ** 2
						uySq = collisionVector[1] ** 2
						reflectionMatrix = (1.0 / collisionVectorMagSq) * matrix(((uxSq - uySq, xy2), (xy2, uySq - uxSq)))
						
						self.speed = -array(self.speed * reflectionMatrix)[0] * COLLISION_LOSS	

						bCollision = True
						self.doThud(oldSpeed, oldPos, oldAngularV, collisionVector / sqrt(float(collisionVectorMagSq)))
						if wall.isKillerWall():
							self.reset()
								
				# Direct impact on RHS
				elif self.pos[0] - self.radius < wall.right and self.pos[0] > wall.centerx:
					#print "right"
					collisionNormal = array((1, 0), "f")
					#print "Right direct"
					self.speed[0] = -self.speed[0] * COLLISION_LOSS
					
					tangSpeed = self.speed[1]
					angVel = self.angularV

					self.speed[1] -= (tangSpeed - (self.radius * angVel)) / 32
					self.angularV += (tangSpeed - (self.radius * angVel)) / 32
					
					self.pos[0] = wall.right + self.radius
					
					self.speed += wall.getSpeed() / 32
					self.angularV += wall.getSpeed()[1] / 32					
					
					bCollision = True
					self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
					if wall.isKillerWall():
						self.reset()			
			
			
			# Easy case - must be direct top or bottom impact
			else:
				if self.pos[1] + self.radius > wall.bottom and self.pos[1] < wall.centery:
					#print "bottom"
					collisionNormal = array((0, -1), "f")
					self.speed[1] = -self.speed[1] * COLLISION_LOSS
					
					tangSpeed = self.speed[0]
					angVel = self.angularV
					
					self.speed[0] -= (tangSpeed - (self.radius * angVel)) / 32
					self.angularV += (tangSpeed - (self.radius * angVel)) / 32
					
					self.speed += wall.getSpeed() / 32
					self.angularV -= wall.getSpeed()[0] / 32
					
					self.pos[1] = wall.bottom - self.radius			
					
					bCollision = True
					self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
					if wall.isKillerWall():
						self.reset()
								
				elif self.pos[1] - self.radius < wall.top and self.pos[1] > wall.centery:
					#print "top"
					collisionNormal = array((0, 1), "f")
					#print "Top direct"
					self.speed[1] = -self.speed[1] * COLLISION_LOSS
					
					tangSpeed = self.speed[0]
					angVel = self.angularV
					
					self.speed[0] += (tangSpeed + (self.radius * angVel)) / 32
					self.angularV -= (tangSpeed + (self.radius * angVel)) / 32	

					self.speed += wall.getSpeed() / 32
					self.angularV -= wall.getSpeed()[0] / 32					
					
					self.pos[1] = wall.top + self.radius
					
					bCollision = True
					self.doThud(oldSpeed, oldPos, oldAngularV, collisionNormal)
					if wall.isKillerWall():
						self.reset()						
			
		self.realSpeed = self.pos - oldPos
		
		for hole in holeList:
			if sqrt(sum((self.pos - hole.getPos()) ** 2)) <= DISK_RADIUS + END_RADIUS:
				SoundManager().playBlackHoleSound()
				self.holeStep = 30
				self.hole = hole
			
		if self.world.checkVictoryForDisk(self.pos):
			self.bFinished = True
		# Sometimes more than one collision can happen
		#elif bCollision and not bCollsionOnly:
		#	self.update(holeList, wallList, True)

			
		
	def draw(self):
		glPushMatrix()
		glTranslatef(float(self.pos[0]), float(self.pos[1]), 0.0)
		glRotatef(self.getRotation() * RAD_TO_DEG, 0.0, 0.0, 1.0)
		if self.scale != 1:
			glScalef(self.scale, self.scale, 1.0)
	
		glCallList(self.drawDList)
		
		glPopMatrix()
		
		
		
		