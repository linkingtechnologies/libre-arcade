values_points = {1: 11, 2: 0, 3: 10, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 2, 12: 3, 13: 4}


def select_winner(table: list, briscola) -> int:
    first, second = table
    first_points = values_points[first.value]
    second_points = values_points[second.value]
    first_points = first.value if values_points[first.value] == values_points[second.value] == 0 else first_points
    second_points = second.value if values_points[first.value] == values_points[second.value] == 0 else second_points
    first_briscola = first.suit == briscola.suit
    second_briscola = second.suit == briscola.suit
    if first_briscola:
        first_points += 100
    if second_briscola:
        second_points += 100
    if not first_briscola and not second_briscola and second.suit != first.suit:
        second_points -= 100
    return second_points > first_points
