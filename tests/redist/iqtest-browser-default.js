/** NOTE: MODIFIED - must not catch errors for use in IQTest */
/*lint-ignore-file*/

/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * when
 * A lightweight CommonJS Promises/A and when() implementation
 *
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 1.0.2
 */

(function(define) {
define(function() {
    var freeze, reduceArray, undef;

    /**
     * No-Op function used in method replacement
     * @private
     */
    function noop() {}

    /**
     * Allocate a new Array of size n
     * @private
     * @param n {number} size of new Array
     * @returns {Array}
     */
    function allocateArray(n) {
        return new Array(n);
    }

    /**
     * Use freeze if it exists
     * @function
     * @private
     */
    freeze = Object.freeze || function(o) { return o; };

    // ES5 reduce implementation if native not available
    // See: http://es5.github.com/#x15.4.4.21 as there are many
    // specifics and edge cases.
    reduceArray = [].reduce ||
        function(reduceFunc /*, initialValue */) {
            // ES5 dictates that reduce.length === 1

            // This implementation deviates from ES5 spec in the following ways:
            // 1. It does not check if reduceFunc is a Callable

            var arr, args, reduced, len, i;

            i = 0;
            arr = Object(this);
            len = arr.length >>> 0;
            args = arguments;

            // If no initialValue, use first item of array (we know length !== 0 here)
            // and adjust i to start at second item
            if(args.length <= 1) {
                // Skip to the first real element in the array
                for(;;) {
                    if(i in arr) {
                        reduced = arr[i++];
                        break;
                    }

                    // If we reached the end of the array without finding any real
                    // elements, it's a TypeError
                    if(++i >= len) {
                        throw new TypeError();
                    }
                }
            } else {
                // If initialValue provided, use it
                reduced = args[1];
            }

            // Do the actual reduce
            for(;i < len; ++i) {
                // Skip holes
                if(i in arr)
                    reduced = reduceFunc(reduced, arr[i], i, arr);
            }

            return reduced;
        };

    /**
     * Trusted Promise constructor.  A Promise created from this constructor is
     * a trusted when.js promise.  Any other duck-typed promise is considered
     * untrusted.
     */
    function Promise() {}

    /**
     * Create an already-resolved promise for the supplied value
     * @private
     *
     * @param value anything
     * @return {Promise}
     */
    function resolved(value) {

        var p = new Promise();

        p.then = function(callback) {
            checkCallbacks(arguments);

            var nextValue;
            if (!when.debug) {
                try {
                    nextValue = callback && callback(value);
                    return promise(nextValue === undef ? value : nextValue);
                } catch(e) {
                    return rejected(e);
                }
            } else {
                nextValue = callback && callback(value);
                return promise(nextValue === undef ? value : nextValue);
            }
        };

        // Not frozen because this should never be exposed
        // to callers
        return p;
    }

    /**
     * Create an already-rejected {@link Promise} with the supplied
     * rejection reason.
     * @private
     *
     * @param reason rejection reason
     * @return {Promise}
     */
    function rejected(reason) {

        var p = new Promise();

        p.then = function(callback, errback) {
            checkCallbacks(arguments);

            var nextValue;
            if (!when.debug) {
                try {
                    if(errback) {
                        nextValue = errback(reason);
                        return promise(nextValue === undef ? reason : nextValue)
                    }

                    return rejected(reason);

                } catch(e) {
                    return rejected(e);
                }
            } else {
                if(errback) {
                    nextValue = errback(reason);
                    return promise(nextValue === undef ? reason : nextValue)
                }

                return rejected(reason);

            }
        };

        // Not frozen because this should never be exposed
        // to callers
        return p;
    }

    /**
     * Helper that checks arrayOfCallbacks to ensure that each element is either
     * a function, or null or undefined.
     *
     * @param arrayOfCallbacks {Array} array to check
     * @throws {Error} if any element of arrayOfCallbacks is something other than
     * a Functions, null, or undefined.
     */
    function checkCallbacks(arrayOfCallbacks) {
        var arg, i = arrayOfCallbacks.length;
        while(i) {
            arg = arrayOfCallbacks[--i];
            if (arg != null && typeof arg != 'function') throw new Error('callback is not a function');
        }
    }

    /**
     * Creates a new, CommonJS compliant, Deferred with fully isolated
     * resolver and promise parts, either or both of which may be given out
     * safely to consumers.
     * The Deferred itself has the full API: resolve, reject, progress, and
     * then. The resolver has resolve, reject, and progress.  The promise
     * only has then.
     *
     * @memberOf when
     * @function
     *
     * @returns {Deferred}
     */
    function defer() {
        var deferred, promise, listeners, progressHandlers, _then, _progress, complete;

        listeners = [];
        progressHandlers = [];

        /**
         * Pre-resolution then() that adds the supplied callback, errback, and progback
         * functions to the registered listeners
         *
         * @private
         *
         * @param [callback] {Function} resolution handler
         * @param [errback] {Function} rejection handler
         * @param [progback] {Function} progress handler
         *
         * @throws {Error} if any argument is not null, undefined, or a Function
         */
        _then = function unresolvedThen(callback, errback, progback) {
            // Check parameters and fail immediately if any supplied parameter
            // is not null/undefined and is also not a function.
            // That is, any non-null/undefined parameter must be a function.
            checkCallbacks(arguments);

            var deferred = defer();

            listeners.push(function(promise) {
                promise.then(callback, errback)
                    .then(deferred.resolve, deferred.reject, deferred.progress);
            });

            progback && progressHandlers.push(progback);

            return deferred.promise;
        };

        /**
         * Registers a handler for this {@link Deferred}'s {@link Promise}.  Even though all arguments
         * are optional, each argument that *is* supplied must be null, undefined, or a Function.
         * Any other value will cause an Error to be thrown.
         *
         * @memberOf Promise
         *
         * @param [callback] {Function} resolution handler
         * @param [errback] {Function} rejection handler
         * @param [progback] {Function} progress handler
         *
         * @throws {Error} if any argument is not null, undefined, or a Function
         */
        function then(callback, errback, progback) {
            return _then(callback, errback, progback);
        }

        /**
         * Resolves this {@link Deferred}'s {@link Promise} with val as the
         * resolution value.
         *
         * @memberOf Resolver
         *
         * @param val anything
         */
        function resolve(val) {
            complete(resolved(val));
        }

        /**
         * Rejects this {@link Deferred}'s {@link Promise} with err as the
         * reason.
         *
         * @memberOf Resolver
         *
         * @param err anything
         */
        function reject(err) {
            complete(rejected(err));
        }

        /**
         * @private
         * @param update
         */
        _progress = function(update) {
            var progress, i = 0;
            while (progress = progressHandlers[i++]) progress(update);
        };

        /**
         * Emits a progress update to all progress observers registered with
         * this {@link Deferred}'s {@link Promise}
         *
         * @memberOf Resolver
         *
         * @param update anything
         */
        function progress(update) {
            _progress(update);
        }

        /**
         * Transition from pre-resolution state to post-resolution state, notifying
         * all listeners of the resolution or rejection
         *
         * @private
         *
         * @param completed {Promise} the completed value of this deferred
         */
        complete = function(completed) {
            var listener, i = 0;

            // Replace _then with one that directly notifies with the result.
            _then = completed.then;

            // Replace complete so that this Deferred can only be completed
            // once. Also Replace _progress, so that subsequent attempts to issue
            // progress throw.
            complete = _progress = function alreadyCompleted() {
                // TODO: Consider silently returning here so that parties who
                // have a reference to the resolver cannot tell that the promise
                // has been resolved using try/catch
                throw new Error("already completed");
            };

            // Free progressHandlers array since we'll never issue progress events
            // for this promise again now that it's completed
            progressHandlers = undef;

            // Notify listeners
            // Traverse all listeners registered directly with this Deferred

            while (listener = listeners[i++]) {
                listener(completed);
            }

            listeners = [];
        };

        /**
         * The full Deferred object, with both {@link Promise} and {@link Resolver}
         * parts
         * @class Deferred
         * @name Deferred
         * @augments Resolver
         * @augments Promise
         */
        deferred = {};

        // Promise and Resolver parts
        // Freeze Promise and Resolver APIs

        /**
         * The Promise API
         * @namespace Promise
         * @name Promise
         */
        promise = new Promise();
        promise.then = deferred.then = then;

        /**
         * The {@link Promise} for this {@link Deferred}
         * @memberOf Deferred
         * @name promise
         * @type {Promise}
         */
        deferred.promise = freeze(promise);

        /**
         * The {@link Resolver} for this {@link Deferred}
         * @namespace Resolver
         * @name Resolver
         * @memberOf Deferred
         * @name resolver
         * @type {Resolver}
         */
        deferred.resolver = freeze({
            resolve:  (deferred.resolve  = resolve),
            reject:   (deferred.reject   = reject),
            progress: (deferred.progress = progress)
        });

        return deferred;
    }

    /**
     * Determines if promiseOrValue is a promise or not.  Uses the feature
     * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
     * promiseOrValue is a promise.
     *
     * @param promiseOrValue anything
     *
     * @returns {Boolean} true if promiseOrValue is a {@link Promise}
     */
    function isPromise(promiseOrValue) {
        return promiseOrValue && typeof promiseOrValue.then === 'function';
    }

    /**
     * Register an observer for a promise or immediate value.
     *
     * @function
     * @name when
     * @namespace
     *
     * @param promiseOrValue anything
     * @param {Function} [callback] callback to be called when promiseOrValue is
     *   successfully resolved.  If promiseOrValue is an immediate value, callback
     *   will be invoked immediately.
     * @param {Function} [errback] callback to be called when promiseOrValue is
     *   rejected.
     * @param {Function} [progressHandler] callback to be called when progress updates
     *   are issued for promiseOrValue.
     *
     * @returns {Promise} a new {@link Promise} that will complete with the return
     *   value of callback or errback or the completion value of promiseOrValue if
     *   callback and/or errback is not supplied.
     */
    function when(promiseOrValue, callback, errback, progressHandler) {
        // Get a promise for the input promiseOrValue
        // See promise()
        var trustedPromise = promise(promiseOrValue);

        // Register promise handlers
        return trustedPromise.then(callback, errback, progressHandler);
    }

    /**
     * Returns promiseOrValue if promiseOrValue is a {@link Promise}, a new Promise if
     * promiseOrValue is a foreign promise, or a new, already-resolved {@link Promise}
     * whose resolution value is promiseOrValue if promiseOrValue is an immediate value.
     *
     * Note that this function is not safe to export since it will return its
     * input when promiseOrValue is a {@link Promise}
     *
     * @private
     *
     * @param promiseOrValue anything
     *
     * @returns Guaranteed to return a trusted Promise.  If promiseOrValue is a when.js {@link Promise}
     *   returns promiseOrValue, otherwise, returns a new, already-resolved, when.js {@link Promise}
     *   whose resolution value is:
     *   * the resolution value of promiseOrValue if it's a foreign promise, or
     *   * promiseOrValue if it's a value
     */
    function promise(promiseOrValue) {
        var promise, deferred;

        if(promiseOrValue instanceof Promise) {
            // It's a when.js promise, so we trust it
            promise = promiseOrValue;

        } else {
            // It's not a when.js promise.  Check to see if it's a foreign promise
            // or a value.

            deferred = defer();
            if(isPromise(promiseOrValue)) {
                // It's a compliant promise, but we don't know where it came from,
                // so we don't trust its implementation entirely.  Introduce a trusted
                // middleman when.js promise

                // IMPORTANT: This is the only place when.js should ever call .then() on
                // an untrusted promise.
                promiseOrValue.then(deferred.resolve, deferred.reject, deferred.progress);
                promise = deferred.promise;

            } else {
                // It's a value, not a promise.  Create an already-resolved promise
                // for it.
                deferred.resolve(promiseOrValue);
                promise = deferred.promise;
            }
        }

        return promise;
    }

    /**
     * Return a promise that will resolve when howMany of the supplied promisesOrValues
     * have resolved. The resolution value of the returned promise will be an array of
     * length howMany containing the resolutions values of the triggering promisesOrValues.
     *
     * @memberOf when
     *
     * @param promisesOrValues {Array} array of anything, may contain a mix
     *      of {@link Promise}s and values
     * @param howMany
     * @param [callback]
     * @param [errback]
     * @param [progressHandler]
     *
     * @returns {Promise}
     */
    function some(promisesOrValues, howMany, callback, errback, progressHandler) {
        var toResolve, results, ret, deferred, resolver, rejecter, handleProgress, len, i;

        len = promisesOrValues.length >>> 0;

        toResolve = Math.max(0, Math.min(howMany, len));
        results = [];
        deferred = defer();
        ret = when(deferred, callback, errback, progressHandler);

        // Wrapper so that resolver can be replaced
        function resolve(val) {
            resolver(val);
        }

        // Wrapper so that rejecter can be replaced
        function reject(err) {
            rejecter(err);
        }

        // Wrapper so that progress can be replaced
        function progress(update) {
            handleProgress(update);
        }

        function complete() {
            resolver = rejecter = handleProgress = noop;
        }

        // No items in the input, resolve immediately
        if (!toResolve) {
            deferred.resolve(results);

        } else {
            // Resolver for promises.  Captures the value and resolves
            // the returned promise when toResolve reaches zero.
            // Overwrites resolver var with a noop once promise has
            // be resolved to cover case where n < promises.length
            resolver = function(val) {
                // This orders the values based on promise resolution order
                // Another strategy would be to use the original position of
                // the corresponding promise.
                results.push(val);

                if (!--toResolve) {
                    complete();
                    deferred.resolve(results);
                }
            };

            // Rejecter for promises.  Rejects returned promise
            // immediately, and overwrites rejecter var with a noop
            // once promise to cover case where n < promises.length.
            // TODO: Consider rejecting only when N (or promises.length - N?)
            // promises have been rejected instead of only one?
            rejecter = function(err) {
                complete();
                deferred.reject(err);
            };

            handleProgress = deferred.progress;

            // TODO: Replace while with forEach
            for(i = 0; i < len; ++i) {
                if(i in promisesOrValues) {
                    when(promisesOrValues[i], resolve, reject, progress);
                }
            }
        }

        return ret;
    }

    /**
     * Return a promise that will resolve only once all the supplied promisesOrValues
     * have resolved. The resolution value of the returned promise will be an array
     * containing the resolution values of each of the promisesOrValues.
     *
     * @memberOf when
     *
     * @param promisesOrValues {Array} array of anything, may contain a mix
     *      of {@link Promise}s and values
     * @param [callback] {Function}
     * @param [errback] {Function}
     * @param [progressHandler] {Function}
     *
     * @returns {Promise}
     */
    function all(promisesOrValues, callback, errback, progressHandler) {
        var results, promise;

        results = allocateArray(promisesOrValues.length);
        promise = reduce(promisesOrValues, reduceIntoArray, results);

        return when(promise, callback, errback, progressHandler);
    }

    function reduceIntoArray(current, val, i) {
        current[i] = val;
        return current;
    }

    /**
     * Return a promise that will resolve when any one of the supplied promisesOrValues
     * has resolved. The resolution value of the returned promise will be the resolution
     * value of the triggering promiseOrValue.
     *
     * @memberOf when
     *
     * @param promisesOrValues {Array} array of anything, may contain a mix
     *      of {@link Promise}s and values
     * @param [callback] {Function}
     * @param [errback] {Function}
     * @param [progressHandler] {Function}
     *
     * @returns {Promise}
     */
    function any(promisesOrValues, callback, errback, progressHandler) {

        function unwrapSingleResult(val) {
            return callback(val[0]);
        }

        return some(promisesOrValues, 1, unwrapSingleResult, errback, progressHandler);
    }

    /**
     * Traditional map function, similar to `Array.prototype.map()`, but allows
     * input to contain {@link Promise}s and/or values, and mapFunc may return
     * either a value or a {@link Promise}
     *
     * @memberOf when
     *
     * @param promisesOrValues {Array} array of anything, may contain a mix
     *      of {@link Promise}s and values
     * @param mapFunc {Function} mapping function mapFunc(value) which may return
     *      either a {@link Promise} or value
     *
     * @returns {Promise} a {@link Promise} that will resolve to an array containing
     *      the mapped output values.
     */
    function map(promisesOrValues, mapFunc) {

        var results, i;

        // Since we know the resulting length, we can preallocate the results
        // array to avoid array expansions.
        i = promisesOrValues.length;
        results = allocateArray(i);

        // Since mapFunc may be async, get all invocations of it into flight
        // asap, and then use reduce() to collect all the results
        for(;i >= 0; --i) {
            if(i in promisesOrValues)
                results[i] = when(promisesOrValues[i], mapFunc);
        }

        // Could use all() here, but that would result in another array
        // being allocated, i.e. map() would end up allocating 2 arrays
        // of size len instead of just 1.  Since all() uses reduce()
        // anyway, avoid the additional allocation by calling reduce
        // directly.
        return reduce(results, reduceIntoArray, results);
    }

    /**
     * Traditional reduce function, similar to `Array.prototype.reduce()`, but
     * input may contain {@link Promise}s and/or values, but reduceFunc
     * may return either a value or a {@link Promise}, *and* initialValue may
     * be a {@link Promise} for the starting value.
     *
     * @memberOf when
     *
     * @param promisesOrValues {Array} array of anything, may contain a mix
     *      of {@link Promise}s and values
     * @param reduceFunc {Function} reduce function reduce(currentValue, nextValue, index, total),
     *      where total is the total number of items being reduced, and will be the same
     *      in each call to reduceFunc.
     * @param initialValue starting value, or a {@link Promise} for the starting value
     *
     * @returns {Promise} that will resolve to the final reduced value
     */
    function reduce(promisesOrValues, reduceFunc, initialValue) {

        var total, args;

        total = promisesOrValues.length;

        // Skip promisesOrValues, since it will be used as 'this' in the call
        // to the actual reduce engine below.

        // Wrap the supplied reduceFunc with one that handles promises and then
        // delegates to the supplied.

        args = [
            function (current, val, i) {
                return when(current, function (c) {
                    return when(val, function (value) {
                        return reduceFunc(c, value, i, total);
                    });
                });
            }
        ];

        if (arguments.length >= 3) args.push(initialValue);

        return promise(reduceArray.apply(promisesOrValues, args));
    }

    /**
     * Ensure that resolution of promiseOrValue will complete resolver with the completion
     * value of promiseOrValue, or instead with resolveValue if it is provided.
     *
     * @memberOf when
     *
     * @param promiseOrValue
     * @param resolver {Resolver}
     * @param [resolveValue] anything
     *
     * @returns {Promise}
     */
    function chain(promiseOrValue, resolver, resolveValue) {
        var useResolveValue = arguments.length > 2;

        return when(promiseOrValue,
            function(val) {
                resolver.resolve(useResolveValue ? resolveValue : val);
            },
            resolver.reject,
            resolver.progress
        );
    }

    //
    // Public API
    //

    when.defer     = defer;

    when.isPromise = isPromise;
    when.some      = some;
    when.all       = all;
    when.any       = any;

    when.reduce    = reduce;
    when.map       = map;

    when.chain     = chain;

    // when true, will not trap errors

    when.debug     = false;
    return when;
});
})(typeof define == 'function'
    ? define
    : function (factory) { typeof module != 'undefined'
        ? (module.exports = factory())
        : (this.when      = factory());
    }
    // Boilerplate for AMD, Node, and browser global
);/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * timeout.js
 *
 * Helper that returns a promise that rejects after a specified timeout,
 * if not explicitly resolved or rejected before that.
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(['./when'], function(when) {

    var undef;

    /**
     * Returns a new promise that will automatically reject after msec if
     * the supplied promise doesn't resolve or reject before that.
     *
     * Usage:
     *
     * var d = when.defer();
     * // Setup d however you need
     *
     * // return a new promise that will timeout if we don't resolve/reject first
     * return timeout(d, 1000);
     *
     * @param promise anything - any promise or value that should trigger
     *  the returned promise to resolve or reject before the msec timeout
     * @param msec {Number} timeout in milliseconds
     *
     * @returns {Promise}
     */
    return function timeout(promise, msec) {
        var deferred, timeout;

        deferred = when.defer();

        timeout = setTimeout(function onTimeout() {
            timeout && deferred.reject(new Error('timed out'));
        }, msec);

        function cancelTimeout() {
            clearTimeout(timeout);
            timeout = undef;
        }

        when(promise, deferred.resolve, deferred.reject);

        return deferred.then(
			function(value) {
				cancelTimeout();
				return value;
			},
			function(reason) {
				cancelTimeout();
				throw reason;
			}
		);
    };

});
})(typeof define == 'function'
    ? define
    : function (deps, factory) { typeof module != 'undefined'
        ? (module.exports = factory(require('./when')))
        : (this.when_timeout = factory(this.when));
    }
    // Boilerplate for AMD, Node, and browser global
);

