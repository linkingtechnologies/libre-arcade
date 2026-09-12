using System.Collections.Generic;
using System.Linq;
using PoIAna.scenes.autoload;

namespace PoIAna.scenes.cards;

public interface IWinStrategy
{
    Player Winner(List<KeyValuePair<Player, CardData>> playedCards, GameGlobals gameGlobals);
}

public interface IScoreStrategy
{
    int Score(CardData cardData);
}

public class BriscolaScore : IScoreStrategy
{
    public int Score(CardData cardData)
    {
        return cardData.Score switch
        {
            cards.Score.Ace => 11,
            cards.Score.Three => 10,
            cards.Score.Jack => 2,
            cards.Score.Knight => 3,
            cards.Score.King => 4,
            _ => 0
        };
    }
}

public class BriscolaWinStrategy : IWinStrategy
{
    private BriscolaScore _briscolaScore = new();
    
    public Player Winner(List<KeyValuePair<Player, CardData>> playedCards, GameGlobals gameGlobals)
    {
        var (firstPlayer, firstCard) = playedCards.First();
        var (secondPlayer, secondCard) = playedCards.Last();

        if (firstCard.Suit == gameGlobals.Briscola.Suit)
        {
            return secondCard.Suit == gameGlobals.Briscola.Suit ? WinnerSameSuit(playedCards) : firstPlayer;
        }

        if (secondCard.Suit == gameGlobals.Briscola.Suit)
        {
            return secondPlayer;
        }

        return firstCard.Suit != secondCard.Suit ? firstPlayer : WinnerSameSuit(playedCards);
    }

    private Player WinnerSameSuit(List<KeyValuePair<Player, CardData>> playedCards)
    {
        var (firstPlayer, firstCard) = playedCards.First();
        var (secondPlayer, secondCard) = playedCards.Last();

        if (_briscolaScore.Score(secondCard) + _briscolaScore.Score(firstCard) == 0)
        {
            return firstCard.Score > secondCard.Score ? firstPlayer : secondPlayer;
        }

        return _briscolaScore.Score(secondCard) > _briscolaScore.Score(firstCard) ? secondPlayer : firstPlayer;
    }
}
