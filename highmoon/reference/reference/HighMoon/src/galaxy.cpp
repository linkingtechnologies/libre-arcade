/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "galaxy.cpp"
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

#include "galaxy.hpp"
#include "sound.hpp"

extern SDL_Surface* MYSDLSCREEN;
extern Soundset *sound;

#ifdef __DEBUG__
extern int __SHOOTS;
extern int __HITS;
#endif

/************************************************************************
 *									*
 * Extra								*
 *									*
 ************************************************************************/
Extra::Extra( double x, double y )
:	
	Spaceobject( x, y )
{
	verbose( "Initializing Extra" );

	width = 36;
	spacing = 20;
	wait = 250;
	waiting = 9999;

	extra_sprite = new Sprite( "gfx/extra.gif" );
}

Extra::~Extra()
{
	verbose( "Deleting Extra" );

	delete extra_sprite;
}

void Extra::kill()
{
	wait = 250;
}

bool Extra::check_collision( double x, double y, double width, bool spacing )
{
	return ( wait > 50 ) ? false : check_sphere_collision( x, y, width, spacing );
}

void Extra::init( Galaxy *galaxy )
{
	if ( wait > 0 )
		wait--;
	
	if ( waiting > 0 ) {
		waiting--;

		if ( waiting == 0 )
			wait = 100;	
	}

	if ( wait == 35 ) {
		double x_test, y_test, width_test;
	
		do {	
			x_test = RANDOM( SCREENWIDTH-150, 150 );
			y_test = RANDOM( SCREENHEIGHT-50, 50 );
			width_test = get_Width() + get_Spacing();
		} while ( galaxy->check_collision( x_test, y_test, width_test, true ) );
		
		set_Pos( x_test, y_test );
		
		waiting=(int)RANDOM( 4000, 3000 );

		sound->play( SOUND_NEWEXTRA );
	}
	
}

void Extra::draw()
{
	if ( wait<30 ) {
		static double c_1 = 0, c_2 = 0;
		
		if ( waiting < 30 )
			extra_sprite->setAlpha( (int)RANDOM(15,0)+(waiting*6) );
		else
			extra_sprite->setAlpha( 200+(int)RANDOM(15,0)-(wait*6) );
			
		if ( ( c_1 += 20*PI/180 ) > 2*PI )
				c_1 -= 2*PI;
	
		if ( ( c_2 -= 30*PI/180 ) < 0 )
				c_2 += 2*PI;
		
		extra_sprite->setPos( (int)(x+sin(c_1)*2), (int)(y+sin(c_2)*2) );
		extra_sprite->draw();
	}
}	

void Extra::hit( Spaceobject *object )
{
	wait = 200;
	waiting = 200;
}

/************************************************************************
 *									*
 * Stone								*
 *									*
 ************************************************************************/
Stone::Stone( double x, double y, double angle )
:
	Spaceobject ( x, y )
{
	verbose( "Initializing Stone" );

	pos_1 = RANDOM(2*PI,0);
	distance = 0;

	if ( angle == -1 ) {
		is_moon = true;
		pos_2 = RANDOM(2*PI,0);
		stone_sprite = new Sprite( "gfx/moon.gif" );
		stone_mask = new Sprite( "gfx/moon_mask.gif" );
		speed = RANDOM(1,3);
	} else {
		is_moon = false;
		pos_2 = angle;
		stone_sprite = new Sprite("gfx/stone.gif");
		stone_mask = new Sprite("gfx/stone_mask.gif");	
		speed = RANDOM( 1,2 );
	}

	width = (double)stone_sprite->getWidth()-1;
	x_a = x;
	y_a = y;
}

Stone::~Stone() 
{
	verbose( "Deleting Stone" );

	delete stone_sprite;
	delete stone_mask;
}

void Stone::set_Distance( double distance )
{
	this->distance = distance;
}

bool Stone::check_collision( double x, double y, double width, bool spacing )
{
	double my_x = x_a;
	double my_y = y_a;
	double my_width = get_Width();

	double dist_Center = sqrt( (x-my_x)*(x-my_x) + (y-my_y)*(y-my_y) );
	double dist_Radius = ( width+ my_width )/2;

	return dist_Center <= dist_Radius;	
}

