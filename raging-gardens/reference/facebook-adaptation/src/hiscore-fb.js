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
 
/**
 * Save hiscores 
 */
Hiscore = Backbone.Model.extend({
    defaults: {
        'version': 2,
    },
    // storage init
    initialize: function() {
    	// empty
    },
    open: function(fnCallback) {
    	// empty
    },
    // save score for given person directly to DB
    save: function(id, score, fnCallback) {
		FB.api('/' + id + '/scores', 'post', { 'score': score }, function(response) {
			if (response.error) {
                // score listing failed because of response.ErrorCode
                if (_Globals.conf.get('debug')) {
                    console.log("Save scores failed!");
                    console.log(response);
                }
                
                // flag that something went wrong
                if (fnCallback) {
                    fnCallback(null);
                }
			} else {
				// OK!
				fnCallback(true);
			}
		});           
    },
    // get sorted list of top scores 
    getAllScores: function(fnCallback) {
		FB.api(_Globals['conf'].getAppId() + '/scores?fields=user,score&limit=50', function(response) {
			if (response.error) {
                // score listing failed because of response.ErrorCode
                if (_Globals.conf.get('debug')) {
                    console.log("Load scores failed!");
                    console.log(response);
                }
                
                // flag that something went wrong
                if (fnCallback) {
                    fnCallback(null);
                }
			} else {
				// OK!
				
                var result = [];
                for(var i=0; i < response.data.length; i++) {
                    var score = response.data[i];
                    result.push({uid: score.user.id, name: score.user.name, score: score.score });
                }
                
                // flag that something went wrong
                if (fnCallback) {
                    fnCallback(result);  
                }
			}
			
		});        
    }
    
});


// Show Hiscore Dialog - View/Reset scores
Crafty.bind("ShowSaveHiscore", function(score) {
    $("#dialog-save-score").dialog({
        resizable: false,
        "width": 400,
        "height": 300,
        modal: false,
        "title": "Save Hiscore",
        zIndex: 20,
        buttons: {
            "Yes": function() {
            	var hiscore = new Hiscore();
                hiscore.save(_Globals['player'].id, score, function(success) {
                    if (success) {
                        Crafty.trigger('ShowHiscore', {text: undefined, refresh: true});
                    } else {
                        Crafty.trigger('ShowHiscore', {text: 'Failed saving your score! Sorry :(', refresh: true});
                    }
                }); 
                
                $(this).dialog("close");
            },
            "No": function() {
                $(this).dialog("close");
                Crafty.trigger('ShowHiscore', {text: undefined, refresh: true});
            }            
        },
    });
});

// Show Hiscore Dialog - View/Reset scores
Crafty.bind("ShowHiscore", function(params) {
    $("#dialog-score").dialog({
        resizable: false,
        width: 600,
        minHeight: 520,
        height: 520,
        modal: true,
        position: 'top',
        "title": "Top 50 Scores",
        open: function() {
            
             $("#dialog-score").css({'height': '520px'});
            
            if (!params.text) {
                $("#dialog-score").html('<p>Please wait while loading scores ...</p>');
                
                var hiscore = new Hiscore();
                
                // load scores
                var text = '<div>';
                text += '<span class="name u">';
                text += 'Player';
                text += '</span>';
                text += '<span class="score u">';
                text += 'Carrots';
                text += '</span>';
                text += '<span></span>';
                text += '</div>';       
                $("#dialog-score").html(text);
                
                hiscore.getAllScores(function(scores, server) {
                    var i = 0;
                    _.each(scores, function(obj) {
                        if (++i > 50)
                            return;
                        text = '<div class="border">';
                        text += '<span class="name">';
                        text += i + '. ';
                        text += obj.name;
                        text += '</span>';
                        text += '<span class="score">';
                        text += obj.score;
                        text += '</span>';
                        var tagid = 'pic_' + i;
                        text += '<span class="pic" id="' + tagid + '"></span>';
                        text += '</div>';
                        
                        $("#dialog-score").append(text);
                        
                        // load pic ...whenever
                		FB.api(obj.uid + '?fields=picture.type(small)', function(response) {
                			console.log('setting tag' + tagid);
                			console.log(response);
                			if (!response.error) {
                				// OK!
                				$('#' + tagid).html('<img src="' + response.picture.data.url + '" />');
                			}
                		});                        
                        
                    });
                    //$("#dialog-score").html(text);
                    //Crafty.trigger("ShowHiscore", {text: text, refresh: params.refresh});
                });
                return;
            } else {
                $("#dialog-score").html(params.text);
            }  
        },
        buttons: {
            "Refresh Scores": function() {
                $(this).dialog("close");
                Crafty.trigger('ShowHiscore', params);
            },
            "Let me out!": function() {
                if (params.refresh) {
                    // TODO: Cheap! :( Must replace with proper restart.
                	window.location.href = window.location.href;
                }                
                $(this).dialog("close");
            }
        },
        close: function(event, ui) {
//            if (params.refresh) {
//                // TODO: Cheap! :( Must replace with proper restart.
//                window.location.reload() 
//            }
        }
    });
});
