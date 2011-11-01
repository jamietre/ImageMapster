/* zepto.js
  Monkey patch for Zepto to add some methods ImageMapster needs
*/

/*global Zepto: true, jQuery: true */

if (window.Zepto) {
    jQuery = Zepto;
    (function ($) {
        $.trim = function (str) {
            return str.replace(/^\s+/, '').replace(/\s+$/, '');
        };
        $.inArray = function (target, arr) {
            return arr.indexOf(target);
        };
        $.fn.clone = function () {
            var ret = $();
            this.each(function () {
                ret = ret.add(this.cloneNode(true));
            });
            return ret;
        };
        $.fn.elOrEmpty = function () {
            return this.length ? this[0] : {};
        };
        $.fn.outerWidth = function () {
            return this.elOrEmpty().outerWidth;
        };
        $.fn.outerHeight = function () {
            return this.elOrEmpty().outerHeight;
        };
        $.fn.position = function () {
            var e = this.elOrEmpty(); return {
                left: e.left,
                top: e.top
            };
        };
        $.browser = {};
        $.browser.msie = false;
    } (jQuery));
}
