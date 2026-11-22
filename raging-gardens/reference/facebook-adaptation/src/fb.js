define(['src/config.js'], function() {
	var cfg = new Config({});
    return {
        load : function(name, req, onLoad, config) {
            
            window.fbAsyncInit = function() {
                // init the FB JS SDK
                FB.init({
                  appId      : cfg.getAppId(),
                  channelUrl : cfg.getHostname() + '/channel.php',
                  status     : true, // check the login status upon init?
                  cookie     : true, // set sessions cookies to allow your server to access the session?
                  xfbml      : false  // parse XFBML tags on this page?
                });
                
                onLoad(FB);
            };
            
            (function(d, debug){
                var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement('script'); js.id = id; js.async = true;
                js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
                ref.parentNode.insertBefore(js, ref);
            }(document, /*debug*/ false));           
        
        }
    };
});