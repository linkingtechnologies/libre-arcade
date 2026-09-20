/******************************************************************************************
 *
 * HighMoon - Duell im All
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "language.hpp"
 * 
 * This class contains all Screentexts as methods.
 * Texts depend on their active language. You can 
 * toggle the language via "toogle()".
 *
 * Actually HighMoon has English, German, French, Polish, Portuguese 
 * and Spanish.
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

#ifndef __LANGUAGE_HPP__
#define __LANGUAGE_HPP__

#include <iostream>

enum Languagetype {
	LANG_ENGLISH=0,
	LANG_GERMAN=1,
	LANG_FRENCH=2,
	LANG_POLISH=3,
	LANG_PORTUGUESE=4,
	LANG_SPANISH=5,
	LANG_RUSSIAN=6,
	LANG_ITALIAN=7,
	LANG_NETHERLAND=8
};

class Language
{
public:
	Language();
	
	void toggle();

	void set( Languagetype language );

	void set( char *language );
	
	char* getWindowtext() const;
	
	std::string getTitletext( int id ) const;

	std::string getScrollertext() const;
	
	std::string getPlayertext( int id ) const;
	
	std::string getComputertext( int strength ) const;
	
	std::string getShieldtext(  int energy ) const;

	std::string getWinnertext( int winner ) const;
	
	std::string getWarptext( int seed, int planets ) const;

	std::string getWarptext() const;
	
private:
	Languagetype language;

};

#endif

