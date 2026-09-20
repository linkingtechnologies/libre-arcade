/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "shoot.hpp"
 * 
 * Explosion - Small Class for an Explosion
 *
 * Shoot - Main Class for a Shoot. Contains it's Explosion
 *
 * Lasers - Normal Shoot
 *
 * Cluster - Cluster Shoot. If it explodes (Timeout or Hit) it will release
 * more Shoots
 *
 * Heavy - Low Gravity and high strength
 *
 * Funghi - Explodes and destroys in a wide-range
 *
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 ******************************************************************************************/

#ifndef __SHOOT_HPP__
#define __SHOOT_HPP__

#include "vector_2.hpp"

#include "constants.hpp"
#include "graphics.hpp"
#include "galaxy.hpp"

class Galaxy;
class Extra;

/************************************************************************
 *									*
 * Explosion								*	
 *									*
 ************************************************************************/
class Explosion : public Spaceobject
{
public:
	Explosion( double x=0, double y=0 );

	~Explosion();
	
	bool is_active() const;

	void activate( double x, double y );
	
	bool check_collision( double x, double y, double width, bool spacing=false );

	void draw();

	void hit( Spaceobject *object );

private:
	bool exploding;
	Sprite *explosion_sprite;

	void calculate_ShootPath( Vector_2 start, Vector_2 direction, Galaxy *galaxy );
};

/************************************************************************
 *									*
 * Shoot 								*	
 *									*
 ************************************************************************/
 class Shoot : public Spaceobject
 {
 public:
	Shoot( double x=0, double y=0 );

	~Shoot();
	
	virtual bool is_active() const;

	bool will_be_a_Hit( int player_id, double factor, Vector_2 start, Vector_2 direction, Galaxy *galaxy );

	void activate( Vector_2 start, Vector_2 vector );

	virtual void reset();

	virtual void destroy();

	virtual bool move( Galaxy *galaxy );

	virtual bool has_Extra_collision( Extra *extra );
	
	virtual bool check_collision( double x, double y, double width, bool spacing=false );

	virtual void draw();

	void draw_hint( Vector_2 start, Vector_2 direction, Galaxy *galaxy );

	virtual void hit( Spaceobject *object );

protected:
	bool is_exploding;
	int moving_time;
	Vector_2 last_shootPos;
	int pre_calculated_Steps;

	struct { 
		int x, y;
	} pre_calculated_Pos[MAXPRECALC];
	
	Explosion *explosion;

	void calculate_ShootPath( Vector_2 start, Vector_2 direction, Galaxy *galaxy );  
};

/************************************************************************
 *									*
 * Laser								*	
 *									*
 ************************************************************************/
class Laser : public Shoot
{
public:	
	Laser( double x=0, double y=0 );
	
	~Laser();
	
	bool is_active() const;

	void reset() {};

	void destroy();
	
	bool move( Galaxy *galaxy );
	
	bool has_Extra_collision( Extra *extra );

	bool check_collision( double x, double y, double width, bool spacing=false );

	void draw();

	void hit( Spaceobject *object );

private:
	Sprite *laser_sprite,
		*laserback_sprite,
		*laserbackk_sprite;

};

/************************************************************************
 *									*
 * Heavy								*	
 *									*
 ************************************************************************/
class Heavy : public Shoot
{
public:	
	Heavy( double x=0, double y=0 );
	
	~Heavy();
	
	bool is_active() const;

	void reset() {};

	void destroy();
	
	bool move( Galaxy *galaxy );
	
	bool has_Extra_collision( Extra *extra );

	bool check_collision( double x, double y, double width, bool spacing=false );
	
	void draw();

	void hit( Spaceobject *object );

private:
	Sprite *heavy_sprite,
		*heavyback_sprite,
		*heavybackk_sprite;

};

/************************************************************************
 *									*
 * Cluster								*	
 *									*
 ************************************************************************/
class Cluster : public Shoot
{
public:	
	Cluster( double x=0, double y=0 );
	
	~Cluster();
	
	bool is_active() const;

	void reset();

	void destroy();
	
	bool move( Galaxy *galaxy );
	
	bool has_Extra_collision( Extra *extra );

	bool check_collision( double x, double y, double width, bool spacing=false );
	
	void draw();

	void hit( Spaceobject *object );

private:
	bool lasers_active;
	bool destroyed;
	int laser_hits;
	
	Sprite *cluster_sprite,
		*clusterback_sprite,
		*clusterbackk_sprite;
	Laser *lasers;

};

#endif
