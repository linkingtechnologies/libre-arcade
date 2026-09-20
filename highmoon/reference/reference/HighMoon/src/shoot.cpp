/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "shoot.cpp"
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

#include <cmath>

#include "sound.hpp"
#include "shoot.hpp"

extern SDL_Surface* MYSDLSCREEN;
extern Soundset *sound;

#ifdef __DEBUG__
extern int __SHOOTS;
extern int __HITS;
#endif

/************************************************************************
 *									*
 * Explosion								*	
 *									*
 ************************************************************************/
Explosion::Explosion( double x, double y )
:
	Spaceobject( x, y ),
	exploding(false)
{
	verbose( "Initializing Explosion" );

	explosion_sprite = new Sprite( "gfx/explosionanim.gif", 6 );
	explosion_sprite->setAlpha(230);
	explosion_sprite->setRepeatmode(false);
	explosion_sprite->setFramerate(1);
}

Explosion::~Explosion()
{
	verbose( "Deleting Explosion" );

	delete explosion_sprite;
}

bool Explosion::is_active() const
{
	return exploding;
}

void Explosion::activate( double x, double y )
{
	set_Pos( x, y );
	explosion_sprite->setPos( (int)x, (int)y );
	explosion_sprite->resetFrames();
	exploding = true;
	
	sound->play(SOUND_EXPLOSION);
}

bool Explosion::check_collision( double x, double y, double width, bool spacing )
{
	return false;
}

void Explosion::draw()
{
	if ( is_active() ) {
		explosion_sprite->draw();
		exploding = !explosion_sprite->is_onLastFrame();
	}	
}

void Explosion::hit( Spaceobject *object ) {}

/************************************************************************
 *									*
 * Shoot 								*	
 *									*
 ************************************************************************/
Shoot::Shoot( double x, double y )
:
	Spaceobject( x, y ),
	is_exploding(false),
	moving_time(0),
	last_shootPos( Vector_2(0,0,K) ),
	pre_calculated_Steps(0)
{
	verbose( "Initializing Shoot" );

	weight = 1;	
	explosion = new Explosion();
}

Shoot::~Shoot() 
{
	verbose( "Deleting Shoot" );

	delete explosion;
}

bool Shoot::is_active() const
{
	return false;
}

bool Shoot::will_be_a_Hit( int player_id, double factor, Vector_2 start, Vector_2 direction, Galaxy *galaxy )
{
	calculate_ShootPath( start, direction, galaxy );
	
	for ( int i=0; i < pre_calculated_Steps; i++ )
		if ( galaxy->is_Ufo_In_Area( player_id, pre_calculated_Pos[i].x, pre_calculated_Pos[i].y, factor ) )
			return true;		
		
	return false;
}

void Shoot::activate( Vector_2 start, Vector_2 vector )
{
	set_Pos( start.getX(), start.getY() );
	direction = vector.getAngle();
	speed = vector.getLength();
	last_shootPos = start;
	is_exploding = false;
	moving_time = MAXSHOOTRUN;

	sound->play(SOUND_SHOOT);
}

void Shoot::reset() {}

void Shoot::destroy() {}

bool Shoot::move( Galaxy *galaxy ) { return false; }

bool Shoot::has_Extra_collision( Extra *extra ) 
{
	return false;
}

bool Shoot::check_collision( double x, double y, double width, bool spacing )
{
	return false;
}

void Shoot::draw() {}

void Shoot::draw_hint( Vector_2 start, Vector_2 direction, Galaxy *galaxy )
{
	static int colorpos = 50;
	
	if ( (colorpos -= 20) < 50 ) colorpos = 255;
	
	calculate_ShootPath( start, direction, galaxy );
	
	int c = colorpos;
	
	SDL_LockSurface( MYSDLSCREEN );

	for (int i=0; i < pre_calculated_Steps; i++) {
		Sprite::putpixel( 
			pre_calculated_Pos[i].x + Sprite::x_offset,
			pre_calculated_Pos[i].y + Sprite::y_offset,
			SDL_MapRGB( MYSDLSCREEN->format, c, c, c ) );

		if ( (c += 30) > 255 ) c = 50;
	}

	SDL_UnlockSurface( MYSDLSCREEN );
}

void Shoot::hit( Spaceobject *object ) {}

