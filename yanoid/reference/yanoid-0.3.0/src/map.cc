/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
    Copyright (C) 2001 contributers of the yanoid project
    Please see the file "AUTHORS" for a list of contributers

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/
#include <Python.h>

#include "map.hh"
#include "ressourcemanager.hh"
#include "entity.hh"
#include "pixmap_entity.hh"
#include "more_entities.hh"
#include "globals.hh"
#include "motion.hh"
#include "interprenter.hh"

/* **********************************************************************
 * Testing: A temporary TMap variable to use with some static functions
 * Note: This is becomming semi permanent...
 * *********************************************************************/
static TMap * CurrentMap = NULL;

/* **********************************************************************
 * These static methods are not so great, but for now, they will have to
 * do.
 * *********************************************************************/

/* **********************************************************************
 * Set the map name
 * *********************************************************************/
static PyObject * MapName(PyObject * self, PyObject * args) {
  char * name;
  if (!CurrentMap || !PyArg_ParseTuple(args, "s", &name)) {
    return NULL;
  }
  if (CurrentMap->SetMapName(name)) {
    return Py_BuildValue("");
  } else {
    return NULL;
  }
}
/* **********************************************************************
 * Add a brick or similar object to the current map
 * *********************************************************************/
static PyObject * AddObject(PyObject * self, PyObject * args) {
  int x; int y; int w; int h; 
  char * type; char * hitfunction; char * pixmap;
  if (!CurrentMap || !PyArg_ParseTuple(args, "ssiiiis", 
				       &type, &hitfunction,
				       &x, &y, &w, &h, &pixmap)) {
    return NULL;
  }
  if (CurrentMap->AddEntity(type, hitfunction, x, y, w, h, pixmap)) {
    return Py_BuildValue("");
  } else {
    return NULL;
  }
}

/* **********************************************************************
 * Set the paddle
 * *********************************************************************/
static PyObject * SetPaddle(PyObject * self, PyObject * args) {
  int x; int y;  
  char * pathtype; 
  double velocity;
  double angle; /* Have to use a type that works with parsetuple */
  char * pixmap;
  if (!CurrentMap || !PyArg_ParseTuple(args, "iisdds", 
				       &x, &y, &pathtype,
				       &velocity, &angle, &pixmap)) {
    return NULL;
  }
  if (CurrentMap->SetPaddle(x, y, pathtype, velocity, angle, pixmap)) {
    return Py_BuildValue("");
  } else {
    return NULL;
  }
}

/* **********************************************************************
 * A general PowerUp handling function, takes a string as parameter
 * *********************************************************************/
static PyObject * PowerUp(PyObject * self, PyObject * args) {
  char * action; char * arg1; char * arg2;
  if (!CurrentMap || !PyArg_ParseTuple(args, "sss",
				       &action, &arg1, &arg2)) {
    return NULL;
  }
  if (CurrentMap->PowerUp(action, arg1, arg2)) {
    return Py_BuildValue("");
  } else {
    return NULL;
  }
}

/* **********************************************************************
 * The map method table
 * *********************************************************************/

static PyMethodDef map_methods[] = {
  {"MapName", MapName, METH_VARARGS},
  {"AddObject", AddObject, METH_VARARGS},
  {"SetPaddle", SetPaddle, METH_VARARGS},
  {"PowerUp", PowerUp, METH_VARARGS},
  {NULL, NULL}
};


/* **********************************************************************
 * TMapState stuff
 * *********************************************************************/

/* **********************************************************************
 * TMapState constructor
 * *********************************************************************/
TMapState::TMapState() : paddle(NULL), num_balls(0), num_bricks(0),
ballspeed(0.19), ballbirth(0), ballacceleration(0.000003) {

}
/* **********************************************************************
 * TMapState destructor
 * *********************************************************************/
TMapState::~TMapState() {
  TEntitiesIterator End = Entities.end();
  TEntitiesIterator i;
  for (i = Entities.begin(); i != End; i++) {
    delete(*i);
  }  
}


/* **********************************************************************
 * Get the paddle
 * *********************************************************************/
TEntity * TMapState::GetPaddle() {
  return paddle;
}


/* **********************************************************************
 * load - loads a TMapState and associated entities from path.
 * *********************************************************************/
void TMapState::load(const std::string& path)
{

}

/* **********************************************************************
 * TMap stuff
 * *********************************************************************/

/* **********************************************************************
 * Constructor
 * Currently builds a simple map.
 * *********************************************************************/
