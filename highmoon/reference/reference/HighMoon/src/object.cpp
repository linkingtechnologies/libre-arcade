/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "object.cpp"
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

#include "object.hpp"

/************************************************************************
 *									*
 * Spaceobject								*	
 *									*
 ************************************************************************/
Spaceobject::Spaceobject( double x, double y )
:
	x(x),
	y(y),
	width(0),
	weight(0),
	speed(0),
	direction(0),
	spacing(0),
	in_background(false)
{}

Spaceobject::~Spaceobject() {};

void Spaceobject::set_Pos( double x, double y ) 
{
	this->x = x;
	this->y = y;
}

bool Spaceobject::is_in_Background() const
{
	return in_background;
}

double Spaceobject::get_X() const 
{ 
	return x; 
}

double Spaceobject::get_Y() const 
{ 
	return y; 
}

double Spaceobject::get_Width() const 
{
	return width; 
}

double Spaceobject::get_Weight() const
{
	return weight;
}

double Spaceobject::get_Speed() const
{
	return speed;
}

double Spaceobject::get_Direction() const
{
	return direction;
}

double Spaceobject::get_Spacing() const
{
	return spacing;
}

bool Spaceobject::has_collision( Spaceobject *object )
{
	if ( check_collision( object->get_X(), object->get_Y(), object->get_Width() ) ) {
		hit( object );
		return true;
	}
	
	return false;
}

bool Spaceobject::check_collision( double x, double y, double width, bool spacing ) { return false; }

void Spaceobject::draw() {}

void Spaceobject::hit( Spaceobject *object ) {}

bool Spaceobject::check_sphere_collision( double x, double y, double width, bool spacing )
{
	double my_x = get_X();
	double my_y = get_Y();
	double my_width = get_Width();

	if ( spacing ) 
		my_width += this->spacing;

	double dist_Center = sqrt( (x - my_x) * (x - my_x) + ( y - my_y ) * ( y - my_y ) );
	double dist_Radius = ( width + my_width )/2;

	return dist_Center <= dist_Radius;	
}

