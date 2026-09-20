/*****************************************************************************************
 *
 * vector_2
 * Patrick Gerdsmeier 2004, 2005, 2006 <patrick@gerdsmeier.net>
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

#include <iostream>
#include <cmath>

#include "vector_2.hpp"

const double PI = 3.141592;

Vector_2::Vector_2( double a, double b, Vectortype typ )
{
	switch (typ) {
		
		case P:
			length = a;
			angle = b;
			x = length * cos( angle );
			y = length * sin( angle );
			infinite = false;
			break;
		case K:
			x = a;
			y = b;
			length = sqrt( x*x + y*y );
			angle = atan2( y, x );
			infinite = false;
			break;
		case U:
			x = 0;
			y = 0;
			infinite = true;
	}
}

bool Vector_2::isInfinite()
{
	return infinite; 
}

double Vector_2::getX() 
{ 
	return x; 
}

double Vector_2::getY() 
{ 
	return y; 
}

double Vector_2::getLength() 
{ 
	return length; 
}

double Vector_2::getAngle() 
{ 
	return angle; 
}

bool Vector_2::operator==( Vector_2 v )
{
	return ( x == v.x && y == v.y );
}

bool Vector_2::operator!=( Vector_2 v )
{
	return !( *this == v );
}

Vector_2& Vector_2::operator+=( Vector_2 v )
{
	x += v.getX();
	y += v.getY();
	length = sqrt( x*x + y*y );
	angle = atan2( y, x );
	
	return *this;
}

Vector_2 Vector_2::operator+( Vector_2 v )
{
	Vector_2 r = *this;
	
	return r += v;
}

Vector_2& Vector_2::operator-=( Vector_2 v )
{
	x -= v.getX();
	y -= v.getY();
	length = sqrt( x*x + y*y );
	angle = atan2( y, x );
	
	return *this;
}

Vector_2 Vector_2::operator-( Vector_2 v )
{
	Vector_2 r = *this;
	
	return r -= v;
}

Vector_2& Vector_2::operator*=( double f )
{
	length *= f;
	x *= f;
	y *= f;
	
	return *this;
}

Vector_2 Vector_2::operator*( double f )
{
	Vector_2 r = *this;
	
	return r *= f;
}

Vector_2& Vector_2::operator/=( double q )
{
	length /= q;
	x /= q;
	y /= q;
	
	return *this;
}

Vector_2 Vector_2::operator/( double q )
{
	Vector_2 r = *this;

	return r /= q;
}

double Vector_2::distance( Vector_2 v )
{
	double dx = x-v.getX();
	double dy = y-v.getY();

	return sqrt( dx*dx + dy*dy );
}	

double Vector_2::projectOn( double angle )
{
	return length * cos( angle - this->angle );
}

Vector_2 Vector_2::newLength( double len )
{
	return len == 0 ? Vector_2( 0, 0, K ) : Vector_2( x/length*len, y/length*len, K );
}

Vector_2 Vector_2::newVectorTo( double len, double angle )
{
	return Vector_2( x+len*cos(angle), y+len*sin(angle), K );
}	

double Vector_2::angleDifference( double angle1, double angle2 )
{
	double d = fabs(angle1-angle2);

	if ( d > 2*PI ) 
		d = d - 2*PI;

	if ( d > PI )
		d = 2*PI - d;

	return d;
}

Vector_2 Vector_2::rayCrossPoint( Vector_2 v1, double angle1, Vector_2 v2, double angle2 )
{
	double x1 = v1.getX();
	double y1 = v1.getY();
	double x2 = v2.getX();
	double y2 = v2.getY();
	double rx1 = cos(angle1);
	double ry1 = sin(angle1);
	double rx2 = cos(angle2);
	double ry2 = sin(angle2);
	double detA = ry1*rx2 - rx1*ry2;

	if ( detA == 0 ) return Vector_2(0,0,U);

	double dx = x2-x1;
	double dy = y2-y1;
	double lambda = ( dy*rx2 - dx*ry2 ) / detA;

	return Vector_2( x1 + lambda*rx1, y1 + lambda*ry1, K );
}	

std::ostream& operator<<( std::ostream& s, Vector_2 v )
{
	if ( v.isInfinite() )
		return s << "INFINITE";
	
	return s << "x:" << v.getX() << " y:" << v.getY() << " l:" << v.getLength() << " w:" << ( v.getAngle()*180.0/PI );
}

/*
int main()
{
	Vector_2 a = Vector_2(100, 100, K);
	Vector_2 b = Vector_2(10, 2, P);
	Vector_2 d = a+b;
	std::cout << "A=" << a << " B=" << b << std::endl;
	std::cout << "A-B: " << a.distance(b) << std::endl;
	b = a.newLength(100);
	std::cout << "B=" << b << std::endl;
	Vector_2 cross = Vector_2::rayCrossPoint( a, 1, b, 2);
	std::cout << "Kreuzpunkt 1=" << cross << std::endl;
	cross = Vector_2::rayCrossPoint( a, 2, b, 2);
	std::cout << "Kreuzpunkt 2=" << cross << std::endl;
}
*/