void Shoot::calculate_ShootPath( Vector_2 start, Vector_2 direction, Galaxy *galaxy )
{
	static Vector_2 last_angle=Vector_2( 0, 0, K );
	static Vector_2 last_shoot=Vector_2( 0, 0, K );

	if ( last_angle != direction || last_shoot != start ) {

		pre_calculated_Steps = 0;
		last_angle = direction;
		last_shoot = start;
		
		for ( int i=0; i < MAXPRECALC; i++ ) {
			galaxy->calculate_nextPos( start, direction );
			double x = start.getX();
			double y = start.getY();
			
			if ( !galaxy->check_collision( x, y, get_Width() ) ) {	
				pre_calculated_Pos[i].x = (int)x;
				pre_calculated_Pos[i].y = (int)y; 
				pre_calculated_Steps++;
			} else break; 
		}
	}
}

/************************************************************************
 *									*
 * Laser								*	
 *									*
 ************************************************************************/
Laser::Laser( double x, double y )
:
	Shoot( x, y )
{
	verbose( "Initializing Laser" );
	
	laser_sprite = new Sprite( "gfx/shoot.gif" );
	laserback_sprite = new Sprite( "gfx/shootback.gif" );
	laserbackk_sprite = new Sprite( "gfx/shootbackk.gif" );

	width = laser_sprite->getWidth();
}
	
Laser::~Laser()
{
	verbose( "Deleting Laser" );

	delete laser_sprite;
	delete laserback_sprite;
	delete laserbackk_sprite;
}

bool Laser::is_active() const
{
	return moving_time > 0;
}
	
void Laser::destroy() 
{
	if ( is_active() )
		hit( this );
}

bool Laser::move( Galaxy *galaxy )
{
	if ( is_active() ) {
		if ( --moving_time == 0 ) return true;
	
		Vector_2 my_shootPos = Vector_2( get_X(), get_Y(), K );
		Vector_2 my_shootVector = Vector_2( speed, direction, P );
		last_shootPos = my_shootPos;
		
		galaxy->calculate_nextPos( my_shootPos, my_shootVector );

		x = my_shootPos.getX();
		y = my_shootPos.getY();
		speed = my_shootVector.getLength();
		direction = my_shootVector.getAngle();
		
		if ( galaxy->has_collision( this ) &&
			!is_active() )
			
			return true;
	}
	
	return false;
}
	
bool Laser::has_Extra_collision( Extra *extra ) 
{
	if ( extra->has_collision( (Spaceobject *)this ) )
		return true;
	
	return false;
}

bool Laser::check_collision( double x, double y, double width, bool spacing )
{
	return check_sphere_collision( x, y, width, spacing );
}

void Laser::draw()
{
	if ( is_active() ) {

		if ( moving_time > 100 ||
			(int)RANDOM(100, 0) < ( moving_time/2 )+25 ) {
			
			double x_anim = RANDOM(2, -2);
			double y_anim = RANDOM(2, -2);
			int alpha_anim = (int)RANDOM(10, -10);
			
			Vector_2 v = last_shootPos-Vector_2( get_X(), get_Y(), K );
			Vector_2 v_1 = v*0.5;
			Vector_2 v_2 = v*0.2;
			
			laserbackk_sprite->setAlpha( 120+alpha_anim );
			laserbackk_sprite->setPos(
				(int)( get_X()+v_1.getX() ),
				(int)( get_Y()+v_1.getY() ) );				
			laserbackk_sprite->draw();

			laserback_sprite->setAlpha( 140+alpha_anim );
			laserback_sprite->setPos(
				(int)( get_X()+v_2.getX() + x_anim ),
				(int)( get_Y()+v_2.getY() + y_anim ) );				
			laserback_sprite->draw();
			
			laser_sprite->setAlpha( 200+alpha_anim );
			laser_sprite->setPos( (int)get_X(), (int)get_Y() );
			laser_sprite->draw();
		}
	}
	
	if ( is_exploding ) {
		explosion->draw();
		is_exploding = explosion->is_active();
	}
}

void Laser::hit( Spaceobject *object )
{
	explosion->activate( x, y );
	is_exploding = true;
	moving_time = 0;
}

/************************************************************************
 *									*
 * Heavy								*	
 *									*
 ************************************************************************/
