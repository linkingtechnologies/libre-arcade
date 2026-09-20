/************************************************************************
 *
 * vector_2
 * Patrick Gerdsmeier 2004, 2005, 2006 <patrick@gerdsmeier.net>
 *
 * Implementiert eine 2D-Vektor Klasse. Vektoren koennen
 * mit ihren karthesisch oder polar initialisiert werden:
 *
 * Vector_2 v1=Vector_2( 100, 100, K );
 * Vector_2 v2=Vector_2( 100, 100, P );
 * 
 * Vektoren koennen addiert oder subtrahiert werden:
 * 
 * Vector_2 v3=v1+v2;
 * v2-=v1;
 *
 * Vektoren koennen auf Gleichheit ueberprueft werden:
 *
 * if (v1!=v2) exit(1);
 *
 * Weiterhin existieren Funktionen rund um Vektoren.
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

#ifndef __VECTOR_2_HPP__
#define __VECTOR_2_HPP__

#include <iostream>

enum Vectortype { K, P, U };

class Vector_2
{
public:
	Vector_2( double, double, Vectortype );

	bool isInfinite();
	double getX();
	double getY();
	double getLength();
	double getAngle();
	
	bool operator==( Vector_2 );
	bool operator!=( Vector_2 );
	
	Vector_2& operator+=( Vector_2 );
	Vector_2 operator+( Vector_2 );
	Vector_2& operator-=( Vector_2 );
	Vector_2 operator-( Vector_2 );
	Vector_2& operator*=( double );
	Vector_2 operator*( double );
	Vector_2& operator/=( double );
	Vector_2 operator/( double );
	
	double distance( Vector_2 );
	double projectOn( double );
	Vector_2 newLength( double );
	Vector_2 newVectorTo( double, double );

	static double angleDifference( double, double );
	static Vector_2 rayCrossPoint( Vector_2, double, Vector_2, double );
	
	void print();

private:
	double x, y, length, angle;
	bool infinite;
}; 

	std::ostream& operator<<( std::ostream&, Vector_2 );
	

#endif
