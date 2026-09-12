using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Godot;
using Microsoft.ML.OnnxRuntime;

namespace PoIAna.scenes.ai;

public class OnnxOpponentStrategy : OpponentStrategy
{
    private int Idx(OnnxState state)
    {
        using var session = new InferenceSession(FileAccess.GetFileAsBytes("res://models/"+ModelFilename));

        // create input tensor (nlp example)
        // using var inputOrtValue = OrtValue.CreateTensorWithEmptyStrings(OrtAllocator.DefaultInstance, new long[] { 1, 1 });
        long[] inputShape = { 1, 519 };
        using var inputOrtValue = OrtValue.CreateTensorValueFromMemory(state.FlatOneHot(), inputShape);

        // Create input data for session. Request all outputs in this case.
        var inputs = new Dictionary<string, OrtValue>
        {
            { "input", inputOrtValue }
        };

        using var runOptions = new RunOptions();

        // We are getting a sequence of maps as output. We are interested in the first element (map) of the sequence.
        // That result is a Sequence of Maps, and we only need the first map from there.
        using var outputs = session.Run(runOptions, inputs, session.OutputNames);
        Debug.Assert(outputs.Count > 0, "Expecting some output");

        // We want the last output, which is the sequence of maps
        var lastOutput = outputs[^1];
        
        var span = lastOutput.GetTensorDataAsSpan<long>();
        var choice = span.ToArray()[0];
        return (int)choice;
    }
    
    public override int ChooseCard(OnnxState state)
    {
        var idx = Idx(state);
        return idx;
    }

    public OnnxOpponentStrategy(string modelFilename) : base(modelFilename)
    {
    }
}