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
#include "entity.hh"

#include "debug.hh"
#include "surfacemanager.hh"
#include "motion.hh"
#include "interprenter.hh"

/* **********************************************************************
 * The current script entity. Yuck.
 * *********************************************************************/
TEntity * current_script_entity = NULL;

/* **********************************************************************
 * The constructor pt. loads a surface to blit around.
 * *********************************************************************/
TEntity::TEntity(double x_, double y_, Angle a, 
		 EntityType e, MoveType m, CollisionGranularity c) :
  _w(24), _h(16), position(TOrientedPoint(x_,y_,a)), collidepoint(0,0),
  name("unknown"), 
  entity_type(e), collision_granularity(c), move_type(m),
  motion(0), 
  mask(0),changed(true),
  collidecorner(0), removable(false), AngleModifier(0.05), 
  MovementAngleModifier(1.55), is_dying(false)
{
}

TEntity::TEntity(double x_, double y_, int w_, int h_, 
		 Angle a, 
		 EntityType e, MoveType m, CollisionGranularity c) :
  _w(w_), _h(h_), position(TOrientedPoint(x_,y_,a)), collidepoint(0,0),
  name("unknown"), 
  entity_type(e), collision_granularity(c), move_type(m),
  motion(0), mask(0),
  changed(true), collidecorner(0), removable(false), 
  AngleModifier(0.05), MovementAngleModifier(1.55), is_dying(false)
{

}

TEntity::TEntity(const TOrientedPoint& p, 
		 EntityType e, MoveType m, CollisionGranularity c) :
  _w(24), _h(16), position(p), collidepoint(0,0), name("unknown"), 
  entity_type(e), collision_granularity(c), move_type(m),
  motion(0), mask(0), 
  changed(true), collidecorner(0), removable(false), 
  AngleModifier(0.05), MovementAngleModifier(1.55), is_dying(false)
{
}

/* **********************************************************************
 * The destructor just clears the surface
 * *********************************************************************/
TEntity::~TEntity() {
}

/* **********************************************************************
 * load - loads a entity from path
 * *********************************************************************/
void TEntity::load(const std::string& path) 
{
  string abspath = PathManager->Resolve(path);
}

/* **********************************************************************
 * setmotion set the motion of the entity
 * *********************************************************************/
void TEntity::setMotion(TMotion* m)
{
  if (motion)
    delete motion;
  motion = m;
}

/* **********************************************************************
 * The Update method simple moves the TEntity along with the velocity
 * *********************************************************************/
void TEntity::Update(Uint32 deltatime) 
{
  /* Sanity check */
  if (!removable && 
      (y() < -1000.0 || y() > 1600.0 || x() < -1000.0 || x() > 1800.0)) {
    LogLineExt(LOG_ERROR, 
	       ("Entity %s is way outside screen - removing it", 
		name.c_str()));
    removable = true;
  }
  
  if (move_type == STATIONARY) {
    changed = false;
    return;
  }

  if (motion)
    motion->Update(deltatime,*this);
}

/* **********************************************************************
 * The render method simply blit the entity to the surface provided
 * (This will probably change)
 * *********************************************************************/
void TEntity::Render(SDL_Surface * surface) {
  SDL_Rect dest;

  //  if (!changed)
  //    return;

  dest.x = static_cast<int>(x()); 
  dest.y = static_cast<int>(y());
  dest.w = _w; dest.h = _h;
  Uint32 color = SDL_MapRGB(surface->format, 0xFF, 0x00, 0x00);

  SDL_FillRect(surface, &dest, color);

  changed = false;
}

/* **********************************************************************
 * Marking dying and removable is to have a way to remove entities 
 * - balls and bricks, mostly - from a map.
 * *********************************************************************/
void TEntity::MarkDying() {
  removable = true;
  /* Could be used to spawn some sort of animation, etc */
}

bool TEntity::IsRemovable() {
  return removable;
}

/* **********************************************************************
 * boundingBoxCollision determines if the entity o's boundingBox, 
 * collides with this boundingbox
 * Much of this code is taken from sgelib
 * *********************************************************************/