void Stone::draw( bool behind_planet )
{
	double z = sin(pos_1+PI/180*90)/2+0.5;

	if ( ( behind_planet && z >= 0.5 ) ||
		( !behind_planet && z < 0.5 ) ) {
		
		if ( is_moon ) {
			x_a = sin(pos_1)*distance+x;
			y_a = sin(pos_2)*distance+y;
		} else {
			x_a = sin(pos_1)*distance+x;
			y_a = sin(-45*PI/180)*cos(pos_1)/2*distance+y;
			//y_a = sin(pos_2)*cos(pos_1)/2*distance+y;
		}

		stone_sprite->setPos( (int)x_a, (int)y_a );
		stone_sprite->draw();
		stone_mask->setPos( (int)x_a, (int)y_a );
		stone_mask->setAlpha( (int)(z*160) );
		stone_mask->draw();
	
		if ( is_moon ) {
			pos_1 += PI/180*speed;
			pos_2 += PI/180*speed;
		} else {
			pos_1 += PI/180*speed;		
			pos_2 += PI/180*1;
		}
		
		if ( pos_1 >= 2*PI )
			pos_1 -= 2*PI;
	
		if ( pos_2 >= 2*PI )
			pos_2 -= 2*PI;
	}
	
}

void Stone::hit( Spaceobject *object )
{
	object->hit( this );
}

/************************************************************************
 *									*
 * Planet								*
 *									*
 ************************************************************************/
Planet::Planet( double x, double y ) 
:
	Spaceobject ( x, y ),
	hit_vector( Vector_2( 0, 0, K ) )
{	
	verbose( "Initializing Planet" );

	char *planet_filename = "";
	planet_type = (Planettype)RANDOM(5,0);

	switch ( planet_type ) {

		case P_JUPITER:
			planet_filename = "gfx/jupiter.gif";
			weight = WEIGHT_JUPITER;
			spacing = 100;
			objects_of_planet = (int)RANDOM(4,1);
			break;
	
		case P_EARTH:
			planet_filename = "gfx/earth.gif";
			weight = WEIGHT_EARTH;
			spacing = 80;
			objects_of_planet = (int)RANDOM(2,0);
			break;
			
		case P_MARS:
			planet_filename = "gfx/mars.gif";
			weight = WEIGHT_MARS;
			spacing = 60;
			objects_of_planet = (int)RANDOM(2,0);
			break;

		case P_VENUS:
			planet_filename = "gfx/venus.gif";
			weight = WEIGHT_VENUS;
			spacing = 30;
			objects_of_planet = 0;
			break;

		case P_SATURN:
			planet_filename = "gfx/saturn.gif";
			weight = WEIGHT_SATURN;
			spacing = 70;
			objects_of_planet = objects_of_planet=(int)RANDOM(MAXSTONES,20);
	}
	
	double angle_ring = RANDOM(2*PI,0), distance;
	planet_sprite = new Sprite( planet_filename );
	width = (double)planet_sprite->getWidth()-2;	// Sub Anti-Alias Borders!
	
	for ( int i=0; i < objects_of_planet; i++ ) {
		if ( objects_of_planet > 3 ) {
			objects[i] = new Stone( 0,0,angle_ring );
			distance = width/2+RANDOM(35,15);
		} else {		
			objects[i] = new Stone();
			distance = width/2+RANDOM(12,10);
		}
		objects[i]->set_Distance( distance );
	}
}

Planet::~Planet()
{
	verbose( "Deleting Planet" );

	delete planet_sprite;
	
	for ( int i=0; i < objects_of_planet; i++ ) 
		delete objects[i];	
}

bool Planet::check_collision( double x, double y, double width, bool spacing )
{
	if ( check_sphere_collision( x, y, width, spacing ) )
		return true;

	for ( int i=0; i < objects_of_planet; i++ )
		if (objects[i]->check_collision( x, y, width ))
			return true;
	
	return false;
}

void Planet::draw()
{
	if ( hit_vector.getLength() > 1 ) {
		Vector_2 v = Vector_2( get_X(), get_Y(), K );
		v += hit_vector;
		hit_vector = hit_vector.newLength( hit_vector.getLength() / 2 );
		set_Pos( v.getX(), v.getY() );
	}

	for ( int i=0; i < objects_of_planet; i++ ) {
		objects[i]->set_Pos( x, y );
		objects[i]->draw(true);
	}

	planet_sprite->setPos( (int)x, (int)y );
	planet_sprite->draw();

	for ( int i=0; i < objects_of_planet; i++ ) 
		objects[i]->draw(false);
}

