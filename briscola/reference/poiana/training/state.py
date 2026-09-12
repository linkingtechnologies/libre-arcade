from dataclasses import dataclass
from typing import List

from briscola_rl.cards import Card, NULLCARD_VECTOR


def pad_card_vector(lst: list, max_len: int):
    if len(lst) < max_len:
        for _ in range(max_len - len(lst)):
            lst.append(NULLCARD_VECTOR)
    return lst


@dataclass()
class PublicState:
    my_points: int
    other_points: int
    hand: List[Card]
    other_hand_size: int  # TODO: to keep or not to keep?
    remaining_deck_cards: int
    table: List[Card]
    my_played: List[Card]
    other_played: List[Card]
    turn: int
    briscola: Card
    order: int

    def as_dict(self, played: bool = True) -> dict:
        return dict(
            my_points=self.my_points,
            other_points=self.other_points,
            hand_size=len(self.hand),
            other_hand_size=self.other_hand_size,
            remaining_deck_cards=self.remaining_deck_cards,
            hand=pad_card_vector([c.vector() for c in self.hand], 3),
            table=pad_card_vector([c.vector() for c in self.table], 2),
            turn=self.turn,
            briscola=self.briscola.vector(),
            order=self.order
        ) | (dict(
            my_played=pad_card_vector([c.vector() for c in self.my_played], 40),
            other_played=pad_card_vector([c.vector() for c in self.other_played], 40),
        ) if played else {})
