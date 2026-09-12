# Wok makefile
# $Id: Makefile,v 1.2 2001/11/10 01:49:26 kenta Exp $

NAME   = wok
O      = o
RM     = rm -f
CC     = gcc

SDL_LIB = -L/usr/lib -L/usr/local/lib
SDL_INCLUDE = -I/usr/include/SDL -I/usr/local/include/SDL

DEFAULT_CFLAGS = $(SDL_INCLUDE)

PROG        = $(NAME)
MORE_CFLAGS = -O3 -DOGG_MUSIC
LDFLAGS     = $(SDL_LIB) -lSDL -lSDL_image -lSDL_mixer -lpthread

CFLAGS  = $(DEFAULT_CFLAGS) $(MORE_CFLAGS)

OBJS =	$(NAME).$(O) pan.$(O) ball.$(O) board.$(O) generator.$(O) attract.$(O)\
	screen.$(O) sound.$(O) vector.$(O)

$(PROG): $(OBJS)
	$(CC) $(CFLAGS) -o $(PROG) $(OBJS) $(LDFLAGS)


clean:
	$(RM) $(PROG) *.$(O)