void Planet::hit( Spaceobject *object )
{
	hit_vector = Vector_2( get_X(), get_Y(), K ) - Vector_2( object->get_X(), object->get_Y(), K );
	hit_vector += Vector_2( object->get_Speed(), object->get_Direction(), P );
	hit_vector = hit_vector.newLength( 10/get_Weight()+2 );
	
	object->hit( this );
}

/************************************************************************
 *									*
 * Blackhole								*	
 *									*
 ************************************************************************/
Blackhole::Blackhole( double x, double y ) 
:
	Spaceobject( x, y )
{
	verbose( "Initializing Blackhole" );

	hole_sprite = new Sprite( "gfx/hole.gif" );
	width = -1;
	weight = WEIGHT_BLACKHOLE;
	spacing = 150;
	in_background = true;

	for ( int i=0; i < MAXHOLE; i++ ) 
		particles[i] = new Vector_2( RANDOM(65,5), RANDOM(2*PI,0), P );
}

Blackhole::~Blackhole() 
{
	verbose( "Deleting Blackhole" );

	delete hole_sprite;

	for ( int i=0; i < MAXHOLE; i++ ) 
		delete particles[i];
}

bool Blackhole::check_collision( double x, double y, double width, bool spacing )
{
	return check_sphere_collision( x, y, width, spacing );
}

void Blackhole::draw() 
{
	static double hole_animPos = 0;

	double x_anim = RANDOM(1,-1);
	double y_anim = RANDOM(1,-1);
	
	hole_sprite->setAlpha(30);
	hole_sprite->setPos( (int)(x+x_anim), (int)(y+y_anim) );
	hole_sprite->draw();

	hole_animPos += ( 5*PI/180 );

	if ( hole_animPos > 2*PI )
		hole_animPos -= 2*PI;
	else if ( hole_animPos < 0 )
		hole_animPos += 2*PI;

	double t_speed = 1;

	SDL_LockSurface(MYSDLSCREEN);
	
	// Draw Blackhole-Pixels
	for ( int i=0; i < MAXHOLE; i++ ) {
		double t_len = particles[i]->getLength();
		double t_ang = particles[i]->getAngle();

		if ( ( t_ang -= PI/180*3 ) < 0 ) 
			t_ang += 2*PI;
		
		if ( ( t_len += t_speed/8+3 ) > 60 ) 
			t_len -= 60+RANDOM(5,-5);

		delete particles[i];
		particles[i] = new Vector_2( t_len, t_ang, P );

		double f = cos( hole_animPos*PI/180 )/6+.75;
		int xx = (int)( x+( particles[i]->getX())*f ) + Sprite::x_offset;
		int yy = (int)( y+( particles[i]->getY())*f ) + Sprite::y_offset;

		if ( t_speed++ > 3 ) 
			t_speed -= 3;

		int r = (int)( t_len*2 + 40 );
		int g = r;
		int b = 20+(int)( t_len*2 + 20 );
		
		Sprite::putpixel( xx, yy, SDL_MapRGB( MYSDLSCREEN->format, r, g, b ) );

		r /= 2;
		g /= 2;
		b /= 2;
		
		if ( t_len > 30 )
			Sprite::putpixel( xx, yy+1, SDL_MapRGB( MYSDLSCREEN->format, r, g, b ) );
		
		if ( t_len > 50 ) {
			Sprite::putpixel( xx+1, yy, SDL_MapRGB( MYSDLSCREEN->format, r, g, b ) );
			Sprite::putpixel( xx+1, yy+1, SDL_MapRGB( MYSDLSCREEN->format, r, g, b ) );
		}
	}
	
	SDL_UnlockSurface(MYSDLSCREEN);
}

void Blackhole::hit( Spaceobject *object ) {}

/************************************************************************
 *									*
 * Wormhole								*	
 *									*
 ************************************************************************/
Wormhole::Wormhole( double x, double y ) 
:
	Spaceobject( x, y )
{
	verbose( "Initializing Wormhole" );

	width = 25;
	weight = 50;
	spacing = 60;
	in_background = true;
	exit_x = RANDOM(350, 150);
	exit_y = RANDOM(350, 150);
	
	if ( (int)RANDOM(2,0) == 1 ) exit_x = -exit_x;
	
	if ( (int)RANDOM(2,0) == 1 ) exit_y = -exit_y;

	for ( int i=0; i < MAXWORM; i++ ) 
		particles[i] = (int)( RANDOM(800, 0) ) & 0x0000fff0;

	for ( int i=0; i < MAXWORM/15; i++ ) 
		start_particles[i] = new Vector_2(
			RANDOM( get_Width()*1.5, 5), 
			RANDOM(2*PI,0),
			P );
}

