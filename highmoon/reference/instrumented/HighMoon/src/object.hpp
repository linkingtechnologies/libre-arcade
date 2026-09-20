/******************************************************************************************
 *
 * HighNoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "object.hpp"
 * 
 * Spaceobject - virtual Object that contains all Information
 * that is needed for an Object in Galaxy. Extended by all
 * other Objects.
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

#ifndef __OBJECT_HPP__
#define __OBJECT_HPP__

/************************************************************************
 *									*
 * Spaceobject								*	
 *									*
 ************************************************************************/
class Spaceobject
{
public:
	Spaceobject( double x=0, double y=0 );

	virtual ~Spaceobject();
	
	void set_Pos( double x, double y );
	
	bool is_in_Background() const;

	double get_X() const;

	double get_Y() const;

	double get_Width() const;
	
	double get_Weight() const;
	
	double get_Speed() const;

	double get_Direction() const;
	
	double get_Spacing() const;
	
	// This is a "real" collision Function. That means
	// that within this Function the Method hit() is
	// called.
	bool has_collision( Spaceobject *object );

	// This checks if the Object has a collision with an
	// Area presented by x, y and width values.
	// Returns TRUE if there was a collision.
	virtual bool check_collision( double x, double y, double width, bool spacing=false );
	
	// Graphical Output on the Screen
	virtual void draw();
	
	// hit() should be implemented from any Spaceobject and should
	// contain the reaction of the Object if it has a collision
	// with another Spaceobject.
	// One can change the Shoot-Status, get the Direction and the
	// Speed of that Spaceobject etc.
	virtual void hit( Spaceobject *object );

protected:
	double x, y;
	double width, weight;
	double speed, direction;
	double spacing;
	bool in_background;

	bool check_sphere_collision( double x, double y, double width, bool spacing=false );
};

#endif
