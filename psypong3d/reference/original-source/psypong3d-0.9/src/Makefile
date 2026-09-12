#
# This file is part of PSY PONG 3D.
#
# Copyright (C) 2008-2009 Quetzy Garcia, <quetzyg@users.sourceforge.net>
# For news and updates, see <http://psypong3d.sourceforge.net/>
#
# PSY PONG 3D is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# PSY PONG 3D is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with PSY PONG 3D.  If not, see <http://www.gnu.org/licenses/>.
#

CC = gcc
OUT = pp3d

CFLAGS = -g -W -Wall
LIBS = -lglut -lm

OBJECTS = common.o bmp.o main.o game.o floor.o player.o ball.o camera.o keyboard.o

$(OUT) : $(OBJECTS)
	$(CC) $(CFLAGS) $(OBJECTS) -o $(OUT) $(LIBS)

	@echo -e "\nBuild complete!"
	@echo -e "\nTo run the program type: ./$(OUT)\n"

clean:
	rm -rf *.o
	rm -rf $(OUT)