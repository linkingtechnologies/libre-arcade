/*
    Yet Another Arkanoid
    Copyright (C) 2001 Mads Bondo Dydensborg <mads@dydensborg.dk>
    Copyright (C) 2001 Jonas Christian Drewsen <jcd@xspect.dk>
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

/* This module is the link between the interprenter (Python) and 
   the rest of the aplication */
#include <Python.h>
#include <string>

class TInterprenter {
public:
  /* The constructor initializes the python engine
     and loads the default module - 
     The application must
     a) Load all modules neccesary for callbacks
     b) Call LoadDefault()
     c) Start using the interprenter
  */
  TInterprenter();
  /* Clean up the python interprenter */
  ~TInterprenter();
  /* Add a module */
  bool AddModule(char * module, PyMethodDef * methods);
  bool AddModule(string module, PyMethodDef * methods);
  /* Load the default scripts */
  bool LoadDefaultScripts();
  /* Run scripts - return true for no fault, false otherwise */
  bool RunSimpleString(char * script);
  bool RunSimpleString(string script);
  /* Note, file is a script within the PathManager path. */
  bool RunSimpleFile(string script);
};

extern TInterprenter * Interprenter;
