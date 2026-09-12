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
/* Various stuff used when debugging */
#ifndef __DEBUG_HH__
#define __DEBUG_HH__

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#define ASSERT_ON
#ifdef ASSERT_ON
#include <signal.h>

/* A backtrace function */
void BackTrace();

/* A custom assert */
extern bool CustomAssert( bool expr, char * description , 
			  int linenum, char * filename);
#define Assert( expr, description ) \
  if ( CustomAssert( (bool)(expr), description, __LINE__, __FILE__) ) { \
  raise(SIGSEGV); \
  }

#else /* DEBUG */
#define Assert( exp, description )
#define BackTrace()
#endif /*DEBUG */
#endif /* __DEBUG_HH__ */
