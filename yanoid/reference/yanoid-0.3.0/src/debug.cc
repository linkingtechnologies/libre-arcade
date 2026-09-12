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
#include "debug.hh"
#ifdef ASSERT_ON

#ifdef HAVE_EXECINFO_H
#include <execinfo.h> 
#endif

#include <iostream>

/* Dump a backtrace to cerr */
void BackTrace() {
#ifdef HAVE_EXECINFO_H
  cerr << "Dumping stacktrace" << endl;
  void *aTrace[32];
  char **tString;
  int size, i;   
  size = backtrace(aTrace, 32);
  tString = backtrace_symbols(aTrace, size);
  for (i = 0; i < size; i++) {
    cerr << "In " << tString[i] << endl;;
  }
#else
  cerr << "No stacktrace available" << endl;
#endif

}

/* If this works well, I want to extend this assert to do some
   interaction with the user */
bool CustomAssert(bool expr, char * description, int linenum, char * filename) {
  if (!expr) {
    cerr << "CustomAssert failed at " << filename << ":" << linenum << " \""
	 << description << "\"" << endl;
    return true;
  } 
  return false;
}
#endif
