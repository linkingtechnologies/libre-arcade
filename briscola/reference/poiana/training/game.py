import logging

from briscola_rl.players.base_player import BasePlayer
from gymnasium import spaces

from briscola_rl.players.epsgreedy_player import EpsGreedyPlayer
from briscola_rl.state import PublicState

from briscola_rl.game_rules import select_winner
from briscola_rl.cards import *
import gymnasium as gym

from briscola_rl.players.random_player import PseudoRandomPlayer
from briscola_rl.players.human_player import HumanPlayer
from players.interactive_player import InteractivePlayer
from players.rules_player import RulesPlayer


class BriscolaCustomEnemyPlayer(gym.Env):
    metadata = {'render_modes': []}

    def __init__(self,
                 other_player: BasePlayer,
                 played: bool = True,
                 sparse_reward: bool = False,
                 dense_reward: bool = True,
                 print_agent_actions: bool = False,
                 penalize_suboptimal_actions: bool = False):
        # Define the action space
        self.action_space = spaces.Discrete(3)  # drop i-th card
        # Define the observation space
        # Card space: (value, seed, points)
        card_space = spaces.MultiDiscrete([14, 5, 12])
        self.observation_space_nested = spaces.Dict({
            'my_points': spaces.Discrete(121),
            'other_points': spaces.Discrete(121),
            'hand_size': spaces.Discrete(4),
            'other_hand_size': spaces.Discrete(4),
            'remaining_deck_cards': spaces.Discrete(41),
            'hand': spaces.Tuple([card_space, card_space, card_space]),
            'table': spaces.Tuple([card_space, card_space]),
            'turn': spaces.Discrete(40),
            'briscola': card_space,
            'order': spaces.Discrete(2)
        } | ({
            'my_played': spaces.Tuple([card_space] * 40),
            'other_played': spaces.Tuple([card_space] * 40),
        } if played else {}))
        self.observation_space = spaces.flatten_space(self.observation_space_nested)
        self.played = played

        self.print_agent_actions = print_agent_actions
        self.sparse_reward = sparse_reward
        self.dense_reward = dense_reward
        self.penalize_suboptimal_actions = penalize_suboptimal_actions

        self.my_player: BasePlayer = HumanPlayer()
        self.other_player = other_player
        self.players = [self.my_player, self.other_player]
        self.reward_range = (-22  + (-36 if penalize_suboptimal_actions else 0) + (-60 if self.sparse_reward else 0), 22 + (60 if self.sparse_reward else 0))
        self.deck = None
        self.briscola: Card = None
        self.__logger = logging.getLogger('Briscola')
        self._turn_my_player = 0  # I start

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self._turn = 0
        self.my_player.reset_player()
        self.other_player.reset_player()
        self.deck = Deck(seed=self.np_random.random())
        self._my_played = []
        self._other_played = []
        self._table = []
        self._my_points = 0
        self._other_points = 0
        self._points = [0, 0]
        self._turn_my_player = self.np_random.integers(0, high=1, endpoint=True)
        self._log_turn_leader()
        self.players = [self.my_player, self.other_player]
        self.briscola: Card = self.deck.draw()
        self.__logger.info(f'Briscola is {self.briscola}')
        for _ in range(3):
            self.my_player.hand.append(self.deck.draw())
        for _ in range(3):
            self.other_player.hand.append(self.deck.draw())
        self._log_hands()
        self.deck.cards.append(self.briscola)
        if self._turn_my_player == 1:
            other_card = self.other_player.play_card(self.public_state())
            self._table.append(other_card)

        return self._get_obs(), self._get_info()

    def _log_hands(self):
        self.__logger.info(f'Player hand is: {self.my_player.hand}')
        self.__logger.info(f'Enemy hand is: {self.other_player.hand}')
        if self.print_agent_actions:
            print(f'Agent hand: {self.my_player.hand}')
            print(f'Your hand: {self.other_player.hand}')

    def _log_turn_leader(self):
        if self.print_agent_actions:
            print('\nThe opponent starts' if self._turn_my_player == 0 else '\nYou start')
        self.__logger.info(f'Starts {self.players[self._turn_my_player].name}')

    def _get_obs(self):
        return spaces.flatten(self.observation_space_nested, self.public_state().as_dict(played=self.played))

    def _get_info(self):
        return dict()

    def step(self, action):
        assert action in self.action_space
        self._turn += 1
        while action >= len(self.my_player.hand):
            action = action - 1
        my_card = self.my_player.hand.pop(action)
        self.__logger.info(f"Agent plays {my_card}")
        if self.print_agent_actions:
            print(f'Agent plays {my_card}')
        self._table.append(my_card)
        if self._turn_my_player == 0:
            other_card = self.other_player.play_card(self.public_state())
            self._table.append(other_card)
        self.__logger.info(f'Table: {self._table}')
        # i_winner: 0 -> Wins first player, 1 -> Wins second player
        i_winner = select_winner(self._table, self.briscola)
        reward = self._state_update_after_winner(i_winner)
        self._draw_phase()
        self._log_turn_leader()
        if self._turn_my_player == 1 and not len(self.other_player.hand) == 0:
            other_card = self.other_player.play_card(self.public_state())
            self._table.append(other_card)
        return self._get_obs(), reward, self.is_terminated(), False, self._get_info()

    def _state_update_after_winner(self, i_winner: int):
        """
        :param i_winner: 0 -> Wins first, 1 -> Wins second
        :return: The reward
        """
        i_winner = 0 if self._turn_my_player == i_winner else 1
        self.__logger.info(f'Turn Winner is {self.players[i_winner].name}')
        if self.print_agent_actions:
            print(f'Turn winner is {self.players[i_winner].name}')
        reward = gained_points = sum(values_points[c.value] for c in self._table)
        self._points[i_winner] += gained_points
        self._my_played.append(self._table[self._turn_my_player])
        self._other_played.append(self._table[1 - self._turn_my_player])
        gained_points_my_player = gained_points_other_player = gained_points
        if i_winner == 0:
            self._my_points += gained_points
            self._turn_my_player = 0
            gained_points_other_player = gained_points_other_player * -1
        else:
            self._other_points += gained_points
            self._turn_my_player = 1
            gained_points_my_player = gained_points_my_player * -1
            reward = reward * -1
        self.my_player.notify_turn_winner(gained_points_my_player)
        self.other_player.notify_turn_winner(gained_points_other_player)

        penalty = self.get_modular_penalty(reward)

        self._table = []
        self.__logger.info(f'Winner gained {gained_points} points')
        self.__logger.info(f'Current game points: {self._points}')
        if self.print_agent_actions:
            print(f'Current points: {self._points}')

        sparse_reward = self.get_sparse_reward()

        return (reward if self.dense_reward else 0) - penalty + sparse_reward

    def get_sparse_reward(self):
        if not self.sparse_reward:
            return 0

        sparse_reward = 0
        if self._points[0] > 60:
            sparse_reward = 60
        elif self._points[1] > 60:
            sparse_reward = -60
        return sparse_reward

    def get_penalty(self, reward):
        if not self.penalize_suboptimal_actions:
            return 0

        penalty = -1000
        if self._turn_my_player == 1:
            for card in self.my_player.hand:
                possible_table = [self._table[0], card]
                winner = select_winner(possible_table, self.briscola)
                coef_pts = 1 if winner else -1
                gain = coef_pts * sum(map(lambda c: c.points, possible_table))
                if gain > reward and gain > penalty and card.suit != self.briscola.suit:
                    penalty = gain
        if penalty == -1000:
            penalty = 0
        elif penalty < 0:
            penalty = abs(reward - penalty)
        return penalty

    def get_modular_penalty(self, reward):
        if not self.penalize_suboptimal_actions:
            return 0

        def unnecessary_charge_first_hand():
            # Penalty range [0, 11]
            played_card = self._table[0]
            if self._turn_my_player == 0 and played_card.points >= 10 and len(self.my_player.hand) > 0:
                min_points = min([c.points for c in self.my_player.hand])
                if played_card.points >= 10 and min_points < played_card.points:
                    return played_card.points - min_points
            return 0

        def missed_choke():
            # Penalty range [0, 11]
            if self._turn_my_player == 1:
                played_card = self._table[1]
                good_choke_cards = [c.points for c in self.my_player.hand if
                                    # No briscola
                                    c.suit != self.briscola.suit and
                                    # Same suits
                                    c.suit == self._table[0].suit and
                                    # More points
                                    c.points > played_card.points and
                                    # Choke
                                    c.points > self._table[0].points]
                choke_points = max(good_choke_cards) if len(good_choke_cards) > 0 else 0
                return choke_points
            return 0

        def unnecessary_charge_second_hand():
            # Penalty range [0, 11]
            played_card = self._table[1]
            if self._turn_my_player == 1 and played_card.points >= 10 and reward < 0 and len(self.my_player.hand) > 0:
                min_points = min([c.points for c in self.my_player.hand])
                if min_points < played_card.points:
                    return played_card.points - min_points
            return 0

        def unnecessary_briscola_second_hand_for_zero_points():
            # Penalty range [0, 5]
            played_card = self._table[1]
            if self._turn_my_player == 1 and played_card.suit == self.briscola.suit:
                if self._table[0].points == 0 and len([c for c in self.my_player.hand if c.points == 0 and c.suit != self.briscola.suit]) > 0:
                    return 5
            return 0

        def unnecessary_high_briscola_second_hand():
            # Penalty range [0, 11]
            played_card = self._table[1]
            briscola_points = [c.points for c in self.my_player.hand if c.suit == self.briscola.suit]
            if self._turn_my_player == 1 and played_card.suit == self.briscola.suit and len(briscola_points) > 0:
                if min(briscola_points) < played_card.points:
                    return played_card.points - min(briscola_points)
            return 0

        penalty = 0
        penalty += unnecessary_charge_first_hand()
        penalty += missed_choke()
        penalty += unnecessary_charge_second_hand()
        penalty += unnecessary_briscola_second_hand_for_zero_points()
        penalty += unnecessary_high_briscola_second_hand()

        return penalty

    def _draw_phase(self):
        if not self.deck.is_empty():
            c1 = self.deck.draw()
            c2 = self.deck.draw()
            if self._turn_my_player == 0:
                c_my_player = c1
                c_other_player = c2
            else:
                c_other_player = c1
                c_my_player = c2
            self.my_player.hand.append(c_my_player)
            self.other_player.hand.append(c_other_player)
            self._log_hands()

    def public_state(self):
        return PublicState(self._my_points, self._other_points, self.my_player.hand,
                           len(self.other_player.hand), len(self.deck.cards),
                           self._table, self._my_played, self._other_played,
                           self._turn, self.briscola, self._turn_my_player)

    def is_terminated(self):
        return any(p > 60 for p in self._points) or \
            (self.deck.is_empty() and all(len(p.hand) == 0 for p in self.players))

    def has_won(self) -> bool:
        return self._points[0] > 60

    def has_drawn(self) -> bool:
        return self._points[0] == 60 and self._points[1] == 60

    def has_lost(self) -> bool:
        return self._points[1] > 60

    def get_points(self):
        return self._points

    def render(self, mode="human"):
        pass


