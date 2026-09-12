import logging
from random import randint, shuffle

import pyglet
from pyglet import gl

from cocos.scene import Scene
from cocos.layer import Layer
from cocos.batch import BatchNode
from cocos.actions import MoveTo, Delay, CallFunc, FadeOut, FadeIn, RotateBy, ScaleBy
from cocos.sprite import Sprite
from cocos.text import Label
from cocos.director import director
from cocos.draw import Line

from game.const import HEIGHT, WIDTH
from game.config import config
from game.audio import player as audio_player

class GameBackgroundLayer(Layer):
    def __init__(self):

        super(GameBackgroundLayer, self).__init__()
        self.img = pyglet.resource.image('background.png')

    def draw(self):

        gl.glPushMatrix()
        self.transform()
        self.img.blit(0, 0)
        gl.glPopMatrix()

class GameMessageLayer(Layer):

    def say(self, text, cb=None, delay=2.0, size=14, move=False):

        label = Label(text,
                      # more or less the end of the board
                      position=(WIDTH//2, (HEIGHT//2)-(HEIGHT//3)),
                      font_size=size,
                      font_name='Russo One',
                      anchor_x='center',
                      anchor_y='center',
                      color=(255, 204, 0, 255),
                      )
        self.add(label)

        action = Delay(delay)
        if move:
            action += MoveTo((label.x, -20), 0.5)
        else:
            action += FadeOut(0.3)

        if cb:
            action += CallFunc(cb)

        action += CallFunc(label.kill)

        label.do(action)

class Tile(Sprite):
    def __init__(self, tile, **kwargs):
        super(Tile, self).__init__(**kwargs)
        self.tile = tile

class GameLayer(Layer):

    _tiles = ("money.png",
              "shield.png",
              "cow.png",
              "meteorite.png",
              "rocket.png",
              "laser.png",
              )

    # board size
    board_w = 10
    board_h = 10
    tile_size = 32
    tile_pad = 2

    def __init__(self):

        super(GameLayer, self).__init__()

        self.tiles = []
        for tile in GameLayer._tiles:
            self.tiles.append(pyglet.resource.image(tile).get_region(1, 1, self.tile_size,  self.tile_size))

        self.batch = BatchNode()
        self.add(self.batch)

        image = pyglet.resource.image("station.png").get_region(1, 1, 128,  128)
        station = Sprite(image, position=(75, 75), opacity=0)
        station.do( Delay(1.0) + FadeIn(2.0))
        self.batch.add(station)
        image = pyglet.resource.image("station.png", flip_x=True).get_region(1, 1, 128,  128)
        station = Sprite(image, position=(WIDTH-75, 75), opacity=0)
        self.batch.add(station)
        station.do(Delay(1.0) + FadeIn(2.0) + CallFunc(self.new_shieldlines))

        self.shieldline = None

        self._board = { }

        self.board_ox = (WIDTH//2)-(self.board_w*(self.tile_size+self.tile_pad))//2
        self.board_oy = HEIGHT-self.tile_size-self.tile_pad

        self.timeline = None

    def new_shieldlines(self):

        # draw the shield to 100%
        self.shieldline = []

        #bg
        s = (10, 10)
        e = (s[0]+128, s[1])
        bg = Line(s, e, (30, 30, 30, 255), 6)
        self.add(bg, z=0)

        s = (10, 10)
        e = (s[0]+128, s[1])
        shield = Line(s, e, (0, 255, 0, 255), 2)
        self.add(shield, z=1)
        self.shieldline.append(shield)

        #bg
        s = (WIDTH-10-128, 10)
        e = (s[0]+128, s[1])
        bg = Line(s, e, (30, 30, 30, 255), 6)
        self.add(bg, z=0)

        s = (WIDTH-10-128, 10)
        e = (s[0]+128, s[1])
        shield = Line(s, e, (0, 255, 0, 255), 2)
        self.add(shield, z=1)
        self.shieldline.append(shield)

    def set_shield(self, who, value):

        # value is damage!
        # FIXME: this shouldn't happen here
        self.parent.control.players[who].shield -= value
        current = self.parent.control.players[who].shield
        if current < 0:
            current = 0
        if current > 100:
            current = 100

        shield = self.shieldline[who]
        e = (shield.start[0]+(current*128/100.0), shield.end[1])
        shield.end = e

    def new_timeline(self):

        s = (self.board_ox, 20+self.board_oy-(self.tile_size+self.tile_pad)*self.board_h)
        self.timeline_w = self.board_w*(self.tile_size+self.tile_pad)
        e = (s[0]+self.timeline_w, s[1])
        self.timeline = Line(s, e, (0, 128, 0, 255), 4)
        self.add(self.timeline)

    def set_timeline(self, per):

        e = (self.timeline.start[0]+(per*self.timeline_w/100.0), self.timeline.end[1])
        self.timeline.end = e

    def new_board(self, cb):

        count = 0
        for y in range(self.board_h):
            for x in range(self.board_w):
                tx, ty = self.board_to_screen(x, y)

                # effect to fill the board first time
                tile = randint(0, len(self.tiles)-1)
                sprite = Tile(tile,
                              image=self.tiles[tile],
                              position=(tx, HEIGHT+self.tile_size*2),
                              anchor=(0, 0),
                              )

                action = Delay(1.0) + MoveTo((tx, ty), 2)

                # FIXME: must be a better way!
                count += 1
                if count == self.board_w*self.board_h:
                    action += CallFunc(cb) + CallFunc(self.new_timeline)

                sprite.do(action)
                self.batch.add(sprite)
                self._board[x, y] = sprite

    def shuffle(self, cb, gravity=True):
        count = 0
        for y in range(self.board_h):
            for x in range(self.board_w):
                sprite = self._board[x, y]
                action = FadeOut(0.3) + CallFunc(sprite.kill)
                # FIXME: must be a better way!
                count += 1
                if count == self.board_w*self.board_h:
                    if gravity:
                        action += CallFunc(lambda: self.gravity(cb=cb))
                    else:
                        action += CallFunc(cb)
                sprite.do(action)
                self._board[x, y] = None

    def set_tile(self, x, y, tile):

        sx, sy = self.board_to_screen(x, y)
        sprite = Tile(tile,
                      image=self.tiles[tile],
                      position=(sx, sy),
                      anchor=(0, 0),
                      )
        self.batch.add(sprite)
        self._board[x, y] = sprite

    def swap(self, selected, cb):

        logging.debug("swaping: %s" % selected)
        a, b = selected

        sprite_a = self._board[a[0], a[1]]
        sprite_b = self._board[b[0], b[1]]

        action = MoveTo((sprite_a.x, sprite_a.y), 0.2)
        sprite_b.do(action)
        action = MoveTo((sprite_b.x, sprite_b.y), 0.2)
        sprite_a.do(action + CallFunc(cb))

        self.real_swap(a, b)

    def real_swap(self, a, b):
        self._board[a[0], a[1]], self._board[b[0], b[1]] = self._board[b[0], b[1]], self._board[a[0], a[1]]

    def valid_move(self, selected):

        # FIXME: is_same_tile
        positions = []
        scores = []
        for bx, by in selected:
            tile = self._board[bx, by].tile
            pos = self._board[bx, by].position
            logging.debug("selected: (%s, %s) is %s" % (bx, by, tile))

            # top
            partial = []
            for y in range(by, self.board_h):
                if self._board[bx, y].tile == tile:
                    partial.append((bx, y))
                else:
                    break
            if len(partial) >= 3:
                positions.extend(partial)
                scores.append((tile, len(set(partial)), pos))

            # bottom
            for y in range(by-1, -1, -1):
                if self._board[bx, y].tile == tile:
                    partial.append((bx, y))
                else:
                    break
            if len(partial) >= 3:
                positions.extend(partial)
                scores.append((tile, len(set(partial)), pos))

            # right
            partial = []
            for x in range(bx, self.board_w):
                if self._board[x, by].tile == tile:
                    partial.append((x, by))
                else:
                    break
            if len(partial) >= 3:
                positions.extend(partial)
                scores.append((tile, len(set(partial)), pos))

            # left
            for x in range(bx-1, -1, -1):
                if self._board[x, by].tile == tile:
                    partial.append((x, by))
                else:
                    break
            if len(partial) >= 3:
                positions.extend(partial)
                scores.append((tile, len(set(partial)), pos))

        logging.debug("scored positions: %s" % positions)
        logging.debug("scores: %s" % scores)
        return positions, scores

    def apply_score(self, positions, score):

        for x, y in set(positions):
            sprite = self._board[x, y]
            p = self.parent.control.current_player.tile_destination
            action = MoveTo(p, 0.4) + CallFunc(sprite.kill)
            sprite.do(action)

            self._board[x, y] = None

        # feedback about the extra $$$
        extras = []
        last_p = None
        for tile, amount, extra_p in score:
            if tile != 0 and amount > 3:
                extra = (amount-3)*5
                extras.append((0, extra, None))
                if extra_p == last_p:
                    extra_p = (extra_p[0], extra_p[1]-20)
                last_p = extra_p
                label_extra = Label("+$%d" % extra,
                                    position=extra_p,
                                    font_size=14,
                                    font_name='Russo One',
                                    anchor_x='center',
                                    anchor_y='center',
                                    color=(255, 204, 0, 255),
                                    )
                self.add(label_extra)
                action = (MoveTo((label_extra.x, label_extra.y+100), 3.0) | (Delay(1.5) + FadeOut(1.5))) + \
                            CallFunc(label_extra.kill)
                label_extra.do(action)

        if extras:
            logging.debug("extras: %s" % extras)
            score.extend(extras)

        self.do(Delay(0.4) + CallFunc(lambda: self.parent.control.current_player.add_score(score)))

    def get_move(self):
        # core of our artificial stupidity!
        # this is the solution I got, must be a better way! for science!

        def test_case_x(x, y, tile, case):
            for j in range(len(case)):
                if case[j] != (self._board[x+j, y].tile == tile):
                    return False
            return True

        def test_case_x_down(x, y, tile, case):
            for j in range(len(case)):
                if case[j] != (self._board[x+j, y].tile == tile):
                    return False
                if not case[j] and self._board[x+j, y+1].tile != tile:
                    return False
            return True

        def test_case_x_up(x, y, tile, case):
            for j in range(len(case)):
                if case[j] != (self._board[x+j, y].tile == tile):
                    return False
                if not case[j] and self._board[x+j, y-1].tile != tile:
                    return False
            return True

        def test_case_y(x, y, tile, case):
            for j in range(len(case)):
                if case[j] != (self._board[x, y+j].tile == tile):
                    return False
            return True

        def test_case_y_right(x, y, tile, case):
            for j in range(len(case)):
                if case[j] != (self._board[x, y+j].tile == tile):
                    return False
                if not case[j] and self._board[x+1, y+j].tile != tile:
                    return False
            return True

        def test_case_y_left(x, y, tile, case):
            for j in range(len(case)):
                if case[j] != (self._board[x, y+j].tile == tile):
                    return False
                if not case[j] and self._board[x-1, y+j].tile != tile:
                    return False
            return True

        moves = []
        combo = False
        for tile in range(len(self.tiles)):
            # horizontal x 4
            for y in range(self.board_h):
                for x in range(self.board_w-4):
                    if test_case_x(x, y, tile, (True, False, True, True, True)):
                        moves.append([(x, y), (x+1, y)])
                        combo = True
                    if test_case_x(x, y, tile, (True, True, True, False, True)):
                        moves.append([(x+3, y), (x+4, y)])
                        combo = True
            # horizontal
            for y in range(self.board_h):
                for x in range(self.board_w-3):
                    if test_case_x(x, y, tile, (True, False, True, True)):
                        moves.append([(x, y), (x+1, y)])
                    if test_case_x(x, y, tile, (True, True, False, True)):
                        moves.append([(x+2, y), (x+3, y)])
            # horizontal up
            for y in range(1, self.board_h):
                for x in range(self.board_w-2):
                    if test_case_x_up(x, y, tile, (False, True, True)):
                        moves.append([(x, y), (x, y-1)])
                    if test_case_x_up(x, y, tile, (True, False, True)):
                        moves.append([(x+1, y), (x+1, y-1)])
                    if test_case_x_up(x, y, tile, (True, True, False)):
                        moves.append([(x+2, y), (x+2, y-1)])
            # horizontal down
            for y in range(self.board_h-1):
                for x in range(self.board_w-2):
                    if test_case_x_down(x, y, tile, (False, True, True)):
                        moves.append([(x, y), (x, y+1)])
                    if test_case_x_down(x, y, tile, (True, False, True)):
                        moves.append([(x+1, y), (x+1, y+1)])
                    if test_case_x_down(x, y, tile, (True, True, False)):
                        moves.append([(x+2, y), (x+2, y+1)])
            # vertical x 4
            for x in range(self.board_w):
                for y in range(self.board_h-4):
                    if test_case_y(x, y, tile, (True, False, True, True, True)):
                        moves.append([(x, y), (x, y+1)])
                        combo = True
                    if test_case_y(x, y, tile, (True, True, True, False, True)):
                        moves.append([(x, y+3), (x, y+4)])
                        combo = True
            # vertical
            for x in range(self.board_w):
                for y in range(self.board_h-3):
                    if test_case_y(x, y, tile, (True, False, True, True)):
                        moves.append([(x, y), (x, y+1)])
                    if test_case_y(x, y, tile, (True, True, False, True)):
                        moves.append([(x, y+2), (x, y+3)])
            # vertical right
            for x in range(self.board_w-1):
                for y in range(self.board_h-2):
                    if test_case_y_right(x, y, tile, (False, True, True)):
                        moves.append([(x, y), (x+1, y)])
                    if test_case_y_right(x, y, tile, (True, False, True)):
                        moves.append([(x, y+1), (x+1, y+1)])
                    if test_case_y_right(x, y, tile, (True, True, False)):
                        moves.append([(x, y+2), (x+1, y+2)])
            # vertical left
            for x in range(1, self.board_w):
                for y in range(self.board_h-2):
                    if test_case_y_left(x, y, tile, (False, True, True)):
                        moves.append([(x, y), (x-1, y)])
                    if test_case_y_left(x, y, tile, (True, False, True)):
                        moves.append([(x, y+1), (x-1, y+1)])
                    if test_case_y_left(x, y, tile, (True, True, False)):
                        moves.append([(x, y+2), (x-1, y+2)])

            # money first!
            if tile == 0 and moves:
                break
            # combos
            if combo and moves:
                break

        logging.debug("moves: %s" % moves)

        if moves:
            shuffle(moves)
            return moves[0]
        else:
            return []

    def gravity(self, cb):

        # this could be more efficient, but cocos doesn't seem to care
        while True:
            updated = False

            for y in range(self.board_h-2, -1, -1):
                for x in range(self.board_w):
                    if self._board[x, y] and not self._board[x, y+1]:
                        sx, sy = self.board_to_screen(x, y+1)
                        action = MoveTo((sx, sy), 0.2)
                        self._board[x, y].do(action)
                        self.real_swap((x, y), (x, y+1))
                        updated = True

            if not updated:
                break

        # fill the gaps
        sprite = None
        for y in range(self.board_h):
            for x in range(self.board_w):
                if not self._board[x, y]:
                    self.set_tile(x, y, randint(0, len(self.tiles)-1))
                    sprite = self._board[x, y]
                    action = MoveTo((sprite.x, sprite.y), 0.4)
                    sprite.y = HEIGHT+self.tile_size*2
                    sprite.do(action)
        if sprite:
            sprite.do(Delay(0.4)+CallFunc(cb))
        else:
            # unlikely!
            self.do(Delay(0.4)+CallFunc(cb))

    def board_to_screen(self, x, y):
        return (self.board_ox+(x*(self.tile_size+self.tile_pad)),
                self.board_oy-(y*(self.tile_size+self.tile_pad)),
                )

    def screen_to_board(self, x, y):
        x, y = director.get_virtual_coordinates(x, y)
        x = int(x)
        y = int(y)
        bx = (x-self.board_ox)//(self.tile_size+self.tile_pad)
        by = -(y-self.board_oy-self.tile_size-self.tile_pad)//(self.tile_size+self.tile_pad)

        if 0 <= bx < self.board_w and 0 <= by < self.board_h:
            return (bx, by)
        raise IndexError()

    def screen_to_asset(self, x, y):
        # FIXME: only works for player 0

        x, y = director.get_virtual_coordinates(x, y)
        x = int(x)
        y = int(y)

        ax = (x-90)//self.tile_size
        ay = -(y-310-34)//34

        if ax == 0 and 0 <= ay < len(self.tiles)-1:
            return ay
        raise IndexError()

    def is_same_tile(self, a, b):
        if not self._board[a[0], a[1]] or not self._board[b[0], b[1]]:
            return False
        return self._board[a[0], a[1]].tile == self._board[b[0], b[1]].tile

class Player(Layer):

    # this is what happens when your code takes control!

    DATA = [{'avatar_position': (48, HEIGHT-84),
             'label_turn_position': (48+32, HEIGHT-94),
             'tile_destination': (48+32, HEIGHT-62),
             'label_money_position': (48+32, HEIGHT-120),
             # attacks
             'src': [75, 20],
             'dst': [WIDTH-75, 75],
             },
            {'avatar_position': (WIDTH-48-64, HEIGHT-84),
             'label_turn_position': (WIDTH-48-32, HEIGHT-94),
             'tile_destination': (WIDTH-48-32, HEIGHT-62),
             'label_money_position': (WIDTH-48-32, HEIGHT-120),
             # attacks
             'dst': [75, 75],
             'src': [WIDTH-75, 20],
             },
           ]

    cost = [ None,
             10,
             30,
             20,
             10,
             5,
             ]

    names = [ None,
              "Shield UP!",
              "Orbital Cow!",
              "Meteor Burst!",
              "Rocket!",
              "Laser Beam!",
              ]

    def __init__(self, avatar, who):
        self.who = who
        image = pyglet.resource.image(avatar)
        self.avatar = image.get_region(1, 1, 64, 64)

        for attr, value in Player.DATA[who].iteritems():
            setattr(self, attr, value)

        self.shield = 100
        self.score = [0 for x in range(len(GameLayer._tiles))]

        self.tiles_on = [None,]
        self.tiles_off = [None,]
        for i in range(1, len(GameLayer._tiles)):
            image = pyglet.resource.image(GameLayer._tiles[i])
            self.tiles_on.append(image.get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size))
            image = pyglet.resource.image("0%s" % GameLayer._tiles[i])
            self.tiles_off.append(image.get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size))

        # setup the labels
        self.add_score([])

    def can_use(self, asset):
        return self.score[asset+1] > 0 and self.score[0] >= self.cost[asset+1]

    def use(self, asset):
        if self.can_use(asset):
            self.score[0] -= self.cost[asset+1]
            self.score[asset+1] -= 1
            # refresh the HUD
            self.add_score([])
            logging.debug("used %s" % asset)
            return self.names[asset+1]

    def add_score(self, score):

        accounted = set()
        for tile, amount, _ in score:
            if tile == 0:
                self.score[tile] += amount*5
            else:
                if tile not in accounted:
                    accounted.add(tile)
                    self.score[tile] += 1

        logging.debug("added score player %s: %s" % (self.who, self.score))

        self.label_money = Label("$%04d" % self.score[0],
                                 position=self.label_money_position,
                                 font_size=12,
                                 font_name='Russo One',
                                 anchor_x='center',
                                 anchor_y='center',
                                 color=(255, 204, 0, 255),
                                 )

        self.labels = []
        self.tiles = []
        for i in range(1, len(self.score)):
            # at this point I don't care
            if self.who == 0:
                p = [86, 300-(i-2)*34]
                a = 'right'
            else:
                p = [WIDTH-86, 300-(i-2)*34]
                a = 'left'
            if self.score[i] > 0 and self.score[0] >= self.cost[i]:
                on = True
                color = (255, 204, 0, 255)
            else:
                on = False
                color = (128, 128, 128, 255)

            self.labels.append(Label("%02d" % self.score[i],
                               position=p,
                               font_size=8,
                               font_name='Droid Sans Mono',
                               anchor_x=a,
                               anchor_y='center',
                               color=color,
                               ))
            p[1] -= 14
            self.labels.append(Label("$%02d" % self.cost[i],
                               position=p,
                               font_size=8,
                               font_name='Russo One',
                               anchor_x=a,
                               anchor_y='center',
                               color=color,
                               ))
            if self.who == 0:
                p = [90, 310-(i-1)*34]
            else:
                p = [WIDTH-90-32, 310-(i-1)*34]

            if on:
                self.tiles.append(Sprite(self.tiles_on[i], position=p, anchor=(0,0)))
            else:
                self.tiles.append(Sprite(self.tiles_off[i], position=p, anchor=(0,0)))

    def draw(self):
        self.avatar.blit(*self.avatar_position)
        self.label_money.draw()
        for label in self.labels:
            label.draw()
        for tile in self.tiles:
            tile.draw()

