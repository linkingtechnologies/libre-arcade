using System;
using Godot;

namespace PoIAna.scenes.cards;

public partial class Card : AnimatedSprite2D
{
    [Signal]
    public delegate void CardClickedEventHandler(Card self);

    public CardData CardData;
    
    public override void _Ready()
    {
        base._Ready();
        var mouseDetector = GetNode<Area2D>("MouseDetector");
        mouseDetector.InputEvent += HandleInputEvent;
    }

    private void HandleInputEvent(Node node, InputEvent inputEvent, long idx)
    {
        if (inputEvent is InputEventMouseButton && inputEvent.IsReleased())
        {
            EmitSignal(SignalName.CardClicked, this);
        }
    }

    private int GetCardFrameIndex(Suit suit, Score score)
    {
        int suitIndex = suit switch
        {
            Suit.Swords => 3,
            Suit.Coins => 0,
            Suit.Cups => 2,
            Suit.Batons => 1,
            _ => throw new ArgumentOutOfRangeException(nameof(suit), suit, null)
        };
        const int maxSuitCards = 13;
        return suitIndex * maxSuitCards + ((int) score-1);
    }

    public void SetCard(CardData cardData)
    {
        Frame = GetCardFrameIndex(cardData.Suit, cardData.Score);
        CardData = cardData;
    }

    public void SetBack(CardData overrideCardInside)
    {
        CardData = overrideCardInside;
        SetBack();
    }
    
    public void SetBack()
    {
        Frame = GetBackFrameIndex();
    }

    private int GetBackFrameIndex()
    {
        const int maxCards = 55;
        return maxCards - 2;
    }
}

public enum Score
{
    Pad,
    Ace,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Knight,
    King,
}

public enum Suit
{
    Pad,
    Swords,
    Coins,
    Cups,
    Batons,
}