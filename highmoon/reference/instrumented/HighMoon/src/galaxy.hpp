/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "galaxy.hpp"
 * 
 * Spaceobject - virtual Object that contains all Information
 * that is needed for an Object in Galaxy. Extended by all
 * other Objects.
 *
 * Planet, Wormhole, Blackhole - Shown on Screen
 *
 * Ufo - Flying Saucer. An Ufo-Object contains Shoot-Objects
 *
 * Galaxy - This Object contains Planets, Wormholes, Blackholes,
 * Ufos and Shoots.
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

#ifndef __GALAXY_HPP__
#define __GALAXY_HPP__

#include "vector_2.hpp"
#include "constants.hpp"
#include "graphics.hpp"
#include "object.hpp"
#include "shoot.hpp"

class Galaxy;
class Shoot;

/************************************************************************
 *									*
 * Extra								*
 *									*
 ************************************************************************/
class Extra : public Spaceobject 
{
public:
	Extra( double x=0, double y=0 );
	
	~Extra();
	
	void kill();
	
	bool check_collision( double x, double y, double width, bool spacing = false );

	void init( Galaxy *galaxy );
	
	void draw();
	
	void hit( Spaceobject *object );

private:
	int wait, waiting;
	Sprite *extra_sprite;
};

 /************************************************************************
 *									*
 * Stone ( Moons and Ring-Objects )					*
 *									*
 ************************************************************************/
class Stone : public Spaceobject
{
public:
	Stone( double x=0, double y=0, double angle=-1 );

	~Stone();

	void set_Distance( double distance );
	
	bool check_collision( double x, double y, double width, bool spacing=false );

	void draw( bool behind_planet=true );

	void hit( Spaceobject *object );
	
private:
	bool is_moon;
	double pos_1, pos_2;
	double x_a, y_a;
	double speed;
	double distance;
	
	Sprite *stone_sprite,
		*stone_mask;
};


/************************************************************************
 *									*
 * Planet								*	
 *									*
 ************************************************************************/
class Planet : public Spaceobject
{
public:
	Planet( double x=0, double y=0 );

	~Planet();
		
	bool check_collision( double x, double y, double width, bool spacing = false );

	void draw();

	void hit( Spaceobject *object );
	
private:
	Vector_2 hit_vector;

	enum Planettype { 
		P_JUPITER=0,
		P_EARTH=1,
		P_MARS=2,
		P_VENUS=3,
		P_SATURN=4 
	} planet_type;

	Sprite *planet_sprite;
	Stone *objects[MAXSTONES];
	int objects_of_planet;
};

/************************************************************************
 *									*
 * Blackhole								*	
 *									*
 ************************************************************************/
class Blackhole : public Spaceobject
{
public:
	Blackhole( double x=0, double y=0 );

	~Blackhole();
		
	bool check_collision( double x, double y, double width, bool spacing=false );

	void draw();

	void hit( Spaceobject *object );
	
private:
	Vector_2 *particles[MAXHOLE];
	Sprite *hole_sprite;
	
};

/************************************************************************
 *									*
 * Wormhole								*	
 *									*
 ************************************************************************/
class Wormhole : public Spaceobject
{
public:
	Wormhole( double x=0, double y=0 );

	~Wormhole();
		
	bool check_collision( double x, double y, double width, bool spacing = false );

	void draw();

	void hit( Spaceobject *object );
	
private:
	double exit_x, exit_y;
	double particles[MAXWORM];
	Vector_2 *start_particles[MAXWORM/15];

};

/************************************************************************
 *									*
 * Flying Saucer							*	
 *									*
 ************************************************************************/
class Ufo : public Spaceobject
{
public:
	Ufo( double x, double y );

	~Ufo();

	bool is_dead() const;
	
	bool is_Computer() const;

	int get_Energy() const;

	int get_Bonus() const;

	int get_BoughtWeapon() const;

	void reset();

	void set_Human();
	
	void set_Computer();
	
	void add_Bonus();
	
	void buy_Bonus();
	
	void next_Weapon();
	
	void activate();
	
	void deactivate();

	void move_Up();

	void move_Down();

	void inc_ShootAngle();

	void dec_ShootAngle();

	void inc_ShootPower();

	Shoot *shoot();
	
	bool calculate_Computer_Move( Galaxy *galaxy, int factor );

	bool check_collision( double x, double y, double width, bool spacing = false );

	void draw();
	
	void draw_hint( Galaxy *galaxy );

	void hit( Spaceobject *object );

private:
	int player_id;
	bool is_human,
		is_active,
		is_locked;
	int shield_strength;
	int bonus;
	WeaponId bought_weapon;
	double shoot_power,
		shoot_angle;
	
	enum { 
		NONE,
		THINKING,
		SHOOTING 
	} computer_mode;
	
	Sprite *ufo_sprite, 
		*circle_sprite, 
		*thinking_sprite,
		*shooting_sprite;
	
	static int current_playerid;

	void draw_Targetmode();

	void draw_Computermode();
};

/************************************************************************
 *									*
 * Galaxy								*	
 *									*
 ************************************************************************/
class Galaxy 
{
public:
	Galaxy( int max, int seed );
	
	~Galaxy();

	double get_ShootX() const;
	
	double get_ShootY() const;
	
	bool is_ShootActive() const;
	
	bool is_Imploding() const;

	bool is_Ufo_In_Area( int player_id, double x, double y, double factor );
	
	void set_Ufos( Ufo **ufos, int max );

	void set_Shoot( Shoot *shoot );

	void kill_all_Shoots();
	
	bool has_Extra_collision();

	bool has_collision( Spaceobject *object );
	
	bool check_collision( double x, double y, double width, bool spacing = false );
	
	bool create( int max, int seed );
	
	void calculate_nextPos( Vector_2 &position, Vector_2 &direction );

	bool animate();
	
	void draw();
	
private:
	bool is_imploding;
	int objects_in_galaxy;
	int ufos_in_galaxy;
	
	Spaceobject *objects[MAXPLANETS];
	Ufo **ufos;
	Shoot *shoot;
	Extra *extra;

	struct {
		double x, y;
	} animate_position[MAXPLANETS];

	bool animate_BigBang();
};

#endif
