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
#include <string.h>
#include "ressourcemanager.hh"
#include "interprenter.hh"
#include "log.hh"

/* **********************************************************************
 * The interprenter
 * *********************************************************************/
TInterprenter * Interprenter;

/* A quick hack to test things ... */

/* Declare a function from main */
extern void PrintMe(char *String);

/* Function to put a string onto the console */
static PyObject * put_console(PyObject * self, PyObject *args) {
  char * command;
  if (!PyArg_ParseTuple(args, "s", &command))
    return NULL;
  PrintMe(command);
  return Py_BuildValue("");
};

/* Function to force reloading the "basic" script */
static PyObject * reload(PyObject * self, PyObject *args) {
  /* Load the yanoid wrapper function */
  char * tmp = strdup(PathManager->Resolve("scripts/yanoid.py").c_str());
  FILE * tmpf = fopen(tmp, "r");
  PyRun_SimpleFile(tmpf, tmp);
  free(tmp);
  PyRun_SimpleString("help()");
  return Py_BuildValue("");
};

/* Function to resolve pathnames */
static PyObject * resolve(PyObject* self, PyObject *args) {
  char * path;
  if (!PyArg_ParseTuple(args, "s", &path))
    return NULL;
  return Py_BuildValue("s", PathManager->Resolve(path).c_str());
};

/* List of default functions */
static PyMethodDef yanoid_methods[] = {
  {"puts_console",  put_console,      METH_VARARGS},
  {"yreload",  reload,      METH_VARARGS},
  {"resolve",  resolve,      METH_VARARGS},
  {NULL,          NULL}           /* sentinel */
};



/* **********************************************************************
 * The constructor
 * Starts an instance of the Python interprenter
 * *********************************************************************/
TInterprenter::TInterprenter() {
  Py_Initialize();
  if (Py_IsInitialized()) {
    LogLine(LOG_INFO, "Python interprenter initialized");
    if (!AddModule("yanoid", yanoid_methods)) {
      LogFatal("Unable to load the yanoid script module");
      exit(-1);
    } else {
      LogLine(LOG_INFO, "Yanoid script module loaded");
    }
    /* Loading the yanoid warpper functions is deferred to 
     the LoadDefault method */
  } else {
    /* Ups, could not initialize. "Bad thing, bad" */ 
    LogFatal("Unable to initialize Python interprenter");
    exit(-1);
  }
}

/* **********************************************************************
 * The destructor - shuts down the interprenter 
 * *********************************************************************/
TInterprenter::~TInterprenter() {
  Py_Finalize();
}

/* **********************************************************************
 * Add a module
 * *********************************************************************/
bool TInterprenter::AddModule(char * module, PyMethodDef * methods) {
  if (PyImport_AddModule(module)) {
    Py_InitModule(module, methods);
    string tmp(module);
    return RunSimpleString("import " + tmp);
  } else {
    return false;
  }
}

bool TInterprenter::AddModule(string module, PyMethodDef * methods) {
  return AddModule(module.c_str(), methods);
}

/* **********************************************************************
 * Load the default script - yanoid.py - loads all others
 * *********************************************************************/
bool TInterprenter::LoadDefaultScripts() {
  return RunSimpleFile("scripts/yanoid.py");
}

/* **********************************************************************
 * Run a simple string
 * *********************************************************************/
bool TInterprenter::RunSimpleString(char * script) {
  return (0 == PyRun_SimpleString(script));
}

bool TInterprenter::RunSimpleString(string script) {
  char * tmp = strdup(script.c_str());
  bool result = (0 == PyRun_SimpleString(tmp));
  free(tmp);
  return result;
}
/* **********************************************************************
 * Run a simple file
 * *********************************************************************/
bool TInterprenter::RunSimpleFile(string script) {
  char * tmp = strdup(PathManager->Resolve(script).c_str());
  FILE * tmpf = fopen(tmp, "r");
  bool result;
  if (tmpf) {
    LogLineExt(LOG_VER_2, ("Got file %s", tmp));
    result = (0 == PyRun_SimpleFile(tmpf, tmp));
    fclose(tmpf);
  } else {
    LogLineExt(LOG_WARNING, ("Could not open file %s", tmp));
    result = false;
  }
  free(tmp);
  return result;
}