class BriscolaRandomPlayer(BriscolaCustomEnemyPlayer):

    def __init__(self, played: bool = True, sparse_reward: bool = False, dense_reward: bool = True, penalize_suboptimal_actions: bool = False):
        super(BriscolaRandomPlayer, self).__init__(PseudoRandomPlayer(),
                                                   played=played,
                                                   sparse_reward=sparse_reward,
                                                   dense_reward=dense_reward,
                                                   penalize_suboptimal_actions=penalize_suboptimal_actions)


class BriscolaEpsGreedyPlayer(BriscolaCustomEnemyPlayer):

    def __init__(self, eps: float = 0.2, played: bool = True, sparse_reward: bool = False, dense_reward: bool = True, penalize_suboptimal_actions: bool = False):
        super(BriscolaEpsGreedyPlayer, self).__init__(EpsGreedyPlayer(eps, 1),
                                                      played=played,
                                                      sparse_reward=sparse_reward,
                                                      dense_reward=dense_reward,
                                                      penalize_suboptimal_actions=penalize_suboptimal_actions)

class BriscolaInteractivePlayer(BriscolaCustomEnemyPlayer):

    def __init__(self):
        super().__init__(InteractivePlayer(), played=False, print_agent_actions=True)

class BriscolaRulesPlayer(BriscolaCustomEnemyPlayer):

    def __init__(self, played: bool = True, sparse_reward: bool = False, dense_reward: bool = True, penalize_suboptimal_actions: bool = False):
        super(BriscolaRulesPlayer, self).__init__(RulesPlayer(1),
                                                      played=played,
                                                      sparse_reward=sparse_reward,
                                                      dense_reward=dense_reward,
                                                      penalize_suboptimal_actions=penalize_suboptimal_actions)