Wormhole::~Wormhole()
{
	verbose( "Deleting Wormhole" );

	for ( int i=0; i < MAXWORM/15; i++ ) 
		delete start_particles[i];
}

bool Wormhole::check_collision( double x, double y, double width, bool spacing )
{
	return check_sphere_collision( x, y, width, spacing );
}

void Wormhole::draw() 
{
	Vector_2 path_to_exit = Vector_2( exit_x, exit_y, K );
	double path_len = path_to_exit.getLength();

	static int mooover = 0, mooover2 = 0;

	if ( (mooover += 5) > 360 )
		mooover -= 360;
	
	if ( (mooover2 -= 4) < 0 )
		mooover += 360;

	SDL_LockSurface(MYSDLSCREEN);
	
	for ( int i=0; i < MAXWORM; i++ ) {

		double p = particles[i];

		if ( ( p += i%3+1 ) > path_len )
			p -= path_len;
		
		particles[i] = p;
		
		double rel_pos = p/path_len;
		Vector_2 pos = path_to_exit.newLength(p);

		// Magic Wormhole Formula =)))
		pos += Vector_2( 
			( ( cos( (mooover+p*10+i*20)*PI/180 ) * 10 )
			+
			( cos( (mooover2+p*2)*PI/180 ) ) * 15 )
			*
			( ( sin( (rel_pos*360)*PI/180 ) ) ),
			pos.getAngle()-(PI/2), 
			P );

		// Color Factor (Fade out in the middle)
		double cf = (cos( (p/path_len)*2*PI )+1) /3+0.25;
		double xx, yy, rr, gg, bb;

		xx = ( get_X()+pos.getX() ) + Sprite::x_offset;
		yy = ( get_Y()+pos.getY() ) + Sprite::y_offset;
		
		rr = ( 255-( (255*p/path_len)/4 ) )*cf;
		bb = gg = ( 120+( (255*p/path_len)/4 ) )*cf;
		
		Sprite::putpixel( (int)xx, (int)yy, SDL_MapRGB( MYSDLSCREEN->format, (int)rr, (int)gg, (int)bb ) );
	}

	for ( int i=0; i < MAXWORM/15; i++  ) {
		Vector_2 particle=Vector_2(
			start_particles[i]->getLength()-RANDOM(3,1),
			start_particles[i]->getAngle()+(5*PI/180),
			P );

		if ( particle.getLength() <= 2 ) {
			particle=Vector_2(
				RANDOM( get_Width()*1.5, get_Width()-10), 
				RANDOM(2*PI,0),
				P );
		}

		delete start_particles[i];
		start_particles[i] = new Vector_2( particle.getLength(), particle.getAngle(), P );

		int rr, gg, bb;
		bb = (int)(50+(particle.getLength()*5));
		gg = (int)((particle.getLength()*5));
		rr = gg;

		int xx = (int)( get_X()+particle.getX() ) + Sprite::x_offset;
		int yy = (int)( get_Y()+particle.getY() ) + Sprite::y_offset;

		Sprite::putpixel (xx, yy, SDL_MapRGB( MYSDLSCREEN->format, rr, gg, bb ) );
	}
	
	SDL_UnlockSurface(MYSDLSCREEN);
}

void Wormhole::hit( Spaceobject *object )
{
	object->set_Pos( get_X()+exit_x, get_Y()+exit_y );
}

/************************************************************************
 *									*
 * Flying Saucer							*	
 *									*
 ************************************************************************/
