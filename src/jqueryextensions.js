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
      // eslint-disable-next-line no-unused-vars
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
        if (ns.includes('mapster') && ns.includes('noPreventDefault')) {
          this.addEventListener(type, listener, { passive: true });
        } else {
          return false;
        }
      };

      // special events for mapster.noPreventDefault
      $.event.special.touchstart = {
        setup: function (_, ns, listener) {
          return setupListener.call(this, ns, 'touchstart', listener);
        }
      };
      $.event.special.touchend = {
        setup: function (_, ns, listener) {
          return setupListener.call(this, ns, 'touchend', listener);
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

/*
  When autoresize is enabled, we obtain the width of the wrapper element and resize to that, however when we're hidden because of
  one of our ancenstors, jQuery width function returns 0. Ideally, we could use ResizeObserver/MutationObserver to detect
  when we hide/show and resize on that event instead of resizing while we are not visible but until official support of older
  browsers is dropped, we need to go this route.  The plugin below will provide the actual width even when we're not visible.

  Source: https://raw.githubusercontent.com/dreamerslab/jquery.actual/master/jquery.actual.js
*/
/*! Copyright 2012, Ben Lin (http://dreamerslab.com/)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 1.0.19
 *
 * Requires: jQuery >= 1.2.3
 */
/* eslint-disable one-var */
(function ($) {
  'use strict';

  $.fn.addBack = $.fn.addBack || $.fn.andSelf;

  $.fn.extend({
    actual: function (method, options) {
      // check if the jQuery method exist
      if (!this[method]) {
        throw (
          '$.actual => The jQuery method "' +
          method +
          '" you called does not exist'
        );
      }

      var defaults = {
        absolute: false,
        clone: false,
        includeMargin: false,
        display: 'block'
      };

      var configs = $.extend(defaults, options);

      var $target = this.eq(0);
      var fix, restore;

      if (configs.clone === true) {
        fix = function () {
          var style = 'position: absolute !important; top: -1000 !important; ';

          // this is useful with css3pie
          $target = $target.clone().attr('style', style).appendTo('body');
        };

        restore = function () {
          // remove DOM element after getting the width
          $target.remove();
        };
      } else {
        var tmp = [];
        var style = '';
        var $hidden;

        fix = function () {
          // get all hidden parents
          $hidden = $target.parents().addBack().filter(':hidden');
          style +=
            'visibility: hidden !important; display: ' +
            configs.display +
            ' !important; ';

          if (configs.absolute === true)
            style += 'position: absolute !important; ';

          // save the origin style props
          // set the hidden el css to be got the actual value later
          $hidden.each(function () {
            // Save original style. If no style was set, attr() returns undefined
            var $this = $(this);
            var thisStyle = $this.attr('style');

            tmp.push(thisStyle);
            // Retain as much of the original style as possible, if there is one
            $this.attr('style', thisStyle ? thisStyle + ';' + style : style);
          });
        };

        restore = function () {
          // restore origin style values
          $hidden.each(function (i) {
            var $this = $(this);
            var _tmp = tmp[i];

            if (_tmp === undefined) {
              $this.removeAttr('style');
            } else {
              $this.attr('style', _tmp);
            }
          });
        };
      }

      fix();
      // get the actual value with user specific methed
      // it can be 'width', 'height', 'outerWidth', 'innerWidth'... etc
      // configs.includeMargin only works for 'outerWidth' and 'outerHeight'
      var actual = /(outer)/.test(method)
        ? $target[method](configs.includeMargin)
        : $target[method]();

      restore();
      // IMPORTANT, this plugin only return the value of the first element
      return actual;
    }
  });
})(jQuery);
/* eslint-enable one-var */
