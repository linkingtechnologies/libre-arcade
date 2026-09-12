from dataclasses import dataclass
from briscola_rl.game_rules import values_points
from briscola_rl.suits import Suit
import random


@dataclass()
class Card:
    value: int
    suit: int

    def __post_init__(self):
        assert 0 <= self.value <= 13, self.value
        assert 0 <= self.suit <= 4, self.suit
        self.points = values_points[self.value]
        self.id = self.suit * 13 + self.value

    def vector(self) -> tuple:
        return self.value, self.suit, self.points

    def __repr__(self):
        return f'{self.name()} of {Suit.str_repr(self.suit)}'

    def name(self):
        if self.value == 11:
            return 'Jack'
        elif self.value == 12:
            return 'Knight'
        elif self.value == 13:
            return 'King'
        else:
            return self.value


NULLCARD_VECTOR = (0, 0, 0)


class Deck:
    __slots__ = ['cards']

    def __init__(self, seed=None):
        self.cards = self.all_cards()
        random.seed(seed)
        random.shuffle(self.cards)

    @classmethod
    def all_cards(cls):
        return [Card(i % 13 + 1, Suit.get_suit(i // 13)) for i in range(52) if i % 13 + 1 not in [8, 9, 10]]

    def draw(self):
        return self.cards.pop(0)

    def is_empty(self) -> bool:
        return len(self.cards) == 0

    def __len__(self):
        return len(self.cards)