Heavy::Heavy( double x, double y )
:
	Shoot( x, y )
{
	verbose( "Initializing Heavy" );

	weight = 2;
	
	heavy_sprite = new Sprite( "gfx/heavy.gif" );
	heavyback_sprite = new Sprite( "gfx/heavyback.gif" );
	heavybackk_sprite = new Sprite( "gfx/heavybackk.gif" );

	width = heavy_sprite->getWidth();
}
	
Heavy::~Heavy()
{
	verbose( "Deleting Heavy" );

	delete heavy_sprite;
	delete heavyback_sprite;
	delete heavybackk_sprite;
}
	
bool Heavy::is_active() const
{
	return moving_time > 0;
}

void Heavy::destroy() 
{
	if ( is_active() )
		hit( this );
}

bool Heavy::move( Galaxy *galaxy )
{
	if ( is_active() ) {
		
		if ( --moving_time == 0 ) return true;
	
		Vector_2 my_shootPos = Vector_2( get_X(), get_Y(), K );
		Vector_2 my_shootVector = Vector_2( speed, direction, P );
		last_shootPos = my_shootPos;
		
		galaxy->calculate_nextPos( my_shootPos, my_shootVector );

		x = my_shootPos.getX();
		y = my_shootPos.getY();
		speed = my_shootVector.getLength();
		direction = my_shootVector.getAngle();
		
		if ( galaxy->has_collision( this ) &&
			!is_active() )
			
			return true;
	}
	
	return false;
}
	
bool Heavy::has_Extra_collision( Extra *extra ) 
{
	if ( extra->has_collision( (Spaceobject *)this ) )
		return true;
	
	return false;
}

bool Heavy::check_collision( double x, double y, double width, bool spacing )
{
	return check_sphere_collision( x, y, width, spacing );
}

void Heavy::draw()
{
	if ( is_active() ) {

		if ( moving_time > 100 ||
			(int)RANDOM(100, 0) < ( moving_time/2 )+25 ) {
			
			double x_anim = RANDOM(2, -2);
			double y_anim = RANDOM(2, -2);
			int alpha_anim = (int)RANDOM(10, -10);
			
			Vector_2 v = last_shootPos-Vector_2( get_X(), get_Y(), K );
			Vector_2 v_1 = v * 0.5;
			Vector_2 v_2 = v * 0.2;
			
			heavy_sprite->setAlpha( 200 + alpha_anim );
			heavy_sprite->setPos( (int)get_X(), (int)get_Y() );
			heavy_sprite->draw();

			heavybackk_sprite->setAlpha( 100 + alpha_anim );
			heavybackk_sprite->setPos(
				(int)( get_X() + v_1.getX() ),
				(int)( get_Y() + v_1.getY() ) );				
			heavybackk_sprite->draw();

			heavyback_sprite->setAlpha( 130 + alpha_anim );
			heavyback_sprite->setPos(
				(int)( get_X() + v_2.getX() + x_anim ),
				(int)( get_Y() + v_2.getY() + y_anim ) );				
			heavyback_sprite->draw();			
		}
	}
	
	if ( is_exploding ) {
		explosion->draw();
		is_exploding = explosion->is_active();
	}
}

void Heavy::hit( Spaceobject *object )
{
	explosion->activate( x, y );
	is_exploding = true;
	moving_time = 0;
}

/************************************************************************
 *									*
 * Cluster								*	
 *									*
 ************************************************************************/
Cluster::Cluster( double x, double y )
:
	Shoot( x, y ),
	lasers_active(false)
{
	verbose( "Initializing Cluster" );

	reset();

	cluster_sprite = new Sprite( "gfx/shoot.gif" );
	clusterback_sprite = new Sprite( "gfx/shootback.gif" );
	clusterbackk_sprite = new Sprite( "gfx/shootbackk.gif" );

	width = cluster_sprite->getWidth();
	
	lasers = new Laser[MAXCLUSTERLASER];
}
	
Cluster::~Cluster()
{
	verbose( "Deleting Cluster" );

	delete cluster_sprite;
	delete clusterback_sprite;
	delete clusterbackk_sprite;
	delete[] lasers;
}
	
bool Cluster::is_active() const
{
	for ( int i=0; i < MAXCLUSTERLASER; i++ )
		if ( lasers[i].is_active() )
			return true;

	return moving_time>0;
}

void Cluster::reset() 
{
	destroyed = false;
	laser_hits = 0;
	moving_time = 0;
}

