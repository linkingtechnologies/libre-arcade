using System;
using Godot;
using System.Collections.Generic;
using System.Linq;
using PoIAna.scenes.autoload;
using PoIAna.scenes.ui;

public partial class SelectorMenu : TextureRect
{
    private List<ModelMeta> _modelMetas;
    private ModelMeta _selectedModel;
    
    private void ModulateStyleBox(Button button, string styleBoxName, Color color)
    {
        var normal = button.GetThemeStylebox(styleBoxName) as StyleBoxTexture;
        StyleBoxTexture copy = new StyleBoxTexture();
        AtlasTexture texture = new AtlasTexture();
        texture.Atlas = GD.Load<CompressedTexture2D>("res://assets/ui_sheet_red_minimal.png");
        texture.Region = ((AtlasTexture)normal!.Texture).Region;
        copy.Texture = texture;
        copy.TextureMarginBottom = normal.TextureMarginBottom;
        copy.TextureMarginTop = normal.TextureMarginTop;
        copy.TextureMarginLeft = normal.TextureMarginLeft;
        copy.TextureMarginRight = normal.TextureMarginRight;
        copy.RegionRect = normal.RegionRect;
        copy.ModulateColor = color;
        button.AddThemeStyleboxOverride(styleBoxName, copy);
    }
    
    public override void _Ready()
    {
        base._Ready();
        
        _modelMetas = new()
        {
            new ModelMeta("🤳🏻", "selfplay-best", 0.568933f),
            new ModelMeta("🌊", "amber-lake", 0.578433f),
            new ModelMeta("🍂", "autumn-night", 0.680767f),
            new ModelMeta("🦦", "mild-aardvark", 0.653067f),
            new ModelMeta("💫", "lively-cosmos", 0.633833f),
            new ModelMeta("🍃", "bumbling-leaf", 0.615367f),
            new ModelMeta("🪨", "easy-shape", 0.612867f),
            new ModelMeta("🌲", "toasty-pine", 0.680800f),
            new ModelMeta("🐦", "blooming-bird", 0.682033f),
            new ModelMeta("📄", "devout-paper", 0.656833f),
            new ModelMeta("🧨", "cosmic-firebrand", 0.450967f),
            new ModelMeta("🥗", "dark-salad", 0.572400f),
            new ModelMeta("🌃", "earnest-night", 0.588133f),
            new ModelMeta("🕳️", "graceful-darkness", 0.681433f),
            new ModelMeta("☄️", "hardy-galaxy", 0.482300f),
            new ModelMeta("🎣", "laced-pond", 0.676333f),
            new ModelMeta("🏔️", "rich-mountain", 0.588133f),
            new ModelMeta("😌", "skilled-serenity", 0.538800f),
            new ModelMeta("🐲", "smart-dragon", 0.532100f),
            new ModelMeta("🌨️", "snowy-shape", 0.650300f),
            new ModelMeta("❄️", "spring-snowflake", 0.575500f),
            new ModelMeta("🌟", "true-star", 0.680267f),
            new ModelMeta("🛶", "warm-river", 0.576833f),
        };
        foreach (var meta in _modelMetas)
        {
            meta.Description = Tr(meta.Name.ToUpper());
        }
        
        _modelMetas.Sort((meta1, meta2) => meta2.WinRate.CompareTo(meta1.WinRate));
        var container = GetNode<HFlowContainer>("%HFlowContainer");
        GetNode<Button>("%Play").ButtonUp += () =>
        {
            Play();
        };

        float min = _modelMetas.Select(meta => meta.WinRate).Min();
        float max = _modelMetas.Select(meta => meta.WinRate).Max();
        foreach (ModelMeta modelMeta in _modelMetas)
        {
            Button button = new Button();
            button.Text = modelMeta.DisplayName;
            button.AddThemeFontSizeOverride("font_size", 24);
            container.AddChild(button);

            var color = Colors.Green.Lerp(Colors.MediumPurple, (modelMeta.WinRate - min) / (max - min));
            ModulateStyleBox(button, "normal", color);
            ModulateStyleBox(button, "focus", color);
            ModulateStyleBox(button, "pressed", color);
            ModulateStyleBox(button, "hover", color);
            
            button.ButtonUp += () =>
            {
                GetNode<Label>("%DisplayName").Text = modelMeta.DisplayName;
                GetNode<Label>("%Description").Text = modelMeta.Description;
                GetNode<RichTextLabel>("%WinRate").Text = String.Format(Tr("WINRATE"), modelMeta.WinRate * 100);
                GetNode<Button>("%Play").Show();
                _selectedModel = modelMeta;
            };
        }
    }

    private void Play()
    {
        var gameScene = GD.Load<PackedScene>("res://scenes/screens/Table.tscn");
        GetNode<GameGlobals>("/root/GameGlobals").ModelMeta = _selectedModel;
        GetTree().ChangeSceneToPacked(gameScene);
    }
}
