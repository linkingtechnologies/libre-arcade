/*
 * The MIT License
 * 
 * Copyright (c) 2013 Dvubuz Games
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
Crafty.scene("splash", function() {
    
    //Crafty.background('transparent');
    
    var bg = Crafty.e("2D, " + _Globals.conf.get('renderType') + ", Image")
        .attr({x: 128, y: 34})
        .image("art/stuz_splash.png", "no-repeat");    

    $("#menu-start").click(function() {
        $("#version").hide();
        $("#menu").hide();
        Crafty.scene('main');
    });
    
    $("#version").text('v' + _Globals.version);
    $("#version").show();
    
    $("#menu-howto").click(function() {
        // show dialog
        $("#dialog-howto").dialog({
            resizable: false,
            "width": 720,
            "height": 420,
            modal: true,
            "title": "How to play",
            buttons: {
                "Sounds legit": function() {
                    $(this).dialog("close");
                }
            },
        });          
    });        
    
    $("#menu-hiscore").click(function() {
        Crafty.trigger('ShowHiscore', {text: undefined, refresh: false});
    });        
    
    $('#menu-credits').click(function() {
        // show dialog
        $("#dialog-credits").dialog({
            resizable: false,
            "width": 480,
            "height": 280,
            modal: true,
            "title": "Credits",
            buttons: {
                "Ok": function() {
                    $(this).dialog("close");
                }
            },
        });           
    });
    
    $("#menu").show();
    
    // start Tibetian chant
//    if (_Globals.conf.get('sfx')) {
//        Crafty.audio.play("lowchant", 1, _Globals.conf.get('sfx_vol'));
//    }
    
});