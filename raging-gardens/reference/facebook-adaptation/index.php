<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta http-equiv="cache-control" content="no-cache">
    <meta name="description" content="Raging Gardens is an HTML5 game made by Dvubuz Games.">
    <meta name="keywords" content="raging gardens, rabbits game, html5, javascript, indie, browser based, 2D game">    
    <title>Raging Gardens</title>
    <script type="text/javascript" src="lib/modernizr.custom.47915.js"></script>
    <link rel="shortcut icon" href="favicon.ico" />
    <link type="text/css" href="css/style.css" rel="stylesheet" /> 
    <link type="text/css" href="css/le-frog/jquery-ui-1.9.2.custom.css" rel="stylesheet">
</head>
<body>
    <div id="fb-root"></div>
<!--[if lt IE 8]><p class=chromeframe>Your browser is <em>ancient!</em> <a href="http://browsehappy.com/">Upgrade to a different browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">install Google Chrome Frame</a> to experience this site.</p><![endif]-->
    <!-- libraries -->
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
    <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/jquery-ui.min.js"></script>
    <script type="text/javascript" src="lib/crafty-0.5.3.js"></script>
    <script type="text/javascript" src="lib/underscore-min.js"></script>
    <script type="text/javascript" src="lib/backbone-min.js"></script>
    <script type="text/javascript" src="lib/graph.js"></script>
    <script type="text/javascript" src="lib/astar.js"></script>
    <script type="text/javascript" src="lib/require.js"></script>
    <!-- game -->
    <?php $timevar = time(); ?>
    <script type="text/javascript" src="src/bootstrap.js?v=<?php echo $timevar; ?>"></script>
    <script type="text/javascript" src="src/hiscore-fb.js?v=<?php echo $timevar; ?>"></script>
    <script type="text/javascript">
    require.config({
        urlArgs: "bust=v<?php echo $timevar; ?>"
    });    
    _Globals = {
        env : 'dev',
        version : '1.0.8',
        scene : 'splash'
        };
    </script> 

    <div id="dialog-save-score" style="display: none;">Publish your score in the hiscores chart?</div>
    <div id="dialog-score" style="display: none;"></div>
    <div id="dialog-howto" style="display: none;">
    <h1>Story</h1>
    <p>
    It's a lovely day at farmers field. A great time for a hungry (ninja) rabbit to sneak in and <span class="keys">pull</span> 
    some carrots to eat. Too bad you weren't the only one with that idea. A horde of hungry opponents approaches fast! 
    Pull as many carrots as you can in <span class="keys">3 minutes</span>. To fight your opponents, you must use ancient rabbitjutsu tactics. 
    These are slightly unorthodox. Simply uhm ... fart to <span class="keys">push</span> your opponents away or use a 
    <span class="keys">Carrot-on-a-Fork</span> totem decoy to deceive them. The totem is spawned on your current position.
    </p>
    <h1>Goals &amp; Controls</h1>
    <p>Collect as many carrots as possible in 3 minutes. Use the controls to move and repel opponents.</p>
    <ul>
        <li><span class="keys">Arrow keys</span> - Move your ninja rabbit on the map.</li>
        <li><span class="keys">Z (or Y)</span> - Hold down to pull a carrot from the ground. You need to be close to a carrot.</li>
        <li><span class="keys">Q</span> - Eat <span class="keys">1 carrot</span> and fart to push opponents away from you.</li>
        <li><span class="keys">W</span> - Eat <span class="keys">2 carrots</span> and spawn a "Carrot-on-a-Fork" totem that attracts 
        opponents and gives you time to pull more carrots elsewhere on the map.</li>
    </ul>
    </div>
    <div id="dialog-restart" style="display: none;">Would you like to restart the game?</div>
    
    <div id="fps" style="display: none;"></div>

    <div id="wrapper">
        <div id="left-frame" style="display: none;"></div>
        <div id="right-frame" style="display: none;"></div>           
        <div id="bottom-frame" style="display: none;"></div>

        <div id="cr-stage">
            <div id="msgs" class="text center"></div>
            <div id="loading" class="text left" style="display: none;"></div>
            <div id="stats" style="display: none;">
                <div id="timer" class="text timer"></div>
                <div id="carrots" class="text carrots"></div>
            </div>
            <div id="in-menu" style="display: none;">
                <div id="toggle-music"></div>
                <div id="toggle-sfx"></div>
            </div>
            <div id="menu" style="display: none;">
                <div id="menu-start" class="button" style="left: 76px">Play Game</div>
                <div id="menu-howto" class="button" style="left: 258px">How to Play</div>
                <div id="menu-hiscore" class="button" style="left: 438px">Hiscores</div>
            </div>
        </div>
    </div>
    
    <div id="logo">
        <div id="version" style="display: none;"></div>
    </div>
    
	<script type="text/javascript">
	if (_Globals['env'] === 'prod') {
	  var _gaq = _gaq || [];
	  _gaq.push(['_setAccount', 'UA-879456-6']);
	  _gaq.push(['_trackPageview']);
	
	  (function() {
	    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	  })();
	}
	</script>    
</body>
</html>
