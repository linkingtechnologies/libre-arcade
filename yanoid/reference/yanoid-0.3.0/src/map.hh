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
/* This is Map state - currently a list of entities */

#include "log.hh"
#include "entity.hh"

class TMap;
class TPaddle;
class TMapState {
  TPaddle * paddle;
  friend TMap;
public:
  int num_balls; /* Number of balls in play. 
		    When 0 is reached, a live is substracted
		    and a ball is added if there is lives left */
  int num_bricks; /* Number of bricks in play. When zero, the map has
		     been completed */
  double ballspeed; /* The speed of all balls in map */
  double ballbirth;
  double ballacceleration;
  string mapname;
  TMapState();
  ~TMapState();
  TEntities Entities;
  TEntity * GetPaddle();
  void load(const std::string& path);
};

/* This is a map clas. It can load a map, and contains the state of a map
 */

class TMap {
protected:
  TMapState * MapState;
  TEntities EntitiesToAddToMapState;
  bool relocateHighEntities(TEntitiesIterator& i);
  bool relocateLowEntities(TEntitiesIterator& i);
  /* Keep track of wheter or not the modules have been loaded */
  static bool ModuleAdded;
  /* Clear the mapstate */
  void Clear();
public:
  TMap();
  ~TMap();
  /* A static funtion to add the map modules */
  static bool AddModule();
  /* Set the map name */
  bool SetMapName(string name);
  /* Add an entity, mostly bricks, walls, etc.
     , initialize with parameters (will probably change). 
     returns true on succes */
  bool AddEntity(string type, string hitfunction, int x, int y, int w, int h, string pixmap);
  /* Set the paddle for the map */
  bool SetPaddle(int x, int y, string pathtype, double velocity,
		 double angle, string pixmap);
  /* PowerUp - typically called from scripts */
  bool PowerUp(string action, string arg1, string arg2);
  /* Loading function - may be temporary*/
  bool Load(string mapname);
  inline TMapState * GetState() { return MapState; }
  void Update(Uint32 deltatime);
};
