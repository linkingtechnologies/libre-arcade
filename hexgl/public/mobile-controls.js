(function() {
  var exports = this;
  exports.bkcore = exports.bkcore || {};

  function isTouchLikeDevice() {
    return (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resetInput(shipControls, virtualTouch) {
    virtualTouch.stickVector.x = 0;
    virtualTouch.stickVector.y = 0;

    shipControls.key.forward = false;
    shipControls.key.backward = false;
    shipControls.key.left = false;
    shipControls.key.right = false;
    shipControls.key.ltrigger = false;
    shipControls.key.rtrigger = false;
    shipControls.key.use = false;
  }

  exports.bkcore.MobileControls = {
    bind: function(hexGL) {
      var root = document.getElementById('mobile-gesture-layer');

      if (!root || !hexGL || !hexGL.components || !hexGL.components.shipControls) {
        return;
      }

      if (!isTouchLikeDevice() && hexGL.controlType !== 1) {
        return;
      }

      var shipControls = hexGL.components.shipControls;

      /*
       * HexGL gebruikt intern al touchController.stickVector.x
       * voor analoog sturen. We maken hier dus een virtuele touchController.
       */
      var virtualTouch = {
        stickVector: {
          x: 0,
          y: 0
        }
      };

      /*
       * Als de oude TouchController al is aangemaakt, zet die uit.
       * De event listeners blijven bestaan, maar doen niets meer.
       */
      if (shipControls.touchController) {
        shipControls.touchController.active = false;
      }

      shipControls.touchController = virtualTouch;

      var active = false;
      var pointerId = null;
      var startX = 0;
      var startY = 0;
      var lastX = 0;
      var lastY = 0;

      function applyGesture(x, y) {
        var dx = x - startX;
        var dy = y - startY;

        var maxDrag = Math.max(80, Math.min(160, window.innerWidth * 0.18));
        var deadZone = 8;
        var brakeThreshold = 55;

        var steer = clamp(dx / maxDrag, -1, 1);

        if (Math.abs(dx) < deadZone) {
          steer = 0;
        }

        virtualTouch.stickVector.x = steer * 100;
        virtualTouch.stickVector.y = dy;

        /*
         * Basis:
         * vasthouden = gas
         */
        shipControls.key.forward = true;
        shipControls.key.backward = false;

        /*
         * Terugvegen / omlaag slepen = remmen/driften.
         *
         * Midden omlaag: beide airbrakes.
         * Links omlaag: linker airbrake.
         * Rechts omlaag: rechter airbrake.
         */
        if (dy > brakeThreshold) {
          shipControls.key.forward = false;

          if (steer < -0.2) {
            shipControls.key.ltrigger = true;
            shipControls.key.rtrigger = false;
          } else if (steer > 0.2) {
            shipControls.key.ltrigger = false;
            shipControls.key.rtrigger = true;
          } else {
            shipControls.key.ltrigger = true;
            shipControls.key.rtrigger = true;
          }
        } else {
          shipControls.key.ltrigger = false;
          shipControls.key.rtrigger = false;
        }
      }

      function startInput(id, x, y) {
        if (hexGL.active === false) {
          window.location.reload();
          return;
        }

        active = true;
        pointerId = id;
        startX = x;
        startY = y;
        lastX = x;
        lastY = y;

        root.classList.add('has-input');

        shipControls.key.forward = true;
        shipControls.key.ltrigger = false;
        shipControls.key.rtrigger = false;

        virtualTouch.stickVector.x = 0;
        virtualTouch.stickVector.y = 0;
      }

      function moveInput(id, x, y) {
        if (!active || id !== pointerId) {
          return;
        }

        lastX = x;
        lastY = y;

        applyGesture(lastX, lastY);
      }

      function endInput(id) {
        if (!active || id !== pointerId) {
          return;
        }

        active = false;
        pointerId = null;

        resetInput(shipControls, virtualTouch);
      }

      root.classList.add('is-visible');

      if (window.PointerEvent) {
        root.addEventListener('pointerdown', function(e) {
          e.preventDefault();

          try {
            root.setPointerCapture(e.pointerId);
          } catch (_) {}

          startInput(e.pointerId, e.clientX, e.clientY);
        }, false);

        root.addEventListener('pointermove', function(e) {
          e.preventDefault();
          moveInput(e.pointerId, e.clientX, e.clientY);
        }, false);

        root.addEventListener('pointerup', function(e) {
          e.preventDefault();
          endInput(e.pointerId);
        }, false);

        root.addEventListener('pointercancel', function(e) {
          e.preventDefault();
          endInput(e.pointerId);
        }, false);
      } else {
        root.addEventListener('touchstart', function(e) {
          var touch;

          e.preventDefault();

          if (!e.changedTouches || e.changedTouches.length < 1) {
            return;
          }

          touch = e.changedTouches[0];
          startInput(touch.identifier, touch.clientX, touch.clientY);
        }, false);

        root.addEventListener('touchmove', function(e) {
          var touch;

          e.preventDefault();

          if (!e.changedTouches || e.changedTouches.length < 1) {
            return;
          }

          touch = e.changedTouches[0];
          moveInput(touch.identifier, touch.clientX, touch.clientY);
        }, false);

        root.addEventListener('touchend', function(e) {
          var touch;

          e.preventDefault();

          if (!e.changedTouches || e.changedTouches.length < 1) {
            return;
          }

          touch = e.changedTouches[0];
          endInput(touch.identifier);
        }, false);

        root.addEventListener('touchcancel', function(e) {
          var touch;

          e.preventDefault();

          if (!e.changedTouches || e.changedTouches.length < 1) {
            return;
          }

          touch = e.changedTouches[0];
          endInput(touch.identifier);
        }, false);
      }

      root.addEventListener('contextmenu', function(e) {
        e.preventDefault();
      }, false);

      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          active = false;
          pointerId = null;
          resetInput(shipControls, virtualTouch);
        }
      }, false);

      window.addEventListener('blur', function() {
        active = false;
        pointerId = null;
        resetInput(shipControls, virtualTouch);
      }, false);
    }
  };
}).call(this);
