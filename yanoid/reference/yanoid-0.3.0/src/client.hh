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
/* This contains the TClient module */

#include <SDL/SDL.h>

class TGame;
class TClient {
protected:
  TGame * Game;
  /* Various stuff for timekeeping */
  Uint32 game_start;
  Uint32 game_lastupdate;
  Uint32 pausetime;
  bool QuitCurrentGame;
  int paused;
  static bool ModuleAdded;
  /* Splitting stuff up, to make it easier to handle */
  void UpdateGame();
  void Render();
  void HandleEvents();
  bool HandleGlobalKeys(SDL_Event * event);
  void PauseGame();
  void ContinueGame();
  bool NextMap();
public:
  TClient();
  ~TClient();
  inline TGame * GetGame() const { return Game; }
  static bool AddModule();
  void Run();
  void ToggleConsole();
  void ToggleMusic();
};

/* Out global client - we can never have more than this. */
extern TClient * Client;
