from DfConstants import *
from numpy import *

def calculateArrow(pos, objectList):
	fixedVector = zeros(2, "f")
	rotVector = zeros(2, "f")
	
	for object in objectList:
		fixedVector += object.getEffectOnPoint(pos, True)
		rotVector += object.getEffectOnPoint(pos, False)
				
	return Arrow(array(pos, "f"), fixedVector, rotVector)		
		
		
class Arrow:
	def __init__(self, pos, fixedVector, rotVector):
		self.pos = pos
		self.fixedVector = fixedVector
		self.rotVector = rotVector
		self.vector = fixedVector + rotVector
		self.strength = sqrt(sum(self.vector ** 2))
		
		self.fixedStrength = sqrt(sum(fixedVector ** 2))
		
		self.removeFixedVec = array((0, 0), "f")
		
		if self.strength:
			self.fixedProportion = self.fixedStrength / self.strength
		else:
			self.fixedProportion = 0
			
		if self.strength:
			self.normVec = self.vector / self.strength
			self.angle = atan2(float(self.normVec[1]), float(self.normVec[0])) * RAD_TO_DEG

	def getPos(self):
		return self.pos
		
	def getFixedVec(self):
		return self.fixedVector
		
	def getRotVec(self):
		return self.rotVector		
		
	def getVec(self):
		return self.vector 
		
	def getStrength(self):
		return self.strength
		
	def getNormVec(self):
		return self.normVec
		
	def getAngle(self):
		return self.angle
		
	def getFixedStrength(self):
		return self.fixedStrength
		
	def getFixedProportion(self):
		return self.fixedProportion
		
	def setRemoveFixedVec(self, removeFixedVec):
		self.removeFixedVec = removeFixedVec
		
	def setFixedVec(self, addFixedVec):
		vecDifference = addFixedVec - self.removeFixedVec
		if vecDifference.any():
			self.fixedVector += vecDifference
				
			self.vector += vecDifference
			self.strength = sqrt(sum(self.vector ** 2))
			
			if self.strength:
				self.normVec = self.vector / self.strength
				self.angle = atan2(float(self.normVec[1]), float(self.normVec[0])) * RAD_TO_DEG

			self.fixedStrength = sqrt(sum(self.fixedVector ** 2))
				
			if self.strength:
				self.fixedProportion = self.fixedStrength / self.strength	
			else:
				self.fixedProportion = 0
	def getFixedVec(self):
		return self.fixedVector
		
	def changeRotVecDirection(self, rotVector):
		self.rotVector = rotVector
		self.vector = self.fixedVector + rotVector
		self.strength = sqrt(sum(self.vector ** 2))
		
		if self.strength:
			self.normVec = self.vector / self.strength
			self.angle = atan2(float(self.normVec[1]), float(self.normVec[0])) * RAD_TO_DEG
		
		
		
		