var buster = (function (setTimeout, B) {
    var isNode = typeof require == "function" && typeof module == "object";
    var div = typeof document != "undefined" && document.createElement("div");
    var F = function () {};

    var buster = {
        bind: function bind(obj, methOrProp) {
            var method = typeof methOrProp == "string" ? obj[methOrProp] : methOrProp;
            var args = Array.prototype.slice.call(arguments, 2);
            return function () {
                var allArgs = args.concat(Array.prototype.slice.call(arguments));
                return method.apply(obj, allArgs);
            };
        },

        partial: function partial(fn) {
            var args = [].slice.call(arguments, 1);
            return function () {
                return fn.apply(this, args.concat([].slice.call(arguments)));
            };
        },

        create: function create(object) {
            F.prototype = object;
            return new F();
        },

        extend: function extend(target) {
            if (!target) { return; }
            for (var i = 1, l = arguments.length, prop; i < l; ++i) {
                for (prop in arguments[i]) {
                    target[prop] = arguments[i][prop];
                }
            }
            return target;
        },

        nextTick: function nextTick(callback) {
            if (typeof process != "undefined" && process.nextTick) {
                return process.nextTick(callback);
            }
            setTimeout(callback, 0);
        },

        functionName: function functionName(func) {
            if (!func) return "";
            if (func.displayName) return func.displayName;
            if (func.name) return func.name;
            var matches = func.toString().match(/function\s+([^\(]+)/m);
            return matches && matches[1] || "";
        },

        isNode: function isNode(obj) {
            if (!div) return false;
            try {
                obj.appendChild(div);
                obj.removeChild(div);
            } catch (e) {
                return false;
            }
            return true;
        },

        isElement: function isElement(obj) {
            return obj && obj.nodeType === 1 && buster.isNode(obj);
        },

        isArray: function isArray(arr) {
            return Object.prototype.toString.call(arr) == "[object Array]";
        },

        flatten: function flatten(arr) {
            var result = [], arr = arr || [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                result = result.concat(buster.isArray(arr[i]) ? flatten(arr[i]) : arr[i]);
            }
            return result;
        },

        each: function each(arr, callback) {
            for (var i = 0, l = arr.length; i < l; ++i) {
                callback(arr[i]);
            }
        },

        map: function map(arr, callback) {
            var results = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                results.push(callback(arr[i]));
            }
            return results;
        },

        parallel: function parallel(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                    callback = null;
                }
            }
            if (fns.length == 0) { return cb(null, []); }
            var remaining = fns.length, results = [];
            function makeDone(num) {
                return function done(err, result) {
                    if (err) { return cb(err); }
                    results[num] = result;
                    if (--remaining == 0) { cb(null, results); }
                };
            }
            for (var i = 0, l = fns.length; i < l; ++i) {
                fns[i](makeDone(i));
            }
        },

        series: function series(fns, callback) {
            function cb(err, res) {
                if (typeof callback == "function") {
                    callback(err, res);
                }
            }
            var remaining = fns.slice();
            var results = [];
            function callNext() {
                if (remaining.length == 0) return cb(null, results);
                var promise = remaining.shift()(next);
                if (promise && typeof promise.then == "function") {
                    promise.then(buster.partial(next, null), next);
                }
            }
            function next(err, result) {
                if (err) return cb(err);
                results.push(result);
                callNext();
            }
            callNext();
        },

        countdown: function countdown(num, done) {
            return function () {
                if (--num == 0) done();
            };
        }
    };

    if (Array.prototype.some) {
        buster.some = function (arr, fn, thisp) {
            return arr.some(fn, thisp);
        };
    } else {
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
        buster.some = function (arr, fun, thisp) {
            "use strict";
            if (arr == null) { throw new TypeError(); }
            arr = Object(arr);
            var len = arr.length >>> 0;
            if (typeof fun !== "function") { throw new TypeError(); }

            for (var i = 0; i < len; i++) {
                if (arr.hasOwnProperty(i) && fun.call(thisp, arr[i], i, arr)) {
                    return true;
                }
            }

            return false;
        };
    }

    if (isNode) {
        module.exports = buster;
        buster.eventEmitter = require("./buster-event-emitter");
        Object.defineProperty(buster, "defineVersionGetter", {
            get: function () {
                return require("./define-version-getter");
            }
        });
    }

    return buster.extend(B || {}, buster);
}(setTimeout, buster));
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global buster, require, module*/
if (typeof require == "function" && typeof module == "object") {
    var buster = require("./buster-core");
}