void Cluster::destroy() 
{

	for ( int i=0; i < MAXCLUSTERLASER; i++ )
		if ( lasers[i].is_active() )
			lasers[i].hit(this);

	if ( is_active() ) {
		destroyed = true;
		hit( this );
	}
}

bool Cluster::move( Galaxy *galaxy )
{
	if ( destroyed )
		return true;

	if ( moving_time > 0 ) {

		if ( --moving_time == 0 )
			return true;

		else {		
			Vector_2 my_shootPos = Vector_2( get_X(), get_Y(), K );
			Vector_2 my_shootVector = Vector_2( speed, direction, P );
			last_shootPos = my_shootPos;
			
			galaxy->calculate_nextPos( my_shootPos, my_shootVector );
	
			x = my_shootPos.getX();
			y = my_shootPos.getY();
			speed = my_shootVector.getLength();
			direction = my_shootVector.getAngle();
			
			if ( galaxy->has_collision( this ) ) {
				laser_hits++;
			}
		}
	}
	
	for ( int i=0; i < MAXCLUSTERLASER; i++ )
		if ( lasers[i].is_active() && lasers[i].move( galaxy ) )
			laser_hits++;

	if ( laser_hits >= MAXCLUSTERLASER + 1 )
		return true;

	return false;
}

bool Cluster::has_Extra_collision( Extra *extra ) 
{
	if ( is_active() && extra->has_collision( (Spaceobject *)this ) )
		return true;

	for ( int i=0; i < MAXCLUSTERLASER; i++ ) {
		if ( lasers[i].is_active() && extra->has_collision( (Spaceobject *)&lasers[i] ) )
			return true;
	}
	
	return false;
}

bool Cluster::check_collision( double x, double y, double width, bool spacing )
{
	for ( int i=0; i < MAXCLUSTERLASER; i++ )
		if ( lasers[i].check_collision( x, y, width, spacing ) )
			return true;

	return check_sphere_collision( x, y, width, spacing );
}

void Cluster::draw()
{
	if ( moving_time > 0 ) {
		
		if ( moving_time > 100 ||
			(int)RANDOM(100, 0) < ( moving_time/2 )+25 ) {
			
			double x_anim = RANDOM(2, -2);
			double y_anim = RANDOM(2, -2);
			int alpha_anim = (int)RANDOM(10, -10);
			
			Vector_2 v = last_shootPos-Vector_2( get_X(), get_Y(), K );
			Vector_2 v_1 = v * 0.5;
			Vector_2 v_2 = v * 0.2;
			
			clusterbackk_sprite->setAlpha( 120 + alpha_anim );
			clusterbackk_sprite->setPos(
				(int)( get_X() + v_1.getX() ),
				(int)( get_Y() + v_1.getY() ) );				
			clusterbackk_sprite->draw();

			clusterback_sprite->setAlpha( 140 + alpha_anim );
			clusterback_sprite->setPos(
				(int)( get_X() + v_2.getX() + x_anim ),
				(int)( get_Y() + v_2.getY() + y_anim ) );				
			clusterback_sprite->draw();
			
			cluster_sprite->setAlpha( 200 + alpha_anim );
			cluster_sprite->setPos( (int)get_X(), (int)get_Y() );
			cluster_sprite->draw();
		}
	}
	
	for (int i=0; i < MAXCLUSTERLASER; i++)
		lasers[i].draw();

	if ( is_exploding ) {
		explosion->draw();
		is_exploding = explosion->is_active();
	}
}

void Cluster::hit( Spaceobject *object )
{
	if ( moving_time > 0 ) {

		explosion->activate( x, y );
		is_exploding = true;
		moving_time = 0;

		if ( !destroyed ) {
			Vector_2 v_hit_vector = Vector_2( get_X(), get_Y(), K )-Vector_2( object->get_X(), object->get_Y(), K );
			Vector_2 v_hit_start = Vector_2( get_X(), get_Y(), K );
			double dir = v_hit_vector.getAngle()-( CLUSTERLASERANGLE*MAXCLUSTERLASER/2 ) * PI / 180;
			
			for ( int i=0; i < MAXCLUSTERLASER; i++ ) {
				Vector_2 v_direction = Vector_2( get_Speed() / 5 * 3, dir, P );
				Vector_2 v_start = v_hit_start + Vector_2( 10, dir, P );
				lasers[i].activate( v_start, v_direction );
				dir += CLUSTERLASERANGLE*PI/180;
			}
		} 
	}
}
