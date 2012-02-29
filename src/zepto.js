/* zepto.js
  Monkey patch for Zepto to add some methods ImageMapster needs
*/

/*global Zepto: true, jQuery: true */

if (window.Zepto) {
    jQuery = Zepto;

    (function ($) {
        var hasOwn = Object.prototype.hasOwnProperty;

        $.css=function( elem, name ) {

            return getComputedStyle(elem,name);
        };

        $.trim = function (str) {
            return str.replace(/^\s+/, '').replace(/\s+$/, '');
        };
        $.inArray = function (target, arr) {
            return arr.indexOf(target);
        };
        /*lint-ignore-start*/
        $.isEmptyObject=function(obj) {
            for ( var name in obj ) {
                        return false;
                    }
            return true;
        };
        $.isWindow = function(obj) {
                return obj && typeof obj === "object" && "setInterval" in obj;
       };

        $.isPlainObject= function( obj ) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if ( !obj || typeof obj !== "object" || obj.nodeType || $.isWindow( obj ) ) {
                return false;
            }

            try {
                // Not own constructor property must be Object
                if ( obj.constructor &&
                    !hasOwn.call(obj, "constructor") &&
                    !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                    return false;
                }
            } catch ( e ) {
                // IE8,9 Will throw exceptions on certain host objects #9897
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.

            var key;
            for ( key in obj ) {}

            return typeof key === 'undefined' || hasOwn.call( obj, key );
        }
        /*lint-ignore-end*/
        $.fn.clone = function () {
            var ret = $();
            this.each(function () {
                ret = ret.add(this.cloneNode(true));
            });
            return ret;
        };
        $.fn.stop=function() {
            return this;
        };
        $.fn.elOrEmpty = function () {
            return this.length ? this[0] : {};
        };
        $.each(["Height", "Width"], function( i, name ) {
            //var type = name.toLowerCase();
            // outerHeight and outerWidth
            //$.fn[ "outer" + name ] = function( margin ) {
           //     var elem = this[0],
           //        cl=margin?"margin":"border";
           //     return elem ?
           //         elem.style ?
           //         (parseFloat( $.css( elem, cl+'-top-'+type)+ ) :
           //         this[ type ]() :
           //         null;
           // };
           $.fn["outer"+name]=function() {
            return this[name.toLowerCase()]();
           };
        });
        $.fn.position = $.fn.position ||  function () {
            var el = this.elOrEmpty();
            return {
                left: this.left,
                top: this.top
            };
        };
        $.browser = {};
        $.browser.msie = false;
    } (jQuery));
}
