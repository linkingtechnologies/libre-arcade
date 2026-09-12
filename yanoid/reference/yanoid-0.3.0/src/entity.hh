/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
    Copyright (C) 2001 Jonas Christian Drewsen <jcd@xspect.dk>
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
/* Entities are the basic units that can be manipulated in the game */

#ifndef __ENTITY_HH__
#define __ENTITY_HH__

#include <SDL/SDL.h>
#include <list>
#include <string>
#include "point.hh"

class TMotion;

class TPixmapEntity;
class TEntity {
public:
  typedef enum CollisionGranularity { BOX, PIXEL } CollisionGranularity;
  typedef enum MoveType { STATIONARY, MOVING } MoveType;
  typedef string EntityType;
protected:
  // TODO: Some sort of fancy vector class? 
  int _w, _h; /* The bounding box size */

  /* The remainding translation after the the motion has translated
     this entity. Both numbers should be < 1.0 since it is the 
     remainder of the velocity after adding it to this entity's
     position. Does it make sense?
  */
  TOrientedPoint position;
  TPoint collidepoint;
  std::string name;
  EntityType entity_type;
  CollisionGranularity collision_granularity;
  MoveType move_type;
  TMotion * motion;
  unsigned char* mask;
  /* Script stuff */
  string ScriptHitCall;
  bool changed;
  int collidecorner;
  Uint32 LastUpdate;
  bool removable;
  double AngleModifier; // only for paddle (should be in subclass)
  double MovementAngleModifier; // only for paddle (should be in subclass)
  bool is_dying; // only for ball (should be in subclass)
public:
  TEntity(double x_, double y_, Angle a_ = 0,
	  EntityType e = "BRICK", 
	  MoveType m = STATIONARY, 
	  CollisionGranularity c = BOX);
  TEntity(double x_, double y_, int w_, int h_, Angle a_ = 0, 
	  EntityType e = "BRICK", 
	  MoveType m = STATIONARY, 
	  CollisionGranularity c = BOX);
  TEntity(const TOrientedPoint& p, 
	  EntityType e = "BRICK", 
	  MoveType m = STATIONARY, 
	  CollisionGranularity c = BOX);
  virtual ~TEntity();

  virtual void load(const std::string& path);

  virtual void Update(Uint32 deltatime);

  virtual void Render(SDL_Surface * surface);

  void setName(const std::string& n) { name = n; };
  std::string getName() const { return name; };

  inline TMotion * getMotion() { return motion; }
  void setMotion(TMotion* m);

  /* Called when this entity collidies with another */
  virtual void OnCollision(TEntity& other, Uint32 time = 0);

  inline EntityType getEntityType() const { return entity_type; }
  inline CollisionGranularity getCollisionGranularity() const { 
    return collision_granularity; 
  }
  inline MoveType getMoveType() const { return move_type; }
  /* Stuff to do with calling scripts (Test) */
  void SetScriptHitCall(string function);
  void ExecuteScriptHitCall();

  /* MarkDying - prepare this entity for its destiny... */
  virtual void MarkDying();
  /* Ask if entity can be removed */
  bool IsRemovable();

  /*
    Geometry functions of the entity
  */
  inline double x() const { return position.x(); };
  inline double y() const { return position.y(); };
  inline void setX(double _x) { position.setX(_x); }
  inline void setY(double _y) { position.setY(_y); }
  inline Angle getAngle() const { return position.getAngle(); }
  inline void setAngle(Angle a) { position.setAngle(a); }
  inline int w() const { return _w; };
  inline int h() const { return _h; };
  inline void setW(int w_) { _w = w_; }
  inline void setH(int h_) { _h = h_; }
  inline bool boundingBoxCollision(TEntity& obj);
  inline int getCollideCorner() { return collidecorner; }
  inline void resetCollideCorner() { collidecorner = 0; }
  inline Uint32 getLastUpdate() { return LastUpdate; };
  /*
    return ! ((obj.position.y()+obj._h) < position.y() || 
	      (position.y()+_h) < obj.position.y() || 
	      (obj.position.x()+obj._w) < position.x() || 
	      (position.x()+_w) < obj.position.x());
  }
  */
  virtual bool pixelCollision(TEntity& obj);
  friend class TMotion;
  friend class TFreeMotion;
  friend class TPathMotion;
  friend class TPixmapEntity;
};

/* Define a list of entities */
typedef std::list<TEntity *> TEntities;
typedef TEntities::iterator TEntitiesIterator;

/* This is a hack. Yuck. Kids, don't do this at home */
extern TEntity * current_script_entity;
#endif


