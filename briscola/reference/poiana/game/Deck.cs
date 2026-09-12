using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using PoIAna.scenes.autoload;

namespace PoIAna.scenes.cards;

public partial class Deck : Node2D
{
    private IDeck _deck;
    private Label _remainingCards;
    private Card _briscolaSprite;
    private Card _deckBackSprite;
    
    public override void _Ready()
    {
        base._Ready();
        _deck = new DeckBriscola();
        _deckBackSprite = GetNode<Card>("Back");
        _deckBackSprite.SetBack();
        var briscola = _deck.PeekLast();
        _briscolaSprite = GetNode<Card>("Briscola");
        _briscolaSprite.SetCard(briscola);
        GetNode<GameGlobals>("/root/GameGlobals").Briscola = briscola;
        _remainingCards = GetNode<Label>("RemainingCards");
        
        UpdateRemainingCardsInterface();
    }

    private void UpdateRemainingCardsInterface()
    {
        _remainingCards.Text = _deck.Count().ToString();
        if (_deck.Count() == 1)
        {
            _deckBackSprite.Hide();
        }
        else if (_deck.Count() == 0)
        {
            _briscolaSprite.Hide();
            _remainingCards.Hide();
        }
    }
    
    public new Card Draw(bool hide) 
    {
        CardData drawn = _deck.TryDraw(); 
        if (drawn == null) 
            return null;
        
        var animableCard = (Card)GD.Load<PackedScene>("res://scenes/cards/Card.tscn").Instantiate(); 
        if (hide)
            animableCard.SetBack(drawn);
        else 
            animableCard.SetCard(drawn); 
        AddChild(animableCard);
        animableCard.Position = _deckBackSprite.Position;
        animableCard.Rotation = _deckBackSprite.Rotation;
        
        UpdateRemainingCardsInterface(); 
        return animableCard; 
    }

    public int RemainingCards()
    {
        return _deck.Count();
    }
}

internal interface IDeck
{
    CardData TryDraw();
    CardData PeekLast();
    int Count();
}

public record CardData(Suit Suit, Score Score);

internal class DeckBriscola : IDeck
{
    private readonly List<CardData> _cards = new();

    public DeckBriscola()
    {
        foreach (Suit suit in Enum.GetValues(typeof(Suit)))
        {
            if (suit == Suit.Pad)
            {
                continue;
            }
            foreach (Score score in Enum.GetValues(typeof(Score)))
            {
                if (score == Score.Pad)
                {
                    continue;
                }
                if (score != Score.Eight && score != Score.Nine && score != Score.Ten)
                {
                    _cards.Add(new CardData(suit, score));
                }
            }
        }
        _cards.Shuffle();
    }

    public CardData TryDraw()
    {
        if (_cards.Count <= 0) return null;
        
        CardData card = _cards[0];
        _cards.RemoveAt(0);
        return card;
    }

    public CardData PeekLast()
    {
        return _cards.Last();
    }

    public int Count()
    {
        return _cards.Count;
    }
}

static class ListExtensions
{
    public static void Shuffle<T>(this IList<T> list)
    {
        Random rng = new Random();
        int n = list.Count;
        while (n > 1) {
            n--;
            int k = rng.Next(n + 1);
            (list[k], list[n]) = (list[n], list[k]);
        }
    }
}