(function () {
    function eventListeners(eventEmitter, event) {
        if (!eventEmitter.listeners) {
            eventEmitter.listeners = {};
        }

        if (!eventEmitter.listeners[event]) {
            eventEmitter.listeners[event] = [];
        }

        return eventEmitter.listeners[event];
    }

    function throwLater(event, error) {
        buster.nextTick(function () {
            error.message = event + " listener threw error: " + error.message;
            throw error;
        });
    }

    function addSupervisor(emitter, listener, thisObject) {
        if (!emitter.supervisors) { emitter.supervisors = []; }
        emitter.supervisors.push({
            listener: listener,
            thisObject: thisObject
        });
    }

    function notifyListener(emitter, event, listener, args) {
        try {
            listener.listener.apply(listener.thisObject || emitter, args);
        } catch (e) {
            throwLater(event, e);
        }
    }

    buster.eventEmitter = {
        create: function () {
            return buster.create(this);
        },

        addListener: function addListener(event, listener, thisObject) {
            if (typeof event === "function") {
                return addSupervisor(this, event, listener);
            }
            if (typeof listener != "function") {
                throw new TypeError("Listener is not function");
            }
            eventListeners(this, event).push({
                listener: listener,
                thisObject: thisObject
            });
        },

        once: function once(event, listener, thisObject) {
            var self = this;
            this.addListener(event, listener);

            var wrapped = function () {
                self.removeListener(event, listener);
                self.removeListener(event, wrapped);
            };
            this.addListener(event, wrapped);
        },

        hasListener: function hasListener(event, listener, thisObject) {
            var listeners = eventListeners(this, event);

            for (var i = 0, l = listeners.length; i < l; i++) {
                if (listeners[i].listener === listener &&
                    listeners[i].thisObject === thisObject) {
                    return true;
                }
            }

            return false;
        },

        removeListener: function (event, listener) {
            var listeners = eventListeners(this, event);

            for (var i = 0, l = listeners.length; i < l; ++i) {
                if (listeners[i].listener == listener) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        },

        emit: function emit(event) {
            var listeners = eventListeners(this, event);
            var args = Array.prototype.slice.call(arguments, 1);

            for (var i = 0, l = listeners.length; i < l; i++) {
                notifyListener(this, event, listeners[i], args);
            }

            listeners = this.supervisors || [];
            args = Array.prototype.slice.call(arguments);
            for (i = 0, l = listeners.length; i < l; ++i) {
                notifyListener(this, event, listeners[i], args);
            }
        },

        bind: function (object, events) {
            var method;

            if (!events) {
                for (method in object) {
                    if (object.hasOwnProperty(method) && typeof object[method] == "function") {
                        this.addListener(method, object[method], object);
                    }
                }
            } else if (typeof events == "string" ||
                       Object.prototype.toString.call(events) == "[object Array]") {
                events = typeof events == "string" ? [events] : events;

                for (var i = 0, l = events.length; i < l; ++i) {
                    this.addListener(events[i], object[events[i]], object);
                }
            } else {
                for (var prop in events) {
                    if (events.hasOwnProperty(prop)) {
                        method = events[prop];

                        if (typeof method == "function") {
                            object[buster.functionName(method) || prop] = method;
                        } else {
                            method = object[events[prop]];
                        }

                        this.addListener(prop, method, object);
                    }
                }
            }

            return object;
        }
    };

    buster.eventEmitter.on = buster.eventEmitter.addListener;
}());

if (typeof module != "undefined") {
    module.exports = buster.eventEmitter;
}
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global buster, require, module*/
(function () {
    var isCommonJS = typeof require == "function" && typeof module == "object";
    if (isCommonJS) buster = require("buster-core");
    var toString = Object.prototype.toString;
    var slice = Array.prototype.slice;
    var assert, refute, ba = buster.assertions = buster.eventEmitter.create();

    if (isCommonJS) {
        module.exports = buster.assertions;
    }

    function countAssertion() {
        if (typeof ba.count != "number") {
            ba.count = 0;
        }

        ba.count += 1;
    }

    ba.count = countAssertion;

    function assertEnoughArguments(name, args, num) {
        if (args.length < num) {
            ba.fail("[" + name + "] Expected to receive at least " +
                        num + " argument" + (num > 1 ? "s" : ""));
            return false;
        }

        return true;
    }

    function defineAssertion(type, name, func, fl, messageValues) {
        ba[type][name] = function () {
            var fullName = type + "." + name;
            countAssertion();
            if (!assertEnoughArguments(fullName, arguments, fl || func.length)) return;

            var failed = false;

            var ctx = {
                fail: function () {
                    failed = true;
                    var failArgs = [type, name].concat(slice.call(arguments));
                    fail.apply(this, failArgs);
                    return true;
                }
            };

            var args = slice.call(arguments, 0);

            if (typeof messageValues == "function") {
                args = messageValues.apply(this, args);
            }

            if (!func.apply(ctx, arguments)) {
                return fail.apply(ctx, [type, name, "message"].concat(args));
            }

            if (!failed) {
                ba.emit.apply(ba, ["pass", fullName].concat(args));
            }
        };
    }

    ba.add = function (name, options) {
        var refuteArgs;

        if (options.refute) {
            refuteArgs = options.refute.length;
        } else {
            refuteArgs = options.assert.length;
            options.refute = function () {
                return !options.assert.apply(this, arguments);
            };
        }

        var values = options && options.values; // TODO: Remove
        defineAssertion("assert", name, options.assert, options.assert.length, values);
        defineAssertion("refute", name, options.refute, refuteArgs, values);

        assert[name].message = options.assertMessage;
        refute[name].message = options.refuteMessage;

        if (options.expectation) {
            if (ba.expect && ba.expect.wrapAssertion) {
                ba.expect.wrapAssertion(name, options.expectation);
            } else {
                assert[name].expectationName = options.expectation;
                refute[name].expectationName = options.expectation;
            }
        }
    };

    function interpolate(string, property, value) {
        return string.replace(new RegExp("\\$\\{" + property + "\\}", "g"), value);
    }

    function interpolatePosArg(message, values) {
        var value;
        values = values || [];

        for (var i = 0, l = values.length; i < l; i++) {
            message = interpolate(message, i, ba.format(values[i]));
        }

        return message;
    }

    function interpolateProperties(msg, properties) {
        for (var prop in properties) {
            msg = interpolate(msg, prop, ba.format(properties[prop]));
        }

        return msg || "";
    }

    function fail(type, assertion, msg) {
        delete this.fail;
        var message = interpolateProperties(
            interpolatePosArg(ba[type][assertion][msg] || msg,
                              [].slice.call(arguments, 3)), this);
        ba.fail("[" + type + "." + assertion + "] " + message);
    }

    function isDate(value) {
        // Duck typed dates, allows objects to take on the role of dates
        // without actually being dates
        return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
    }

    ba.isDate = isDate;

    // Fixes NaN === NaN (should be true) and
    // -0 === +0 (should be false)
    // http://wiki.ecmascript.org/doku.php?id=harmony:egal
    function egal(x, y) {
        if (x === y) {
            // 0 === -0, but they are not identical
            return x !== 0 || 1 / x === 1 / y;
        }
        
        // NaN !== NaN, but they are identical.
        // NaNs are the only non-reflexive value, i.e., if x !== x,
        // then x is a NaN.
        // isNaN is broken: it converts its argument to number, so
        // isNaN("foo") => true
        return x !== x && y !== y;
    }

    function areEqual(expected, actual) {
        if (egal(expected, actual)) {
            return true;
        }

        // Elements are only equal if expected === actual
        if (buster.isElement(expected) || buster.isElement(actual)) {
            return false;
        }

        // null and undefined only pass for null === null and
        // undefined === undefined
        /*jsl: ignore*/
        if (expected == null || actual == null) {
            return actual === expected;
        }
        /*jsl: end*/

        if (isDate(expected) || isDate(actual)) {
            return isDate(expected) && isDate(actual) &&
                expected.getTime() == actual.getTime();
        }

        var useCoercingEquality = typeof expected != "object" || typeof actual != "object";

        if (expected instanceof RegExp && actual instanceof RegExp) {
            if (expected.toString() != actual.toString()) {
                return false;
            }

            useCoercingEquality = false;
        }

        // Arrays can only be equal to arrays
        var expectedStr = toString.call(expected);
        var actualStr = toString.call(actual);

        // Coerce and compare when primitives are involved
        if (useCoercingEquality) {
            return expectedStr != "[object Array]" && actualStr != "[object Array]" &&
                expected == actual;
        }

        var expectedKeys = ba.keys(expected);
        var actualKeys = ba.keys(actual);

        if (isArguments(expected) || isArguments(actual)) {
            if (expected.length != actual.length) {
                return false;
            }
        } else {
            if (typeof expected != typeof actual || expectedStr != actualStr ||
                expectedKeys.length != actualKeys.length) {
                return false;
            }
        }

        var key;

        for (var i = 0, l = expectedKeys.length; i < l; i++) {
            key = expectedKeys[i];

            if (!Object.prototype.hasOwnProperty.call(actual, key) ||
                !areEqual(expected[key], actual[key])) {
                return false;
            }
        }

        return true;
    }

    ba.deepEqual = areEqual;

    assert = ba.assert = function assert(actual, message) {
        countAssertion();
        if (!assertEnoughArguments("assert", arguments, 1)) return;

        if (!actual) {
            var val = ba.format(actual)
            ba.fail(message || "[assert] Expected " + val + " to be truthy");
        } else {
            ba.emit("pass", "assert", message || "", actual);
        }
    };

    assert.toString = function () {
        return "buster.assert";
    };

    refute = ba.refute = function (actual, message) {
        countAssertion();
        if (!assertEnoughArguments("refute", arguments, 1)) return;

        if (actual) {
            var val = ba.format(actual)
            ba.fail(message || "[refute] Expected " + val + " to be falsy");
        } else {
            ba.emit("pass", "refute", message || "", actual);
        }
    };

    assert.message = "[assert] Expected ${0} to be truthy";
    ba.count = 0;

    ba.fail = function (message) {
        var exception = new Error(message);
        exception.name = "AssertionError";

        try {
            throw exception;
        } catch (e) {
            ba.emit("failure", e);
        }

        if (typeof ba.throwOnFailure != "boolean" || ba.throwOnFailure) {
            throw exception;
        }
    };

    ba.format = function (object) {
        return "" + object;
    };

    function msg(message) {
        if (!message) { return ""; }
        return message + (/[.:!?]$/.test(message) ? " " : ": ");
    }

    function actualAndExpectedMessageValues(actual, expected, message) {
        return [actual, expected, msg(message)]
    }

    function actualMessageValues(actual) {
        return [actual, msg(arguments[1])];
    }

    function actualAndTypeOfMessageValues(actual) {
        return [actual, typeof actual, msg(arguments[1])];
    }

    ba.add("same", {
        assert: function (actual, expected) {
            return egal(actual, expected);
        },
        refute: function (actual, expected) {
            return !egal(actual, expected);
        },
        assertMessage: "${2}${0} expected to be the same object as ${1}",
        refuteMessage: "${2}${0} expected not to be the same object as ${1}",
        expectation: "toBe",
        values: actualAndExpectedMessageValues
    });

    function multiLineStringDiff(actual, expected, message) {
        if (actual == expected) return true;

        var message = interpolatePosArg(assert.equals.multiLineStringHeading, [message]),
            actualLines = actual.split("\n"),
            expectedLines = expected.split("\n"),
            lineCount = Math.max(expectedLines.length, actualLines.length),
            lines = [];

        for (var i = 0; i < lineCount; ++i) {
            if (expectedLines[i] != actualLines[i]) {
                lines.push("line " + (i + 1) + ": " + (expectedLines[i] || "") +
                           "\nwas:    " + (actualLines[i] || ""));
            }
        }

        ba.fail("[assert.equals] " + message + lines.join("\n\n"));
        return false;
    }

    ba.add("equals", {
        assert: function (actual, expected) {
            if (typeof actual == "string" && typeof expected == "string" &&
                (actual.indexOf("\n") >= 0 || expected.indexOf("\n") >= 0)) {
                var message = msg(arguments[2]);
                return multiLineStringDiff.call(this, actual, expected, message);
            }

            return areEqual(actual, expected);
        },

        refute: function (actual, expected) {
            return !areEqual(actual, expected);
        },

        assertMessage: "${2}${0} expected to be equal to ${1}",
        refuteMessage: "${2}${0} expected not to be equal to ${1}",
        expectation: "toEqual",
        values: actualAndExpectedMessageValues
    });

    assert.equals.multiLineStringHeading = "${0}Expected multi-line strings to be equal:\n";

    ba.add("greater", {
        assert: function (actual, expected) {
            return actual > expected;
        },

        assertMessage: "${2}Expected ${0} to be greater than ${1}",
        refuteMessage: "${2}Expected ${0} to be less than or equal to ${1}",
        expectation: "toBeGreaterThan",
        values: actualAndExpectedMessageValues
    });

    ba.add("less", {
        assert: function (actual, expected) {
            return actual < expected;
        },

        assertMessage: "${2}Expected ${0} to be less than ${1}",
        refuteMessage: "${2}Expected ${0} to be greater than or equal to ${1}",
        expectation: "toBeLessThan",
        values: actualAndExpectedMessageValues
    });

    ba.add("defined", {
        assert: function (actual) {
            return typeof actual != "undefined";
        },
        assertMessage: "${2}Expected to be defined",
        refuteMessage: "${2}Expected ${0} (${1}) not to be defined",
        expectation: "toBeDefined",
        values: actualAndTypeOfMessageValues
    });

    ba.add("isNull", {
        assert: function (actual) {
            return actual === null;
        },
        assertMessage: "${1}Expected ${0} to be null",
        refuteMessage: "${1}Expected not to be null",
        expectation: "toBeNull",
        values: actualMessageValues
    });

    function match(object, matcher) {
        if (matcher && typeof matcher.test == "function") {
            return matcher.test(object);
        }

        if (typeof matcher == "function") {
            return matcher(object) === true;
        }

        if (typeof matcher == "string") {
            matcher = matcher.toLowerCase();
            return !!object && ("" + object).toLowerCase().indexOf(matcher) >= 0;
        }

        if (typeof matcher == "number") {
            return matcher == object;
        }

        if (typeof matcher == "boolean") {
            return matcher === object;
        }

        if (matcher && typeof matcher == "object") {
            for (var prop in matcher) {
                if (!match(object[prop], matcher[prop])) {
                    return false;
                }
            }

            return true;
        }

        throw new Error("Matcher (" + ba.format(matcher) + ") was not a " +
                        "string, a number, a function, a boolean or an object");
    }

    ba.match = match;

    ba.add("match", {
        assert: function (actual, matcher) {
            var passed;

            try {
                passed = match(actual, matcher);
            } catch (e) {
                return this.fail("exceptionMessage", e.message, msg(arguments[2]));
            }

            return passed;
        },

        refute: function (actual, matcher) {
            var passed;

            try {
                passed = match(actual, matcher);
            } catch (e) {
                return this.fail("exceptionMessage", e.message);
            }

            return !passed;
        },

        assertMessage: "${2}${0} expected to match ${1}",
        refuteMessage: "${2}${0} expected not to match ${1}",
        expectation: "toMatch",
        values: actualAndExpectedMessageValues
    });

    assert.match.exceptionMessage = "${1}${0}";
    refute.match.exceptionMessage = "${1}${0}";

    ba.add("isObject", {
        assert: function (actual) {
            return typeof actual == "object" && !!actual;
        },
        assertMessage: "${2}${0} (${1}) expected to be object and not null",
        refuteMessage: "${2}${0} expected to be null or not an object",
        expectation: "toBeObject",
        values: actualAndTypeOfMessageValues
    });

    ba.add("isFunction", {
        assert: function (actual) {
            return typeof actual == "function";
        },
        assertMessage: "${2}${0} (${1}) expected to be function",
        refuteMessage: "${2}${0} expected not to be function",
        expectation: "toBeFunction",
        values: function (actual) {
            return [("" + actual).replace("\n", ""), typeof actual, msg(arguments[1])];
        }
    });

    ba.add("isTrue", {
        assert: function (actual) {
            return actual === true;
        },
        assertMessage: "${1}Expected ${0} to be true",
        refuteMessage: "${1}Expected ${0} to not be true",
        expectation: "toBeTrue",
        values: actualMessageValues
    });

    ba.add("isFalse", {
        assert: function (actual) {
            return actual === false;
        },
        assertMessage: "${1}Expected ${0} to be false",
        refuteMessage: "${1}Expected ${0} to not be false",
        expectation: "toBeFalse",
        values: actualMessageValues
    });

    ba.add("isString", {
        assert: function (actual) {
            return typeof actual == "string";
        },
        assertMessage: "${2}Expected ${0} (${1}) to be string",
        refuteMessage: "${2}Expected ${0} not to be string",
        expectation: "toBeString",
        values: actualAndTypeOfMessageValues
    });

    ba.add("isBoolean", {
        assert: function (actual) {
            return typeof actual == "boolean";
        },
        assertMessage: "${2}Expected ${0} (${1}) to be boolean",
        refuteMessage: "${2}Expected ${0} not to be boolean",
        expectation: "toBeBoolean",
        values: actualAndTypeOfMessageValues
    });

    ba.add("isNumber", {
        assert: function (actual) {
            return typeof actual == "number" && !isNaN(actual);
        },
        assertMessage: "${2}Expected ${0} (${1}) to be a non-NaN number",
        refuteMessage: "${2}Expected ${0} to be NaN or another non-number value",
        expectation: "toBeNumber",
        values: actualAndTypeOfMessageValues
    });

    ba.add("isNaN", {
        assert: function (actual) {
            return typeof actual == "number" && isNaN(actual);
        },
        assertMessage: "${2}Expected ${0} to be NaN",
        refuteMessage: "${2}Expected not to be NaN",
        expectation: "toBeNaN",
        values: actualAndTypeOfMessageValues
    });

    ba.add("isArray", {
        assert: function (actual) {
            return toString.call(actual) == "[object Array]";
        },
        assertMessage: "${2}Expected ${0} to be array",
        refuteMessage: "${2}Expected ${0} not to be array",
        expectation: "toBeArray",
        values: actualAndTypeOfMessageValues
    });

    function isArrayLike(object) {
        return toString.call(object) == "[object Array]" ||
            (!!object && typeof object.length == "number" &&
            typeof object.splice == "function") ||
            ba.isArguments(object);
    }

    ba.isArrayLike = isArrayLike;

    ba.add("isArrayLike", {
        assert: function (actual) {
            return isArrayLike(actual);
        },
        assertMessage: "${2}Expected ${0} to be array like",
        refuteMessage: "${2}Expected ${0} not to be array like",
        expectation: "toBeArrayLike",
        values: actualAndTypeOfMessageValues
    });

    function captureException(callback) {
        try {
            callback();
        } catch (e) {
            return e;
        }

        return null;
    }

    ba.captureException = captureException;

    assert.exception = function (callback, exception, message) {
        countAssertion();
        if (!assertEnoughArguments("assert.exception", arguments, 1)) return

        if (!callback) {
            return;
        }

        var err = captureException(callback);
        message = msg(message);

        if (!err) {
            if (exception) {
                return fail.call({}, "assert", "exception", "typeNoExceptionMessage",
                                 message, exception);
            } else {
                return fail.call({}, "assert", "exception", "message",
                                 message, exception);
            }
        }

        if (exception && err.name != exception) {
            if (typeof window != "undefined" && typeof console != "undefined") {
                console.log(err);
            }

            return fail.call({}, "assert", "exception", "typeFailMessage",
                             message, exception, err.name, err.message);
        }

        ba.emit("pass", "assert.exception", message, callback, exception);
    };

    assert.exception.typeNoExceptionMessage = "${0}Expected ${1} but no exception was thrown";
    assert.exception.message = "${0}Expected exception";
    assert.exception.typeFailMessage = "${0}Expected ${1} but threw ${2} (${3})";
    assert.exception.expectationName = "toThrow";

    refute.exception = function (callback) {
        countAssertion();
        if (!assertEnoughArguments("refute.exception", arguments, 1)) return;

        var err = captureException(callback);

        if (err) {
            fail.call({}, "refute", "exception", "message",
                      msg(arguments[1]), err.name, err.message, callback);
        } else {
            ba.emit("pass", "refute.exception", callback);
        }
    };

    refute.exception.message = "${0}Expected not to throw but threw ${1} (${2})";
    refute.exception.expectationName = "toThrow";

    ba.add("near", {
        assert: function (actual, expected, delta) {
            return Math.abs(actual - expected) <= delta;
        },
        assertMessage: "${3}Expected ${0} to be equal to ${1} +/- ${2}",
        refuteMessage: "${3}Expected ${0} not to be equal to ${1} +/- ${2}",
        expectation: "toBeNear",
        values: function (actual, expected, delta, message) {
            return [actual, expected, delta, msg(message)];
        }
    });

    ba.add("hasPrototype", {
        assert: function (actual, protoObj) {
            return protoObj.isPrototypeOf(actual);
        },
        assertMessage: "${2}Expected ${0} to have ${1} on its prototype chain",
        refuteMessage: "${2}Expected ${0} not to have ${1} on its prototype chain",
        expectation: "toHavePrototype",
        values: actualAndExpectedMessageValues
    });

    ba.add("contains", {
        assert: function (haystack, needle) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] === needle) {
                    return true;
                }
            }
            return false;
        },
        assertMessage: "${2}Expected [${0}] to contain ${1}",
        refuteMessage: "${2}Expected [${0}] not to contain ${1}",
        expectation: "toContain",
        values: actualAndExpectedMessageValues
    });

    ba.add("tagName", {
        assert: function (element, tagName) {
            if (!element.tagName) {
                return this.fail("noTagNameMessage", tagName, element, msg(arguments[2]));
            }

            return tagName.toLowerCase &&
                tagName.toLowerCase() == element.tagName.toLowerCase();
        },
        assertMessage: "${2}Expected tagName to be ${0} but was ${1}",
        refuteMessage: "${2}Expected tagName not to be ${0}",
        expectation: "toHaveTagName",
        values: function (element, tagName, message) {
            return [tagName, element.tagName, msg(message)];
        }
    });

    assert.tagName.noTagNameMessage = "${2}Expected ${1} to have tagName property";
    refute.tagName.noTagNameMessage = "${2}Expected ${1} to have tagName property";

    function indexOf(arr, item) {
        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i] == item) {
                return i;
            }
        }

        return -1;
    }

    ba.add("className", {
        assert: function (element, className) {
            if (typeof element.className == "undefined") {
                return this.fail("noClassNameMessage", className, element, msg(arguments[2]));
            }

            var expected = typeof className == "string" ? className.split(" ") : className;
            var actual = element.className.split(" ");

            for (var i = 0, l = expected.length; i < l; i++) {
                if (indexOf(actual, expected[i]) < 0) {
                    return false;
                }
            }

            return true;
        },
        assertMessage: "${2}Expected object's className to include ${0} but was ${1}",
        refuteMessage: "${2}Expected object's className not to include ${0}",
        expectation: "toHaveClassName",
        values: function (element, className, message) {
            return [className, element.className, msg(message)];
        }
    });

    assert.className.noClassNameMessage = "${2}Expected object to have className property";
    refute.className.noClassNameMessage = "${2}Expected object to have className property";

    if (typeof module != "undefined") {
        ba.expect = function () {
            ba.expect = require("./buster-assertions/expect");
            return ba.expect.apply(exports, arguments);
        };
    }

    function isArguments(obj) {
        if (typeof obj != "object" || typeof obj.length != "number" ||
            toString.call(obj) == "[object Array]") {
            return false;
        }

        if (typeof obj.callee == "function") {
            return true;
        }

        try {
            obj[obj.length] = 6;
            delete obj[obj.length];
        } catch (e) {
            return true;
        }

        return false;
    }

    ba.isArguments = isArguments;

    if (Object.keys) {
        ba.keys = function (obj) {
            return Object.keys(obj)
        };
    } else {
        ba.keys = function (object) {
            var keys = [];

            for (var prop in object) {
                if (Object.prototype.hasOwnProperty.call(object, prop)) {
                    keys.push(prop);
                }
            }

            return keys;
        }
    }
}());
/* common.utils.js: a core framework library of utilities and polyfills.
   
This adds utility functions into a namespace u.

Standard polyfills are automatically added to their prototypes. The following nonstandard prototype
changes are made:
        
String.format
String.split with trim option
Array.contains
Array.first

You can remove the call to u.polyfill to prevent the nonstandard changes.

Version 1.0.1 - 6/19/1012

James Treworgy
*/