TMap::TMap() {
  /* Create a TMapState */
  MapState = new TMapState();
  if (!MapState) {
    LogFatal("TMap::TMap - unable to create mapstate");
  }
}
/* **********************************************************************
 * Clear the map
 * *********************************************************************/


/* **********************************************************************
 * Destructor
 * *********************************************************************/
TMap::~TMap() {
  if (MapState) {
    delete MapState;
  }
  TEntitiesIterator End = EntitiesToAddToMapState.end();
  TEntitiesIterator i;
  for (i = EntitiesToAddToMapState.begin(); i != End; i++) {
    delete(*i);
  }  
}
/* **********************************************************************
 * Add the modules
 * *********************************************************************/
bool TMap::ModuleAdded = false;

bool TMap::AddModule() {
  if (!ModuleAdded) {
    if (Interprenter->AddModule("yanoid_map", map_methods)) {
      ModuleAdded = true;
    }
  }    
  return ModuleAdded;
}

/* **********************************************************************
 * Load a map - set the current pointer, load the python mapname into the
 * interprenter, unset the current pointer, return
 * *********************************************************************/

bool TMap::Load(string mapname) {
  /* Make sure we have a fresh mapstate */
  delete MapState;
  MapState = new TMapState();
  if (!MapState) {
    LogFatal("TMap::Load - unable to create mapstate");
  }
  CurrentMap = this;
  bool result = Interprenter->RunSimpleFile(mapname);
  /* Eventually we may want to unset the current map - currently we just 
     keep it, such that we can do our stuff from the console */
  // CurrentMap = NULL;
  return result;
}


/* **********************************************************************
 * Set the map name
 * *********************************************************************/
bool TMap::SetMapName(string name) {
  if (!MapState) {
    return false;
  }
  MapState->mapname = name;
  return true;
}
/* **********************************************************************
 * AddEntity
 * This will need to be refined to allow for different types, etc.
 * *********************************************************************/
bool TMap::AddEntity(string type, string hitfunction, 
		     int x, int y, int w, int h, 
		     string pixmap) {
  /* Do different things, according to type */
  if ("brick" == type ) {
    /* This is a pixmapentity */
    MapState->Entities.push_back(new TBrick(x, y, pixmap, hitfunction));
    MapState->num_bricks++;
    return true;
  } else if ("brick-stay-3" == type ) {
    /* This is a pixmapentity */
    MapState->Entities.push_back(new TBrick(x, y, pixmap, hitfunction, 3));
    MapState->num_bricks++;
    return true;
  } else if ("brick-stay" == type ) {
    /* This is a pixmapentity */
    MapState->Entities.push_back(new TBrick(x, y, pixmap, hitfunction, -1));
    // Obviously, do not increase the number of bricks, if the brick
    // can not be removed... *douh*
    // MapState->num_bricks++;
    return true;
  } else if ("static" == type) {
    /* In lack of a better name */
    TEntity * e = new TEntity(x, y, w, h, 0, "STATIC");
    e->SetScriptHitCall(hitfunction);
    MapState->Entities.push_back(e);
    return true;
  } else if ("hole" == type) {
    TEntity * e = new THole(x, y, w, h);
    // TEntity * e = new TEntity(x, y, w, h);
    e->SetScriptHitCall(hitfunction);
    MapState->Entities.push_back(e);
    // LogLine(LOG_VERBOSE, "hole created");
    return true;
  } else if ("default-ball" == type) {
    if (!MapState->paddle) {
      LogLine(LOG_ERROR, "Can't add default ball, with no paddle");
      return false;
    }
    /* Note, the placement is ... well, off, since we do not 
       know the size of the entity. Never mind for now */
    /*TEntity * e = new TPixmapEntity(MapState->paddle->x() 
				    + (MapState->paddle->w()/2),
				    MapState->paddle->y() - 16,
				    0, pixmap, TEntity::PIXEL, 
				    TEntity::MOVING);*/
    TEntity * e;
    if (x == 0 && y == 0) {
      e = new TPixmapEntity(300, 400, 0, pixmap, 
			    "BALL", TEntity::MOVING,
			    TEntity::PIXEL);
    }else{
      e = new TPixmapEntity(x, y, 0, pixmap, 
			    "BALL", TEntity::MOVING,
			    TEntity::PIXEL);
    }
    e->SetScriptHitCall(hitfunction);
    // TODO, error handling.. 
    e->setMotion(new TFreeMotion);
    //    dynamic_cast<TFreeMotion*>(e->getMotion())->setDir(1 * M_PI / 5);
    dynamic_cast<TFreeMotion*>(e->getMotion())->setDir(1 * M_PI / 3);
    dynamic_cast<TFreeMotion*>(e->getMotion())->setVelocity(MapState->ballspeed);
    e->setName("Default Ball");
    MapState->Entities.push_back(e);
    MapState->num_balls++;
    return true;
  } else {
    LogLine(LOG_WARNING, "TMap::AddEntity - unknown type " + type);
    return false;
  }
}


