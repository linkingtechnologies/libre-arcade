bin_PROGRAMS = yanoid

SUBDIRS = ConsoleSource

yanoid_SOURCES = soundmanager.cc more_entities.cc interprenter.cc \
                game.cc map.cc entity.cc pixmap_entity.cc \
		path.cc velocity.cc motion.cc \
		display.cc client.cc \
		surfacemanager.cc musicmanager.cc \
		ressourcemanager.cc highscore.cc \
	        debug.cc log.cc screen.cc main.cc globals.cc  \
		menu.cc fontmanager.cc texteffects.cc

yanoid_LDADD = ConsoleSource/libSDL_console.la

# none of these are installed - here for dist

noinst_HEADERS = soundmanager.hh more_entities.hh globals.hh interprenter.hh \
		 map.hh point.hh entity.hh pixmap_entity.hh \
		 path.hh game.hh velocity.hh motion.hh \
		 display.hh client.hh \
		 surfacemanager.hh musicmanager.hh \
		 ressourcemanager.hh highscore.hh \
		 debug.hh log.hh screen.hh \
		 menu.hh fontmanager.hh texteffects.hh