Ufo::Ufo( double x, double y )
:
	Spaceobject(),
	player_id(Ufo::current_playerid),
	is_human(false),
	is_active(false),
	is_locked(false),
	shield_strength(MAXENERGY),
	bonus(0),
	bought_weapon(WEAPON_LASER)
{
	verbose( "Initializing Ufo" );

	reset();
	
	char *u_filename = "", *c_filename = "";
	double angle=0;
	
	switch (Ufo::current_playerid++) {
	
		case 0:
			x = BORDERWIDTH;
			angle = 0;
			u_filename = "gfx/ufored.gif";
			c_filename = "gfx/cpktred.gif";
			break;	
		case 1:
			x = SCREENWIDTH-BORDERWIDTH;
			angle = PI;
			u_filename = "gfx/ufoblue.gif";
			c_filename = "gfx/cpktblue.gif";
			break;
	}

	set_Pos( x, y );
	width = 48;
	
	shoot_angle = angle;
	shoot_power = 0;
	
	ufo_sprite = new Sprite( u_filename, 25 );
	circle_sprite = new Sprite( c_filename );

	thinking_sprite = new Sprite( "gfx/c_thinking.gif", 2 );
	thinking_sprite->setFramerate(25);
	thinking_sprite->setAlpha(150);

	shooting_sprite = new Sprite( "gfx/c_shooting.gif", 2 );
	shooting_sprite->setFramerate(25);
	shooting_sprite->setAlpha(150);	
}

Ufo::~Ufo() 
{
	verbose( "Deleting Ufo" );

	delete ufo_sprite;
	delete circle_sprite;
	delete thinking_sprite;
	delete shooting_sprite;
}

bool Ufo::is_dead() const 
{
	return shield_strength <= 0;
}

bool Ufo::is_Computer() const
{
	return !is_human;
}

int Ufo::get_Energy() const
{
	return shield_strength;
}

int Ufo::get_Bonus() const
{
	return bonus;
}

int Ufo::get_BoughtWeapon() const
{
	return bought_weapon;
}

void Ufo::reset()
{
	shield_strength  =MAXENERGY;
	bonus = 0;
	bought_weapon = WEAPON_LASER;
	is_active = false;
	is_locked = false;
}

void Ufo::set_Human()
{
	is_human = true;
}

void Ufo::set_Computer()
{
	is_human = false;
}

void Ufo::add_Bonus() 
{
	if ( ++bonus > 4 )
		bonus = 4;
}

void Ufo::buy_Bonus() 
{
	if (bonus > 0) {

		switch (bonus) {
		
			case 1: 
				shield_strength += 5;
				bonus = 0;
				break;

			case 2: 
				if ( bought_weapon == WEAPON_LASER ) {
					bought_weapon = WEAPON_HEAVY;
					bonus = 0;
				}
				break;

			case 3: 
				if ( bought_weapon == WEAPON_LASER ) {
					bought_weapon = WEAPON_CLUSTER;
					bonus = 0;
				}
				break;
				
			case 4: 
				shield_strength +=25;
				bonus = 0;
				break;
		}
		
		verbose ( "Bonus bought" );

		sound->play(SOUND_BUYWEAPON);
		
	}
}

void Ufo::next_Weapon()
{
	switch (bought_weapon) {
	
		case WEAPON_LASER:
			bought_weapon = WEAPON_HEAVY;
			break;
			
		case WEAPON_HEAVY:
			bought_weapon = WEAPON_CLUSTER;
			break;
			
		case WEAPON_CLUSTER:
			bought_weapon = WEAPON_LASER;
			break;
			
		case WEAPON_FUNGHI:
			bought_weapon = WEAPON_LASER;
			break;
			
	}
}

void Ufo::activate()
{	
	is_active = true;
	is_locked = false;
	shoot_power = 0;
}
	
void Ufo::deactivate()
{
	is_active = false;
}

void Ufo::move_Up()
{
	if ( y > BORDERWIDTH ) 
		y -= 2;
}

void Ufo::move_Down()
{
	if ( is_active && y < SCREENHEIGHT-BORDERWIDTH ) 
		y += 2;
}

void Ufo::inc_ShootAngle()
{
	if ( is_active )
		shoot_angle += PI/180; 
}

void Ufo::dec_ShootAngle()
{
	if ( is_active )
		shoot_angle -= PI/180; 
}

void Ufo::inc_ShootPower()
{
	if ( is_active && ++shoot_power > MAXSHOOTPOWER )
		shoot_power = MAXSHOOTPOWER;
}

