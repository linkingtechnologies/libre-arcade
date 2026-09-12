
import gc

import pyglet
from pyglet import gl

from cocos.director import director
from cocos.layer import Layer
from cocos.menu import Menu, MenuItem, ToggleMenuItem, CENTER
from cocos.scenes.transitions import FadeTransition

from game.config import config
from game.audio import player
from game.scenes import GameScene

class MenuBackgroundLayer(Layer):
    def __init__(self):
        super(MenuBackgroundLayer, self).__init__()
        self.img = pyglet.resource.image('title.png')

    def draw(self):
        gl.glPushMatrix()
        self.transform()
        self.img.blit(0,0)
        gl.glPopMatrix()

    def on_enter(self):
        super(MenuBackgroundLayer, self).on_enter()
        if config.music:
            player.queue(pyglet.resource.media("menu.ogg"))
            player.volume = config.volume
            player.eos_action = 'loop'
            if player.playing:
                player.next()
            player.play()

class MainMenu(Menu):
    def __init__(self):
        super(MainMenu, self).__init__()

        sound = pyglet.resource.media('select.wav', streaming=False)
        self.select_sound = sound
        self.activate_sound = sound

        self.font_item['font_name'] = 'Russo One',
        self.font_item['color'] = (255, 204, 0, 255)
        self.font_item['font_size'] = 18
        self.font_item_selected['font_name'] = 'Russo One'
        self.font_item_selected['color'] = (255, 230, 140, 255)
        self.font_item_selected['font_size'] = 24

        self.y = -60
        self.menu_anchor_y = CENTER
        self.menu_anchor_x = CENTER

        items = []

        items.append(MenuItem('Start Game', self.on_start_game))
        items.append(MenuItem('Demo', self.on_start_demo_game))
        items.append(MenuItem('Options', self.on_options))
        items.append(MenuItem('Quit', self.on_quit))

        self.create_menu(items)

    def on_start_demo_game(self):
        director.push(FadeTransition(GameScene(demo=True), 1.0))

    def on_start_game(self):
        director.push(FadeTransition(GameScene(), 1.0))

    def on_options(self):
        self.parent.switch_to(1)

    def on_quit(self):
        global player

        self.select_sound = None

        if player.playing:
            player.pause()

        # FIXME: workaround for uncollected media players
        player = None
        gc.collect()

        # try to save the configuration
        config.save()

        pyglet.app.exit()

class OptionsMenu(Menu):
    def __init__(self):
        super(OptionsMenu, self).__init__()

        sound = pyglet.resource.media('select.wav', streaming=False)
        self.select_sound = sound
        self.activate_sound = sound

        self.font_item['font_name'] = 'Russo One',
        self.font_item['color'] = (255, 204, 0, 255)
        self.font_item['font_size'] = 18
        self.font_item_selected['font_name'] = 'Russo One'
        self.font_item_selected['color'] = (255, 230, 140, 255)
        self.font_item_selected['font_size'] = 24

        self.y = -80
        self.menu_anchor_y = CENTER
        self.menu_anchor_x = CENTER

        items = []

        items.append(ToggleMenuItem('Music: ', self.on_music, config.music))
        items.append(ToggleMenuItem('Fullscreen: ', self.on_fullscreen, config.fullscreen))
        items.append(MenuItem('Back', self.on_quit))

        self.create_menu(items)

    def on_music(self, toggle):
        config.music = toggle
        if not toggle:
            player.pause()
        else:
            player.play()

    def on_fullscreen(self, toggle):
        director.window.set_fullscreen(toggle)
        config.fullscreen = toggle

    def on_quit(self):
        self.parent.switch_to(0)

