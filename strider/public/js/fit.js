// Local addition (not upstream): the stage is a fixed 400x640, which upstream
// clipped in browser windows shorter than that. Scale it down to fit instead
// (CSS transform, see --fit in css/main.css).
//
// Crafty 0.6.3 turns mouse positions into stage positions from a stage offset
// it measured once at startup and knows nothing about a CSS transform, so its
// translate() is replaced by one that measures the stage now and divides by
// the same factor. Nothing in lib/crafty.js itself is edited.
(function (Crafty) {
    var STAGE_HEIGHT = 642; // 640 plus the 1px border on each side
    var fitFactor = 1;

    function fit() {
        fitFactor = Math.min(1, window.innerHeight / STAGE_HEIGHT);
        document.documentElement.style.setProperty('--fit', String(fitFactor));
    }
    window.addEventListener('resize', fit, false);
    fit();

    Crafty.domHelper.translate = function (clientX, clientY) {
        var rect = Crafty.stage.elem.getBoundingClientRect();
        var view = Crafty.viewport;
        var zoom = view._scale * fitFactor;
        return {
            x: (clientX - rect.left - fitFactor) / zoom - view._x,
            y: (clientY - rect.top - fitFactor) / zoom - view._y
        };
    };
}(Crafty));