Shoot *Ufo::shoot()
{
	if ( is_active ) {

		verbose ( "Shooting..." );

		Vector_2 v_start = Vector_2( get_X(), get_Y(), K )+Vector_2( 60, shoot_angle, P );
		Vector_2 v_direction = Vector_2( shoot_power*SHOOTPOWERFACTOR, shoot_angle, P );

		static Heavy heavy_shoot = Heavy(); 
		static Cluster cluster_shoot = Cluster();
		static Cluster funghi_shoot = Cluster();
		static Laser laser_shoot = Laser();

		#ifdef __DEBUG__ 
		__SHOOTS++;
		//std::cout << __HITS << "/" << __SHOOTS << "=" << (int)(__HITS*100/__SHOOTS) << "%" << std::endl;
		#endif

		switch ( bought_weapon ) {
		
			case WEAPON_HEAVY:	
				bought_weapon = WEAPON_LASER;
				heavy_shoot.activate( v_start, v_direction );
				return &heavy_shoot;
	
			case WEAPON_CLUSTER:
				bought_weapon = WEAPON_LASER;
				cluster_shoot.activate( v_start, v_direction );
				return &cluster_shoot;
			
			case WEAPON_FUNGHI:
				bought_weapon = WEAPON_LASER;
				funghi_shoot.activate( v_start, v_direction );
				return &funghi_shoot;
				
			default:
				laser_shoot.activate( v_start, v_direction );
				return &laser_shoot;
		}
	}
	
	return NULL;
}

bool Ufo::calculate_Computer_Move( Galaxy *galaxy, int factor ) 
{
	static Shoot s = Shoot();
	static bool found = false;
	static int searches = MAXCOMPUTERSEARCH;
	static double new_ShootPower, new_ShootAngle, new_y;
	bool canshoot = false;
	computer_mode = NONE;
	
	// Zug suchen
	if ( !found && !is_locked ) {
		
		if (bonus == 1 && shield_strength < 40)
			buy_Bonus();

		if ( bonus == 2 && (RANDOM(10,0) < 2) )
			buy_Bonus();
		
		if ( bonus == 3 && (RANDOM(10,0) < 8) )
			buy_Bonus();
		
		canshoot = false;

		// Randomize Shoot-configuration
		new_y = (int)RANDOM( SCREENHEIGHT-200, 100 );
		new_ShootPower = (int)RANDOM( MAXSHOOTPOWER , 10 );
		new_ShootAngle = RANDOM( 2*PI, 0 );
		
		Vector_2 start = Vector_2( get_X(), new_y, K ) + Vector_2( 60, new_ShootAngle, P );
		Vector_2 direction = Vector_2( new_ShootPower*SHOOTPOWERFACTOR, new_ShootAngle, P);

		found = s.will_be_a_Hit( player_id, factor, start, direction, galaxy );
		
		#ifdef __DEBUG__ 
		//if (found) std::cout << "*** FEIND ENTDECKT BEI " <<  start << ", " << direction << std::endl;
		#endif
		
		if ( --searches < 0 )
			found = true;
		
		if ( !found )
			computer_mode = THINKING;
	}

	// Schuss und Position einstellen
	if ( found && !canshoot ) {
		canshoot = true;

		if ( (int)new_y < y ) {
			canshoot = false;
			move_Up();
			
			if ( (int)new_y > y )
				y = (int)new_y;
		}

		if ( (int)new_y > y ) { 
			canshoot = false;
			move_Down();
			
			if ( (int)new_y < y )
				y = (int)new_y;
		}

		if ( new_ShootAngle > shoot_angle ) { 
			canshoot = false; 
			inc_ShootAngle(); 

			if ( new_ShootAngle < shoot_angle )
				shoot_angle = new_ShootAngle; 
		}

		if ( new_ShootAngle < shoot_angle ) {
			canshoot = false;
			dec_ShootAngle(); 

			if ( new_ShootAngle > shoot_angle )
				shoot_angle = new_ShootAngle; 
		}

		if ( canshoot && new_ShootPower > shoot_power ) {
			canshoot = false;
			inc_ShootPower();
		}

		if ( !canshoot ) 
			computer_mode = SHOOTING;
	}

	// Schuss
	if ( canshoot ) {
		computer_mode = NONE;
		searches = MAXCOMPUTERSEARCH;
		shoot_power = new_ShootPower;
		canshoot = false;
		galaxy->set_Shoot( shoot() );
		found = false;
		is_locked = true;
		
		return true;
	}
	
	return false;

}

bool Ufo::check_collision( double x, double y, double width, bool spacing )
{
	return check_sphere_collision( x, y, width, spacing );
}