bool TEntity::boundingBoxCollision(TEntity& o)
{
  double x1 = position.x();
  double y1 = position.y();
  double x2 = o.position.x();
  double y2 = o.position.y();
  double w1 = static_cast<double>(_w);
  double h1 = static_cast<double>(_h);
  double w2 = static_cast<double>(o._w);
  double h2 = static_cast<double>(o._h);
  
  if(x1 < x2){
    if(x1+w1 > x2){
      if(y1 < y2){
	if(y1+h1 > y2){
	  collidepoint.setX(x1 + w1);
	  collidepoint.setY(y1 + h1);
	  o.collidepoint.setX(x2);
	  o.collidepoint.setY(y2);
	  o.collidecorner = 1;
	  collidecorner = 3;
	  return true;
	}
      }
      else{
	if(y2+h2 > y1){
	  collidepoint.setX(x1 + w1);
	  collidepoint.setY(y1);
	  o.collidepoint.setX(x2);
	  o.collidepoint.setY(y2 + h2);
	  o.collidecorner = 2;
	  collidecorner = 4;
	  return true;
	}
      }
    }	
  }
  else{
    if(x2+w2 > x1){
      if(y2 < y1){
	if(y2+h2 > y1){
	  collidepoint.setX(x1);
	  collidepoint.setY(y1);
	  o.collidepoint.setX(x2 + w2);
	  o.collidepoint.setY(y2 + h2);
	  o.collidecorner = 3;
	  collidecorner = 1;
	  return true;
	}
      }
      else{
	if(y1+h1 > y2){
	  collidepoint.setX(x1);
	  collidepoint.setY(y1 + h1);
	  o.collidepoint.setX(x2 + w2);
	  o.collidepoint.setY(y2);
	  o.collidecorner = 4;
	  collidecorner = 2;
	  return true;
	}
      }
    }	
  }
  return false;
}

/* **********************************************************************
 * PixelCollision determines whether the TEntity obj, 
 * of obj collides with this TEntity using pixel perfection. 
 * *********************************************************************/
bool TEntity::pixelCollision(TEntity& o) {
  return boundingBoxCollision(o);
}

/* **********************************************************************
 * Called, when this entity collides with another
 * *********************************************************************/
