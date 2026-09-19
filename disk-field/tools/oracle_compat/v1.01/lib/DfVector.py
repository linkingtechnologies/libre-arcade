from numpy import *
from math import *

def rotateVector(vec, rot):
	if not rot:
		return vec
	cosRot = cos(rot)
	sinRot = sin(rot)
	
	rotArray = matrix(([cosRot, sinRot], [-sinRot, cosRot]))
	
	vec = vec * rotArray
	
	return array(vec)[0]