void Ufo::draw() 
{
	ufo_sprite->setPos( (int)(this->get_X()-2), (int)(get_Y()+10) );
	ufo_sprite->draw();
	
	draw_Targetmode();
	draw_Computermode();
}

void Ufo::hit( Spaceobject *object )
{
	#ifdef __DEBUG__ 
	__HITS++;
	std::cout << __HITS << "/" << __SHOOTS << "=" << (int)(__HITS*100/__SHOOTS) << "%" << std::endl;
	#endif
	
	shield_strength -= (int)( object->get_Speed() / 10 * object->get_Weight() );
	
	if (shield_strength < 0) 
		shield_strength = 0;

	object->hit( this );
}

void Ufo::draw_hint( Galaxy *galaxy )
{
	Vector_2 start = Vector_2( get_X(), get_Y(), K ) + Vector_2( 60, shoot_angle, P );
	Vector_2 direction = Vector_2( 100 * SHOOTPOWERFACTOR, shoot_angle, P );
	
	static Laser *ufo_shoot = new Laser();

	ufo_shoot->draw_hint( start, direction, galaxy ); 
}

void Ufo::draw_Targetmode()
{	
	if ( is_active ) {

		Vector_2 m = Vector_2(x, y, K);
		double distance = 30;
		int alpha = 150;
		
		for ( int i=0; i < 5; i++ ) {

			if ( (int)( shoot_power/20 ) > i )
				circle_sprite->setAlpha( alpha+105 );
			else
				circle_sprite->setAlpha(alpha);

			Vector_2 pos = m + Vector_2( distance, shoot_angle, P );
			circle_sprite->setPos( (int)pos.getX(), (int)pos.getY() );
			circle_sprite->draw();

			alpha -= 20;
			distance += 10;
		}
	}
}

void Ufo::draw_Computermode()
{
	if ( is_Computer() && is_active ) { 
		
		switch (computer_mode) {
		
			case THINKING: 
				thinking_sprite->setPos( (int)get_X(), (int)get_Y() );
				thinking_sprite->draw();
				break;
			
			case SHOOTING:
				shooting_sprite->setPos( (int)get_X(), (int)get_Y() );
				shooting_sprite->draw();
				break;
			default:
				break;
		}
	}
}	

int Ufo::current_playerid = 0;

/************************************************************************
 *									*
 * Galaxy								*
 *									*
 ************************************************************************/
Galaxy::Galaxy( int max, int id )
:
	is_imploding(false),
	objects_in_galaxy(0),
	ufos_in_galaxy(0)
{
	verbose( "Initializing Galaxy" );

	extra = new Extra();
	create( max, id );
	shoot = NULL;
}
	
Galaxy::~Galaxy()
{
	verbose( "Deleting Galaxy" );

	for ( int i=0; i < objects_in_galaxy; i++ ) 
		delete objects[i];
	
	delete extra;
}

double Galaxy::get_ShootX() const
{
	return ( shoot == NULL ) ? 0 : shoot->get_X();
}
	
double Galaxy::get_ShootY() const
{
	return ( shoot == NULL ) ? 0 : shoot->get_Y();
}

bool Galaxy::is_ShootActive() const
{
	return ( shoot == NULL ) ? false : shoot->is_active();
}
	
bool Galaxy::is_Imploding() const
{
	return is_imploding;
}

bool Galaxy::is_Ufo_In_Area( int player_id, double x, double y, double factor )
{
	for ( int i=0; i < MAXPLAYER; i++ ) {

		if ( i != player_id ) {
			if ( ufos[i]->check_collision( x, y, 8 * factor ) )
				return true;
		}
	}
	
	return false;
}

void Galaxy::set_Ufos( Ufo **ufos, int max ) 
{
	this->ufos = ufos;
	ufos_in_galaxy = max;	
}

void Galaxy::set_Shoot( Shoot *shoot )
{
	if ( shoot != NULL ) {
		this->shoot = shoot;
	}
}

void Galaxy::kill_all_Shoots() 
{
	if ( shoot != NULL ) {
		shoot->destroy();
		shoot->reset();
	}
}

