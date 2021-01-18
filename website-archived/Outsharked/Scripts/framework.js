/*global define, require, module */

String.prototype.format = function () {
    var args = (arguments.length === 1 && $.isArray(arguments[0])) ?
        arguments[0] : 
        arguments;
    return this.replace(/\{(\d+)\}/g, function (match, number) {
        return typeof args[number] !== 'undefined'
      ? String(args[number])
      : match
    ;
    });
};


(function (define) {
    define(function () {
        var u = {
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
            filter: function (source, what) {
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
            isArray: function (obj) {
                return obj && obj.constructor === Array;
            },
            arrayIndexOf: function (arr, val) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] === val) {
                        return i;
                    }
                }
                return -1;
            },
            inArray: function (arr, val) {
                return u.arrayIndexOf(arr, val) >= 0;
            },
            isFunction: function (obj) {
                return typeof obj === 'function';
            },
            isString: function (obj) {
                return typeof obj === 'string';
            },
            isBool: function (obj) {
                return typeof obj === 'boolean';
            },
            isValueType: function (obj) {
                return u.inArray(['boolean', 'number', 'string'], typeof (obj));

            },
            trim: function (str) {
                return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            },
            //split with trim (why would you want it any other way?)
            split: function (str, delim) {

                var result = [];
                u.each(str.split(delim || ','), function (i, e) {
                    result.push(u.trim(e));
                });
                return result;
            },
            // replaces {0}.. {n} with the ordinal valued parameter. You can also pass an 
            // array instead of multiple parameters
            format: function (text) {
                var args = (arguments.length === 2 && u.isArray(arguments[1])) ?
                arguments[1] :
                this.toArray(arguments, 1);
                return text.replace(/\{(\d+)\}/g, function (match, number) {
                    return typeof args[number] !== 'undefined'
              ? String(args[number])
              : match
            ;
                });
            },
            // usual each, if you happen to pass a string, it will split it on commas.
            // it will always trim string values in an array.
            each: function (coll, cb) {
                var i, val;
                if (u.isString(coll)) {
                    coll = coll.split(',');
                }
                if (u.isArray(coll)) {
                    for (i = 0; i < coll.length; i++) {
                        val = u.isString(coll[i]) ?
                        u.trim(coll[i]) : coll[i];

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
            },
            donothing: function () { }

        };
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
    u = this.common.utils;
u.route = function (path) {
        
    if (arguments.length>1) {
        path = path.format(Array.prototype.slice.call(arguments, 1));
    }
    return path;
};
u.restCommand = function (command, path, data) {
    var target = u.route(path),
            defer = when.defer(),
            config = {
                url: target,
                type: command.toUpperCase(),
                data: data ? JSON.stringify(data) : null,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: defer.resolve,
                error: function (jqXHR, textStatus, errorThrown) {
//                    // call the error handler from the client first, if nothing is returned then assume
//                    // the error is unhandled and use the defeault handler
//                    if (jqXHR.status === 404) {
//                        jqXHR.requestPath = target;
                    //                    }
                    defer.reject(jqXHR.responseText);
//                    lf.errors.handleAjax(jqXHR, textStatus, errorThrown);

                }
            };
    $.ajax(config);
    return defer;
};
$.each(["Get", "Post"], function (i, e) {
    u["rest" + e] = (function (e) {

        return function () {
            // filter off the last arg when it's a post, that is the data;
            var len = arguments.length,
                    hasData = e === 'Post'
                        && len
                        && !u.isValueType(arguments[len - 1]),
                    args = Array.prototype.slice.call(arguments, 1, hasData ? len - 1 : len),
                    data = hasData ?
                        arguments[len - 1] : null,
                    path = arguments[0];

            // add each argument to the path
            $.each(args, function (i, arg) {
                path += "/" + encodeURIComponent(u.isValueType(arg) ? String(arg) : 'null');
            });

            return u.restCommand(e, path, data);
        };
    } (e));
});