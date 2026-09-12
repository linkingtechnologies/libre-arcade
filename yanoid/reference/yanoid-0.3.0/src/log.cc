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
#include "log.hh"
#ifdef DEBUG
#include <iostream>
#include <strstream>
#include <iomanip.h>

#include <SDL/SDL.h>
#include "ConsoleSource/CON_console.h"

bool duptoconsole = false;

/* These MUST match the declarations in log.hh */
static char * loglevel_to_name [] =
{
  "FATAL  ",
  "ERROR  ",
  "WARNING",
  "TODO   ",
  "INFO   ",
  "TRACE  ",
  "VERBOSE",
  "VER 2  ",
  "MAX    "
};

/* **********************************************************************
 * The log object.
 * *********************************************************************/

TLog * Log;

/* **********************************************************************
 * The Setlevel function.
 * *********************************************************************/
void TLog::SetLevel(int nlevel) {
  if (nlevel < LOG_MAX) {
    level = nlevel; 
  } else {
    LogLine(LOG_WARNING, "TLog::SetLevel - level to large");
  }
}


/* **********************************************************************
 * The AddLine only prints to stdout at this moment 
 * *********************************************************************/
void TLog::AddLine(int level_, char * filename, int lineno, string line) {
  if (level_ <= level) {
    ostrstream tmp;
    tmp << "LOG: " << loglevel_to_name[level_] << " in "
	<< setw(20) << filename << ":"
	<< setw(4)  << setiosflags(ios::left) << lineno
	<< " - \"" << line << "\"" << ends;
    cout << tmp.str() << endl;
    if (duptoconsole) {
      CON_ConOut(tmp.str());
    }
  }
}

#endif