bool Galaxy::has_Extra_collision()
{
	if ( shoot != NULL )
		return shoot->has_Extra_collision( extra );
		
	return false;
}
bool Galaxy::has_collision( Spaceobject *object )
{
	// Check all Objects
	for ( int i=0; i < objects_in_galaxy; i++ )
		if ( objects[i]->has_collision(object) ) 
			return true;

	// Check all Flying Saucers
	for ( int i=0; i < ufos_in_galaxy; i++ )
		if ( ufos[i]->has_collision(object) )
			return true;

	return false;
}
	
bool Galaxy::check_collision( double x, double y, double width, bool spacing )
{
	for ( int i=0; i < objects_in_galaxy; i++ ) 
		if ( objects[i]->check_collision( x, y, width, spacing ) ) 
			return true;

	return false;
}

bool Galaxy::create( int max, int id )
{
	if ( !is_imploding ) {
		
		verbose( "Creating Galaxy" );

		extra->kill();
		
		srand(id);
		
		for ( int i=0; i < objects_in_galaxy; i++ )
			delete objects[i];

		objects_in_galaxy = 0;
		max = ( max < MAXPLANETS ) ? max : MAXPLANETS;
		
		for ( int i=0; i < max; i++ ) {
			double x_test, y_test, width_test;
			Spaceobject *tmp_planet = NULL;
			int type_of_planet = (int)RANDOM(8,0);

			//std::cout << "PLANETTYPE=" << type_of_planet << std::endl;

			switch ( type_of_planet ) {
				
				case 5: 
					tmp_planet = new Blackhole();
					break;
				case 6: 
					tmp_planet = new Wormhole();
					break;
				default:
					tmp_planet = new Planet();
			}
			
			do {	
				x_test = RANDOM( SCREENWIDTH-220, 220 );
				y_test = RANDOM( SCREENHEIGHT, 0 );
				width_test = tmp_planet->get_Width() + tmp_planet->get_Spacing();
			} while ( check_collision( x_test, y_test, width_test, true ) );

			tmp_planet->set_Pos( x_test, y_test );
			animate_position[i].y = y_test;
			objects[objects_in_galaxy++] = tmp_planet;
		}

		for ( int i=0; i < objects_in_galaxy; i++ )
			objects[i]->set_Pos( objects[i]->get_X(), -600 );

		is_imploding = true;
		
		sound->play(SOUND_WARPGALAXY);

		return true;
	}
	
	return false;
}
	
void Galaxy::calculate_nextPos( Vector_2 &position, Vector_2 &direction )
{
	Vector_2 vec_toPlanets = Vector_2( 0, 0, K );

	for ( int i=0; i < objects_in_galaxy; i++ ) {
		Vector_2 vec_PlanetPos = Vector_2( objects[i]->get_X(), objects[i]->get_Y(), K);
		double distance = vec_PlanetPos.distance(position);
		Vector_2 vec_toPlanet = vec_PlanetPos-position;
		vec_toPlanet = vec_toPlanet.newLength( objects[i]->get_Weight()/distance );
		vec_toPlanets = vec_toPlanets+vec_toPlanet;
	}
	direction += vec_toPlanets;

	position += direction.newLength( direction.getLength() * SHOOT_INTERVAL / 1000 );
}
		
bool Galaxy::animate()
{
	if ( shoot != NULL && shoot->move(this) ) {
		shoot->reset();
		
		return true;
	}

	return false;
}

void Galaxy::draw()
{
	is_imploding = animate_BigBang();
	
	extra->init(this);
	extra->draw();

	for ( int i=0; i < objects_in_galaxy; i++ )
		if ( objects[i]->is_in_Background() )
			objects[i]->draw();

	for ( int i=0; i < objects_in_galaxy; i++ )
		if ( !objects[i]->is_in_Background() )
			objects[i]->draw();

	for ( int i=0; i < ufos_in_galaxy; i++ )
		ufos[i]->draw();

	if ( shoot != NULL )
		shoot->draw();	
}

bool Galaxy::animate_BigBang() 
{
	bool still_moving = false;

	if ( is_imploding ) {
	
		for ( int i=0; i < objects_in_galaxy; i++ ) {
			double object_y = objects[i]->get_Y();
			double object_final_y = animate_position[i].y;
			
			if ( object_final_y > object_y ) {
				still_moving = true;
				object_y = object_y + ( (object_final_y-object_y)/10+1 );
				
				if ( object_final_y < object_y )
					object_y = object_final_y;
			}
			
			objects[i]->set_Pos( objects[i]->get_X(), object_y);
		}
	}
	
	return still_moving;
}