/*global define, require, module */
/*jslint curly: false, expr: true */
(function (define) {
    define(function () {
        var u;

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
            if (!coll) return;

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
                var num = parseInt(number, 10);
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

            forEach.call(String.prototype.split.call(this, delim || ','), function (i, e) {
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
            var i, undef;

            if (!filter) {
                return this.length > 0 ? this[0] : undef;
            }

            for (i = 0; i < this.length; i++) {
                if (filter.call(this[i], i, this[i])) {
                    return this[i];
                }
            }
            return undef;
        }

        // return the first element where filter returns true
        function arrayLast(filter) {
            var i, undef;

            if (!filter) {
                return this.length > 0 ? this[this.length-1] : undef;
            }

            for (i = this.length; i >0; i--) {
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
            // when onlyInTarget is true, properties will not be added - only updated
            // passing a falsy value as the target results in a new object being created
            // and onlyInTarget is ignored (properties must be added to a new object)

            extend: function (target /*[,onlyInTarget]*/) {
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
                coll && forEach.call(coll, cb);
            },
            first: function(arr,filter) {

                return arrayFirst.call(arr,filter);
            },
            last: function(arr,filter) {
                return arrayLast.call(arr,filter);
            },
            donothing: function () { },
            // add nonstandard polyfills
            polyfill: function () {

                Array.prototype.contains = arrayContains;
                Array.prototype.first = arrayFirst;
                Array.prototype.last = arrayLast;
                String.prototype.format = format;
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
/*
IqTest: A javascript testing framework that promises to be easy

(c) 2012 James Treworgy
MIT License
*/

/*jslint novar:true, onevar: false, debug: true */
/*global alert, define, require, module, buster, u */


(function(define) {

define(['./iqtest'], function(u,when,when_timeout, iq_asserts, buster_asserts, utils) {
    var options,iqtestApi,Test, TestGroup, Assert,
    globalDefaults = {
        setup: null,
        teardown: null,
        timeout: 10
    },
    // default values for TestGroup
    groupDefaults = {

        // an id or name
        name: "test-group", 

        // detailed desription of the test
        desc: "Unnamed Test Group",
        
         // when true, will not trap errors in the test itself.
        debug: false,
        // timeout for function execution (null inherits)
        timeout: null,
        // functions to run on setup or teardown
        setup: null,
        teardown: null
        
    },
    // default values for Test and also defines allowed options
    testDefaults = {
        name: "test",
        desc: "Unnamed Test",
        func: null,
        timeout: null,
        // there is a test-specific debug option so that currently running tests will remain
        // in non-debug mode after another one fails
        debug: false
    },
    // list of methods to import from buster
    busterMethods="same,equals,typeOf,defined,isNull,match,isObject,isFunction,exception,tagName,className,isTrue,isFalse",
    initialized=false,
    // metadata collected about the assertions
    assertionData={};
    
    // get the last argument if it's a string
    function assertMessage(assertion,args) {
        var argCount= assertionData[assertion.split('.')[1]].args;
        return argCount < args.length ?
            String(args[argCount]) :
            'an anonymous test';
    }
    // Map all asserts

    function captureMethodArgs(method,func)
    {
        // get metadata by examining error message
        var matches=0,
        reg=/^.*?Expected.*?([0-9]) argument[s]?\s*$/;
        
        try {
            func();
        }
        catch(err)
        {
            matches=reg.test(err.message) ? parseInt(RegExp.$1,10) : 0;
        }
        assertionData[method]={ 
            args: matches 
        };
    }

    function initialize()
    {
        var ba,tp;
        if (initialized) {
            return;
        }
        // Create a single default assertion so this works with no includes.
        // Other non-buster methods can be found in iqtest.assertions.js

        iq_asserts.push({
            truthy: function(obj,message) {
                u.expectOpts(arguments,1);
                return {
                    passed: !!obj,
                    err: u.formatAssert(message,'The object {0} is {not}truthy',String(obj))
                };
            },
            // has special handling - the actual asserion doesn't know if it was given a promise, only the output.
            // the queue funciton must verify
            resolves: function(obj,message) {
                u.expectOpts(arguments,1);
                return {
                    passed: typeof obj !== 'undefined',
                    err: u.formatAssert(message,'The object {0} did {not}resolve',String(obj))
                };
            }
        });

        // Map buster.assertions.assert & refute to Test protype "assert" & "refute".
        // Also map the assertions directly to test

        tp=Test.prototype;
        ba=buster.assertions;

        u.each(["assert","refute"],function(i,type) {
            
            // create proto.assert

            var asserts = {};

            // map methods from buster

            u.each(busterMethods.split(','),function(j,method) {
                captureMethodArgs(method,ba[type][method]);
                asserts[method] = function () {
                    var that=((this.test && this.test instanceof Test) ? this.test : this);
                    return that.queueTest(ba[type][method],type+"."+method,u.toArray(arguments));
                };
            });
            
            // map builtin methods from the array. Ignore ones that have already been defined.

            u.each(iq_asserts,function(i,iqa) {
                u.each(iqa, function(method,func) {
                    if (!asserts[method]) {
                        captureMethodArgs(method,func);
                        asserts[method]=function() {
                             var that=((this.test && this.test instanceof Test) ? this.test : this);
                            return that.queueBooleanTest(func,
                                type+"."+method,
                                u.toArray(arguments),
                                type==='refute');
                        };
                    }
                });
            });

            // copy asserts to main Test object (do it before we update with the utilities, those are FROM the main object)

            if (type==='assert') {
                u.extend(tp,asserts);
            }
            // map utilities

            u.each(["backpromise","callback","then"],function(i,method) {
                asserts[method]=function() {
                    return this.test[method].apply(this.test,u.toArray(arguments));
                };
            });

            // finally update the prototype, and create this.assert() and this.refute() functions
            
            tp[type]=function(obj,message) {
               return tp[type].truthy.apply(this,u.toArray(arguments));
            };

            u.extend(tp[type],asserts);

            initialized=true;
        });
    }

    // u needs to be imported from common.utils

    u.extend(u, {
        event: function(func,that,parm) {
            if (u.isFunction(func)) {
                func.call(that,parm);
            }
        },
        // throw an error if the 'args' array has fewer than 'expected' elements.
        expectOpts: function(args,expected) {
            if ((args ? args.length : 0) < expected) {
                throw({
                        name: "AssertionError",
                        type: "iq",
                        message: u.format("Expected to receive at least {0} argument",expected.toString())
                    });
            }
        },
        // standardize the format of the output from assertions
        formatAssert: function(message,reason,parms) {
            return !reason ? '' :
             (message ? message+': ':'') +
                u.format(reason,u.isArray(parms) ? parms : u.toArray(arguments,2));
        }

    });

    /* Begin Main Code */
    
    /* Shared functions */

    function doEvent(obj,method /* [,parms] */ ) {
        if (obj[method]) {
            obj[method].apply(this,u.toArray(arguments,2));
        }
    }
    
    // return a delegate to a function with the specified context
    // if any additional arguments are passed when the func is actually called, they come first

    function bind(context,func /*[,args]*/) {
        var args=u.toArray(arguments,2);
        return function() {
            // "arguments" here is what the delegate was ultimately invoked with.
            var finalArgs = u.toArray(arguments).concat(args);
            if (finalArgs.length>0) {
                func.apply(context,finalArgs);
            } else {
                func.call(context);
            }
        };
    }
    // create a new prototype from arbitrary arguments

    function construct(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    }
    /* Functions for the TestGroup prototype */

    function groupAddTest(test) {
        var hasDesc, func, description, 
            testData,
            me=this;

        function addTest(test) {
            me.tests.push(test);
            test.group=me;
            test.id = me.tests.length;
        }
        if (test.constructor === TestGroup) {
            u.each(test.tests,function(i,e) {
               addTest(e);
            });
        } else if (test.constructor === Test) {
            addTest(test);
        } else if (typeof test === 'string') {
            description = arguments[1];
            func = arguments[2];
            hasDesc = !!func;
            testData = {
                name: test,
                desc: hasDesc ? description : '',
                func: hasDesc ? func : description,
                debug: me.debug,
                timeout: me.timeout
            };
            addTest(new Test(testData));
        }
        return me;
    }

    // function must be called with a context of 
    function testFinished(group,test) {
        var groupResult;

        if (test.promise!==test._lastPromise) {
            test._lastPromise=test.promise;
            test._lastPromise.then(function() {
                testFinished(group,test);
            },function(err) {
                test.testerror(err,true);
                testFinished(group,test);
            });
            return;
        }
        if (!u.isBool(test.passed)) {
            test.passed = (test.count===test.countPassed);
        }
        test._allPass &= test.passed;
        
        test.doWriterEvent("testEnd",u.filterProps(test,"count,passed"));

        doEvent.call(test,test,"teardown");

        // see if all tests have been resolved

        groupResult=true;
        u.each(group.tests,function(i,e) {
            if (!u.isBool(e.passed)) {
                groupResult=null;
                return false;
            } else {
                if (!e.passed) {
                    groupResult=false;
                }
            }
        });

        if (u.isBool(groupResult)) {
            group.passed = groupResult;
            group.doWriterEvent("groupEnd");
            doEvent.call(this,this,"teardown");
            group.promise.resolve();
        }
    }


    function groupRun() {
        var me=this;

        doEvent.call(this,this,"setup");

        this.reset();
        u.each(me.tests,function(i,test) {
            test.reset();
        });

        this.doWriterEvent("groupStart",u.filterProps(me,"name,desc"));
                
        u.each(me.tests,function(i,test) {
            var assert=u.extend({},test.assert,{test: test}),
                refute = u.extend({},test.refute,{test: test});

            doEvent.call(test,test,"setup");
            test.doWriterEvent("testStart",u.filterProps(test,"name"));

            if (test.debug) {
                test.func.call(test,assert,refute);
            } else {
                try {
                     test.func.call(test,assert,refute);
                }
                catch(err)
                {
                    test.testerror(u.format("An error occurred in your test code: {0}",err),true);
                }
            }

            // wait for everything to finish by binding to the last promise, and deferring each time
            // it changes as a result of a callback or something.
            // this is really quite nasty, I have not figured out a better way to do it yet

            test._lastPromise=test.promise;
            test._allPass=true;

            // bind to the last promise in the chain. The finishing function will detect if 
            // anything else has been added.

            test.promise.then(function() {
                testFinished(me,test);
            },function(err) {
                test.testerror(err,true);
                testFinished(me,test);
            });
        });
        return this;
    }
    // call function "event" that is a member of each element in activeWriters, with args
    // should be called with the sender event context
    function doWriterEvent(event,args) {
        var me = this;
        u.each(this.group.writers,function(i,e) {
            var target = e[event];
            if (u.isFunction(target)) {
                target.apply(e,[me].concat(args));
            }
        });

    }

    TestGroup = function (name, desc, options) {
        initialize();

        var opts = name && typeof name === 'object' ? name:
            desc && typeof desc === 'object' ? desc : 
            options || {};

        if (typeof desc === 'string') {
            opts.name=name;
        }
        if (typeof desc === 'string') {
            opts.desc=desc;
        }
        u.extend(this,
            u.extend(null,groupDefaults,opts,true)
        );

        // active ouput writers
        this.writers=[];

        // private methods

        this.doEvent = doEvent;
        
        // uniform interface for both tests & groups for accessing the group & event emitter
        this.group = this;
        this.doWriterEvent = function() {
            doWriterEvent.apply(this,u.toArray(arguments));
        };

        this.clear();
    };

    TestGroup.prototype = {
        constructor: TestGroup,
        // Add a new test to this group. This can be a Test object, or a 
        // add: function(name [,description],func)
        add: groupAddTest,
        // run the tests that have been added to this test group
        // return the group object, which is also a promise that resolves when 
        // the group is finished running.
        run: groupRun,
        // a promise that resolves when a "run" operation finishes 
        then: function() {
            return this.promise.then.apply(this,u.toArray(arguments));
        },
        configure: function(options) {
            if (typeof options === 'string') {
                options = {name: options};
            }
            var allowed = u.extend({},groupDefaults);
            u.extend(allowed,options,true);
            u.extend(this,allowed);
            return this;
        },
        reset: function() {
            this.promise=when.defer();
            this.passed=null;
            return this;
        },
        clear: function() {
            this.tests = [];
            this.reset();
            return this;
        },
        // activate a named writer
        writer: function(id /*,writer-args*/) {
            var w,
                proto = iqtestApi.writers[id];
            if (!proto) {
                throw("There is no output writer with id '{0}'".format(w));
            }

            w=construct(proto,u.toArray(arguments,1));
            w.owner=this;
            this.writers.push(w);
            return this;
        },
        // events
        groupStart: u.donothing,
        groupEnd: u.donothing
    };

    // A test object. After running tests, the "results" contains an array of strings describing
    // failures.
    Test = function (options) {
        var me=this;

        u.extend(me, testDefaults);
        u.extend(me, options, true);
        me.id=null;
        me.group=null;
        me.clear();

        this.doWriterEvent = function() {
            doWriterEvent.apply(this,u.toArray(arguments));
        };
    };

    Test.prototype =  {
        constructor: Test,
        // set timeout only for the next test
        impl: {},      
        reset: function() {
            u.extend(this, {
                //domino: when.defer(),
                promise: when.defer(),
                results: [],
                count: 0,
                countPassed: 0,
                countFailed: 0,                
                nextThen: [],
                cbPromise: null,
                resolver: null,
                stopped: false,
                passed: null

            });

            // resolve immediately to start the chain when the first thing is added
            this.promise.resolve();
        },
        clear: function() {
            this.setDebug(false);
            this.userPromises={};
        },
        setDebug: function(active,count) {
            this.debug=u.isBool(active) ? active : true;
            when.debug = this.debug;
            if (active) {
                if (typeof count==='number') {
                    this.debugCount= count;
                }
            } else {
                this.debugCount=-1;
            }
        },
        nextIsProblemAssertion: function() {
            return this.debug && !this.stopped && this.debugCount>=0 
                && this.debugCount === this.count-1;
        },
        timeoutOnce: function(seconds) {
            var me=this,
                originalTimeout = me.timeout;
            me.then(function() {
                me.timeout = seconds;
            });
            me.afterNext(function() {
                me.timeout = originalTimeout;
            });
        },
        // set options for this test 
        configure: function(options) {
            if (typeof options === 'string') {
                options = {name: options};
            }
            var allowedOpts =u.extend({},testDefaults);
            // update with current options, then with options passed
            u.extend(allowedOpts,this,options,true);
            u.extend(this,allowedOpts);
        },
        // queue a callback to attach to the next thing queued.
        then: function(callback,errFunc) {
            var me=this,       
                errback=errFunc || function(err) {
                    // failures of everything end up here - if we've already broken for a particular reason then 
                    // stop logging all the inevitable timeouts.
                    me.testerror(err,false);
                },
                prev = me.promise,
                next = when.defer();
            
            me.promise = next;
            prev.then(function(val) {

                try {
                    if (me.nextIsProblemAssertion()) {
                        // the next event is the one causing you trouble
                        debugger;
                    }
                    callback(val);
                }
                catch(err){
                    me.testerror("An error occurred during a 'then' clause of an assertion: "+String(err),true);
                }
            },errback);

            
            when.chain(prev,next);           

            return me;
        },
        chain: function(callback,errback) {
            var next = when.defer(),
                prev = this.promise;

            this.promise = next.promise;
            prev.then(callback,errback || bind(this,this.testerror));
            when.chain(prev,next);
            return this;
        },
        //TODO
        afterNext: function(callback,errback) {
            this.nextThen.push({callback:callback, errback:errback});
        },
        startTest: function (info) {
            this.count++;
            // cache the active assertion data
            this.assertionInfo = u.extend({},info,
            {
                count: this.count
            });
            this.doWriterEvent("itemStart",this.assertionInfo);
            this.itemRunning=true;
        },
        endTest: function (result) {
            // TODO: Option allowing logging of passed tests
            var output=result;
            if (!this.itemRunning) {
                this.testerror("Error: test was not running when endTest called: " + result.desc);
                return;
            }
            if (!result.passed) {
                output=this.addResult(result);
                this.countFailed++;
            } else {
                this.countPassed++;
            }
            this.itemRunning=false;
            this.doWriterEvent("itemEnd",output);
        },
        // queue a test that returns true or false
        // will wrap it & pass on to queueTest
        queueBooleanTest: function(module,assertion,args,invert) {
            // make a copy of the object to keep in this closure
            var testArgs = u.toArray(args);
            return this.queueTest(function() {
                var result= module.apply(null,testArgs);

                if (result.passed === invert) {
                    throw({
                        name: "AssertionError",
                        type: "iq",
                        message: u.format(result.err.replace('{not}','{0}'),invert?'not ':'')
                    });
                }
            },
            assertion,
            args);
        },
        // queue a test that throws an error
        queueTest: function(module,assertion,args)
        {
            var me=this, 
                // internal methods are wrapped in tryTest - get their args as the 2nd arg in "args." Argh!
                cbPos, 
                assertionName=assertion.split('.')[1],
                methodArgs=assertionData[assertionName].args,
                hasMagicCallback,
                deferred,
                next,prev,
                pending=[];

            if (me.stopped) {
                return me;
            }

            // check for the "magic" callback. If me.cbPromise exists, then it was hopefully created by the parameters
            // for this method. This is slightly brittle because there's no direct binding of the particular promise to 
            // this particular method, but the single-threaded nature of javascript should cause this to work fine. 
            // I can't see any substantive risk here and it is extraordinarily convenient.

            if (me.cbPromise) {
                hasMagicCallback=true;
                deferred = deferred || when.defer();

                if (methodArgs===1) {
                    cbPos=0;
                } else if (args[0] && !args[1]) {
                    cbPos=1;
                } else if (args[1] && !args[0]) {
                    cbPos=0;
                } else {
                    me.testerror(u.format('I couldn\'t figure out what to do with your magic callback. ' 
                        + 'For this test you may need to define it explicitly.'
                        + '[{0}] {1}',assertion,assertMessage(args)));
                    return;
                }

                me.cbPromise.then(function(response) {
                    args[cbPos]=response;
                },function(err) {
                    deferred.reject('The callback failed. ' + (err ? u.format('Reason: {0}',String(err)) :''));
                });
                pending.push(me.cbPromise);
                me.cbPromise=null;
            }

            // special case - must check argument for "resolves"

            if (assertionName==='resolves' && !when.isPromise(args[0])) {
                throw("The argument passed to 'resolves' was not a promise.");
            }

            // check all the arguments to this assertion for promises or callbacks; if any are found,
            // add to our list of things to do before resolving this assertion.

            u.each(args,function(i,arg) {

                // wait for any promises
                if (when.isPromise(arg)) {

                    deferred = deferred || when.defer();

                    if (i===0 && hasMagicCallback) {
                        deferred.reject("You're using magic callback but you've also defined a promise as the first argument of your assert.");
                    }
                    arg.then(function(response)
                    {
                        args[i]=response;
                    });
                    pending.push(arg);
                }

            });

            // queue a promise that will emit events when the test has started.
           
            this.chain(function() {
                me.startTest({
                    desc: assertMessage(assertion,args),
                    assertion: assertion
                });
            });
            

            // if there are pending promises, then wait for all those events (in addition to the last promise)
            // before resolving. Add a timeout on top of it if necessary.

            if (pending.length) {
                pending.push(me.promise);
                
                me.promise = me.timeout ? 
                    when_timeout(deferred.promise,me.timeout*1000):
                    deferred.promise;

                when.chain(when.all(pending),deferred);
            } 


            // link each test to a new resolver so failures will break the chain at that point
            // some tests don't have an "actual" part (e.g. pass,fail).  

            next = when.defer();
            prev = me.promise;
            me.promise = next.promise;
            prev.then(function resolve(value) {
                // check if a value was passed - it is likely the cb parm
                if (me.runTest.call(me,module,assertion,args)) {
                     next.resolve();
                } else {
                     next.reject("The test failed");
                }
            },function reject(err) {
                if (me.itemRunning) {
                    me.endTest({ 
                        passed: false,
                        err: String(err)
                    });
                }
                next.reject("The test was stopped because an assertion failed.");
            });


            
            //me.resolver=deferred.resolver;
            
            return me;
        },
        // run a named test using the arguments in array args
        runTest: function (module,assertion,args) {
            // should return an object [err: error message, desc: description of test passed in]
            var result={
                assertion: assertion,
                err: '',
                passed: true
            };

            //args is an object mapped to the relevant parms for any assert
            try {
               module.apply(null, args);    
            }
            catch(err)
            {
                // rethrow anything that isn't a test failure - it will be caught and dealt with higher up.
                if (err.name !== 'AssertionError') {
                    if (this.debug) {
                        debugger;
                        // Continue execution to try the assertion again
                        module.apply(null, args);  
                    } else {
                        this.setDebug();
                        err.message = (err.message || err.type) + ". Debugging has been enabled.";
                    }
                }
                if (err.type==='iq') {
                    err.message = u.format('[{0}] {1}',assertion,err.message);
                }
                result.err = err.message;
                result.passed=false;
            }
            
            this.endTest(result);
            return result.passed;
        },
        /// add the current test results as properties to the object passed in 
        addResult: function (result) {

            var output = u.extend({}, result),
                    passfail = output.passed ?
                     "passed" :
                     "failed";

            // "Test #[1] [assertEq] [passed|failed] [with result "message"] [in test "test"]

            output.count = this.count;
            output.fulltext = u.format('Test #{0} {1} {2} {3}{4}',
                    this.count,
                    this.assertionInfo.assertion,
                    passfail,
                    output.passed ? 
                        '' : 
                        ': ' + result.err,
                    
                    u.format(' in test "{0}"', this.assertionInfo.desc) 
                        
                    );

            this.results.push(output);
            return output;

        },
        
        // when the debugging parm is true, will enable debugging for the group
        testerror: function(err, debug) {
            var me=this;
            try {
                
                if (me.stopped) {
                    return;
                }
                me.stopped=true;
                me.passed=false;
                
                this.doWriterEvent("testLog",
                    u.format('{0}. {1}',String(err),
                        debug ? 'Debugging is enabled if you start again.' : '' ));
            }
            catch(e) {
                // this is basically a fatal error. Not much else to do.
                debugger;
                 
            }

            if (debug) {
                me.setDebug(true,me.count);
            }
            

        },

        // create a callback that the next assert will wait for, optionally expiring.
        callback: function(target,timeout) {
            var me=this,
                t = timeout || me.timeout,
                deferred = when.defer();

            // if no timeout is specified, the actual function is already wrapped by a timeout so not needed

            me.cbPromise= 
                t ? 
                 when_timeout(deferred, t * 1000) :
                 deferred;

            return function() {
                var value;
                if (!target) {
                    value=true;
                } else {
                    if (me.debug) {
                        value=target.apply(this,u.toArray(arguments));
                    } else {
                        try
                        {
                            value=target.apply(this,u.toArray(arguments));
                        }
                        catch(err)
                        {
                            me.testerror("An error occurred in your callback(): "+String(err),true);
                            deferred.reject(value);
                            return;
                        }
                    }
                }
                deferred.resolve(value);
            };
        },
        
        /*  creates a promise bound to the resolution of a callback, and adds it to the
            assertion queue. usage (note "callback" parameter)
          
            this.when(function(callback) {
                doSomething(arg1,arg2,callback)
            }).then(function(response) {
                a.equals(expected,response)
            });
        
        */

        when: function(func,timeout) {
            var me=this,
                t=timeout || me.timeout,
                next = when.defer(),
                last = me.promise;
            

            me.promise = t ? when_timeout(next, t*1000) : next;

            // this promise will chain upon successful resolution of the callback to "next"
            // however we still need a failure handler for "last" becase an error in "func"
            // could cause it to never resolve. This is better than timing out.

            last.then(function() {
                func.call(me,next.resolve);
            }).then(null,function(err) {
                me.testerror("An error occured during a 'when' operand: " + String(err),true);
                next.reject();
            });

            return me;
        },

        // create a new deferred object (same as when.defer) and bind completion of the tests to its
        // resolution

        defer: function(callback,timeout) {
            var me = this,
                next = when.defer(),
                t = timeout || me.timeout;
            
            // just replace the active promise -- there is no dependency on the prior
            // promise because user code is responsible for resolving this promise.

            me.promise = t ? when_timeout(next, t*1000) : next;

            if (callback) {
                // we don't need to bind an error handler to the callback because this is now
                // the last promise on the chain.
                next.then(callback);
            }
            return next;
        },
        
        /**
         * Return a new promise identified by name, or an existing one with that name
         * @param  {string} name A name to identify this promist
         * @return {[type]} A new or existing promist
         */
        promises: function(name)  {
            if (typeof this.userPromises[name]==='undefined') {
                this.userPromises[name]=when.defer();
            }
            return this.userPromises[name];
        },
        // return a promise from a function that has a callback parameter
        backpromise: function(func,callback,timeout) {
            var defer=when.defer(),
                me=this,
                t=timeout || me.timeout,
                cb=function() {
                    var value;
                    if (callback) {
                        if (me.debug) {
                            value=callback.apply(this,u.toArray(arguments));
                        } else {
                            try
                            {
                                value=callback.apply(this,u.toArray(arguments));
                            }
                            catch(err)
                            {
                                me.testerror("An error occurred in your backpromise() callback: "+err,true);
                                defer.reject(value);
                                return;
                            }
                        }
                    }
                    defer.resolve(value);
                };
            
            if (me.debug) {
                func.call(me,cb);
            } else {
                try
                {
                    func.call(me,cb);
                }
                catch(err)
                {
                    me.testerror("An error occurred in your backpromise() function: "+err,true);
                    defer.reject();
                    return;
                }
            }

            
            return t ? when_timeout(defer, t*1000) : defer;
        }

    };

    // Global configuration

    options = u.extend({},globalDefaults);

    // PUBLIC API

    iqtestApi =  {
        // Create & return a new test group and configure with the options passed
        create: function(name,desc,groupOpts) {
            var finalOpts = u.extend({
                timeout: options.timeout,
                setup: options.setup,
                teardown: options.teardown
            },groupOpts);

            var group = new TestGroup(name,desc,finalOpts);
            return group;
        },
        add: function () {
            return this.add.apply(this,u.toArray(arguments));
        },
        extend: function(assertions) {
            iq_asserts.push(assertions);
        },
        // configure global options.
        configure: function(newOpts) {
            u.extend(options,newOpts,true);
        },
        options: options,
        // library of available writers; each should be a prototype that can be instantiated and exposing the
        // correct api (see html implementation)
        writers: {},
        impl: {
            TestGroup: TestGroup,
            Test: Test,
            Assert: Assert,
            utility: u
        }
    };
    return iqtestApi;
});
}(typeof define === 'function'
    ? define
    : function (deps, factory) { 
        if (typeof module !== 'undefined') {
            module.exports = factory(require('./when'),
                require('./timeout'),
                require('./buster-assertions'),
                require('./common.utils')
                );
        } else {
            if (!this.iqtest_assertions) {
                this.iqtest_assertions=[];
            } 
            this.iqtest = factory(this.common.utils,this.when,this.when_timeout,this.iqtest_assertions, 
                this.buster ? this.buster.assert : null);
        }
    }
)); /*
Assertions for IQ Test (other than buster)
This requires iqtest to use its utility methods so must be included afterwards

Each assertion should throw an error when called with no args: "Expected 1 argument[s]"
This is necessary for iqtest to determine the position of the "message" argument
 */

/*jslint eqeqeq:false */
/*global define, require, module */

 (function(define) {
define(function(iqtest) {
    var u=iqtest.impl.utility,
        output = u.formatAssert;

    // return true if exactly equal, or are not value types (e.g. ignore non-value types)
    function valuesEqual(expected,actual) {
        if (expected===actual) {
            return true;
        } else if (typeof expected !== typeof actual) {
            return false;
        } else if (!u.isValueType(expected)) {
            return true;
        }
    }
    function propertiesEqual(expected,actual,message, ignoreObjects) {
        var reason='',count=0,actualCount=0;
        if (typeof expected !== 'object' || typeof actual !== 'object') {
            reason = u.format('the objects are not both objects');
        } else {
            u.each(expected,function(prop,e)
            {
                if (typeof actual[prop]==='undefined') {
                    reason = u.format('the expected object has a property "{0}"" which does not exist on the actual object',prop);
                    return false;
                }
                if (ignoreObjects ?
                        !valuesEqual(actual[prop],expected[prop]) :
                        actual[prop]!==expected[prop]) {
                    reason = u.format('the expected object property "{0}" has value "{1}" which does not match the actual value "{2}"',prop,expected[prop],actual[prop]);
                    return false;
                }
                count++;
            });
            if (!reason) {
                u.each(actual,function() {
                    actualCount++;
                });
                if (count!=actualCount) {
                    reason = u.format('the expected object has {0} properties, the actual has {1}',count,actualCount);
                }
            }
        }
        return {
            passed: !reason,
            err: output(message,reason)
        };
    }

    /* Custom asserions: each should return an object with the format shown below. The err message must appear for both
        positive and negative assertions, with a parameter for adding the word "not." Use the output function to do this
        as in the example */

    function contentsEqual(expected,actual,message) {
        var result,
            reason, index,
            isArr = u.isArray(actual),
            actualArr=actual, 
            expectedArr=expected;


        // return first index at which arrays differ
        function arraysEqual(obj1,obj2) {
            for (var i=0;i<obj1.length;i++) {
                if (obj1[i]!==obj2[i]) {
                    return i;
                }
            }
            return -1;
        }
        // return the name of the nth property
        function getOrdinalName(obj,n) {
             var i=0;
             u.each(obj,function(prop,el) {
                if (i===n) {
                    return prop;
                }
            });
        }

        u.expectOpts(arguments,2);

        if (typeof actual !== typeof expected) {
            reason = u.format('the objects are {not}different types (expected is {0}, actual is {1})',typeof expected, typeof actual);
        } else if (u.isString(actual)) {
            actualArr = u.split(actual,',');
            expectedArr = u.split(expected,',');
            isArr=true;
        } else if (typeof actual !== 'object') {
            reason=u.format('are of type "{3}" which is {not}not a container',typeof actual);
        }

        if (!reason) {
            if (isArr) {
                actualArr.sort();
                expectedArr.sort();
            
                if (actualArr.length !== expectedArr.length) {
                    reason=u.format('the objects are {not}different lengths, expected {0} and was {1}',expectedArr.length, actualArr.length);
                } 
                else 
                {
                    
                    index=arraysEqual(actualArr,expectedArr);
                    if (index>=0) {
                        if (!isArr) {
                            index = '"'+getOrdinalName(actual,index)+'"';
                        }
                        reason=u.format('sorted objects are {not}different at element {0}, expected "{1}" vs. actual "{2}"',index,expectedArr[index],actualArr[index]);
                    }
                }
            }  else {
                result = propertiesEqual(expected,actual,message);
            }
        }
        
        return result || {
            passed: !reason,
            err: output(message,reason)
        };
    }
    /// compare only value-typed properties
    function valuePropertiesEqual(expected,actual,message) {
        u.expectOpts(arguments,2);
        return propertiesEqual(expected,actual,message,true);
    }

    return {
        // Two things should have the same contents. If this is an object, the values of each property must be identical.
        // if an array, they must have the same elements, but order is irrelevant.
        // If a string, it is split on commas and treated as a CSV. 
        collectionEquals: contentsEqual,
        propertyEquals: propertiesEqual,
        propertyValueEquals: valuePropertiesEqual
    };


});
}(typeof define === 'function'
    ? define
    : function (factory) { 
        if (typeof module !== 'undefined') {
            module.exports = factory(require('./iqtest'));
        } else {
            this.iqtest_assertions.push(factory(this.iqtest));
        }
    }
    // Boilerplate for AMD, Node, and browser global
));


/*
	An HTML output writer for iqtest

	Uses options on the TestGroup:
	groupTemplate: {name} = group name
	testTemplate: {name} = test name, {desc} = simple failure description
	itemTemplate: {fulltext} 

	This should append itself to iqtest.writers.xxx

*/
/*global iqtest, when */
/*jslint smarttabs:true  */

(function(iqtest) {
	var u = iqtest.impl.utility,
		options = {
			group:'<pre><h1>Starting test group "<span class="test-name"></span>": <span class="test-groupstatus"></span></h1>'+
				'<div><div></div></div></pre>',
			testStart: '<h2>Starting test "<span class="test-name"></span>": <span class="test-teststatus"></span></h2><div></div>',
			testEnd: '<h3><span class="test-count"></span> assertions passed.</h3>',
			itemStart: '<span style="color: blue;font-style: italic;">#<span class="test-number"></span>: '
					+'<span class="test-assertion"></span> "<span class="test-message"></span>"....</span><br/>',
			itemEnd: '<span class="test-failmessage"></span><br/>',
			log: '<span style="color:purple"><span class="test-logmessage"></span><br/>',
			// the following are just formats 
			resultSuccess: '<span style="color:green"></span>',
			resultFail:'<span style="color:red"></span>',
			showPassed: false
			
		};
	
	// replace every element in "el" containing class "test-*" with the value of properties "*"
	function tmpReplace(el,obj){
		var sel,replaceEl,prop;
		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				sel = '.test-'+prop.toLowerCase();
				replaceEl = $(sel,el);
				if (!replaceEl.length) {
					replaceEl=$(el).filter(sel);
				}
				replaceEl.empty().append(obj[prop]);				
			}
		}
		return el;
	}

	function getResultOutput(passed) {
		var tmpl = passed ? options.resultSuccess: options.resultFail;
		
		return $(tmpl).text(passed ? "Passed":"Failed");
	}

	/* Implementation */

	function groupStart(group) {
		var groupWrapper = tmpReplace($(options.group).clone(),{
			name: group.name,
			groupstatus: "Running"
		});

		this.container.append(groupWrapper);
		
		// should be the innermost div
		this.groupWrapper = groupWrapper;
		this.groupContainer = $(u.last(groupWrapper.find('div:only-child')));
	}
	function groupEnd(group) {
		tmpReplace(this.groupWrapper,{
			groupstatus: getResultOutput(group.passed)
		});
	}

	function testStart(test) {
			
		var testData = this.getTestData(test.id),
			content= tmpReplace($(options.testStart).clone(),{
				name: test.name,
				teststatus: "Running"
			});

		testData.testWrapper = content;
		testData.testContainer = content.filter('div');

		this.groupContainer.append(content);
	}

	function testEnd(test) {
		var testData = this.getTestData(test.id),
			content = tmpReplace($(options.testEnd).clone(),{
				count: test.count
			});

		testData.testContainer.append(content);
		
		tmpReplace(testData.testWrapper, {
			teststatus: getResultOutput(test.passed)
		});
	}

	function itemStart(test,testinfo)
	{
		var testData = this.getTestData(test.id),
			tempItem= tmpReplace($(options.itemStart).clone(),{
				number: testinfo.count,
				assertion: testinfo.assertion,
				message: testinfo.desc
			});

		testData.itemTarget = tempItem;
		testData.testContainer.append(tempItem);
	}
	function itemEnd(test,response) {
		// this can get called without itemStart (prob should create a different kind of event for errors but...)
		var testData = this.getTestData(test.id);

		if (response.passed) {
			if (!options.showPassed) {
				testData.itemTarget.remove();
			}
		} else {
			testData.itemTarget.replaceWith(tmpReplace($(options.itemEnd).clone(),{
				failmessage: response.fulltext
			}));
		}
		testData.itemTarget=null;
		response.written=true;
	}
	function testLog(test,message) {
		var testData = this.getTestData(test.id);
		testData.testContainer.append(tmpReplace($(options.log).clone(),{
			logmessage: message
		}));
	}
	//	function render() {
	//	var me=this;

	//	u.each(me.results,function(i,result) {
	//		if (!result.written) {
	//		.event(this.group.itemEnd,this.group,result);
	//	}
	//	});
	//	}

	// ensure that errors don't ever cause a promise to fail. errors in the harness should always
	// cause execution to stop.

	function safeMethod(method) {
		return function() {
			try {
				method.apply(this,u.toArray(arguments));
			}
			catch(err) {
				when.debug=true;
				throw err;
			}
		};
	}
	function HtmlWriter(container, opts) {
		// when added to a TestGroup, the group should assign itself to owner
		this.owner=null;
		this.container=container;
		this.tests={};

		if (typeof opts==='object') {
			$.extend(options,opts);
		}
	}

	HtmlWriter.prototype = {
		constructor: HtmlWriter,
		groupStart: safeMethod(groupStart),
		groupEnd: safeMethod(groupEnd),
		testStart: safeMethod(testStart),
		testEnd: safeMethod(testEnd),
		itemStart: safeMethod(itemStart),
		itemEnd: safeMethod(itemEnd),
		testLog: safeMethod(testLog),
		// internal api
		getTestData: function(id) {
			if (!this.tests[id]) {
				this.tests[id]={};
			}
			return this.tests[id];
		}
	};


	iqtest.writers.html = HtmlWriter;

}(iqtest));

