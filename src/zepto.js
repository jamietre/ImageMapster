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
})(jQuery);
