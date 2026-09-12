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
/* This provides a general ressource manager class, using templates */
#ifndef __RESSOURCEMANAGER_HH__
#define __RESSOURCEMANAGER_HH__
#include <map>
#include <string>
#include <vector>
#include "log.hh"
#include "debug.hh"

/* **********************************************************************
 * The PathManager
 * *********************************************************************/

/* The pathmanager maps from a name - which is a partial path - (eg
   graphics/fonts/menu_font.png) to an absolute path - a filename (eg
   /usr/local/share/yanoid/graphics/fonts/menu_font.png).
   Paths added will override earlier mappings. This way we can
   experiment with new (or partially new) datasets */
typedef std::map <string, string> TPathMap;
typedef TPathMap::iterator TPathMapIterator;

class TPathManager {
protected:
  TPathMap pathmap;
  void AddPathRecursivly(size_t base_size, string path);
  void AddMapping(string name, string absolute);
public:
  TPathManager() {};
  ~TPathManager();
  /* Add path will add the files found in that path to our list of 
     path mappings. Files found will override earlier paths */
  void AddPath(string path);
  /* This will return a absolute path to a file from the 
     filepath name. Will return an empty string, if file not found. */
  string Resolve(string name);
};

/* Our global pathmanager */
extern TPathManager * PathManager;

/* **********************************************************************
 * The acutal ressource managers
 * *********************************************************************/

/* The overall strategy is to have a general ressource manager, that
   will have several handlers registered to handle the different
   ressources. Note - the only point is to be able to access ressources,
   and share references to them. We perform no memory management
   we assume that this will never be a problem and let the OS handle it
   Clearly we are not developing for a console machine .. ;-) 
   
   There are currently no way to unload ressources.
*/

/* The base ressource handler uses templates to abstract away the type of
   the ressource to be managed - one will need to inherit from them, 
   to make a usefull manager. */
template <typename res_t>
class TRessourceManager {
protected:
  /* The ressources that have been loaded from disk are stored
     within the handlers */
  class storage_t {
  protected:
    string name; /* Ressource name */
    res_t * ressource;
    int hrefs, rrefs; 
  public:
    storage_t(string _name, res_t * _ressource) {
      name      = _name; 
      ressource = _ressource;
      hrefs     = 0;
      rrefs     = 0;
    };
    string GetName() { return name; };
    res_t * TakeRessource() { ++rrefs; return ressource; };
    void ReleaseRessource() { 
      --rrefs; 
      Assert(rrefs >= 0, "Someone released a ressouce one to often");
    };
    bool HasRefs() { return 0 != rrefs; }
  }; /* storage_t */

  /* **********************************************************************
   * Variables for the ressource manager, etc.
   * *********************************************************************/

  /* The actual ressources are stored in here */
  typedef std::map<string, storage_t *> TNameToStorageMap;
  typedef TNameToStorageMap::iterator   TNameToStorageMapIterator;
  /* This is for looking up storage_t, when we get a ressource */
  
  typedef std::map<res_t *, storage_t *> TRessourceToStorageMap;
  typedef TRessourceToStorageMap::iterator TRessourceToStorageMapIterator;
  TNameToStorageMap NameToStorageMap;
  TRessourceToStorageMap RessourceToStorageMap;

  /* **********************************************************************
   * Virtual methods to ensure that different types of ressouces can be 
   * loaded, etc.
   * *********************************************************************/
  
  /* Load ressouce should do anything that is required to make
     the res_t ressource valid, from a given filename */
  virtual res_t * LoadRessource(string filename) = 0;
  /* UnloadRessource should totally get rid of the ressource -
     res will be meaningless afterwards and will never be referenced */
  virtual void UnloadRessource(res_t *) = 0;
  
public:
  /* **********************************************************************
   * This is the meat of the handler
   * *********************************************************************/
  TRessourceManager() {};
  virtual ~TRessourceManager();
  /* Require will load or locate the ressource, and return a pointer
     to it */
  res_t * RequireRessource(string name);
  /* Release will let the manager know that this pointer is no longer
     needed */
  void ReleaseRessource(res_t * ressource);
  /* This is for duplicating a ressource *
     Please us this, if you need to copy the * */
  res_t * DuplicateRessource(res_t * ressource);
};



