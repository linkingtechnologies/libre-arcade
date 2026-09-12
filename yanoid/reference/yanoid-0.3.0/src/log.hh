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
/* This is an implementation of a log object. It sucks, but is a start */
#ifndef __LOG_HH__
#define __LOG_HH__

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

/* The log is only present, if we have compiled with the 
   debug directive, expect for FATAL, which is always there
 */
#include <iostream>
#include <strstream>

#define LOG_FATAL   0
#define LogFatal(_line) \
  cerr << "FATAL ERROR : " << __FILE__ << ":" << __LINE__ \
   << " - \"" << _line << "\"" << endl; exit(-1)

#ifdef DEBUG 
#include <string>

/* Variable to control putting stuff onto the console instead */
extern bool duptoconsole;

/* If you any levels below, remember to update the
   names (in log.cc) also */
#define LOG_ERROR   (1+LOG_FATAL)
#define LOG_WARNING (1+LOG_ERROR)
#define LOG_TODO    (1+LOG_WARNING)
#define LOG_INFO    (1+LOG_TODO)
#define LOG_TRACE   (1+LOG_INFO)
#define LOG_VERBOSE (1+LOG_TRACE)
#define LOG_VER_2   (1+LOG_VERBOSE)
#define LOG_MAX     (1+LOG_VER_2)

/* Log line is the usual interface to the log */
#define LogLineExt( _level, _line ) \
  { ostrstream loglinetmp; \
    loglinetmp.form _line << ends; \
    Log->AddLine( _level, __FILE__, __LINE__, loglinetmp.str()); }

#define LogLine( _level, _line ) \
  Log->AddLine( _level, __FILE__, __LINE__, _line )

class TLog {
  int level; /* Only stuff lower than this level is logged */
public:
  TLog() { level = LOG_MAX; };
  ~TLog() {};
  void SetLevel(int nlevel);
  void AddLine(int level_, char * filename, int lineno, string line);
};

extern TLog * Log;

#else
#define LogLine( _level, _line ) 
#define LogLineExt( _level, _line ) 
#endif

#endif
