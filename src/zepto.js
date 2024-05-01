/*
  zepto.js
  Monkey patch for Zepto to add some methods ImageMapster needs
*/

(function ($) {
  'use strict';

  var origStop = $.fn.stop;
  if (!origStop) {
    $.fn.stop = function () {
      return this;
    };
  }

  $.each(['Height', 'Width'], function (_, name) {
    var funcName = 'outer' + name,
      origFunc = $.fn[funcName];
    if (!origFunc) {
      $.fn[funcName] = function () {
        return this[name.toLowerCase()]();
      };
    }
  });

  var origFnExtend = $.fn.extend;
  if (!origFnExtend) {
    $.fn.extend = function (obj) {
      $.extend($.fn, obj);
    };
  }

  var origAddSelf = $.fn.addSelf;
  if (!origAddSelf) {
    /*
      Including Zepto Stack module manually since it is small and avoids updating docs, rebuilding zepto dist, etc.
      This is needed to support autoresize functionality which needs to resize when the map and/or one (or more) of
      its parents is not visible. Ideally, we could use ResizeObserver/MutationObserver to detect when we hide/show 
      and resize on that event instead of resizing while we are not visible but until official support of older browsers 
      is dropped, we need to go this route.

      Source: https://github.com/madrobby/zepto/blob/main/src/stack.js
    */
    // Zepto.js
    // (c) 2010-2016 Thomas Fuchs
    // Zepto.js may be freely distributed under the MIT license.
    $.fn.end = function () {
      return this.prevObject || $();
    };

    $.fn.andSelf = function () {
      return this.add(this.prevObject || $());
    };

    'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'
      .split(',')
      .forEach(function (property) {
        var fn = $.fn[property];
        $.fn[property] = function () {
          var ret = fn.apply(this, arguments);
          ret.prevObject = this;
          return ret;
        };
      });
  }
})(jQuery);
