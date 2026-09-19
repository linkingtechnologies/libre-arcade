## LEVELING CODE DOESN'T WORK WITH MOVING AREAS

from math import pi

import pygame
from numpy import *

from DfConstants import *
from DfObjects import *

from random import random
from copy import deepcopy

def getNumDisksForWorld(iLevel):
	return len(levelList[iLevel]["diskPos"])

def getDiskPosForWorld(iLevel, iDisk):
	return levelList[iLevel]["diskPos"][iDisk]
	
def getWorldX(iLevel):
	return int(SCREEN_RES[0] / VECTOR_POINT_SPACING) - 1

def getWorldY(iLevel):
	return int(SCREEN_RES[1] / VECTOR_POINT_SPACING) - 1
	
def getObjectListForLevel(iLevel):
	return levelList[iLevel]["objectList"]
	
def getHoleListForLevel(iLevel):
	return levelList[iLevel]["holeList"]
	
def getWallListForLevel(iLevel):
	return levelList[iLevel]["wallList"]
	
def getWinPosForLevel(iLevel):
	return levelList[iLevel]["winPos"]	
		
	
	
levelList = [None for i in range(NUM_LEVELS + 1)]
		
def createLevel(iLevel):
	if iLevel > NUM_LEVELS:
		return -1

	if iLevel == 0:
		levelList[0] = {"name"		 : "Intro",
						"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [Repeller((SCREEN_RES[0] / 2, SCREEN_RES[1] / 2), 120, False),
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2, SCREEN_RES[1] / 2))),
						}
	elif iLevel == 1:			
		levelList[1] = {"name"		 : "Off to the side...",
						"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [Repeller((2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 120, False),
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [],
						"winPos"	 : roundToGap(array((2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2))),
						}			
	elif iLevel == 2:
		levelList[2] = {"name"		 : "Around a corner",
						"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [Repeller((2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING), 110, False),
										GravityWell((7 * SCREEN_RES[0] / 8, 3 * SCREEN_RES[1] / 4), 110, False),
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [HWall(SCREEN_RES[0] / 4, SCREEN_RES[0], SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING)],
						"winPos"	 : roundToGap(array((7 * SCREEN_RES[0] / 8, 3 * SCREEN_RES[1] / 4))),
						}				
					
	elif iLevel == 3:				
		levelList[3] = {"name"		 : "Up we go!",
						"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [Spinner((SCREEN_RES[0] / 2 - 2 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING), 140, True, False),
										Spinner((SCREEN_RES[0] / 2 + 2 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING), 140, False, False),
										GravityWell((SCREEN_RES[0] / 2, 3 * SCREEN_RES[1] / 4), 140, False),
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [VWall(SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING / 2, 0, SCREEN_RES[1] / 2),
										VWall(SCREEN_RES[0] / 2 + 3 * VECTOR_ARROW_SPACING / 2, 0, SCREEN_RES[1] / 2),
										HWall(SCREEN_RES[0] / 4, 3 * SCREEN_RES[0] / 4, 2 * SCREEN_RES[1] / 3),
										VWall(SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING / 2, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										VWall(SCREEN_RES[0] / 2 + 3 * VECTOR_ARROW_SPACING / 2, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2, SCREEN_RES[1] - VECTOR_ARROW_SPACING))),
						}		
	elif iLevel == 4:
		levelList[4] = {"name"		 : "Watch the chute!",
						"diskPos"    : ((VECTOR_ARROW_SPACING + DISK_RADIUS, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [AreaObject(1, pi, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										
										AreaObject(1, -pi / 2, pygame.Rect(VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 2 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - VECTOR_ARROW_SPACING - 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi / 2, pygame.Rect(SCREEN_RES[0] - 2 * VECTOR_ARROW_SPACING, 0, 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - VECTOR_ARROW_SPACING - 3 * VECTOR_ARROW_SPACING), False, False),
										
										AreaObject(2.3, -pi / 2, pygame.Rect(SCREEN_RES[0] / 2 - VECTOR_ARROW_SPACING / 4, 0, VECTOR_ARROW_SPACING / 2, SCREEN_RES[1]), True, False),
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [HWall(0, SCREEN_RES[0] / 2 - VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 2 * VECTOR_ARROW_SPACING),
										HWall(SCREEN_RES[0] / 2 + VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2 * VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 2 * VECTOR_ARROW_SPACING),
										HWall(2 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 5 * VECTOR_ARROW_SPACING),
										HWall(SCREEN_RES[0] / 2 + VECTOR_ARROW_SPACING, SCREEN_RES[0], VECTOR_ARROW_SPACING + 5 * VECTOR_ARROW_SPACING),
										HWall(0, SCREEN_RES[0] / 2 - VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 8 * VECTOR_ARROW_SPACING),
										HWall(SCREEN_RES[0] / 2 + VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2 * VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 8 * VECTOR_ARROW_SPACING),
										HWall(2 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING + 11 * VECTOR_ARROW_SPACING),
										HWall(SCREEN_RES[0] / 2 + VECTOR_ARROW_SPACING, SCREEN_RES[0], VECTOR_ARROW_SPACING + 11 * VECTOR_ARROW_SPACING),
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}		

	elif iLevel == 5:
		levelList[5] = {"name"		 : "Careful around that wall",
						"diskPos"    : ((1.5 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),),
						"objectList" : [GravityWell((SCREEN_RES[0] / 2, SCREEN_RES[1] / 4 - 0.5 * VECTOR_ARROW_SPACING), 90, True),
										AreaObject(1.0, -pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),

			
										],
						"holeList"   : [],				
						"wallList"   : [HWall(0, 4.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2, bCorner = True),
										HWall(SCREEN_RES[0] - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2, bCorner = True),	
										
										HWall(0, 6.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2, bCorner = True),	
										HWall(SCREEN_RES[0] - 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], 4 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2, bCorner = True),	
										
										
										HWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True, bKiller = False),

										VWall(4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 3 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),									 					
										VWall(SCREEN_RES[0] - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 3 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),									 					

										VWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 4 * VECTOR_ARROW_SPACING),									 					
										VWall(SCREEN_RES[0] - 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 4 * VECTOR_ARROW_SPACING),									 					
										
										
										HWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True, bKiller = False),										
										HWall(4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 3 * VECTOR_ARROW_SPACING, bCorner = True, bKiller = True),
										

										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2))),
						}	
						
	elif iLevel == 6:	
		levelList[6] = {"name"		 : "Dodge!",
						"diskPos"    : ((VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2),),
						"objectList" : [AreaObject(3, pi, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 4 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(3, pi, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(3, -pi / 2, pygame.Rect(0, SCREEN_RES[1] / 2, 2.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(3, pi / 2, pygame.Rect(0, SCREEN_RES[1] / 2 - 4 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										
										AreaObject(0.5, pi, pygame.Rect(0, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, SCREEN_RES[0], 2 * VECTOR_ARROW_SPACING), False, False),
										],
						"holeList"   : [],				
						"wallList"   : [HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),							
										HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),								
										HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										
										VWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(5.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(5.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										
										HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),							
										HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),								
										HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),								
										
										HWall(0, SCREEN_RES[0], SCREEN_RES[1] / 2 - 4 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(0, SCREEN_RES[0], SCREEN_RES[1] / 2 + 4 * VECTOR_ARROW_SPACING, bCorner = True),								
										
										MovingWall(HWall(3.5 * VECTOR_ARROW_SPACING, 5.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 yVel = 2 + random()),		

										MovingWall(HWall(6.5 * VECTOR_ARROW_SPACING, 8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 yVel = -2 - random()),
													 
										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 yVel = 2 + random()),		
													 
										MovingWall(HWall(12.5 * VECTOR_ARROW_SPACING, 14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 yVel = -2 - random()),		

										MovingWall(HWall(15.5 * VECTOR_ARROW_SPACING, 17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 yVel = -2 - random()),												 
										
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2))),
						}	
		
	elif iLevel == 7:
		levelList[7] = {"name"		 : "Be sure to get a run up",
						"diskPos"    : ((1.25 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2),),
						"objectList" : [
										MovingObject(AreaObject(1.6, pi, pygame.Rect(3 * SCREEN_RES[0] / 8, 3 * SCREEN_RES[1] / 8, SCREEN_RES[0] / 4, SCREEN_RES[1] / 4), True, True),
													 startY = 3 * SCREEN_RES[1] / 8 - 1.5 * VECTOR_ARROW_SPACING,
													 endY = 3 * SCREEN_RES[1] / 8 + 1.5 * VECTOR_ARROW_SPACING,
													 yVel = 1.0,
													 ),
												 
										AreaObject(1.0, -pi / 2, pygame.Rect(0, 3 * SCREEN_RES[1] / 8, SCREEN_RES[0], SCREEN_RES[1] / 4), False, False),				
										],
						"holeList"   : [],				
						"wallList"   : [
										HWall(0, SCREEN_RES[0], 3 * SCREEN_RES[1] / 8),
										HWall(0, SCREEN_RES[0], 5 * SCREEN_RES[1] / 8),
										],
						"winPos"	 : array((SCREEN_RES[0] - VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2)),
						}		
		
		
	elif iLevel == 8:
		levelList[8] = {"name"		 : "Holes",
						"diskPos"    : ((SCREEN_RES[0] / 4, SCREEN_RES[1] - VECTOR_ARROW_SPACING),),
						"objectList" : [
										AreaObject(0.95, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										Spinner((SCREEN_RES[0] / 4 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 100, True, True)
										],
						"holeList"   : [
										BlackHole((SCREEN_RES[0] / 4 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), (3 * SCREEN_RES[0] / 4 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2)),
										],				
						"wallList"   : [
										VWall(SCREEN_RES[0] / 2 + 1.5 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[1]),
										VWall(SCREEN_RES[0] / 4 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, bCorner = True),
										VWall(SCREEN_RES[0] / 4 - 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, bCorner = True),
										HWall(SCREEN_RES[0] / 4 - 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 4 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, bCorner = True),
										],
						"winPos"	 : roundToGap(array((3 * SCREEN_RES[0] / 4 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
							}		
		
	elif iLevel == 9:
		levelList[9] = {"name"		 : "Under and over",
						"diskPos"    : ((VECTOR_ARROW_SPACING + DISK_RADIUS, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [AreaObject(2, - 3 * pi / 5, pygame.Rect(5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2, SCREEN_RES[0] - 9 * VECTOR_ARROW_SPACING, SCREEN_RES[1]), True, False),
										AreaObject(2, - 3 * pi / 4, pygame.Rect(5 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[0] - 9 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2), True, False),
										MovingObject(AreaObject(2, pi / 4, pygame.Rect(SCREEN_RES[0] - 9 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, (SCREEN_RES[1] / 2) - 2 * VECTOR_ARROW_SPACING), True, True),
													 startX = 5 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] - 9 * VECTOR_ARROW_SPACING,
													 xVel = -2),
										AreaObject(1, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										#DefaultGravity()
										],
						"holeList"   : [],				
						"wallList"   : [HWall(0, VECTOR_ARROW_SPACING + 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),
										MovingWall(HWall(SCREEN_RES[0] - VECTOR_ARROW_SPACING - 8 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - VECTOR_ARROW_SPACING - 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),
													 startX = VECTOR_ARROW_SPACING + 4 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] - VECTOR_ARROW_SPACING - 8 * VECTOR_ARROW_SPACING,
													 xVel = -2),										 					
										HWall(SCREEN_RES[0] - VECTOR_ARROW_SPACING - 4 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),			
										],
						"winPos"	 : roundToGap(array((1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
							}
						
	elif iLevel == 10:
		levelList[10] = {"name"		 : "Stay on track",
						"diskPos"    : ((VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2),),
						"objectList" : [
										AreaObject(2, -5 * pi / 6, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[0], 1.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, 5 * pi / 6, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], 1.5 * VECTOR_ARROW_SPACING), True, False),
										
										AreaObject(2, pi / 2, pygame.Rect(0, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(0, SCREEN_RES[1] / 2, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2.5 * VECTOR_ARROW_SPACING), True, False),

										AreaObject(2.5, 3 * pi / 4, pygame.Rect(0, 0, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2.5, -3 * pi / 4, pygame.Rect(0, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING), True, False),
										
										AreaObject(1, pi, pygame.Rect(0, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 7 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 4 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(10.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 6 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(12.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(14.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(SCREEN_RES[0] - 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2, 3.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										
										#AreaObject(2, pi / 2, pygame.Rect(1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, 1 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(10.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2, 4 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(12.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										
										
										#AreaObject(2, -pi / 2, pygame.Rect(1.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 1 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(8.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(16.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), True, False),										
										],
						"holeList"   : [],				
						"wallList"   : [
										HWall(2.5 * VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING),
										HWall(2.5 * VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING),
										
										VWall(10.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING),
										
										#HWall(12.5 * VECTOR_ARROW_SPACING, 14.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING),
										
										VWall(16.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING),
										VWall(12.5 * VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING),
										
										HWall(16.5 * VECTOR_ARROW_SPACING, 18.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 7.5 * VECTOR_ARROW_SPACING),
										
										
										HWall(14.5 * VECTOR_ARROW_SPACING, 16.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 5.5 * VECTOR_ARROW_SPACING),			
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING))),
						}
						
						
	elif iLevel == 11:						
		levelList[11] = {"name"	     : "Down and up",
						"diskPos"    : ((SCREEN_RES[0] / 2 + 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - VECTOR_ARROW_SPACING),),
						"objectList" : [
										AreaObject(1.5, -pi / 2, pygame.Rect(2 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[0], SCREEN_RES[1] - 3.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(0, 0, 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1]), True, False),
										AreaObject(1, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										
										MovingObject(AreaObject(1.5, pi / 2, pygame.Rect(SCREEN_RES[0] / 2 - 4 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 7 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING), True, True),
													 startX = SCREEN_RES[0] / 2 - 7 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING,
													 xVel = -2),											
										
										],
						"holeList"   : [],				
						"wallList"   : [VWall(SCREEN_RES[0] / 2 + 0.5 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										HWall(SCREEN_RES[0] / 2 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 + 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 3.5 * VECTOR_ARROW_SPACING),
										HWall(SCREEN_RES[0] / 2 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 3.5 * VECTOR_ARROW_SPACING),
										HWall(0, SCREEN_RES[0], VECTOR_ARROW_SPACING, bKiller = True),
										
										MovingWall(HWall(SCREEN_RES[0] / 2 - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 0.5 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING),
													 startX = SCREEN_RES[0] / 2 - 4.5 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] / 2 + 3.5 * VECTOR_ARROW_SPACING,
													 xVel = -2),		

										# Harder level
										#MovingWall(HWall(SCREEN_RES[0] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 + 3 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2, bKiller = True),
										#			 startX = SCREEN_RES[0] / 2 + 1 * VECTOR_ARROW_SPACING,
										#			 endX = SCREEN_RES[0] - 3 * VECTOR_ARROW_SPACING,
										#			 xVel = -2),														 
										
										MovingWall(HWall(SCREEN_RES[0] / 2 - 4 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING),
													 startX = SCREEN_RES[0] / 2 - 7 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING,
													 xVel = -2),												
										
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2 - 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}				
						
	elif iLevel == 12:	
		levelList[12] = {"name"		 : "Black holes!",
						"diskPos"    : ((SCREEN_RES[0] / 2, SCREEN_RES[1] - VECTOR_ARROW_SPACING),),
						"objectList" : [Repeller((1.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING), 50, False),
										Repeller((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING), 50, False),
										
										GravityWell((SCREEN_RES[0] / 2 - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 100, True),
										GravityWell((SCREEN_RES[0] / 2 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 100, True),
		
										AreaObject(1, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										],
						"holeList"   : [BlackHole((SCREEN_RES[0] / 2 - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), (SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING)),
										BlackHole((SCREEN_RES[0] / 2 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), (1.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING)),
						
										],
						
						"wallList"   : [
										HWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										
										HWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										HWall(SCREEN_RES[0] / 2 + 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										
										VWall(2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										VWall(SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING, bCorner = True),
										],
						"winPos"	 : array((SCREEN_RES[0] / 2, SCREEN_RES[1] / 2)),
						}								
							
						
	elif iLevel == 13:				
		levelList[13] = {"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [Spinner((SCREEN_RES[0] / 2 - 2 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING), 140, True, False),
										Spinner((SCREEN_RES[0] / 2 + 2 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING), 140, False, False),
										GravityWell((SCREEN_RES[0] / 2, 3 * SCREEN_RES[1] / 4), 140, False),
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [VWall(SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING / 2, 0, SCREEN_RES[1] / 2),
										VWall(SCREEN_RES[0] / 2 + 3 * VECTOR_ARROW_SPACING / 2, 0, SCREEN_RES[1] / 2),
										HWall(SCREEN_RES[0] / 4, 3 * SCREEN_RES[0] / 4, 2 * SCREEN_RES[1] / 3, bKiller = True),
										VWall(SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING / 2, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										VWall(SCREEN_RES[0] / 2 + 3 * VECTOR_ARROW_SPACING / 2, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2, SCREEN_RES[1] - VECTOR_ARROW_SPACING))),
						}		
				

	# elif iLevel == 12:	
		# levelList[12] = {"diskPos"    : ((VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2),),
						# "objectList" : [AreaObject(3, pi, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 4 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), True, False),
										# AreaObject(3, pi, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), True, False),
										# AreaObject(3, -pi / 2, pygame.Rect(0, SCREEN_RES[1] / 2, 2.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										# AreaObject(3, pi / 2, pygame.Rect(0, SCREEN_RES[1] / 2 - 4 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										
										# AreaObject(0.5, pi, pygame.Rect(0, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, SCREEN_RES[0], 2 * VECTOR_ARROW_SPACING), False, False),
										# ],
						# "holeList"   : [],				
						# "wallList"   : [HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),							
										# HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),								
										# HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, bCorner = True),
										
										# VWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(5.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(5.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# VWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 1 * VECTOR_ARROW_SPACING, bCorner = True),
										
										# HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(2.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(5.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),							
										# HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(8.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(11.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(14.5 * VECTOR_ARROW_SPACING, 15.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),								
										# HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),								
										
										# HWall(0, SCREEN_RES[0], SCREEN_RES[1] / 2 - 4 * VECTOR_ARROW_SPACING, bCorner = True),
										# HWall(0, SCREEN_RES[0], SCREEN_RES[1] / 2 + 4 * VECTOR_ARROW_SPACING, bCorner = True),								
										
										# MovingWall(HWall(3.5 * VECTOR_ARROW_SPACING, 5.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 # startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 # endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 # yVel = 2.5 + random()),		

										# MovingWall(HWall(6.5 * VECTOR_ARROW_SPACING, 8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 # startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 # endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 # yVel = -2.5 - random()),
													 
										# MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 # startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 # endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 # yVel = 2.5 + random()),		
													 
										# MovingWall(HWall(12.5 * VECTOR_ARROW_SPACING, 14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 # startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 # endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 # yVel = -2.5 - random()),		

										# MovingWall(HWall(15.5 * VECTOR_ARROW_SPACING, 17.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + (random() * 4 - 2) * VECTOR_ARROW_SPACING, bTrim = True),
													 # startY = SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING,
													 # endY = SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,
													 # yVel = -2.5 - random()),												 
										
										# ],
						# "winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2))),
						# }	


	elif iLevel == 14:
		levelList[14] = {"diskPos"    : ((VECTOR_ARROW_SPACING + DISK_RADIUS, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [AreaObject(2.5, - 3 * pi / 5, pygame.Rect(5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2, SCREEN_RES[0] - 9 * VECTOR_ARROW_SPACING, SCREEN_RES[1]), True, False),
										AreaObject(2.5, - 3 * pi / 4, pygame.Rect(5 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[0] - VECTOR_ARROW_SPACING - 8 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2), True, False),
										MovingObject(AreaObject(2.2, pi / 4, pygame.Rect(SCREEN_RES[0] - 8 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING, (SCREEN_RES[1] / 2) - 2 * VECTOR_ARROW_SPACING), True, True),
													 startX = 5 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] - 8 * VECTOR_ARROW_SPACING,
													 xVel = -3.0),
										AreaObject(1, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),

			
										DefaultGravity()],
						"holeList"   : [],				
						"wallList"   : [HWall(0, VECTOR_ARROW_SPACING + 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),
										MovingWall(HWall(SCREEN_RES[0] - 8 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - VECTOR_ARROW_SPACING - 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),
													 startX = 5 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] - 8 * VECTOR_ARROW_SPACING,
													 xVel = -3.0),										 					
										HWall(SCREEN_RES[0] - 5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 2 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING + SCREEN_RES[1] / 2),			
										],
						"winPos"	 : roundToGap(array((1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}
						
	elif iLevel == 15:
		levelList[15] = {"diskPos"    : ((VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2),),
						"objectList" : [
										AreaObject(2, -5 * pi / 6, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[0], 1.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, 5 * pi / 6, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], 1.5 * VECTOR_ARROW_SPACING), True, False),
										
										AreaObject(2, pi / 2, pygame.Rect(0, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(0, SCREEN_RES[1] / 2, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2.5 * VECTOR_ARROW_SPACING), True, False),

										AreaObject(2.5, 3 * pi / 4, pygame.Rect(0, 0, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2.5, -3 * pi / 4, pygame.Rect(0, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING), True, False),
										
										AreaObject(1, pi, pygame.Rect(0, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 7 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 4 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(10.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 6 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(12.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(14.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), False, False),
										AreaObject(1, pi, pygame.Rect(SCREEN_RES[0] - 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2, 3.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), False, False),
										
										#AreaObject(2, pi / 2, pygame.Rect(1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, 1 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(10.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2, 4 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(14.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(12.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										
										
										#AreaObject(2, -pi / 2, pygame.Rect(1.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 1 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(2.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(8.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(6.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, -pi / 2, pygame.Rect(16.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING, 6 * VECTOR_ARROW_SPACING), True, False),
										
										],
						"holeList"   : [],				
						"wallList"   : [
						
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] / 2 + VECTOR_ARROW_SPACING))),
						}								
												
	elif iLevel == 16:						
		levelList[16] = {"diskPos"    : ((SCREEN_RES[0] / 2 + 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - VECTOR_ARROW_SPACING),),
						"objectList" : [Spinner((SCREEN_RES[0] / 2, 4 * VECTOR_ARROW_SPACING), 20, True, True),
										AreaObject(1.5, -pi / 2, pygame.Rect(2 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[0], SCREEN_RES[1] - 3.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(2, pi / 2, pygame.Rect(0, 0, 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1]), True, False),
										AreaObject(0.8, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										
										MovingObject(AreaObject(1.5, pi / 2, pygame.Rect(SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 7 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING), True, True),
													 startX = SCREEN_RES[0] / 2 - 6 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] / 2 - 2 * VECTOR_ARROW_SPACING,
													 xVel = -2.7),											
										
										],
						"holeList"   : [],				
						"wallList"   : [VWall(SCREEN_RES[0] / 2 + 0.5 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										HWall(SCREEN_RES[0] / 2 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 + 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 3.5 * VECTOR_ARROW_SPACING),
										HWall(SCREEN_RES[0] / 2 + 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 3.5 * VECTOR_ARROW_SPACING),
										HWall(0, SCREEN_RES[0], VECTOR_ARROW_SPACING, bKiller = True),
										
										MovingWall(HWall(SCREEN_RES[0] / 2 - 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 0.5 * VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING),
													 startX = SCREEN_RES[0] / 2 - 4.5 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] / 2 + 3.5 * VECTOR_ARROW_SPACING,
													 xVel = -3),		

										# Harder level
										MovingWall(HWall(SCREEN_RES[0] / 2 + 1 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 + 3 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2, bKiller = True), bKiller = True,
													 startX = SCREEN_RES[0] / 2 + 1 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] - 3 * VECTOR_ARROW_SPACING,
													 xVel = -3),														 
										
										MovingWall(HWall(SCREEN_RES[0] / 2 - 3 * VECTOR_ARROW_SPACING, SCREEN_RES[0] / 2 - 1 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING),
													 startX = SCREEN_RES[0] / 2 - 6 * VECTOR_ARROW_SPACING,
													 endX = SCREEN_RES[0] / 2 - 2 * VECTOR_ARROW_SPACING,
													 xVel = -2.7),												
										
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2 - 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}	



	
	return 0
						
			
			
	"""levelList[0] = {"diskPos"    : ((VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2),),
					"objectList" : [RSquaredObject((1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 75, 0.3, True),
									AreaObject(2, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
									#Spinner((SCREEN_RES[0] - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 140, True, False),Spinner((SCREEN_RES[0] - 4.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 140, True, False),
									#Spinner((SCREEN_RES[0] / 2 - 0.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2), 50, True),
									DefaultGravity()],
					"wallList"   : [VWall(4 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCrumble = True),
									VWall(8 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCrumble = True),		
									
									VWall(SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 6 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),		
									VWall(SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 6 * VECTOR_ARROW_SPACING, bCorner = True),		
									
									VWall(SCREEN_RES[0] - 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,  bCorner = True),		
									
									VWall(SCREEN_RES[0] / 2 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING,  bCorner = True),		
					
									HWall(0, SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
									HWall(0, SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),
									
									HWall(SCREEN_RES[0] / 2 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 - 2 * VECTOR_ARROW_SPACING, bCorner = True),
									HWall(SCREEN_RES[0] / 2 + 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0] - 3.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2 + 2 * VECTOR_ARROW_SPACING, bCorner = True),								

									HWall(SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 - 6 * VECTOR_ARROW_SPACING, bCorner = True),
									HWall(SCREEN_RES[0] / 2 - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] / 2 + 6 * VECTOR_ARROW_SPACING, bCorner = True),
								   
									
									
									],
					"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] / 2))),
					}	"""
		
		
	"""elif iLevel == 9:
		levelList[9] = {"name"		 : "From the skies!",
						"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [AreaObject(1, pi / 2, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										AreaObject(0.95, -pi / 2, pygame.Rect(0, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[0], SCREEN_RES[1] - 5 * VECTOR_ARROW_SPACING), True, False),
						
										],
						"holeList"   : [],				
						"wallList"   : [
										WallGenerator([
														MovingWall(HWall(VECTOR_ARROW_SPACING, 3 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = VECTOR_ARROW_SPACING,
																   endX = 3 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(3 * VECTOR_ARROW_SPACING, 5 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 3 * VECTOR_ARROW_SPACING,
																   endX = 5 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(5 * VECTOR_ARROW_SPACING, 7 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 5 * VECTOR_ARROW_SPACING,
																   endX = 7 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(7 * VECTOR_ARROW_SPACING, 9 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 7 * VECTOR_ARROW_SPACING,
																   endX = 9 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(9 * VECTOR_ARROW_SPACING, 11 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 9 * VECTOR_ARROW_SPACING,
																   endX = 11 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(11 * VECTOR_ARROW_SPACING, 13 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 11 * VECTOR_ARROW_SPACING,
																   endX = 13 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(13 * VECTOR_ARROW_SPACING, 15 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 13 * VECTOR_ARROW_SPACING,
																   endX = 15 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(15 * VECTOR_ARROW_SPACING, 17 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 15 * VECTOR_ARROW_SPACING,
																   endX = 17 * VECTOR_ARROW_SPACING,
																   yVel = -2),
														MovingWall(HWall(17 * VECTOR_ARROW_SPACING, 19 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
																   startX = 17 * VECTOR_ARROW_SPACING,
																   endX = 19 * VECTOR_ARROW_SPACING,
																   yVel = -2),																   
													  ],
													  50)
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}		"""		
"""
elif iLevel == 9:
		levelList[9] = {"name"		 : "Ribbit!",
						"diskPos"    : ((SCREEN_RES[0] / 2, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [AreaObject(0.2, pi, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
						
										],
						"holeList"   : [],				
						"wallList"   : [
										WallGenerator([
														MovingWall(VWall(VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = 0,
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(3 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(7 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(9 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(11 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(13 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(15 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),
														MovingWall(VWall(17 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bKiller = True),
																   startY = 0,
																   endY = SCREEN_RES[1],
																   yVel = -3,
																   bKiller = True),																   
													  ],
													  10)
										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] / 2, SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}							"""						
		
"""
	elif iLevel == 9:
		levelList[9] = {"name"		 : "All about timing",
						"diskPos"    : ((VECTOR_ARROW_SPACING + DISK_RADIUS, VECTOR_ARROW_SPACING + DISK_RADIUS),),
						"objectList" : [
										AreaObject(3, 0, pygame.Rect(9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 4.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(3, pi, pygame.Rect(7.5 * VECTOR_ARROW_SPACING, 0, 2.5 * VECTOR_ARROW_SPACING, 3.0 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(1, -pi / 2, pygame.Rect(0, 0, 7.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1]), False, False),
										AreaObject(1, -pi / 2, pygame.Rect(11.5 * VECTOR_ARROW_SPACING, 0, 8.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1]), False, False),
										MovingObject(AreaObject(2, 0, pygame.Rect(7.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING), True, False),
													 fRotSpeed = pi / 60),
													 
													 
										#DefaultGravity()
										],
						"holeList"   : [],				
						"wallList"   : [
										WallGenerator([MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1], bTrim = True),
																  startY = 0,
																  endY = SCREEN_RES[1],
																  yVel = -2,),
													  ],
													  30,
													   
													 ),
										WallGenerator([MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 0, bTrim = True),
																  startY = 0,
																  endY = SCREEN_RES[1],
																  yVel = 2,),
													  ],
													  30,
													 ),

													 
										VWall(9.5 * VECTOR_ARROW_SPACING, 0, 2.5 * VECTOR_ARROW_SPACING),
										VWall(9.5 * VECTOR_ARROW_SPACING, 4 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										VWall(7.5 * VECTOR_ARROW_SPACING, 2 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2 * VECTOR_ARROW_SPACING),
										VWall(11.5 * VECTOR_ARROW_SPACING, 0, SCREEN_RES[1] - 4 * VECTOR_ARROW_SPACING),
										VWall(11.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1]),
										

										],
						"winPos"	 : roundToGap(array((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING))),
						}"""		
		
"""	elif iLevel == 8:
		levelList[8] = {"name"		 : "All about timing",
						"diskPos"    : (((SCREEN_RES[0] - 1.5 * VECTOR_ARROW_SPACING , SCREEN_RES[1] - 1.5 * VECTOR_ARROW_SPACING)),),
						"objectList" : [
										AreaObject(0.5, 0, pygame.Rect(0, 0, SCREEN_RES[0], SCREEN_RES[1]), False, False),
										AreaObject(3, pi / 2, pygame.Rect(0, 2.5 * VECTOR_ARROW_SPACING, 8 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 6.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(3, 0, pygame.Rect(0, SCREEN_RES[1] - 4.5 * VECTOR_ARROW_SPACING, 8 * VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING), True, False),
										AreaObject(3, 0, pygame.Rect(11.5 * VECTOR_ARROW_SPACING, 0, 2.5 * VECTOR_ARROW_SPACING, SCREEN_RES[1] - 2.5 * VECTOR_ARROW_SPACING), True, False),											 
													 
										#DefaultGravity()
										],
						"holeList"   : [],				
						"wallList"   : [
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 2.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 2 * VECTOR_ARROW_SPACING,
												   endY = 3 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),		
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 4.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 4 * VECTOR_ARROW_SPACING,
												   endY = 5 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),		
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 6 * VECTOR_ARROW_SPACING,
												   endY = 7 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),	
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 6.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 6 * VECTOR_ARROW_SPACING,
												   endY = 7 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),	
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 8.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 8 * VECTOR_ARROW_SPACING,
												   endY = 9 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),	
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 10.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 10 * VECTOR_ARROW_SPACING,
												   endY = 11 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),	
										MovingWall(HWall(7.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, 12.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 12 * VECTOR_ARROW_SPACING,
												   endY = 13 * VECTOR_ARROW_SPACING,
												   yVel = 1.8,
												   ),												   

										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 1.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 1 * VECTOR_ARROW_SPACING,
												   endY = 2 * VECTOR_ARROW_SPACING,
												   yVel = -1.8,),
										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 3.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 3 * VECTOR_ARROW_SPACING,
												   endY = 4 * VECTOR_ARROW_SPACING,
												   yVel = -1.8,),		
										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 5.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 5 * VECTOR_ARROW_SPACING,
												   endY = 6 * VECTOR_ARROW_SPACING,
												   yVel = -1.8,),			
										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 7.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 7 * VECTOR_ARROW_SPACING,
												   endY = 8 * VECTOR_ARROW_SPACING,
												   yVel = -1.8,),		
										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 9.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 9 * VECTOR_ARROW_SPACING,
												   endY = 10 * VECTOR_ARROW_SPACING,
												   yVel = -1.8,),		
										MovingWall(HWall(9.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, 11.5 * VECTOR_ARROW_SPACING, bTrim = True),
												   startY = 11 * VECTOR_ARROW_SPACING,
												   endY = 12 * VECTOR_ARROW_SPACING,
												   yVel = -1.8,),	

										VWall(9.5 * VECTOR_ARROW_SPACING, 0, VECTOR_ARROW_SPACING, bCorner = True),
										],
						"winPos"	 : roundToGap(array((VECTOR_ARROW_SPACING, VECTOR_ARROW_SPACING))),
						}		"""				
		