void TEntity::OnCollision(TEntity& other,Uint32 currenttime) {

  /* This must only be called, when at least boundingCollision have been 
     called 
     The purpose of this method is to resolve collisions between this object
     and the other. */
  /* Check if we have already collided */
  if (LastUpdate == currenttime) {
    return;
  }

  TEntity* ball;
  TEntity* tother;

  /* Mega if on this beeing a ball */
  if (getEntityType() == "BALL" && "POWERUP" != other.getEntityType()) {
    /* LogLineExt(LOG_VERBOSE, ("BALL has collided with %s", 
       other.getEntityType().c_str())); */
	       
    ball = this;
    tother = &other;

    // set collision update time
    // so that we won't calculate collisions
    // 2 times on a entity
    LastUpdate = currenttime;
    // other.LastUpdate = currenttime;
    
    //
    // If we have a ball in the collision
    //
    if (ball->getMotion()) {
      double colx = ball->x();
      double coly = ball->y();
      ball->getMotion()->rewind(*ball);
      TFreeMotion* motion = dynamic_cast<TFreeMotion*>(ball->getMotion());
      double newangle = 0.0;
      
      
      double ballwidth = 0;
      double ballheight = 0;
    
      // if the ball is on the way down the drain, skip collision response
      if ( tother->getEntityType() == "PADDLE" && 
	   (ball->y() + ball->h()) > tother->y() ) {

	ball->getMotion()->setVelocity(0.5);
	ball->setX(colx);
	ball->setY(coly);
	// make sure the right reflektion is done
	if (!ball->is_dying && 
	    ((motion->getDir() > (3*M_PI/2) && ball->x() < (tother->x() + tother->w()/2)) ||
	     (motion->getDir() < (3*M_PI/2) && ball->x() > (tother->x() + tother->w()/2)) ) )
	  motion->setDir(3.0 * M_PI - motion->getDir());       
	ball->is_dying = true;
	return;
      }

      switch(tother->collidecorner) {
      case 1:
	ballwidth = ball->w();
	ballheight = ball->h();
	break;
      case 2:
	ballwidth = ball->w();
	break;
      case 3:
	break;
      case 4:
	ballheight = ball->h();
	break;
      }
      double dx = ball->collidepoint.x() - (ball->x() + ballwidth);
      double dy = ball->collidepoint.y() - (ball->y() + ballheight);
      
      // Equation of two lines intersecting, knowing that one of 
      // the lines is vertical. The taking only the y component of the 
      // intersection point.
      double lin_intersect_y = dy * ((tother->collidepoint.x() - (ball->x() + ballwidth) ) / dx) + ball->y() + ballheight; 
      
      bool verticalhit = false;
      switch(tother->collidecorner) {
      case 1:
	if ( lin_intersect_y > tother->collidepoint.y() && dx > 0) {
	  verticalhit = true;
	}
	break;
      case 2:
	if ( lin_intersect_y < tother->collidepoint.y() && dx > 0) {
	  verticalhit = true;
	}
	break;
      case 3:
	if ( lin_intersect_y < tother->collidepoint.y() && dx < 0) {
	  verticalhit = true;
	}
	break;
      case 4:
	if ( lin_intersect_y > tother->collidepoint.y() && dx < 0) {	
	  verticalhit = true;
	}
	break;
      }
      
      if ( verticalhit ) {	
	// OK collision on the side
	// a hit from the left
	newangle = (dy < 0) ? 
	  M_PI - motion->getDir() :
	  3.0 * M_PI - motion->getDir(); 
	
	if (dx >= 0) {
	  ball->setX(colx - 2 * ( (colx + ballwidth) -  tother->collidepoint.x()));	
	}else{
	  ball->setX(colx + 2 * ( tother->collidepoint.x() - colx ));
	}
	ball->setY(coly);
	
	
      }else{
	// OK collision on the top/bottom
	
	newangle = (dx < 0) ? 
	  2.0 * M_PI - motion->getDir() :
	  2.0 * M_PI - motion->getDir();
	
	if (dy >= 0) {

	  ball->setY(coly - 2 * ( (coly + ballheight) -  tother->collidepoint.y()) -1  );

	  // If the ball has hit the paddle from above we make some modifications to the angle
	  // depending where on the paddle the ball has hit.
	  if (tother->getEntityType() == "PADDLE") {
	    double lx = (ball->x() + ball->w()/2) - tother->x();
	    lx = (lx < 0) ? 0 :  ( (lx > tother->w()) ? tother->w() : lx);
	    double modangle = ( (tother->w()/2) < lx) ? -log(lx - tother->w()/2) : log(tother->w()/2 - lx);
	    modangle = ( (tother->w()/2) == lx) ? 0 : modangle;

	    // if the ball hits the middle of the bat no angle modifier is applied
	    modangle = (fabs(tother->w()/2 - lx) < (tother->w() * 0.3)) ? 0 : modangle;

	    // OK now we see if the paddle is moving and make the appropriate changes to 
	    // the angle of the ball.
	    double modangle2 = 0;
	    if (motion->getCurrentVelocity() != 0)
	      modangle2 = -(tother->MovementAngleModifier * tother->getMotion()->getCurrentVelocity());

	    newangle += modangle * tother->AngleModifier + modangle2;

	    // make some adjustment so the ball doesn't move horizontal ever
	    if (newangle < (M_PI / 7)) {
	      newangle = M_PI / 7;
	    } else if (newangle > (6 *M_PI / 7)) {
	      newangle = 6 * M_PI / 7;
	    }
	  }
	}else{
	  ball->setY(coly + 2 * ( tother->collidepoint.y() -  coly) + 1 );
	}
	
	ball->setX(colx);
	
      }
      motion->setDir(newangle);
    } 
    
  } /* If ball in collision */
  
  /* Execute the script associated with this entity */
  /* HACK: We do not want the paddle to script on 
     hitting powerups */
  if ("PADDLE" != getEntityType() 
      || "POWERUP" != other.getEntityType()) {
    ExecuteScriptHitCall();
  }
}

/* **********************************************************************
 * Script hit call operations
 * *********************************************************************/
void TEntity::SetScriptHitCall(string function) {
  ScriptHitCall = function;
}
 
void TEntity::ExecuteScriptHitCall() {
  if ("" != ScriptHitCall) {
    current_script_entity = this;
    if(!Interprenter->RunSimpleString(ScriptHitCall)) {
      LogLine(LOG_ERROR, "TEntity::ExecuteScriptHitCall error");
      LogLineExt(LOG_ERROR, ("Script is >>>%s<<<", ScriptHitCall.c_str()));
    }
  } else {

    // LogLineExt(LOG_VERBOSE, ("No script for %s", name.c_str()));
  }
  current_script_entity = NULL;
}
