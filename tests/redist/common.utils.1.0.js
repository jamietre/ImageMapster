/* common.utils.js: a core framework library of utilities and polyfills.
   
   This adds utility functions into a namespace u.

   Standard polyfills are automatically added to their prototypes. The following nonstandard prototype
   changes are made:
        
        String.format
        String.split with trim option
        Array.contains
        Array.first

   You can remove the call to u.polyfill to prevent the nonstandard changes.

   Version 1.0
   James Treworgy
*/

/*global define, require, module */
/*jslint curly: false */
(function (define) {
    define(function () {
        var u,nativeSplit=String.prototype.split;

        /* General puropose functions */

        function isBool(obj) {
            return typeof obj === 'boolean';
        }
        function isString(obj) {
            return typeof obj === 'string';
        }
        function isUndefined(obj) {
            return typeof obj === 'undefined';
        }
        function isArray(obj) {
            return obj && obj.constructor === Array;
        }

        /* prototype extension functions - these must be called with a context */

        // trim a string leading & trailing whitespace
        function stringTrim() {
            return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }

        // generic iterator. when trim is true, string values are trimmed.
        function forEach(cb, trim) {
            var coll = this,
                i, val;
            if (isString(coll)) {
                coll = coll.split(',');
            }
            if (isArray(coll)) {
                for (i = 0; i < coll.length; i++) {
                    val = isString(coll[i]) ?
                        stringTrim.call(coll[i]) :
                        coll[i];

                    if (cb.call(val, i, val) === false) {
                        break;
                    }
                }
            } else {
                for (i in coll) {
                    if (coll.hasOwnProperty(i)) {
                        if (cb.call(coll[i], i, coll[i]) === false) {
                            break;
                        }
                    }
                }
            }
        }
        // string format function
        function format() {
            var args = (arguments.length === 1 && $.isArray(arguments[0])) ?
                arguments[0] :
                arguments;
            return this.replace(/\{(\d+)\}/g, function (match, number) {
                var num = parseInt(number,10);
                return !isUndefined(args[num])
                    ? String(args[num])
                    : match;
            });
        }
        
        // a split function that trims its results. any 'true' bool parameter will be interpreted as a flag to trim
        function stringSplit(delimiter, trimResults) {
            var result = [],
                delim = isString(delimiter) ?
                    delimiter : ',',
                trim = isBool(delimiter) ?
                    delimiter :
                    isBool(trimResults) ?
                        trimResults : false;

            forEach.call(nativeSplit.call(this,delim || ','), function (i, e) {
                result.push(trim ? stringTrim(e) : e);
            });
            return result;
        }

        // polyfills

        function arrayForEach(action, that) {
            for (var i = 0, n = this.length; i < n; i++)
                if (i in this)
                    action.call(that, this[i], i, this);
        }

        function arrayIndexOf(find, i /*opt*/) {
            if (i === undefined) i = 0;
            if (i < 0) i += this.length;
            if (i < 0) i = 0;
            for (var n = this.length; i < n; i++)
                if (i in this && this[i] === find)
                    return i;
            return -1;
        }

        // returns true if the element exists
        function arrayContains(val) {
            return arrayIndexOf.call(this, val) >= 0;
        }

        // NONSTANDARD 

        // return the first element where filter returns true
        function arrayFirst(filter) {
            var i,undef;
            
            if (!filter) {
                return this.length>0 ? this[0] : undef;
            }

            for (i = 0; i < this.length; i++) {
                if (filter.call(this[i], i, this[i])) {
                    return this[i];
                }
            }
            return undef;
        }

        function arrayLastIndexOf(find, i /*opt*/) {
            if (i === undefined) i = this.length - 1;
            if (i < 0) i += this.length;
            if (i > this.length - 1) i = this.length - 1;
            for (i++; i-- > 0; ) /* i++ because from-argument is sadly inclusive */
                if (i in this && this[i] === find)
                    return i;
            return -1;
        }

        function arrayMap(mapper, that /*opt*/) {
            var n, i, other = new Array(this.length);
            for (i = 0, n = this.length; i < n; i++)
                if (i in this)
                    other[i] = mapper.call(that, this[i], i, this);
            return other;
        }

        function arrayFilter(filter, that /*opt*/) {
            var i, n, other = [], v;
            for (i = 0, n = this.length; i < n; i++)
                if (i in this && filter.call(that, v = this[i], i, this))
                    other.push(v);
            return other;
        }

        function arrayEvery(tester, that /*opt*/) {
            for (var i = 0, n = this.length; i < n; i++)
                if (i in this && !tester.call(that, this[i], i, this))
                    return false;
            return true;
        }

        function arraySome(tester, that /*opt*/) {
            for (var i = 0, n = this.length; i < n; i++)
                if (i in this && tester.call(that, this[i], i, this))
                    return true;
            return false;
        }

        u = {
            // when onlyInSource is true, properties will not be added - only updated
            // passing a falsy value as the target results in a new object being created
            // and onlyInTarget is irrelevant
            extend: function (target) {
                var prop, source, sources, i,
                li = arguments.length,
                lastBool = u.isBool(arguments[li - 1]),
                len = lastBool ?
                    li - 2 : li - 1,
                emptyTarget = !target,
                onlyInTarget = lastBool ?
                        arguments[len + 1] : false;

                target = target || {};

                sources = u.toArray(arguments, 1, len + 1);

                for (i = 0; i < sources.length; i++) {
                    source = sources[i];
                    for (prop in source) {
                        if (source.hasOwnProperty(prop)
                        && (emptyTarget || !onlyInTarget || target.hasOwnProperty(prop))) {
                            target[prop] = source[prop];
                        }
                    }
                    // start honoring onlyInTarget after the first source
                    emptyTarget = false;
                }
                return target;
            },
            // copy selected properties to a new object
            filterProps: function (source, what) {
                var target = {},
                props = u.isArray(what) ?
                what :
                what.split(',');

                u.each(props, function (i, prop) {
                    target[prop] = source[prop];
                });
                return target;
            },
            toArray: function (arrLike, first, last) {
                return Array.prototype.slice.call(arrLike, first || 0, last || arrLike.length);
            },
            isArray: isArray,
            arrayIndexOf: function (arr, val) {
                return arrayIndexOf.call(arr, val);
            },
            inArray: function (arr, val) {
                return arrayContains.call(arr, val);
            },
            isFunction: function (obj) {
                return typeof obj === 'function';
            },
            isUndefined: isUndefined,
            isString: isString,
            isBool: isBool,
            isValueType: function (obj) {
                return u.inArray(['boolean', 'number', 'string'], typeof (obj));
            },
            trim: function (str) {
                return stringTrim.call(str);
            },
            //split with trim (why would you want it any other way?)
            split: function (str, delim) {
                return stringSplit.call(str, delim);
            },
            // replaces {0}.. {n} with the ordinal valued parameter. You can also pass an 
            // array instead of multiple parameters
            format: function () {
                return format.apply(arguments[0], u.toArray(arguments, 1));
            },
            // usual each, if you happen to pass a string, it will split it on commas.
            // it will always trim string values in an array.
            each: function (coll, cb) {
                return forEach.call(coll, cb);
            },
            donothing: function () { },
            // add nonstandard polyfills
            polyfill: function () {

                Array.prototype.contains = arrayContains;
                Array.prototype.first = arrayFirst;

                String.prototype.format = format;

                // always replace split, ours is better
                if (String.prototype.split !== stringSplit) {
                    String.prototype.split = stringSplit;
                }
            }

        };

        // add required polyfills

        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = arrayIndexOf;
        }
        if (!Array.prototype.trim) {
            Array.prototype.trim = stringTrim;
        }
        if (!Array.prototype.lastIndexOf) {
            Array.prototype.lastIndexOf = arrayLastIndexOf;
        }
        if (!Array.prototype.forEach) {
            Array.prototype.forEach = arrayForEach;
        }
        if (!Array.prototype.filter) {
            Array.prototype.filter = arrayFilter;
        }
        if (!Array.prototype.every) {
            Array.prototype.every = arrayEvery;
        }
        if (!Array.prototype.some) {
            Array.prototype.some = arraySome;
        }
        if (!Array.prototype.map) {
            Array.prototype.map = arrayMap;
        }
        u.polyfill();

        return u;
    });
} (typeof define === 'function'
    ? define
    : function (factory) {
        if (typeof module !== 'undefined') {
            module.exports = factory();
        } else {
            this.common = this.common || {};
            this.common.utils = factory();
        }
    }
// Boilerplate for AMD, Node, and browser global
));