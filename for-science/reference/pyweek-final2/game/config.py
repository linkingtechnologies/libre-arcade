
import os
import logging
import json

import pyglet

from game.const import CONF_FILE

class Config(object):

    # some defaults (FIXME: should be defined in const)
    conf = dict(audio_driver=('openal', 'pulse', 'directsound', 'silent',),
                music=True,
                volume=0.8,
                fullscreen=False,
                )

    def __getattr__(self, item):
        return Config.conf[item]

    def __setattr__(self, item, value):
        if item in self.conf:
            self.conf[item] = value
        else:
            self.__dict__[item] = value

    def load(self):
        try:
            fd = pyglet.resource.file(CONF_FILE, "rt")
            conf = json.load(fd)
            fd.close()
        except Exception as ex:
            logging.warning(ex)
        else:
            Config.conf = conf

    def save(self):
        try:
            filename = os.path.join(os.path.abspath(pyglet.resource.get_script_home()), CONF_FILE)
            with open(filename, "wt") as fd:
                fd.write(json.dumps(Config.conf, indent=1))
        except Exception as ex:
            logging.warning(ex)

config = Config()

