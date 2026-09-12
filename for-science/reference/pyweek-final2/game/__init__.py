
import logging
from optparse import OptionParser

import pyglet

pyglet.options['debug_gl'] = False

# for py2exe *FIXME*
# import os
#SCRIPT_PATH = os.path.join(os.path.abspath(pyglet.resource.get_script_home()), 'data')
#pyglet.resource.path.append(SCRIPT_PATH)

# resources setup
pyglet.resource.path.append("@game.data")
pyglet.resource.reindex()
# FIXME: must be a better way!
pyglet.font.add_directory(pyglet.resource.location("DATA").path)

from cocos.director import director
from cocos.layer import MultiplexLayer
from cocos.scene import Scene

from game.const import PROJECT_DESC, PROJECT_URL, VERSION, WIDTH, HEIGHT
from game.config import config
from game.menu import MenuBackgroundLayer, MainMenu, OptionsMenu

class Game(object):

    def __init__(self):

        # try to load the configuration
        config.load()

        # pyglet setup
        pyglet.options['audio'] = config.audio_driver
        pyglet.options['debug_gl'] = False


        parser = OptionParser(description="%s - PyWeek 16 (April 2013)" % PROJECT_DESC,
                              epilog='Project website: %s' % PROJECT_URL,
                              version='%prog ' + VERSION,
                              )
        parser.add_option("-f", "--fullscreen",
                          dest="fullscreen",
                          default=False,
                          action="store_true",
                          )
        parser.add_option("-d", "--debug",
                          dest="debug",
                          default=False,
                          action="store_true",
                          )
        self.options, args = parser.parse_args()

        if self.options.debug:
            logging.basicConfig(level=logging.DEBUG)
            logging.debug("Debug enabled")
            logging.debug("Options: %s" % self.options)

    def run(self):
        director.init(resizable=False, width=WIDTH, height=HEIGHT)
        director.set_show_FPS(self.options.debug)
        director.window.set_caption(PROJECT_DESC)

        scene = Scene()
        scene.add(MenuBackgroundLayer(), z=0)
        scene.add(MultiplexLayer(MainMenu(), OptionsMenu(),),)

        if self.options.fullscreen or config.fullscreen:
            director.window.set_visible(True)
            director.window.set_fullscreen(True)

        director.run(scene)