/* **********************************************************************
 * Set the paddle - should probably mean that we remove the current
 * from the list of entities.
 * *********************************************************************/

bool TMap::SetPaddle(int x, int y, string pathtype, double velocity,
		     double angle, string pixmap) {
  /* Check if the mapstate already have a paddle
     we can not handle that */
  if (MapState->paddle) {
    LogLine(LOG_WARNING, "TMap::SetPaddle - paddle already set");
    return false;
  } 

  /* First, try and make things work */
  TPaddle * paddle 
    = new TPaddle(x, y, pixmap, 
		  "graphics/paddles/square2_100.png",
		  "graphics/paddles/square2_50.png");
  

    /*    new TPixmapEntity(x, y, 0, pixmap, "PADDLE", 
	  TEntity::MOVING, TEntity::PIXEL); */
  paddle->setName("Paddle");
  paddle->SetScriptHitCall("paddle_hit()");
  if ("FreeMotion" == pathtype) {
    paddle->setMotion(new TFreeMotion);    
    dynamic_cast<TFreeMotion*>(paddle->getMotion())->setDir(angle);
  } else {
    LogLine(LOG_ERROR, "TMap::SetPaddle - unknown pathtype "  
	    + pathtype);
    delete paddle;
    return false;
  }
  
  /* Set standard parameters */
  paddle->getMotion()->setVelocity(velocity);
  paddle->getMotion()->setAccel(-0.03);
  paddle->getMotion()->setCurrentVelocity(2.0);
  paddle->setName("Paddle");
  MapState->Entities.push_back(paddle);
  MapState->paddle = paddle;
  return true;
}

/* **********************************************************************
 * Powerup
 * *********************************************************************/
bool TMap::PowerUp(string action, string arg1, string arg2) {
  // LogLine(LOG_VERBOSE, "in powerup");

  /* **********************************************************************
   * First the major case, spawning powerups (bricks falling down)
   * *********************************************************************/
  if ("powerup" == action) {
    // LogLine(LOG_VERBOSE, "powerup added");
    if (!current_script_entity) {
      LogLine(LOG_WARNING, "no current_script_entity");
      return false;
    }
    /* Add a powerup at the location of the current entity */
    TEntity * e 
      = new TPowerUp(static_cast<int>(current_script_entity->x()), 
		     static_cast<int>(current_script_entity->y()), 
		     arg1, arg2);
    e->setName("powerup");
    EntitiesToAddToMapState.push_back(e);
    return true;
  } /* "powerup" */ 

  /* **********************************************************************
   * Spawning a ball.
   * *********************************************************************/
  else if ("spawn-ball" == action) {
    // LogLine(LOG_VERBOSE, "in spawnball");
    /* Add a ball, based on the location of the current entity */
    if (current_script_entity) {
      /* arg1 == pixmap
	 arg2 == hitfunction */
      TEntity * e 
	= new 
	TPixmapEntity(static_cast<int>(current_script_entity->x()), 
		      static_cast<int>(current_script_entity->y()), 
		      0, arg1, 
		      "BALL", TEntity::MOVING, TEntity::PIXEL);
      e->SetScriptHitCall(arg2);
      // TODO, error handling.. 
      e->setMotion(new TFreeMotion);
      //    dynamic_cast<TFreeMotion*>(e->getMotion())->setDir(1 * M_PI / 5);
      dynamic_cast<TFreeMotion*>(e->getMotion())->setDir(1 * M_PI / 5);
      dynamic_cast<TFreeMotion*>(e->getMotion())->setVelocity(MapState->ballspeed);
      e->setName("Default Ball");
      EntitiesToAddToMapState.push_back(e);
      // MapState->num_balls++;
      return true;
    } else {
      LogLine(LOG_WARNING, "no current_script_entity");
      return false;
    }
  } /* "spawn-ball" */ 

  /* **********************************************************************
   * size-paddle
   * *********************************************************************/
  else if ("size-paddle" == action) {
    /* arg1 == size (normal, narrow, wide), arg2 == seconds */
    if ("normal" == arg1) {
      MapState->paddle->GoNormal();
    } 
    else if ("wide" == arg1 || "narrow" == arg1) {
      /* Arg 2 is seconds, ignore errors */
      int seconds = atoi(arg2.c_str());
      if ("wide" == arg1) {
	MapState->paddle->GoWide(seconds);
      } else {
	MapState->paddle->GoNarrow(seconds);
      }
    } else {
      LogLine(LOG_ERROR, "powerup size-paddle with wrong size");
      return false;
    }
    return true;
  }

  /* **********************************************************************
   * Not handled, falling through to here
   * *********************************************************************/
  else {
    LogLineExt(LOG_ERROR, ("Unhandled action : %s", action.c_str()))
    return false;
  }
}