/* **********************************************************************
 * The RessourceManager class comes here
 * *********************************************************************/

/* **********************************************************************
 * The destructor
 * *********************************************************************/
template <typename res_t>
TRessourceManager <res_t>::~TRessourceManager() {
  TNameToStorageMapIterator End = NameToStorageMap.end();
  TNameToStorageMapIterator i;
  for (i = NameToStorageMap.begin(); i != End; i++) {
    if ((*i).second->HasRefs()) {
      LogLine(LOG_ERROR, "Releasing " + (*i).second->GetName() + 
	      " - ressource still referenced");
      UnloadRessource((*i).second->TakeRessource());
      delete ((*i).second);
    }
  }
};


/* **********************************************************************
 * Require a ressource - may force ressource to be loaded.
 * *********************************************************************/

template <typename res_t>
res_t * TRessourceManager <res_t>::RequireRessource(string name) {
  /* Check if name is already mapped, return that */
  storage_t * storage = NameToStorageMap[name];
  if (storage) {
    // LogLine(LOG_VER_2, "Reusing " + name);
    return storage->TakeRessource();
  };
  
  /* Not mapped. Load ressource, create record, insert into 
     handleresource map, insert into namehandle map, return handle */
  string filename = PathManager->Resolve(name);
  if ("" == filename) {
    LogLine(LOG_ERROR, "Unable to resolve " + name);
    return 0;
  };
  /* Load the ressource, use the virtual method */
  res_t * ressource = LoadRessource(filename);
  if (NULL == ressource) {
    LogLine(LOG_ERROR, "Unable to load ressource " + filename);
    return 0;
  };
  /* Get storage */
  storage = new storage_t(name, ressource);
  if (NULL == storage) {
    LogLine(LOG_ERROR, "Unable to allocate storage_t");
    UnloadRessource(ressource);
    return 0;
  };
  /* Should be OK now - save the stuff in the maps */
  // LogLine(LOG_VER_2, "Inserting storage for " + name);
  NameToStorageMap[name] = storage ;
  RessourceToStorageMap[ressource] = storage;
  return storage->TakeRessource();
};

/* **********************************************************************
 * Release a ressource 
 * *********************************************************************/

template <typename res_t>
void TRessourceManager <res_t>::ReleaseRessource(res_t * ressource) {
  if (NULL == ressource) {
    LogLine(LOG_WARNING, "ReleaseRessource on NULL pointer");
    return;
  }
  /* Lookup the ressource in the storage map */
  storage_t * tmp = RessourceToStorageMap[ressource];
  if (!tmp) {
    LogLine(LOG_ERROR, "ReleaseRessource on unmapped ressource");
    return;
  }
  // LogLine(LOG_VER_2, "Releasing ressource " + tmp->GetName());
  tmp->ReleaseRessource();
}

/* **********************************************************************
 * Duplicate a ressources
 * *********************************************************************/
template <typename res_t>
res_t * TRessourceManager <res_t>::DuplicateRessource(res_t * ressource) {
  if (NULL == ressource) {
    LogLine(LOG_ERROR, "DuplicateRessource on NULL pointer");
    return NULL;
  }
  /* Look up the ressource */
  storage_t * tmp = RessourceToStorageMap[ressource];
  if (!tmp) {
    LogLine(LOG_ERROR, "DuplicateRessource on unmapped ressource");
    return NULL;
  }
  // LogLine(LOG_VER_2, "Duplicating ressource " + tmp->GetName());
  return tmp->TakeRessource();
}

#endif