class GameControl(Layer):

    is_event_handler = True

    def __init__(self, demo):
        super(GameControl, self).__init__()

        self.demo = demo
        self.selected = []
        self.clicked = False
        self.moving = False

        self.player = 1  # will move to 0 in the first turn
        self.time = 0
        self.elapsed = 0
        self.tip = False

        self.speed = 0.2
        self.turn_over = 0

        image = pyglet.resource.image('selected.png')
        self.selector = image.get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)

        self.players = [Player('drx.png', 0), Player('drz.png', 1)]
        self.label_turn = Label("MOVE!",
                                position=(0, 0),
                                font_size=12,
                                font_name='Russo One',
                                anchor_x='center',
                                anchor_y='center',
                                color=(255, 204, 0, 255),
                                )
        self.label_turn.visible = False
        self.add(self.label_turn)

        self.effects = {}
        image = pyglet.resource.image('rocket_launch.png').get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)
        self.effects['rocket_right'] = image
        image = pyglet.resource.image('rocket_launch.png', flip_x=True).get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)
        self.effects['rocket_left'] = image
        image = pyglet.resource.image('meteorite.png').get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)
        self.effects['meteorite_left'] = image
        image = pyglet.resource.image('meteorite.png', flip_x=True).get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)
        self.effects['meteorite_right'] = image
        image = pyglet.resource.image('cow.png', flip_x=True).get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)
        self.effects['cow'] = image
        image = pyglet.resource.image('explosion.png', flip_x=True).get_region(1, 1, GameLayer.tile_size, GameLayer.tile_size)
        self.effects['explosion'] = image

    @property
    def current_player(self):
        return self.players[self.player]

    @property
    def enemy_player(self):
        return self.players[self.enemy_who]

    @property
    def enemy_who(self):
        who = 0 if self.player else 1
        return who

    def on_player_start(self):

        self.player = 0 if self.player else 1
        self.label_turn.position = self.current_player.label_turn_position
        self.label_turn.visible = True
        self.time = 100
        self.elapsed = 0
        self.parent.view.set_timeline(self.time)
        self.schedule(self.update)
        self.on_player_move()

    def on_player_move(self):

        if not self.tip:
            if self.demo:
                self.parent.messages.say("press ESC to leave the demo", delay=4.0)
            else:
                self.parent.messages.say("click 2 adjacent cells to swap", delay=4.0)
            self.tip = True

        # FIXME: not true for two players
        if not self.demo and self.player == 0:
            self.moving = True
            self.clicked = False
        else:
            # basic AI
            self.moving = False
            asset = None

            # try to shield up
            if self.current_player.shield < 45 and self.current_player.can_use(0):
                asset = 0

            # we may attack

            # have money? be aggressive!
            if self.current_player.score[0] > 80:
                possible = [4, 4, 4, 4, 3, 3, 3, 2, 2, 1,]
            else:
                # normal
                possible = [4, 4, 3, 0, 0, 0, 0, 0, 0,]

            shuffle(possible)
            if asset is None and possible[0] > 0 and self.current_player.can_use(possible[0]):
                asset = possible[0]

            if asset is not None:
                msg = self.current_player.use(asset)
                self.turn_over = 0
                self.unschedule(self.update)
                self.parent.messages.say(msg, size=34, move=True, delay=1.0, cb=lambda: self.on_use_asset(asset))
                return

            self.selected = self.parent.view.get_move()
            if self.selected:
                action = Delay(1.5) + CallFunc(lambda: self.parent.view.swap(self.selected, cb=self.on_verify_move))
                self.do(action)

            # no moves left, will timeout

    def on_verify_move(self):

        positions, score = self.parent.view.valid_move(self.selected)
        if positions:
            self.parent.view.apply_score(positions, score)
            self.parent.efx['score'].play()

            self.selected = []
            self.turn_over = 0
            self.unschedule(self.update)
            self.parent.view.gravity(cb=self.on_player_start)
        else:
            self.parent.view.swap(self.selected, cb=self.on_player_move)
            self.selected = []
            self.parent.efx['error'].play()

    def on_turn_timeout(self):
        self.unschedule(self.update)
        self.parent.efx['endturn'].play()
        self.turn_over += 1
        if self.turn_over == 2:
            self.parent.messages.say("New Board", delay=1.0, size=36, move=True)
            self.turn_over = 0
            self.selected = []
            self.on_shuffle()
        else:
            self.parent.messages.say("Timeout!", delay=1.0, size=36, move=True)
            self.selected = []
            self.on_player_start()

    def on_shuffle(self):

        self.parent.efx['shield'].play()
        self.parent.view.shuffle(cb=self.on_player_start)

    def on_mouse_press(self, x, y, button, mods):

        if not self.moving:
            return False

        if self.clicked:
            return False

        logging.debug("clicked: %s, %s (%s)" % (x, y, button))

        if button == 1:
            try:
                bx, by = self.parent.view.screen_to_board(x, y)
            except IndexError:
                self.selected = []

                # check assets
                try:
                    asset = self.parent.view.screen_to_asset(x, y)
                except IndexError:
                    return False
                else:
                    logging.debug("asset selected: %s (has %s)" % (asset, self.current_player.score[asset+1]))
                    if self.current_player.can_use(asset):
                        msg = self.current_player.use(asset)
                        self.moving = False
                        self.turn_over = 0
                        self.unschedule(self.update)
                        self.parent.messages.say(msg, size=34, move=True, delay=1.0, cb=lambda: self.on_use_asset(asset))
                        return True
                    else:
                        self.parent.efx['error'].play()
                    return False

            if not self.selected:
                self.selected.append((bx, by))

            elif (bx, by) in self.selected:
                self.selected = [item for item in self.selected if item != (bx, by)]
                # TODO: sound

            elif self.parent.view.is_same_tile(self.selected[0], (bx, by)):
                # TODO: sound
                pass

            else:
                # if we're out of the board is not a big deal because
                # that would be an illegal value for bx, by
                # this is a simple way of checking is a valid move
                for j, k in [(-1, 0), (0, -1), (0, 1), (1, 0),]:
                    if (bx+j, by+k) in self.selected:
                        self.selected.append((bx, by))
                        self.moving = False
                        self.parent.view.swap(self.selected, cb=self.on_verify_move)
                        break

            logging.debug("selected: %r" % self.selected)
            self.clicked = True
            return True

        return False

    def on_use_asset(self, asset):

        if asset == 0: # shield
            self.parent.view.set_shield(self.player, -15)
            self.on_player_start()
            self.parent.efx['shield'].play()
            logging.debug("launched shield")
            return

        elif asset == 1: # cow
            damage = 15 + randint(0, 15)
            s = self.current_player.src
            s[1] += 20
            e = self.current_player.dst
            e[1] += randint(-10, 10)
            ent = Sprite(self.effects['cow'], position=s)
            action = MoveTo(e, 2.0) | RotateBy(360, 1) * 2
            self.parent.efx['cow'].play()
            logging.debug("launched cow")

        elif asset == 2: # meteor
            damage = 10 + randint(0, 15)
            e = self.current_player.dst
            e[1] += randint(-10, 10)
            if self.player == 0:
                s = (0, HEIGHT)
                ent = Sprite(self.effects['meteorite_right'], position=s)
            else:
                s = (WIDTH, HEIGHT)
                ent = Sprite(self.effects['meteorite_left'], position=s)
            action = MoveTo(e, 2.0)
            self.parent.efx['meteorite'].play()
            logging.debug("launched meteorite")

        elif asset == 3: # rocket
            damage = 10 + randint(0, 5)
            s = self.current_player.src
            e = self.current_player.dst
            e[1] += randint(-10, 10)
            if self.player == 0:
                ent = Sprite(self.effects['rocket_right'], position=s)
            else:
                ent = Sprite(self.effects['rocket_left'], position=s)
            action = MoveTo(e, 1.0)
            self.parent.efx['rocket'].play()
            logging.debug("launched rocket")

        elif asset == 4: # laser
            damage = 5 + randint(0, 5)
            s = self.current_player.src
            e = self.current_player.dst
            e[1] += randint(-10, 10)
            ent = Line(s, e, (255, 0, 0, 255), 2)
            action = Delay(0.5)
            self.parent.efx['laser'].play()
            logging.debug("launched laser")
        else:
            # shouldn't happen!
            self.on_player_start()
            return

        self.parent.view.add(ent, z=1)
        action += CallFunc(lambda: self.parent.view.set_shield(self.enemy_who, damage)) + \
                  CallFunc(self.on_explosion) + \
                  FadeOut(0.2) + \
                  Delay(1.0)

        # will die?
        if self.enemy_player.shield - damage > 0:
            action += CallFunc(self.on_player_start)
        else:
            action += CallFunc(self.on_end_of_game)

        action += CallFunc(ent.kill)
        ent.do(action)

    def on_explosion(self):

        p = self.current_player.dst
        sprite = Sprite(self.effects['explosion'], position=p)
        self.parent.view.add(sprite, z=2)
        action = Delay(1.0) + FadeOut(2.0) | ScaleBy(1.2, 2.0) + CallFunc(sprite.kill)
        sprite.do(action)
        self.parent.efx['explosion'].play()

    def on_end_of_game(self):
        self.parent.view.shuffle(gravity=False, cb=self.on_game_over)

    def on_game_over(self):
        # nasty, but...
        self.parent.view.timeline.kill()
        if self.demo:
            if self.player == 0:
                self.parent.messages.say("Dr X Won!", delay=10.0, size=36, cb=director.pop)
            else:
                self.parent.messages.say("Dr Z Won!", delay=10.0, size=36, cb=director.pop)
        else:
            if self.player == 0:
                if config.music:
                    audio_player.queue(pyglet.resource.media("menu.ogg"))
                    audio_player.volume = config.volume
                    if audio_player.playing:
                        audio_player.next()
                    audio_player.play()
                text = "You Won!"
                self.parent.messages.say("Thanks for playing!", delay=20.0, size=24, move=True, cb=director.pop)
            else:
                text = "Game Over"
                self.parent.messages.say("You lose!", delay=10.0, size=32, move=True, cb=director.pop)

            label = Label(text,
                          position=(WIDTH//2, HEIGHT//2),
                          font_size=38,
                          font_name='Russo One',
                          anchor_x='center',
                          anchor_y='center',
                          color=(255, 204, 0, 255),
                          )
            self.add(label)

    def update(self, dt):
        self.elapsed += dt
        if self.elapsed > self.speed:
            self.elapsed = 0
            self.parent.view.set_timeline(self.time)
            self.time -= 1
            if self.time < 0:
                self.on_turn_timeout()

    def draw(self):
        for x, y in self.selected:
            sx, sy = self.parent.view.board_to_screen(x, y)
            self.selector.blit(sx, sy)

        for player in self.players:
            player.draw()

        self.clicked = False

    def on_enter(self):
        super(GameControl, self).on_enter()
        # TODO: in-game music
        if config.music and audio_player.playing:
            audio_player.pause()

class GameScene(Scene):

    efx = dict(
            laser=pyglet.resource.media("laser.wav", streaming=False),
            rocket=pyglet.resource.media("rocket.wav", streaming=False),
            meteorite=pyglet.resource.media("meteorite.wav", streaming=False),
            cow=pyglet.resource.media("cow.wav", streaming=False),
            shield=pyglet.resource.media("shield.wav", streaming=False),
            explosion=pyglet.resource.media("explosion.wav", streaming=False),

            endturn=pyglet.resource.media("endturn.wav", streaming=False),
            error=pyglet.resource.media("error.wav", streaming=False),
            score=pyglet.resource.media("score.wav", streaming=False),
        )

    def __init__(self, demo=False):
        super(GameScene, self).__init__()

        self.messages = GameMessageLayer()
        self.control = GameControl(demo=demo)
        self.view = GameLayer()

        self.add(GameBackgroundLayer(), z=0)
        self.add(self.view)
        self.add(self.messages)
        self.add(self.control)

        # FIXME: shouldn't be time based!
        self.view.new_board(lambda: self.messages.say("Ready?", size=38, delay=2.0, cb=self.control.on_player_start, move=True))