/* **********************************************************************
 * Update - update all entities
 * *********************************************************************/
void TMap::Update(Uint32 deltatime) {
  /* Iterate through entities that needs to be added, add them */
  TEntitiesIterator i, tmpi;
  TEntitiesIterator End = EntitiesToAddToMapState.end();
  for (i = EntitiesToAddToMapState.begin(); i != End;) {
    /* Add this entity, remove it from this list */
    MapState->Entities.push_back(*i);
    /* If we add a ball, remember to increase the number of balls */
    if ("BALL" == (*i)->getEntityType()) {
      MapState->num_balls++;
      // LogLine(LOG_VERBOSE, "Ball added");
    }
    tmpi = i;
    i++;
    EntitiesToAddToMapState.erase(tmpi);
  }  
  
  /* Do the update of all entities in the map */
  TEntitiesIterator candi;
  End = MapState->Entities.end();
  for (i = MapState->Entities.begin(); i != End; i++) {
    (*i)->Update(deltatime);

    // Now in order to ensure that the entity list is ordered by
    // y axis we have to check if the current entity should be moved
    // to another pos. in the list. We want to order by y axis 
    // because it speeds up the collision detection.
    candi = i;
    if (i != MapState->Entities.begin())
      --candi;

    if (i != MapState->Entities.end()) {
      if (i != MapState->Entities.begin() ){
	if (relocateHighEntities(i) || relocateLowEntities(i))
	  i = candi;
      }else {
	if (relocateHighEntities(i))
	  i = candi;
      }
    }else {
      if (relocateLowEntities(i)) 
	i = candi;
    }
  }
  /* Clean out entities that are no longer alive */
  TEntity * tmp;
  // Note, End could be changed above... 
  End = MapState->Entities.end();
  for (i = MapState->Entities.begin(); i != End;) {
    candi = i;
    i++;
    if ((*candi)->IsRemovable()) {
      tmp = (*candi);
      if ("BALL" == tmp->getEntityType()) {
	MapState->num_balls--;
	// LogLine(LOG_VERBOSE, "Ball removed");
	Assert(MapState->num_balls >= 0, 
	       "Cant have a negative number of balls");
      }
      /* If we remove a BRICK, reduce the number of brics */
      if ("BRICK" == tmp->getEntityType()) {
	MapState->num_bricks--;
	// LogLine(LOG_VERBOSE, "Brick removed");
	Assert(MapState->num_bricks >= 0, 
	       "Can't have a negative number of bricks");
      }

      MapState->Entities.erase(candi);
      delete tmp;
    }
  }

}


/* helper function for update
   Moves the entity associated with the iterator i, 
   to the correct position in the upper half of the 
   list from itself.
*/
bool TMap::relocateHighEntities(TEntitiesIterator& i)
{
  TEntitiesIterator newi = i;
  TEntitiesIterator nexti = i;
  ++nexti;
  TEntitiesIterator End = MapState->Entities.end();
  while(++newi != End) {
    if ((*newi)->y() >= (*i)->y()) {
      if (*newi != *nexti) {
	TEntity* tmp = *i;
	i = MapState->Entities.erase(i);
	--i;
	MapState->Entities.insert(newi,1,tmp);
	return true;
      }else{
	return false;
      }
    }
  }
  return false;
}


/* helper function for update
   Moves the entity associated with the iterator i, 
   to the correct position in the lower half of the 
   list from itself.
*/
bool TMap::relocateLowEntities(TEntitiesIterator& i)
{
  TEntitiesIterator newi = i;
  TEntitiesIterator previ = i;
  --previ;
  TEntitiesIterator Begin = MapState->Entities.begin();
  while(--newi != Begin) {
    if ((*newi)->y() <= (*i)->y()) {
      if (*newi != *previ) {
	TEntity* tmp = *i;
	i = MapState->Entities.erase(i);
	--i;
	MapState->Entities.insert(++newi,1,tmp);
	return true;
      }else{
	return false;
      }
    }
  }
  return false;
}

