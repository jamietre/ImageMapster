/* 
  jqueryextensions.js
  Extend/intercept jquery behavior
*/

(function ($) {
  'use strict';

  function setupPassiveListeners() {
    // Test via a getter in the options object to see if the passive property is accessed
    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function () {
          supportsPassive = true;
          return true;
        }
      });
      window.addEventListener('testPassive.mapster', function () {}, opts);
      window.removeEventListener('testPassive.mapster', function () {}, opts);
    } catch (e) {
      // intentionally ignored
    }

    if (supportsPassive) {
      // In order to not interrupt scrolling on touch devices
      // we commit to not calling preventDefault from within listeners
      // There is a plan to handle this natively in jQuery 4.0 but for
      // now we are on our own.
      // TODO: Migrate to jQuery 4.0 approach if/when released
      // https://www.chromestatus.com/feature/5745543795965952
      // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
      // https://github.com/jquery/jquery/issues/2871#issuecomment-175175180
      // https://jsbin.com/bupesajoza/edit?html,js,output
      var setupListener = function (ns, type, listener) {
        if (ns.includes('noPreventDefault')) {
          window.addEventListener(type, listener, { passive: true });
        } else {
          console.warn('non-passive events - listener not added');
          return false;
        }
      };

      // special events for noPreventDefault
      $.event.special.touchstart = {
        setup: function (_, ns, listener) {
          return setupListener(ns, 'touchstart', listener);
        }
      };
      $.event.special.touchend = {
        setup: function (_, ns, listener) {
          return setupListener(ns, 'touchend', listener);
        }
      };
    }
  }

  function supportsSpecialEvents() {
    return $.event && $.event.special;
  }

  // Zepto does not support special events
  // TODO: Remove when Zepto support is removed
  if (supportsSpecialEvents()) {
    setupPassiveListeners();
  }
})(jQuery);
