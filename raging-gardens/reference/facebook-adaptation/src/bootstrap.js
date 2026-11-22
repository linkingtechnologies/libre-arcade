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
'use strict';
$(document).ready(function() {
    require(["src/fb!", "src/config.js"], function(FB) {
        
        /**
         * Global Registry
         */
        _Globals['conf'] = new Config({});
        
        /**
         * Load FB API
         */
    	FB.getLoginStatus(function(response) {
    		  if (response.status === 'connected') {
				FB.api('/me', function(response) {
					var player = {
							id: response.id,
							name: response.name,
							score: 0, // default
					};
					_Globals['player'] = player;
					
					// get score for this player
					FB.api('/' + response.id + '/scores', function(response) {
						for(var i = 0; i < response.data.length; i++) {
							var item = response.data[i];
							if (item.application.id === _Globals['conf'].getAppId()) {
								player.score = item.score;
								break;
							} 
						}
						// save with fetched score
						_Globals['player'] = player;
					});
				});    	
    		  } else { // if (response.status === 'not_authorized') { 
    		    // not_authorized or not_logged_in
			    FB.login(function(response) {
			        if (response.authResponse) {
	                    // TODO: Cheap! :( Must replace with proper restart.
			        	window.location.href = window.location.href;
			        } else {
			            // TODO: cancelled
			        	window.history.back();
			        }
			    },
			    { scope:'publish_actions' });
    		  }
    	});    	
    	
        $("#stats").hide();

        /**
         * Init Crafty Engine
         */
        Crafty.init(_Globals.conf.get('screen-width'), _Globals.conf.get('screen-height'), 60)
            .canvas.init();
        Crafty.background('transparent');

        /**
         * Load assets
         */
        Crafty.scene("loading", function() {
            Crafty.load([
                "art/stuz_tiles.png", 
                "art/stuz_rabbit.png",
                "art/stuz_enemy.png",
                "art/stuz_fart_moving.png",
                "art/stuz_carrots.png",
                "art/stuz_forkit.png",
                "art/stuz_splash.png",
                // sfx
                "sfx/fart1.ogg",
                "sfx/fart2.ogg",
                "sfx/pull.ogg",
                "sfx/scream1.ogg",
                "sfx/scream2.ogg",
                "sfx/aaaah.ogg",
                "sfx/laughter01.ogg",
                "sfx/laughter02.ogg",
                "sfx/burp.ogg",
                "sfx/trouble_in_the_garden_lowq.ogg",
                ], 
            function() {
        	    
                // --- Graphics
        	    Crafty.sprite(64, "art/stuz_tiles.png", {
    			    grass: [0,0],
    			    stone_small: [1,0],
    			    stone_big: [2,0],
                    heysack: [3,0],
    			    tree: [0,1],
                    bush: [1,1],
                    barrel: [2,1],
    		    });
                Crafty.sprite("art/stuz_rabbit.png", {
    			    player: [0, 0, 32, 48],
    		    });
                Crafty.sprite("art/stuz_enemy.png", {
        		    enemy: [0, 0, 32, 48],
    		    });                
                Crafty.sprite(64, "art/stuz_fart_moving.png", {
        		    explosion1: [0, 0],
    		    });   
                Crafty.sprite("art/stuz_carrots.png", {
                    carrot: [0, 0, 32, 32],
    		    });
                Crafty.sprite(48, "art/stuz_forkit.png", {
                    fork: [0, 0],
        	    });
                Crafty.sprite("art/stuz_splash.png", {
                    splash: [0, 0],
                });                
                // --- Audio
                Crafty.audio.add({
                    fart1: ["sfx/fart1.ogg"],
                    fart2: ["sfx/fart2.ogg"],
                    pull: ["sfx/pull.ogg"],
                    scream1: ["sfx/scream1.ogg"],
                    scream2: ["sfx/scream2.ogg"],
                    aaaah: ["sfx/aaaah.ogg"],
                    laughter1: ["sfx/laughter01.ogg"],
                    laughter2: ["sfx/laughter02.ogg"],
                    burp: ["sfx/burp.ogg"],
                    music: ["sfx/trouble_in_the_garden_lowq.ogg"],
                });                
                
    		    Crafty.scene(_Globals['scene']);
                
                // disable loading
                $('#loading').hide();
            },
            // On Progress
            function(e) {
                $('#loading').html('Loaded: ' + e.percent.toFixed(0) + '%');
//                if (_Globals.conf.get('debug'))
//                    console.log(e);
            },
            // On Error
            function(e) {
                $('#loading').html('Could not load: ' + e.src);
                
                if (_Globals.conf.get('debug'))
                    console.log(e);       
            });

            if (_Globals.conf.get('debug'))
                console.log("Loading ...");
            
            $('#loading').show();
        });
        
        /**
         * Load required scenes and game data
         */           
    	require([
            "src/tilemap.js",
            "src/player.js",
            "src/enemy.js",
            "src/scene.splash.js",
            "src/scene.game.js",
            "src/gfx.js",
        ], function() {            
            
            Crafty.scene("loading");
            
        });    
        
	});
});