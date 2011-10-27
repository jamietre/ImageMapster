/* ImageMapster 1.2.5 b23

Copyright 2011 James Treworgy
http://www.outsharked.com/imagemapster
https://github.com/jamietre/ImageMapster

A jQuery plugin to enhance image maps.
*/
/*
version 1.2.5
-- remove "attrmatches" to save space
-- offset 1 pixel strokes by 0.5 px to prevent the fuzzies
-- inore UI events during resize - causes issues
-- queue all methods (highlight, data, tooltip) so configuration delays don't cause problems ever
-- unbind "load" event explicitly from images added. 
-- add dynamic images to DOM instead of loading through JS
-- ignore missing keys on some operations
-- trim results of string splits so spaces don't cause problems
-- yet more tweaking of image loading detection
-- allow fade on highlight
-- Refactor "graphics" into an object and instiate for each instance. In Safari (and possibly mobile devices?)
"load" callbacks were changing event order, resulting in the single instance getting wires crossed. Isolated
each map instance completely, problem solved.
-- fix canvases re-ordered after first selection making effect sometimes inconsistent
-- fix resize bug when groups are used
-- "highlight" option
-- detect touchscreen devices
-- detect excanvas, force into !has_canvas mode if present
version 1.2.4
-- resize bug in IE <9 fixed
version 1.2.3
-- resize with multiple images affecting other images - fixed
version 1.2.2
-- firefox 6.0 context.save() bug workaround
version 1.2.1
-- Ugh, post-release bug introduced - click callback "this" - fixed
-- Replace u.isFunction with $.isFunction to save a few bytes
version 1.2
-- fixed fader problem for old IE (again, really this time)
-- allow selecting includeKeys areas from staticState areas
-- test browser features for filter vs. opacity
-- "resize" option
-- improve startup speed by eliminating need for setTimeout callback
-- address startup bug when images aren't loaded and there are lots of images
-- fixed exception when "set" with no data for key
-- bug when multiple images bound on same page 
-- another IE tweak: blur() on mouseover/click to remove browser-rendered border around area
-- some tweaks for IE regarding image borders to make appearance remain consistent across unbind/rebind
-- Fixed "onMouseover" option, added tests for onMouseover/onMouseout.
-- many performance improvements, tests, refactoring some old inefficient code. Improved memory usage.
-- fix css flickering when debinding/rebinding
-- add "scaleMap" option to automatically resize image maps when a bound image is resized dynamically.
To use: set scaleMap: true in the options. ImageMapster will automatically detect images that have been scaled from their
original size, and refactor the imagemap to match the new size. 
-- And oh yeah... now that we can easily resize everything the next thing is going to be area zooms!



See complete changelog at github


/// LICENSE (MIT License)
///
/// Permission is hereby granted, free of charge, to any person obtaining
/// a copy of this software and associated documentation files (the
/// "Software"), to deal in the Software without restriction, including
/// without limitation the rights to use, copy, modify, merge, publish,
/// distribute, sublicense, and/or sell copies of the Software, and to
/// permit persons to whom the Software is furnished to do so, subject to
/// the following conditions:
///
/// The above copyright notice and this permission notice shall be
/// included in all copies or substantial portions of the Software.
///
/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
/// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
/// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
/// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
/// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
/// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
/// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///
/// January 19, 2011

*/

/*jslint eqeqeq: false */
/*global jQuery: true, Zepto: true */

if (window.Zepto) {
    jQuery = Zepto;
    (function ($) {
        $.trim = function (str) { return str.replace(/^\s+/, '').replace(/\s+$/, ''); };
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
        $.fn.elOrEmpty = function () { return this.length ? this[0] : {}; };
        $.fn.outerWidth = function () { return this.elOrEmpty().outerWidth; };
        $.fn.outerHeight = function () { return this.elOrEmpty().outerHeight; };
        $.fn.position = function () { var e = this.elOrEmpty(); return { left: e.left, top: e.top }; };
        $.browser = {};
        $.browser.msie = false;
    } (jQuery));
}



(function ($) {
    var methods;
    $.fn.isJquery = $.fn.isJquery || true;
    $.fn.mapster = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.bind.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.mapster');
        }
    };

    $.mapster = {};
    $.mapster.version = "1.2.5b23";
    // utility functions
    $.mapster.utils = {
        // return four outer corners
        areaCorners: function (coords, left, top) {
            var minX, minY, maxX, maxY, curX, curY, j;

            minX = 999999;
            minY = minX;
            maxX = -1;
            maxY = -1;

            for (j = coords.length - 2; j >= 0; j -= 2) {
                curX = parseInt(coords[j], 10);
                curY = parseInt(coords[j + 1], 10);
                if (curX < minX) {
                    minX = curX;
                }
                if (curX > maxX) {
                    maxX = curX;
                }

                if (curY < minY) {
                    minY = curY;
                }
                if (curY > maxY) {
                    maxY = curY;
                }

            }
            return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
        },
        area_corner: function (coords, left, top) {
            var bestX, bestY, curX, curY, j;

            bestX = left ? 999999 : -1;
            bestY = top ? 999999 : -1;

            for (j = coords.length - 2; j >= 0; j -= 2) {
                curX = parseInt(coords[j], 10);
                curY = parseInt(coords[j + 1], 10);

                if (top ? curY < bestY : curY > bestY) {
                    bestY = curY;
                    if (left ? curX < bestX : curX > bestX) {
                        bestX = curX;
                    }
                }
            }
            return [bestX, bestY];
        },
        split: function (text) {
            var arr = text.split(',');
            return $.each(arr, function (i) {
                arr[i] = $.trim(arr[i]);
            });
        },
        setOpacity: function (e, opacity, ie) {
            if (ie) {
                e.style.filter = "Alpha(opacity=" + String(opacity * 100) + ")";
            } else {
                e.style.opacity = opacity;
            }
        },
        // sorta like $.extend but limits to updating existing properties on the base object. If the base object is null, then it will
        // be limited to the properties of the FIRST object.
        // (options,target,source,source,...)
        // options: target: target object
        //          source: sorce object or objects
        //          include="xxx,yyy" - csv of properties to include
        //          ignore="xxx,yyy" - csv of props to ignore
        //          template: an object to use as a template. it will be copied under the target before any other processing.
        //            when a template is provided "add" defaults to false.
        //          add = true | false -- when true, will add properties -- default TRUE
        //          
        // returns - new object.
        mergeObjects: function (options) {
            var obj, i, len, prop, u = this,
	                add = this.boolOrDefault(options.add, options.template ? false : true),
	                ignore = options.ignore ? u.split(options.ignore) : '',
	                include = options.include ? u.split(options.include) : '',
	                deep = options.deep ? u.split(options.deep) : '',
	                target = options.target || {},
	                source = [].concat(options.source);
            if (options.template) {
                target = this.mergeObjects({ target: {}, source: [options.template, target] });
            }
            len = source.length;
            for (i = 0; i < len; i++) {
                obj = source[i];
                if (obj) {
                    for (prop in obj) {
                        if ((!ignore || $.inArray(prop, ignore) < 0)
	                          && (!include || $.inArray(prop, include) >= 0)
	                          && obj.hasOwnProperty(prop)
	                          && (add || target.hasOwnProperty(prop))) {

                            if (deep && $.inArray(prop, deep) >= 0 && typeof obj[prop] === 'object') {
                                if (typeof target[prop] !== 'object' && add) {
                                    target[prop] = {};
                                }
                                this.mergeObjects({ target: target[prop], source: obj[prop], add: add });
                            } else {
                                target[prop] = this.clone(obj[prop]);
                            }
                        }
                    }
                }
            }
            return target;
        },
        // simple clone (non-deep) - ensures that arrays and objects are not passed by ref
        clone: function (obj) {
            var prop, i, target, len;
            if ($.isArray(obj)) {
                target = [];
                len = obj.length;
                for (i = 0; i < len; i++) {
                    target.push(obj[i]);
                }
            } else if (obj && obj.clone) {
                target = obj.clone();
            } else if (typeof obj === 'object' && obj && !obj.nodeName) {
                target = {};
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        target[prop] = obj[prop];
                    }
                }
            } else {
                target = obj;
            }
            return target;
        },
        isElement: function (o) {
            return (typeof HTMLElement === "object" ? o instanceof HTMLElement :
               o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string");
        },
        arrayIndexOfProp: function (arr, prop, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] && arr[i][prop] === obj) {
                    return i;
                }
            }
            return -1;
        },
        // returns "obj" if true or false, or "def" if not true/false
        boolOrDefault: function (obj, def) {
            return this.isBool(obj) ?
                obj : def || false;
        },
        isBool: function (obj) {
            return typeof obj === "boolean";
        },
        isFunction: function (obj) {
            return obj && typeof obj === 'function';
        },
        // evaluates "obj", if function, calls it with args
        // (todo - update this to handle variable lenght/more than one arg)
        ifFunction: function (obj, that, args) {
            if ($.isFunction(obj)) {
                obj.call(that, args);
            }
        },
        // recycle empty array elements
        arrayReuse: function (arr, obj) {
            var index = $.inArray(null, arr);
            if (index < 0) {
                index = arr.push(obj) - 1;
            } else {
                arr[index] = obj;
            }
            return index;
        },
        // iterate over each property of obj or array, calling fn on each one
        each: function (obj, fn) {
            var i, l;
            if (obj.constructor === Array) {
                l = obj.length;
                for (i = 0; i < l; i++) {
                    if (fn.call(obj[i], i) === false) {
                        return false;
                    }
                }
            } else if (obj) {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        if (fn.call(obj[i], i) === false) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        getScaleInfo: function (realW, realH, width, height) {
            var pct;
            if (!width && !height) {
                pct = 1;
            } else {
                pct = width / realW || height / realH;
                // make sure a float error doesn't muck us up
                if (pct > 0.98 && pct < 1.02) { pct = 1; }
            }
            return {
                scale: (pct !== 1),
                scalePct: pct,
                realWidth: realW,
                realHeight: realH,
                width: width,
                height: height,
                ratio: width / height
            };
        },
        // Scale a set of AREAs, return old data as an array of objects
        scaleMap: function (image, scale, callback) {
            var imgCopy, realH, realW, width, height, img = $(image),
                me = this;
            if (!img.length) { return; }

            width = img.width();
            height = img.height();

            function getSize() {
                if (!realH) {
                    realH = this.height;
                    realW = this.width;
                    callback(me.getScaleInfo(realW, realH, width, height));
                }
            }
            if (scale) {
                imgCopy = new Image();
                imgCopy.onload = getSize;
                imgCopy.src = image.src;
                if (imgCopy.width && imgCopy.height) {
                    getSize.call(imgCopy);
                }
            } else {
                realH = height;
                realW = width;
            }
        },
        isImageLoaded: function (img) {
            if (typeof img.complete !== 'undefined' && !img.complete) {
                return false;
            }
            if (typeof img.naturalWidth !== 'undefined' &&
                            (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                return false;
            }
            return true;
        },
        // thanks paul irish
        imageLoaded: function (images, callback) {
            var elems = images && images.isJquery ? images.filter('img') : $(images),
            //elems = this.filter('img'),
                  len = elems.length;

            elems.bind('load.mapster', function () {
                if (--len <= 0) {
                    callback.call(this);
                }
            }).each(function () {
                // cached images don't fire load sometimes, so we reset src.
                if (this.complete ||
                    (typeof this.complete === 'undefined' && (this.naturalWidth === 0 || this.naturalHeight === 0))) {
                    var src = this.src;
                    // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
                    // data uri bypasses webkit log warning (thx doug jones)
                    this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                    this.src = src;
                }
            });
        },
        fader: (function () {
            var elements = [],
                lastKey = 0,
                fade_func = function (el, op, endOp, duration, ie) {
                    var index, u = $.mapster.utils, obj;
                    if (typeof el === 'number') {
                        index = u.arrayIndexOfProp(elements, 'key', el);
                        if (index === -1) {
                            return;
                        } else {
                            obj = elements[index].element;
                        }
                    } else {
                        index = u.arrayIndexOfProp(elements, 'element', el);
                        if (index >= 0) {
                            elements[index] = null;
                        }
                        obj = el;
                        el = ++lastKey;
                        u.arrayReuse(elements, { "element": obj, "key": el });
                    }
                    endOp = endOp || 1;

                    op = (op + (endOp / 10) > endOp - 0.01) ? endOp : op + (endOp / 10);

                    u.setOpacity(obj, op, ie);
                    if (op < endOp) {
                        setTimeout(function () {
                            fade_func(el, op, endOp, duration, ie);
                        }, duration ? duration / 10 : 15);
                    }
                };
            return fade_func;

        } ())

    };
    $.mapster.default_tooltip_container = function () {
        return '<div class="mapster-tooltip" style="border: 2px solid black; background: #EEEEEE; position:absolute; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
        '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; ' +
        'border-radius: 6px 6px 6px 6px;"></div>';
    };
    $.mapster.render_defaults =
    {
        fadeDuration: 150,
        altImage: null,
        altImageOpacity: 0.7,
        fill: true,
        highlight: null,     // let device type determine highlighting
        fillColor: '000000',
        fillColorMask: 'FFFFFF',
        fillOpacity: 0.5,
        stroke: false,
        strokeColor: 'ff0000',
        strokeOpacity: 1,
        strokeWidth: 1,
        includeKeys: '',
        alt_image: null // used internally
    };

    $.mapster.defaults = $.mapster.utils.mergeObjects({ source:
    [{
        render_highlight: {},
        render_select: { fade: false },
        fade: true,
        staticState: null,
        selected: false,
        isSelectable: true,
        isDeselectable: true,
        singleSelect: false,
        wrapClass: null,
        wrapCss: null,
        onGetList: null,
        sortList: false,
        listenToList: false,
        mapKey: '',
        mapValue: '',
        listKey: 'value',
        listSelectedAttribute: 'selected',
        listSelectedClass: null,
        showToolTip: false,
        toolTipFade: true,
        toolTipClose: ['area-mouseout'],
        toolTipContainer: $.mapster.default_tooltip_container(),
        onClick: null,
        onMouseover: null,
        onMouseout: null,
        onStateChange: null,
        onShowToolTip: null,
        boundList: null,
        onCreateTooltip: null,
        onConfigured: null,
        configTimeout: 10000,
        noHrefIsMask: true,
        scaleMap: true,
        safeLoad: false,
        areas: []
    }, $.mapster.render_defaults]
    });
    $.mapster.area_defaults =
        $.mapster.utils.mergeObjects({
            source: [$.mapster.defaults, {
                toolTip: '',
                includeKeys: '',
                isMask: false
            }],
            deep: "render_highlight, render_select",
            include: "fade,fadeDuration,highlight,fill,fillColor,fillOpacity,stroke,strokeColor,strokeOpacity,strokeWidth,staticState,selected,"
            + "isSelectable,isDeselectable,render_highlight,render_select,isMask,toolTip"
        });

    $.mapster.impl = (function () {
        var me = {},
        AreaData, MapData, MapArea, Method, Graphics,
        u = $.mapster.utils,
        ie_config_complete = false,
        has_canvas = null,
        is_touch = null,
        windowLoaded = false,
        canvas_style =
        {
            position: 'absolute',
            left: 0,
            top: 0,
            padding: 0,
            border: 0
        };
        me.map_cache = [];
        function addMap(map_data) {
            return me.map_cache.push(map_data) - 1;

        }
        function removeMap(map_data) {
            me.map_cache.splice(map_data.index, 1);
            for (var i = me.map_cache.length - 1; i >= this.index; i--) {
                me.map_cache[i].index--;
            }
        }
        // for safari
        $(window).bind('load', function () {
            windowLoaded = true;
            $(me.map_cache).each(function () {
                if (!this.complete && this.isReadyToBind()) {
                    this.initialize();
                }
            });
        });
        me.test = function (obj) {
            return eval(obj);
        };
        /// return current map_data for an image or area
        function get_map_data_index(obj) {
            var img, id;
            switch (obj.tagName && obj.tagName.toLowerCase()) {
                case 'area':
                    id = $(obj).parent().attr('name');
                    img = $("img[usemap='#" + id + "']")[0];
                    break;
                case 'img':
                    img = obj;
                    break;
            }
            return img ?
                u.arrayIndexOfProp(me.map_cache, 'image', img) : -1;
        }
        function get_map_data(obj) {
            var index = get_map_data_index(obj);
            if (index >= 0) {
                return index >= 0 ? me.map_cache[index] : null;
            }
        }

        // Causes changes to the bound list based on the user action (select or deselect)
        // area: the jQuery area object
        // returns the matching elements from the bound list for the first area passed (normally only one should be passed, but
        // a list can be passed
        function setBoundListProperties(opts, target, selected) {
            target.each(function () {
                if (opts.listSelectedClass) {
                    if (selected) {
                        $(this).addClass(opts.listSelectedClass);
                    } else {
                        $(this).removeClass(opts.listSelectedClass);
                    }
                }
                if (opts.listSelectedAttribute) {
                    $(this).attr(opts.listSelectedAttribute, selected);
                }
            });
        }
        function getBoundList(opts, key_list) {
            if (!opts.boundList) {
                return null;
            }
            var index, key, result = $(), list = key_list.split(',');
            opts.boundList.each(function () {
                for (index = 0; index < list.length; index++) {
                    key = list[index];
                    if ($(this).is('[' + opts.listKey + '="' + key + '"]')) {
                        result = result.add(this);
                    }
                }
            });
            return result;
        }

        // EVENTS

        function queue_command(map_data, that, command, args) {
            if (!map_data) {
                return false;
            }
            if (!map_data.complete) {
                map_data.commands.push(
                {
                    that: that,
                    command: command,
                    args: args
                });
                return true;
            }
            return false;
        }

        // NOT IMPLEMENTED
        //        function list_click(map_data) {
        //            //

        //        }
        //        

        // Config for object prototypes
        // first: use only first object (for things that should not apply to lists)
        /// calls back one of two fuinctions, depending on whether an area was obtained.
        // opts: {
        //    name: 'method name',
        //    key: 'key,
        //    args: 'args'
        //
        //}
        // name: name of method
        // args: arguments to re-call with 
        // Iterates through all the objects passed, and determines whether it's an area or an image, and calls the appropriate
        // callback for each. If anything is returned from that callback, the process is stopped and that data return. Otherwise,
        // the object itself is returned.
        Method = function (that, func_map, func_area, opts) {
            var me = this;
            me.output = that;
            me.input = that;
            me.first = opts.first || false;
            me.args = opts.args ? Array.prototype.slice.call(opts.args, 0) : null;
            me.key = opts.key;
            me.name = opts.name;
            me.func_map = func_map;
            me.func_area = func_area;
            //$.extend(me, opts);
            me.name = opts.name;

        };
        Method.prototype.go = function () {
            var i, data, ar, len, result, src = this.input,
                area_list = [],
                me = this;
            len = src.length;
            for (i = 0; i < len; i++) {
                data = get_map_data(src[i]);
                if (data) {
                    if (queue_command(data, this.input, this.name, this.args)) {
                        if (this.first) {
                            result = '';
                        }
                        continue;
                    }
                    ar = data.getData(src[i].nodeName === 'AREA' ? src[i] : this.key);
                    if (ar) {
                        if ($.inArray(ar, area_list) < 0) {
                            area_list.push(ar);
                        }
                    } else {
                        result = this.func_map.apply(data, this.args);
                    }
                    if (this.first || typeof result !== 'undefined') {
                        break;
                    }
                }
            }
            // if there were areas, call the area function for each unique group
            $(area_list).each(function () {
                result = me.func_area.apply(this, me.args);
            });

            if (typeof result !== 'undefined') {
                return result;
            } else {
                return this.output;
            }
        };

        MapData = function (image, options) {
            var me = this;
            this.index = -1;                // index of this in map_cache - so we have an ID to use for wraper div

            this.image = image;             // (Image)  main map image
            this.options = options;         // {}       options passed buy user
            this.area_options = u.mergeObjects({
                template: $.mapster.area_defaults,
                source: options
            });
            this.bindTries = options.configTimeout / 200;

            // save the initial style of the image for unbinding. This is problematic, chrome duplicates styles when assigning, and
            // cssText is apparently not universally supported. Need to do something more robust to make unbinding work universally.
            this.imgCssText = image.style.cssText || null;

            this.initializeDefaults();

            this.mouseover = function (e) {
                var ar = me.getDataForArea(this), opts;
                if (ar && !ar.owner.resizing) {

                    opts = ar.effectiveOptions();

                    me.inArea = true;
                    if (!has_canvas) {
                        this.blur();
                    }
                    if (me.currentAreaId === ar.areaId) {
                        return;
                    }
                    me.clearEffects(true);

                    ar.highlight(!opts.highlight);


                    if (me.options.showToolTip && opts.toolTip) {
                        ar.showTooltip();
                    }
                    me.currentAreaId = ar.areaId;


                    if ($.isFunction(me.options.onMouseover)) {
                        me.options.onMouseover.call(this,
                    {
                        e: e,
                        options: opts,
                        key: ar.key,
                        selected: ar.isSelected()
                    });
                    }
                }
            };
            this.mouseout = function (e) {
                var key,
                    ar = me.getDataForArea(this),
                    opts = me.options;
                if (ar && !ar.owner.resizing) {
                    me.inArea = false;
                    me.clearEffects(false);

                    if ($.isFunction(opts.onMouseout)) {
                        opts.onMouseout.call(this,
                    {
                        e: e,
                        options: opts,
                        key: key,
                        selected: ar.isSelected()
                    });
                    }
                }
            };

            this.clearEffects = function (force) {
                var opts = me.options;
                // this is a timer callback - ensure it hasn't been unbound
                //if (!me.image) {
                //    return;
                //}
                if ((me.currentAreaId < 0 || force !== true) && me.inArea) {
                    return;
                }
                me.ensureNoHighlight();
                if (opts.toolTipClose && $.inArray('area-mouseout', opts.toolTipClose) >= 0) {
                    me.clearTooltip();
                }
                me.currentAreaId = -1;

            };
            this.click = function (e) {
                var selected, list, list_target, newSelectionState, canChangeState,
                    that = this,
                    ar = me.getDataForArea(this),
                    opts = me.options;

                e.preventDefault();
                if (!ar || ar.owner.resizing) { return; }
                if (!has_canvas) {
                    this.blur();
                }

                opts = me.options;
                function clickArea(ar) {
                    var areaOpts;
                    canChangeState = (ar.isSelectable() &&
                    (ar.isDeselectable() || !ar.isSelected()));
                    if (canChangeState) {
                        newSelectionState = !ar.isSelected();
                    } else {
                        newSelectionState = ar.isSelected();
                    }

                    list_target = getBoundList(opts, ar.key);
                    if ($.isFunction(opts.onClick)) {
                        if (false === opts.onClick.call(that,
                    {
                        e: e,
                        listTarget: list_target,
                        key: ar.key,
                        selected: newSelectionState
                    })) {
                            return;
                        }
                    }

                    if (canChangeState) {
                        selected = ar.toggleSelection();
                    }

                    if (opts.boundList && opts.boundList.length > 0) {
                        setBoundListProperties(opts, list_target, ar.isSelected());
                    }
                    areaOpts = ar.effectiveOptions();
                    if (areaOpts.includeKeys) {
                        list = u.split(areaOpts.includeKeys);
                        u.each(list, function () {
                            var ar = me.getDataForKey(this.toString());
                            if (!ar.options.isMask) {
                                clickArea(ar);
                            }
                        });
                    }
                }
                clickArea(ar);

            };
            this.graphics = new Graphics(this);

        };
        MapData.prototype.initializeDefaults = function () {
            this.images = [];               // (Image)  all images associated with this map. this will include a "copy" of the main one
            this.imageSources = [];         // (string) src for each image
            this.imageStatus = [];          // (bool)   the loaded status of each indexed image in images
            this.altImagesXref = {};        // (int)    xref of "render_xxx" to this.images
            this.map = null;                // ($)      the image map
            this.base_canvas = null;       // (canvas|var)  where selections are rendered
            this.overlay_canvas = null;    // (canvas|var)  where highlights are rendered

            this.imagesAdded = false;      // (bool)    when all images have been added, we can now test for all being done loaded
            this.imagesLoaded = false;     // (bool)    when all images have finished loading (config can proceed)
            this.complete = false;         // (bool)    when configuration is complete
            this.commands = [];            // {}        commands that were run before configuration was completed (b/c images weren't loaded)
            this.data = [];                // (MapData[]) area groups
            this.originalAreaData = [];    // ref of all coord data from areas as bound, indexed by auto-generated id during "initialize"


            // private members
            this._xref = {};               // (int)      xref of mapKeys to data[]
            this._highlightId = -1;        // (int)      the currently highlighted element.
            this.currentAreaId = -1;
            this._tooltip_events = [];     // {}         info on events we bound to a tooltip container, so we can properly unbind them
            this.scaleInfo = null;         // {}         info about the image size, scaling, defaults
            //                scale: (bool) image is scaled
            //                scalePct: pct (perctage of scale)
            //                realWidth: realW,
            //                realHeight: realH,
            //                width: width,
            //                height: height,
            //                ratio: width / height
            this.inArea = false;

        };
        // options: duration = animation time (zero = no animation)
        // force: supercede any existing animation
        // css = any css to be applied to the wrapper
        MapData.prototype.resize = function (newWidth, newHeight, effectDuration) {
            var highlightId, ratio, width, height, duration, opts = {}, newsize, els, me = this;
            if (typeof newWidth === 'object') {
                opts = newWidth;
            } else {
                opts.width = newWidth;
                opts.height = newHeight;
                opts.duration = effectDuration;
            }
            width = opts.width;
            height = opts.height;
            duration = opts.duration || 1000;

            if (me.scaleInfo.width === width && me.scaleInfo.height === height) {
                return;
            }
            highlightId = me._highlightId;

            function sizeCanvas(canvas, w, h) {
                if (has_canvas) {
                    canvas.width = w;
                    canvas.height = h;
                } else {
                    $(canvas).width(w);
                    $(canvas).height(h);
                }
            }
            function finishResize() {
                sizeCanvas(me.overlay_canvas, width, height);

                // restore highlight state if it was highlighted before
                if (opts.highlight) {
                    if (highlightId >= 0) {
                        var areaData = me.data[highlightId];
                        areaData.tempOptions = { fade: false };
                        me.getDataForKey(areaData.key).highlight();
                        areaData.tempOptions = null;
                    }
                }
                sizeCanvas(me.base_canvas, width, height);

                me.setAreasSelected();
                me.resizing = false;
                if ($.isFunction(opts.callback)) {
                    opts.callback();
                }
            }
            if (!width) {
                ratio = height / me.scaleInfo.realHeight;
                width = Math.round(me.scaleInfo.realWidth * ratio);
            }
            if (!height) {
                ratio = width / me.scaleInfo.realWidth;
                height = Math.round(me.scaleInfo.realHeight * ratio);
            }

            newsize = { 'width': String(width) + 'px', 'height': String(height) + 'px' };
            if (!has_canvas) {
                $(me.base_canvas).children().remove();
            }
            els = $(me.wrapper).find('.mapster_el');

            if (me.resizing && opts.force) {
                $(els).stop();
                //(me.wrapper).stop();
            }
            me.resizing = true;

            if (opts.duration) {
                els.animate(newsize, { duration: duration, complete: finishResize, easing: "linear" });
                $(me.wrapper).animate({
                    scrollLeft: opts.scrollLeft || 0,
                    scrollTop: opts.scrollTop || 0
                },
                { duration: duration, easing: "linear" });
            } else {
                els.css(newsize);
                finishResize();
                //                if (opts.css) {
                //                    me.wrapper.css(opts.css);
                //                }
            }
            $(this.image).css(newsize);
            // start calculation at the same time as effect
            me.scaleInfo = u.getScaleInfo(me.scaleInfo.realWidth, me.scaleInfo.realHeight, width, height);
            u.each(me.data, function () {
                u.each(this.areas, function () {
                    this.resize();
                });
            });

        };
        MapData.prototype.state = function () {
            return {
                complete: this.complete,
                resizing: this.resizing,
                zoomed: this.zoomed,
                zoomedArea: this.zoomedArea,
                scaleInfo: this.scaleInfo
            };
        };
        MapData.prototype.isReadyToBind = function () {
            return this.imagesAdded && this.imagesLoaded && (!this.options.safeLoad || windowLoaded);
        };
        // bind a new image to a src, capturing load event. Return the new (or existing) image.
        MapData.prototype.addImage = function (img, src, altId) {
            var index, image, source, me = this;

            // fires on image onLoad evetns, could mean everything is ready
            function onLoad() {
                if (me.complete) {
                    return;
                }

                index = $.inArray(this, me.images);
                if (index < 0) {
                    throw ("Unable to find ref to image '" + this.src + "'.");
                }

                me.imageStatus[index] = true;
                if ($.inArray(false, me.imageStatus) < 0 &&
                    (!me.options.safeLoad || windowLoaded)) {
                    me.initialize();
                }
            }
            function storeImage(image) {
                var index = me.images.push(image) - 1;
                me.imageSources[index] = source;
                me.imageStatus[index] = false;
                if (altId) {
                    me.altImagesXref[altId] = index;
                }
            }
            if (!img && !src) { return; }

            image = img;
            // use attr because we want the actual source, not the resolved path the browser will return directly calling image.src
            source = src || $(image).attr('src');
            if (!source) { throw ("Missing image source"); }

            if (!image) {
                image = $('<img class="mapster_el" />').hide()[0];

                //$(this.images[0]).before(image);

                //image = new Image();
                //image.src = source;

                $('body').append(image);
                storeImage(image);
                $(image).bind('load.mapster', onLoad);
                $(image).attr('src', source);

            } else {
                storeImage(image);
            }

        };
        // Wait until all images are loaded then call initialize. This is difficult because browsers are incosistent about
        // how or if "onload" works and in how one can actually detect if an image is already loaded. Try to check first,
        // then bind onload event, and finally use a timer to keep checking.
        MapData.prototype.bindImages = function (retry) {
            var alreadyLoaded = true,
                me = this;

            me.imagesAdded = true;

            if (me.complete) {
                return;
            }
            // check to see if every image has already been loaded
            u.each(me.images, function () {
                if (!u.isImageLoaded(this)) {
                    alreadyLoaded = false;
                    return false;
                }
            });
            me.imagesLoaded = alreadyLoaded;

            if (me.isReadyToBind()) {
                me.initialize();
                return;
            }

            //            for (i = 0; i < me.images.length; i++) {
            //                whenLoaded(me.images[i], onLoad);
            //            }

            // to account for failure of onLoad to fire in rare situations
            if (me.bindTries-- > 0) {
                window.setTimeout(function () {
                    me.bindImages(true);
                }, 200);
            } else {
                throw ("Images never seemed to finish loading.");
            }

        };
        MapData.prototype.altImage = function (mode) {
            return this.images[this.altImagesXref[mode]];
        };
        MapData.prototype.wrapId = function () {
            return 'mapster_wrap_' + this.index;
        };
        MapData.prototype._idFromKey = function (key) {
            return this.complete && typeof key === "string" && this._xref.hasOwnProperty(key) ?
                this._xref[key] : -1;
        };
        // getting all selected keys - return comma-separated string

        MapData.prototype.getSelected = function () {
            var result = '';
            u.each(this.data, function () {
                if (this.isSelected()) {
                    result += (result ? ',' : '') + this.key;
                }
            });
            return result;
        };
        // Locate MapArea data from an HTML area
        MapData.prototype.getDataForArea = function (area) {
            var ar,
                key = $(area).attr(this.options.mapKey);
            if (key) {
                key = u.split(key)[0];
            }
            ar = this.data[this._idFromKey(key)];
            // set the actual area moused over/selected
            // TODO: this is a brittle model for capturing which specific area - if this method was not used,
            // ar.area could have old data. fix this.
            if (ar) {
                ar.area = area.length ? area[0] : area;
            } else {
                ar.area = null;
            }
            return ar;
        };
        MapData.prototype.getDataForKey = function (key) {
            return this.data[this._idFromKey(key)];
        };
        MapData.prototype.getData = function (obj) {
            if (typeof obj === 'string') {
                return this.getDataForKey(obj);
            } else if (obj && obj.isJquery || u.isElement(obj)) {
                return this.getDataForArea(obj);
            } else {
                return null;
            }
        };
        // remove highlight if present, raise event
        MapData.prototype.ensureNoHighlight = function () {
            var ar;
            if (this._highlightId >= 0) {
                this.graphics.clear_highlight();
                ar = this.data[this._highlightId];
                ar.changeState('highlight', false);
                this._highlightId = -1;
            }
        };
        MapData.prototype.setHighlight = function (id) {
            this._highlightId = id;
        };

        // rebind based on new area options. This copies info from array "areas" into the data[area_id].area_options property.
        // it returns a list of all selected areas.
        MapData.prototype.setAreaOptions = function (area_list) {
            var i, area_options, ar,
                areas = area_list || {};
            // refer by: map_data.options[map_data.data[x].area_option_id]
            for (i = areas.length - 1; i >= 0; i--) {
                area_options = areas[i];
                ar = this.getDataForKey(area_options.key);
                if (ar) {
                    u.mergeObjects({ target: ar.options, source: area_options });
                    // TODO: will not deselect areas that were previously selected, so this only works for an initial bind.
                    if (u.isBool(area_options.selected)) {
                        ar.selected = area_options.selected;
                    }
                }
            }
        };
        MapData.prototype.setAreasSelected = function (selected_list) {
            var i;
            if (selected_list) {
                for (i = selected_list.length - 1; i >= 0; i--) {
                    this.data[selected_list[i]].setAreaSelected();
                }
            } else {
                u.each(this.data, function () {
                    if (this.isSelectedOrStatic()) {
                        this.setAreaSelected();
                    }
                });
            }
        };
        ///called when images are done loading
        MapData.prototype.initialize = function () {
            var base_canvas, overlay_canvas, wrap, parentId, $area, area, css, sel, areas, i, j, keys, key, area_id, default_group, group_value, img,
                sort_func, sorted_list, dataItem, mapArea, scale, mapKey,
                me = this,
                opts = me.options;

            function addGroup(key, value) {
                var dataItem = new AreaData(me, key, value, opts);
                dataItem.areaId = me._xref[key] = me.data.push(dataItem) - 1;
                return dataItem.areaId;
            }
            // return;
            if (me.complete) { return; }
            //            debug = (me.image.id === 'usa');
            me.complete = true;
            img = $(me.image);
            parentId = img.parent().attr('id');

            // create a div wrapper only if there's not already a wrapper, otherwise, own it
            if (parentId && parentId.length >= 12 && parentId.substring(0, 12) === "mapster_wrap") {
                wrap = img.parent();
                wrap.attr('id', me.wrapId());
            } else {
                wrap = $('<div id="' + me.wrapId() + '"></div>');

                if (opts.wrapClass) {
                    if (opts.wrapClass === true) {
                        wrap.addClass(img.attr('class'));
                    }
                    else {
                        wrap.addClass(opts.wrapClass);
                    }
                }
            }
            me.wrapper = wrap;

            base_canvas = me.graphics.createVisibleCanvas(me.image);
            overlay_canvas = me.graphics.createVisibleCanvas(me.image);

            me.base_canvas = base_canvas;
            me.overlay_canvas = overlay_canvas;

            me._xref = {};
            me.data = [];

            default_group = !opts.mapKey;
            sel = ($.browser.msie && $.browser.version <= 7) ? 'area' :
                (default_group ? 'area[coords]' : 'area[' + opts.mapKey + ']');
            areas = $(me.map).find(sel);

            u.scaleMap(me.image, opts.scaleMap, function (scaleInfo) {
                scale = me.scaleInfo = scaleInfo;
                for (i = areas.length - 1; i >= 0; i--) {
                    area_id = 0;
                    area = areas[i];
                    $area = $(area);

                    // skip areas with no coords - selector broken for older ie 
                    if (!area.coords) {
                        continue;
                    }

                    mapKey = area.getAttribute(opts.mapKey);
                    keys = (default_group || typeof mapKey !== 'string') ? [''] : u.split(mapKey);
                    // conditions for which the area will be bound to mouse events
                    // only bind to areas that don't have nohref. ie 6&7 cannot detect the presence of nohref, so we have to also not bind if href is missing.

                    mapArea = new MapArea(me, area);
                    // Iterate through each mapKey assigned to this area
                    for (j = keys.length - 1; j >= 0; j--) {
                        key = keys[j];
                        if (opts.mapValue) {
                            group_value = $area.attr(opts.mapValue);
                        }
                        if (default_group) {
                            // set an attribute so we can refer to the area by index from the DOM object if no key
                            area_id = addGroup(me.data.length, group_value);
                            dataItem = me.data[area_id];
                            dataItem.key = key = area_id.toString();
                        }
                        else {
                            area_id = me._xref[key];
                            if (area_id >= 0) {
                                dataItem = me.data[area_id];
                                if (group_value && !me.data[area_id].value) {
                                    dataItem.value = group_value;
                                }
                            }
                            else {
                                area_id = addGroup(key, group_value);
                                dataItem = me.data[area_id];
                            }
                        }
                        //mapArea = new MapArea(this, area);
                        dataItem.areas.push(mapArea);
                    }

                    if (!mapArea.nohref) {
                        $area.bind('mouseover.mapster', me.mouseover)
                            .bind('mouseout.mapster', me.mouseout)
                            .bind('click.mapster', me.click);
                    }
                    // Create a key if none was assigned by the user

                    if (!mapKey) {
                        $area.attr('data-mapster-key', key);
                    }

                }

                if (!mapKey) {
                    me.options.mapKey = 'data-mapster-key';
                }


                // now that we have processed all the areas, set css for wrapper, scale map if needed

                css = {
                    display: 'block',
                    position: 'relative',
                    padding: 0,
                    width: scale.width,
                    height: scale.height
                };
                if (opts.wrapCss) {
                    $.extend(css, opts.wrapCss);

                }
                // if we were rebinding with an existing wrapper, the image will aready be in it
                if (img.parent()[0] !== me.wrapper[0]) {

                    img.before(me.wrapper);
                }

                wrap.css(css);

                // move all generated images into the wrapper for easy removal later

                for (i = 1; i < me.images.length; i++) {
                    wrap.append(me.images[i]);
                }
                // seems that some browsers want to show stuff while being added to the DOM
                $(me.images.slice(1)).hide();

                img.css(canvas_style);
                me.images[1].style.cssText = me.image.style.cssText;

                wrap.append(me.images[1])
                    .append(base_canvas)
                    .append(overlay_canvas)
                    .append(img);



                // images[0] is the original image with map, images[1] is the copy/background that is visible

                u.setOpacity(me.image, 0, !has_canvas);
                u.setOpacity(me.images[1], 1, !has_canvas);

                me.setAreaOptions(opts.areas);

                if (opts.isSelectable && opts.onGetList) {
                    sorted_list = me.data.slice(0);
                    if (opts.sortList) {
                        if (opts.sortList === "desc") {
                            sort_func = function (a, b) {
                                return a === b ? 0 : (a > b ? -1 : 1);
                            };
                        }
                        else {
                            sort_func = function (a, b) {
                                return a === b ? 0 : (a < b ? -1 : 1);
                            };
                        }

                        sorted_list.sort(function (a, b) {
                            a = a.value;
                            b = b.value;
                            return sort_func(a, b);
                        });
                    }

                    me.options.boundList = opts.onGetList.call(me.image, sorted_list);
                }
                // TODO listenToList... why haven't I done this yet?
                //            if (opts.listenToList && opts.nitG) {
                //                opts.nitG.bind('click.mapster', event_hooks[map_data.hooks_index].listclick_hook);
                //            }


                // populate areas from config options
                me.setAreasSelected();

                // process queued commands
                if (me.commands.length) {
                    u.each(me.commands, function () {
                        methods[this.command].apply(this.that, this.args);
                    });
                    me.commands = [];
                }
                if (opts.onConfigured && typeof opts.onConfigured === 'function') {
                    opts.onConfigured.call(img, true);
                }
            });
        };
        MapData.prototype.clearEvents = function () {
            $(this.map).find('area')
                .unbind('.mapster');
            $(this.images)
                .unbind('.mapster');
        };
        MapData.prototype._clearCanvases = function (preserveState) {
            // remove the canvas elements created
            if (!preserveState) {
                $(this.base_canvas).remove();
            }
            $(this.overlay_canvas).remove();
        };
        MapData.prototype.clearTooltip = function () {
            if (this.activeToolTip) {
                this.activeToolTip.remove();
                this.activeToolTip = null;
                this.activeToolTipID = -1;
            }
            u.each(this._tooltip_events, function () {
                this.object.unbind(this.event);
            });
        };
        MapData.prototype.clearMapData = function (preserveState) {
            var me = this;
            this._clearCanvases(preserveState);

            // release refs to DOM elements
            u.each(this.data, function () {
                //this.reset(preserveState);
            });
            this.data = null;
            if (!preserveState) {
                // get rid of everything except the original image
                this.image.style.cssText = this.imgCssText;
                $(this.wrapper).before(this.image).remove();

            }
            // release refs

            u.each(this.images, function (i) {
                if (me.images[i] !== this.image) {
                    me.images[i] = null;
                }
            });
            me.images = [];

            this.image = null;
            this.clearTooltip();
        };
        MapData.prototype.bindTooltipClose = function (option, event, obj) {
            var event_name = event + '.mapster-tooltip', me = this;
            if ($.inArray(option, this.options.toolTipClose) >= 0) {
                obj.unbind(event_name).bind(event_name, function () {
                    me.clearTooltip();
                });
                this._tooltip_events.push(
                {
                    object: obj, event: event_name
                });
            }
        };
        // Compelete cleanup process for deslecting items. Called after a batch operation, or by AreaData for single
        // operations not flagged as "partial"
        MapData.prototype.removeSelectionFinish = function () {
            var g = this.graphics;

            g.refresh_selections();
            // do not call ensure_no_highlight- we don't really want to unhilight it, just remove the effect
            g.clear_highlight();
        };
        // END MAPDATA

        // AREADATA - represents an area group (one or more areas)

        AreaData = function (owner, key, value) {
            this.owner = owner;
            this.key = key || '';
            this.areaId = -1;
            this.value = value || '';
            this.options = {};
            this.selected = null;   // "null" means unchanged. Use "isSelected" method to just test true/false
            this.areas = [];        // MapArea objects
            this.area = null;       // (temporary storage) - the actual area moused over 
            this._effectiveOptions = null;
        };
        // return all coordinates for all areas
        AreaData.prototype.coords = function (percent, offset) {
            var coords = [];
            $.each(this.areas, function (i, el) {
                coords = coords.concat(el.coords(percent, offset));
            });
            return coords;
        };
        AreaData.prototype.reset = function (preserveState) {
            u.each(this.areas, function () {
                this.reset(preserveState);
            });
            this.areas = null;
            this.options = null;
            this._effectiveOptions = null;
        };
        // Return the effective selected state of an area, incorporating staticState
        AreaData.prototype.isSelectedOrStatic = function () {
            var o = this.effectiveOptions();
            return u.isBool(this.selected) ? this.selected :
                (u.isBool(o.staticState) ? o.staticState :
                (u.isBool(this.owner.options.staticState) ? this.owner.options.staticState : false));
        };
        AreaData.prototype.isSelected = function () {
            return this.selected || false;
        };
        AreaData.prototype.isSelectable = function () {
            return u.isBool(this.effectiveOptions().staticState) ? false :
                (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isSelectable);
        };
        AreaData.prototype.isDeselectable = function () {
            return u.isBool(this.effectiveOptions().staticState) ? false :
                (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isDeselectable);
        };
        AreaData.prototype.setTemporaryOption = function (options) {
            this.tempOptions = options;
        };
        AreaData.prototype.effectiveOptions = function (override_options) {
            //if (!this._effectiveOptions) {
            //TODO this isSelectable should cascade already this seems redundant
            var opts = this._effectiveOptions = u.mergeObjects({
                source: [this.owner.area_options,
                        this.options,
                        override_options || {},
                        this.tempOptions || {},
                        { id: this.areaId}],
                deep: "render_highlight,render_select"
            });
            return opts;
            //}
            //return this._effectiveOptions;
        };
        // Fire callback on area state change
        AreaData.prototype.changeState = function (state_type, state) {
            if ($.isFunction(this.owner.options.onStateChange)) {
                this.owner.options.onStateChange.call(this.owner.image,
                {
                    key: this.key,
                    state: state_type,
                    selected: state
                });
            }
        };
        // highlight this area, no render causes it to happen internally only
        AreaData.prototype.highlight = function (noRender) {
            var o = this.owner;
            if (!noRender) {
                o.graphics.addShapeGroup(this, "highlight");
            }
            o.setHighlight(this.areaId);
            this.changeState('highlight', true);
        };
        // select this area. if "callEvent" is true then the state change event will be called. (This method can be used
        // during config operations, in which case no event is indicated)
        AreaData.prototype.setAreaSelected = function (callEvent) {
            this.owner.graphics.addShapeGroup(this, "select");
            if (callEvent) {
                this.changeState('select', true);
            }
        };
        AreaData.prototype.addSelection = function () {
            // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
            var o = this.owner;
            if (o.options.singleSelect) {
                o.graphics.remove_selections();
                u.each(o.data, function () {
                    this.selected = false;
                });
            }

            // because areas can overlap - we can't depend on the selection state to tell us anything about the inner areas.
            //if (!this.isSelected()) {
            this.setAreaSelected(true);
            this.selected = true;
            //}

            if (o.options.singleSelect) {
                o.graphics.refresh_selections();
            }
        };
        // Remve a selected area group. If the parameter "partial" is true, then this is a manual operation 
        // and the caller mus call "finishRemoveSelection" after multiple "removeSelectionFinish" events
        AreaData.prototype.removeSelection = function (partial) {

            //            if (this.selected === false) {
            //                return;
            //            }
            this.selected = false;
            this.changeState('select', false);
            this.owner.graphics.remove_selections(this.areaId);
            if (!partial) {
                this.owner.removeSelectionFinish();
            }
        };
        // Complete selection removal process. This is separated because it's very inefficient to perform the whole
        // process for multiple removals, as the canvas must be totally redrawn at the end of the process.ar.remove

        AreaData.prototype.toggleSelection = function (partial) {
            if (!this.isSelected()) {
                this.addSelection();
            }
            else {
                this.removeSelection(partial);
            }
            return this.isSelected();
        };
        // Show tooltip adjacent to DOM element "area"
        AreaData.prototype.showTooltip = function () {
            var tooltip, left, top, tooltipCss, coords, fromCoords, container,
                alignLeft = true,
	        alignTop = true,
	        opts = this.effectiveOptions(),
                map_data = this.owner,
                baseOpts = map_data.options,
                template = map_data.options.toolTipContainer;

            // prevent tooltip from being cleared if it was in progress - area is in the same group

            if (map_data.activeToolTipID === this.areaId) {
                return;
            }

            if (typeof template === 'string') {
                container = $(template);
            } else {
                container = $(template).clone();
            }

            tooltip = container.html(opts.toolTip).hide();

            if (this.area) {
                fromCoords = u.split(this.area.coords, ',');
            } else {
                fromCoords = [];
                u.each(this.areas, function () {
                    fromCoords = fromCoords.concat(this.coords());
                });
            }
            coords = u.area_corner(fromCoords, alignLeft, alignTop);

            map_data.clearTooltip();

            $(map_data.image).after(tooltip);
            map_data.activeToolTip = tooltip;
            map_data.activeToolTipID = this.areaId;

            // Try to upper-left align it first, if that doesn't work, change the parameters
            left = coords[0] - tooltip.outerWidth(true);
            top = coords[1] - tooltip.outerHeight(true);
            if (left < 0) {
                alignLeft = false;
            }
            if (top < 0) {
                alignTop = false;
            }
            // get the coords again if didn't work before
            if (!alignLeft || !alignTop) {
                coords = u.area_corner(fromCoords, alignLeft, alignTop);
            }

            left = coords[0] - (alignLeft ? tooltip.outerWidth(true) : 0);
            top = coords[1] - (alignTop ? tooltip.outerHeight(true) : 0);

            tooltipCss = { "left": left + "px", "top": top + "px" };

            if (!tooltip.css("z-index") || tooltip.css("z-index") === "auto") {
                tooltipCss["z-index"] = "2000";
            }
            tooltip.css(tooltipCss).addClass('mapster_tooltip');

            map_data.bindTooltipClose('area-click', 'click', $(map_data.map));
            map_data.bindTooltipClose('tooltip-click', 'click', tooltip);
            // not working properly- closes too soon sometimes
            //map_data.bindTooltipClose('img-mouseout', 'mouseout', $(map_data.image));

            if (map_data.options.toolTipFade) {
                u.setOpacity(tooltip[0], 0, !has_canvas);
                tooltip.show();
                u.fader(tooltip[0], 0, 1, opts.fadeDuration, !has_canvas);
            } else {
                tooltip.show();
            }

            //"this" will be null unless they passed something to forArea
            u.ifFunction(baseOpts.onShowToolTip, this.area || null,
            {
                toolTip: tooltip,
                areaOptions: opts,
                key: this.key,
                selected: this.isSelected()
            });

        };

        // represents an HTML area
        MapArea = function (owner, areaEl) {
            var me = this;
            me.owner = owner;
            me.area = areaEl;
            me.originalCoords = [];
            $.each(u.split(areaEl.coords), function (i, el) {
                me.originalCoords.push(parseFloat(el));
            });
            me.length = me.originalCoords.length;

            me.shape = areaEl.shape.toLowerCase();
            me.nohref = areaEl.nohref || !areaEl.href;
            //change the area tag data if needed
            if (me.owner.scaleInfo.scale) {
                me.resize();
            }
        };
        // scale this area's imagemap to the current scale
        MapArea.prototype.resize = function () {
            this.area.coords = this.coords().join(',');
        };
        MapArea.prototype.reset = function () {
            this.area.coords = this.coords(1).join(',');
        };
        MapArea.prototype.coords = function (percent, coordOffset) {
            var j, newCoords = [],
                pct = percent || this.owner.scaleInfo.scalePct,
                offset = coordOffset || 0;

            if (pct === 1 && coordOffset === 0) {
                return this.originalCoords;
            }

            for (j = 0; j < this.length; j++) {
                //amount = j % 2 === 0 ? xPct : yPct;
                newCoords.push(Math.round(this.originalCoords[j] * pct) + offset);
            }
            return newCoords;
        };
        // PUBLIC FUNCTIONS
        Graphics = function (map_data) {
            //$(window).unload($.mapster.unload);
            // create graphics functions for canvas and vml browsers. usage: 
            // 1) init with map_data, 2) call begin with canvas to be used (these are separate b/c may not require canvas to be specified
            // 3) call add_shape_to for each shape or mask, 4) call render() to finish

            var me = this;

            me.active = false;
            me.canvas = null;
            me.width = 0;
            me.height = 0;
            me.shapes = [];
            me.masks = [];
            me.map_data = map_data;
        };
        Graphics.prototype._addShapeGroupImpl = function (areaData, mode) {
            var opts, areaOpts,
                me = this,
                map_data = me.map_data;
            // first get area options. Then override fade for selecting, and finally merge in the "select" effect options.
            areaOpts = areaData.effectiveOptions();
            opts = u.mergeObjects({
                source: [$.mapster.render_defaults,
                    areaOpts,
                    areaOpts['render_' + mode],
                    {
                        alt_image: map_data.altImage(mode)
                    }]
            });

            u.each(areaData.areas, function () {
                opts.isMask = areaOpts.isMask || (this.nohref && map_data.options.noHrefIsMask);
                if (!u.isBool(opts.staticState)) {
                    me.addShape(this, opts);
                }
            });

            return opts;
        };
        Graphics.prototype.begin = function (curCanvas, curName) {
            var c = $(curCanvas);

            if (!has_canvas) {
                this.elementName = curName;
            }
            this.canvas = curCanvas;

            this.width = c.width();
            this.height = c.height();
            this.shapes = [];
            this.masks = [];
            this.active = true;

        };
        Graphics.prototype.addShape = function (mapArea, options) {
            var addto = options.isMask ? this.masks : this.shapes;
            addto.push({ mapArea: mapArea, options: options });
        };
        Graphics.prototype.createVisibleCanvas = function (img) {
            return $(this.createCanvasFor(img)).addClass('mapster_el').css(canvas_style)[0];
        };
        Graphics.prototype.addShapeGroup = function (areaData, mode) {
            // render includeKeys first - because they could be masks
            var me = this,
                    list, name, canvas,
                    map_data = this.map_data,
                    opts = areaData.effectiveOptions();

            if (mode === 'select') {
                name = "static_" + areaData.areaId.toString();
                canvas = map_data.base_canvas;
            } else {
                canvas = map_data.overlay_canvas;
            }

            me.begin(canvas, name);

            if (opts.includeKeys) {
                list = u.split(opts.includeKeys);
                u.each(list, function () {
                    me._addShapeGroupImpl(map_data.getDataForKey(this.toString()), mode);
                });
            }

            opts = me._addShapeGroupImpl(areaData, mode);

            me.render();

            if (opts.fade) {
                u.fader(canvas, 0, 1, opts.fadeDuration, !has_canvas);
            }

        };
        function configureGraphics(has_canvas) {
            var p = Graphics.prototype;
            if (has_canvas) {
                p.hex_to_decimal = function (hex) {
                    return Math.max(0, Math.min(parseInt(hex, 16), 255));
                };
                p.css3color = function (color, opacity) {
                    return 'rgba(' + this.hex_to_decimal(color.substr(0, 2)) + ','
                    + this.hex_to_decimal(color.substr(2, 2)) + ','
                    + this.hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
                };

                p.renderShape = function (context, mapArea, offset) {
                    var i,
                        c = mapArea.coords(null, offset);

                    switch (mapArea.shape) {
                        case 'rect':
                            context.rect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
                            break;
                        case 'poly':
                            context.moveTo(c[0], c[1]);

                            for (i = 2; i < mapArea.length; i += 2) {
                                context.lineTo(c[i], c[i + 1]);
                            }
                            context.lineTo(c[0], c[1]);
                            break;
                        case 'circ':
                        case 'circle':
                            context.arc(c[0], c[1], c[2], 0, Math.PI * 2, false);
                            break;
                    }
                };
                p.addAltImage = function (context, image, mapArea, options) {
                    context.beginPath();

                    this.renderShape(context, mapArea);
                    context.closePath();
                    context.clip();

                    context.globalAlpha = options.altImageOpacity;

                    context.drawImage(image, 0, 0, mapArea.owner.scaleInfo.width, mapArea.owner.scaleInfo.height);
                };

                p.render = function () {
                    // firefox 6.0 context.save() seems to be broken. to work around,  we have to draw the contents on one temp canvas, 
                    // the mask on another, and merge everything. ugh. fixed in 1.2.2. unfortunately this is a lot more code for masks,
                    // but no other way around it that i can see.

                    var maskCanvas, maskContext,
                        me = this,
                        hasMasks = me.masks.length,
                        shapeCanvas = me.createCanvasFor(me.canvas),
                        shapeContext = shapeCanvas.getContext('2d'),
                        context = me.canvas.getContext('2d');

                    if (hasMasks) {
                        maskCanvas = me.createCanvasFor(me.canvas);
                        maskContext = maskCanvas.getContext('2d');
                        maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

                        u.each(me.masks, function () {
                            maskContext.save();
                            maskContext.beginPath();
                            me.renderShape(maskContext, this.mapArea);
                            maskContext.closePath();
                            maskContext.clip();
                            maskContext.lineWidth = 0;
                            maskContext.fillStyle = '#000';
                            maskContext.fill();
                            maskContext.restore();
                        });

                    }

                    u.each(me.shapes, function () {
                        var s = this;
                        shapeContext.save();
                        if (s.options.alt_image) {
                            me.addAltImage(shapeContext, s.options.alt_image, s.mapArea, s.options);
                        } else if (s.options.fill) {

                            shapeContext.beginPath();
                            me.renderShape(shapeContext, s.mapArea);
                            shapeContext.closePath();
                            //shapeContext.clip();
                            shapeContext.fillStyle = me.css3color(s.options.fillColor, s.options.fillOpacity);
                            shapeContext.fill();
                        }
                        shapeContext.restore();
                    });


                    // render strokes at end since masks get stroked too

                    u.each(me.shapes.concat(me.masks), function () {
                        var s = this,
                            offset = s.options.strokeWidth == 1 ? 0.5 : 0;
                        // offset applies only when stroke width is 1 and stroke would render between pixels.

                        if (s.options.stroke) {
                            shapeContext.save();
                            shapeContext.strokeStyle = me.css3color(s.options.strokeColor, s.options.strokeOpacity);
                            shapeContext.lineWidth = s.options.strokeWidth;

                            shapeContext.beginPath();

                            me.renderShape(shapeContext, s.mapArea, offset);
                            shapeContext.closePath();
                            shapeContext.stroke();
                            shapeContext.restore();
                        }
                    });

                    if (hasMasks) {
                        // render the new shapes against the mask

                        maskContext.globalCompositeOperation = "source-out";
                        maskContext.drawImage(shapeCanvas, 0, 0);

                        // flatten into the main canvas
                        context.drawImage(maskCanvas, 0, 0);
                    } else {
                        context.drawImage(shapeCanvas, 0, 0);
                    }

                    me.active = false;
                    return me.canvas;



                };

                // create a canvas mimicing dimensions of an existing element
                p.createCanvasFor = function (element) {
                    var el = $(element),
                                w = el.width() || el[0].width,
                                h = el.height() || el[0].height,
                                c = $('<canvas width="' + w + '" height="' + h + '"></canvas>')[0];

                    //c.getContext("2d").clearRect(0, 0, w, h);
                    return c;
                };
                p.clear_highlight = function () {
                    var c = this.map_data.overlay_canvas;
                    c.getContext('2d').clearRect(0, 0, c.width, c.height);
                };
                p.remove_selections = function () {

                };
                // Draw all items from selected_list to a new canvas, then swap with the old one. This is used to delete items when using canvases. 
                p.refresh_selections = function () {
                    var canvas_temp, map_data = this.map_data;
                    // draw new base canvas, then swap with the old one to avoid flickering
                    canvas_temp = map_data.base_canvas;

                    map_data.base_canvas = this.createVisibleCanvas(map_data.image);
                    $(map_data.base_canvas).hide();
                    $(canvas_temp).before(map_data.base_canvas);

                    map_data.setAreasSelected();

                    $(map_data.base_canvas).show();
                    $(canvas_temp).remove();
                };
            } else {
                p.renderShape = function (mapArea, options, cssclass) {
                    var me = this, stroke, e, t_fill, el_name, el_class, template, c = mapArea.coords();
                    el_name = me.elementName ? 'name="' + me.elementName + '" ' : '';
                    el_class = cssclass ? 'class="' + cssclass + '" ' : '';

                    t_fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" /><v:stroke opacity="' + options.strokeOpacity + '"/>';

                    if (options.stroke) {
                        stroke = 'strokeweight=' + options.strokeWidth + ' stroked="t" strokecolor="#' + options.strokeColor + '"';
                    } else {
                        stroke = 'stroked="f"';
                    }

                    switch (mapArea.shape) {
                        case 'rect':
                            template = '<v:rect ' + el_class + el_name + ' filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + c[0] + 'px;top:' + c[1]
                                + 'px;width:' + (c[2] - c[0]) + 'px;height:' + (c[3] - c[1]) + 'px;">' + t_fill + '</v:rect>';
                            break;
                        case 'poly':
                            template = '<v:shape ' + el_class + el_name + ' filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + me.width + ',' + me.height
                                + '" path="m ' + c[0] + ',' + c[1] + ' l ' + c.slice(2).join(',')
                                + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + me.width + 'px;height:' + me.height + 'px;">' + t_fill + '</v:shape>';
                            break;
                        case 'circ':
                        case 'circle':
                            template = '<v:oval ' + el_class + el_name + ' filled="t" ' + stroke
                                + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (c[0] - c[2]) + 'px;top:' + (c[1] - c[2])
                                + 'px;width:' + (c[2] * 2) + 'px;height:' + (c[2] * 2) + 'px;">' + t_fill + '</v:oval>';
                            break;
                    }
                    e = $(template);
                    $(me.canvas).append(e);

                    return e;
                };
                p.render = function () {
                    var opts, me = this;

                    u.each(this.shapes, function () {
                        me.renderShape(this.mapArea, this.options);
                    });

                    if (this.masks.length) {
                        u.each(this.masks, function () {
                            opts = u.mergeObjects({ source: [this.options, { fillOpacity: 1, fillColor: this.options.fillColorMask}] });
                            me.renderShape(this.mapArea, opts, 'mapster_mask');
                        });
                    }

                    this.active = false;
                    return this.canvas;
                };

                p.createCanvasFor = function (element) {
                    var el = $(element),
                            w = el.width(),
                            h = el.height();
                    return $('<var width="' + w + '" height="' + h + '" style="zoom:1;overflow:hidden;display:block;width:' + w + 'px;height:' + h + 'px;"></var>')[0];
                };

                p.clear_highlight = function () {
                    $(this.map_data.overlay_canvas).children().remove();
                };
                // remove single or all selections
                p.remove_selections = function (area_id) {
                    if (area_id >= 0) {
                        $(this.map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
                    }
                    else {
                        $(this.map_data.base_canvas).children().remove();
                    }
                };
                p.refresh_selections = function () {
                    return null;
                };
            }
        }

        // Returns a comma-separated list of user-selected areas. "staticState" areas are not considered selected for the purposes of this method.
        me.get = function (key) {
            return (new Method(this,
                function () {
                    // map_data return
                    return this.getSelected();
                },
                function () {
                    return this.isSelected();
                },
                { name: 'get',
                    args: arguments,
                    key: key,
                    first: true,
                    defaultReturn: ''
                }
            )).go();
        };
        me.data = function (key) {
            return (new Method(this,
                null,
                function () {
                    return this;
                },
                { name: 'data',
                    args: arguments,
                    key: key
                }
            )).go();
        };
        // key is one of: (string) area key: target the area -- will use the largest
        //                (DOM el/jq) area: target specific area
        //                 any falsy value: close the tooltip

        // or you don't care which is used.
        me.tooltip = function (key) {
            return (new Method(this,
                function () {
                    this.clearTooltip();
                },
                function () {
                    if (this.effectiveOptions().toolTip) {
                        this.showTooltip();
                    }
                },
                { name: 'tooltip',
                    args: arguments,
                    key: key
                }
            )).go();
        };

        // Set or return highlight state. 
        //  $(img).mapster('highlight') -- return highlighted area key, or null if none
        //  $(area).mapster('highlight') -- highlight an area
        //  $(img).mapster('highlight','area_key') -- highlight an area
        //  $(img).mapster('highlight',false) -- remove highlight
        me.highlight = function (key) {
            return (new Method(this,
                function (selected) {
                    if (key === false) {
                        this.ensureNoHighlight();
                    } else {
                        var id = this._highlightId;
                        return id >= 0 ? this.data[id].key : null;
                    }
                },
                function () {
                    this.highlight();
                },
                { name: 'highlight',
                    args: arguments,
                    key: key,
                    first: true
                }
            )).go();
        };

        // Select or unselect areas identified by key -- a string, a csv string, or array of strings.
        // if set_bound is true, the bound list will also be updated. Default is true. If neither true nor false,
        // it will be toggled.
        me.set = function (selected, key, set_bound) {
            var lastParent, parent, map_data, do_set_bound,
                key_list,
                area_list = []; // array of unique areas passed

            function setSelection(ar) {
                if (ar) {
                    switch (selected) {
                        case true:
                            ar.addSelection(); break;
                        case false:
                            ar.removeSelection(true); break;
                        default:
                            ar.toggleSelection(); break;
                    }
                }
            }

            do_set_bound = u.isBool(set_bound) ? set_bound : true;

            this.each(function () {
                var ar;
                map_data = get_map_data(this);
                if (!map_data) {
                    return true; // continue
                }
                key_list = '';
                if ($(this).is('img')) {
                    if (queue_command(map_data, $(this), 'set', [selected, key, do_set_bound])) {
                        return true;
                    }
                    if (key instanceof Array) {
                        if (key.length) {
                            key_list = key.join(",");
                        }
                    }
                    else {
                        key_list = key;
                    }

                    if (key_list) {
                        u.each(u.split(key_list), function () {
                            setSelection(map_data.getDataForKey(this.toString()));
                        });
                        if (!selected) {
                            map_data.removeSelectionFinish();
                        }
                    }

                } else {
                    parent = $(this).parent()[0];
                    // it is possible for areas from different mapsters to be passed, make sure we're on the right one.
                    if (lastParent && parent !== lastParent) {
                        map_data = get_map_data(this);
                        if (!map_data) {
                            return true;
                        }
                        lastParent = parent;
                    }
                    lastParent = parent;

                    if (queue_command(map_data, $(this), 'set', [selected, key, do_set_bound])) {
                        return true;
                    }

                    ar = map_data.getDataForArea(this);

                    if ($.inArray(ar, area_list) < 0) {
                        area_list.push(ar);
                    }
                }
                // set all areas collected from the loop

                $.each(area_list, function (i, el) {
                    setSelection(el);
                });
                if (do_set_bound && map_data.options.boundList) {
                    setBoundListProperties(map_data.options, getBoundList(map_data.options, key_list), selected);
                }
            });
            return this;
        };
        me.unbind = function (preserveState) {
            return (new Method(this,
                function () {
                    this.clearEvents();
                    this.clearMapData(preserveState);
                    removeMap(this);
                },
                null,
                { name: 'unbind',
                    args: arguments
                }
            )).go();
        };
        // merge new area data into existing area options. used for rebinding.
        function merge_areas(map_data, areas) {
            var ar, index,
                map_areas = map_data.options.areas;
            if (areas) {
                u.each(areas, function () {
                    index = u.arrayIndexOfProp(map_areas, "key", this.key);
                    if (index >= 0) {
                        $.extend(map_areas[index], this);
                    }
                    else {
                        map_areas.push(this);
                    }
                    ar = map_data.getDataForKey(this.key);
                    if (ar) {
                        $.extend(ar.options, this);
                    }
                });
            }
        }
        function merge_options(map_data, options) {
            u.mergeObjects({
                ignore: "areas",
                target: map_data.options,
                source: options,
                deep: "render_select,render_highlight"
            });

            merge_areas(map_data, options.areas);
            // refresh the area_option template
            u.mergeObjects({ target: map_data.area_options, source: map_data.options, add: false });

            u.each(map_data.data, function () {
                this._effectiveOptions = null;
            });
        }

        // refresh options and update selection information.
        me.rebind = function (options) {
            return (new Method(this,
                function () {
                    merge_options(this, options);
                    this.setAreaOptions(options.areas || {});
                    this.setAreasSelected();
                },
                null,
                {
                    name: 'rebind',
                    args: arguments
                }
            )).go();
        };
        // get options. nothing or false to get, or "true" to get effective options (versus passed options)
        me.get_options = function (key, effective) {
            var eff = u.isBool(key) ? key : effective; // allow 2nd parm as "effective" when no key
            return (new Method(this,
                function () {
                    var opts = $.extend({}, this.options);
                    if (eff) {
                        opts.render_select = u.mergeObjects({ template: $.mapster.render_defaults, source: [opts, opts.render_select] });
                        opts.render_highlight = u.mergeObjects({ template: $.mapster.render_defaults, source: [opts, opts.render_highlight] });
                    }
                    return opts;
                },
                function () {
                    return eff ? this.effectiveOptions() : this.options;
                },
                {
                    name: 'get_options',
                    args: arguments,
                    first: true,
                    key: key
                }
            )).go();
        };

        // set options - pass an object with options to set, 
        me.set_options = function (options) {
            return (new Method(this,
                function () {
                    merge_options(this, options);
                },
                null,
                {
                    name: 'set_options',
                    args: arguments
                }
            )).go();
        };
        me.unload = function () {
            var i;
            for (i = me.map_cache.length - 1; i >= 0; i--) {
                if (me.map_cache[i]) {
                    me.unbind.call($(me.map_cache[i].image));
                }
            }
            me.graphics = null;
        };
        me.resize = function (width, height, duration) {
            if (!width && !height) {
                return false;
            }
            return (new Method(this,
                function () {
                    this.resize(width, height, duration);
                },
                null,
                {
                    name: 'resize',
                    args: arguments
                }
            )).go();
        };
        me.snapshot = function () {
            return (new Method(this,
                function () {
                    u.each(this.data, function () {
                        this.selected = false;
                    });

                    this.base_canvas = this.graphics.createVisibleCanvas(this.image);
                    $(this.image).before(this.base_canvas);
                },
                null,
                { name: 'snapshot' }
            )).go();
        };
        // do not queue this function
        me.state = function () {
            var md, result = null;
            $(this).each(function () {
                if (this.nodeName === 'IMG') {
                    md = get_map_data(this);
                    if (md) {
                        result = md.state();
                    }
                    return false;
                }
            });
            return result;
        };
        // options {
        //    padding: n,
        //    duration: m,
        //}
        //
        me.zoom = function (key, opts) {
            var options = opts || {};

            function zoom(areaData) {
                // this will be MapData object returned by Method

                var scroll, corners, height, width, ratio,
                    diffX, diffY, ratioX, ratioY, offsetX, offsetY, newWidth, newHeight, scrollLeft, scrollTop,
                    padding = options.padding || 0,
                    scrollBarSize = areaData ? 20 : 0,
                    me = this,
                    zoomOut = false;

                if (areaData) {
                    // save original state on first zoom operation
                    if (!me.zoomed) {
                        me.zoomed = true;
                        me.preZoomWidth = me.scaleInfo.width;
                        me.preZoomHeight = me.scaleInfo.height;
                        me.zoomedArea = areaData;
                        if (options.scroll) {
                            me.wrapper.css({ overflow: 'auto' });
                        }
                    }
                    corners = $.mapster.utils.areaCorners(areaData.coords(1, 0));
                    width = me.wrapper.innerWidth() - scrollBarSize - padding * 2;
                    height = me.wrapper.innerHeight() - scrollBarSize - padding * 2;
                    diffX = corners.maxX - corners.minX;
                    diffY = corners.maxY - corners.minY;
                    ratioX = width / diffX;
                    ratioY = height / diffY;
                    ratio = Math.min(ratioX, ratioY);
                    offsetX = (width - diffX * ratio) / 2;
                    offsetY = (height - diffY * ratio) / 2;

                    newWidth = me.scaleInfo.realWidth * ratio;
                    newHeight = me.scaleInfo.realHeight * ratio;
                    scrollLeft = (corners.minX) * ratio - padding - offsetX;
                    scrollTop = (corners.minY) * ratio - padding - offsetY;
                } else {
                    if (!me.zoomed) {
                        return;
                    }
                    zoomOut = true;
                    newWidth = me.preZoomWidth;
                    newHeight = me.preZoomHeight;
                    scrollLeft = null;
                    scrollTop = null;
                }

                this.resize({
                    width: newWidth,
                    height: newHeight,
                    duration: options.duration,
                    scroll: scroll,
                    scrollLeft: scrollLeft,
                    scrollTop: scrollTop,
                    // closure so we can be sure values are correct
                    callback: (function () {
                        var isZoomOut = zoomOut,
                            scroll = options.scroll,
                            areaD = areaData;
                        return function () {
                            if (isZoomOut) {
                                me.preZoomWidth = null;
                                me.preZoomHeight = null;
                                me.zoomed = false;
                                me.zoomedArea = false;
                                if (scroll) {
                                    me.wrapper.css({ overflow: 'inherit' });
                                }
                            } else {
                                // just to be sure it wasn't canceled & restarted
                                me.zoomedArea = areaD;
                            }
                        };
                    } ())
                });
            }
            return (new Method(this,
                function (opts) {
                    zoom.call(this);
                },
                function () {
                    zoom.call(this.owner, this);
                },
                {
                    name: 'zoom',
                    args: arguments,
                    first: true,
                    key: key
                }
                )).go();


        };

        me.bind = function (options) {
            var opts = u.mergeObjects({
                source: [$.mapster.defaults, options],
                deep: "render_select,render_highlight"
            });

            return this.each(function () {
                var img, map, usemap, map_data;

                // save ref to this image even if we can't access it yet. commands will be queued
                img = $(this);

                // sorry - your image must have border:0, things are too unpredictable otherwise.
                img.css('border', 0);

                map_data = get_map_data(this);
                // if already bound completely, do a total rebind
                if (map_data) {
                    img.unbind();
                    if (!map_data.complete) {
                        // will be queued
                        img.bind();
                        return true;
                    }
                }

                // ensure it's a valid image
                // jQuery bug with Opera, results in full-url#usemap being returned from jQuery's attr.
                // So use raw getAttribute instead.
                usemap = this.getAttribute('usemap');
                map = usemap && $('map[name="' + usemap.substr(1) + '"]');
                if (!(img.is('img') && usemap && map.size() > 0)) {
                    return true;
                }

                if (!map_data) {
                    map_data = new MapData(this, opts);

                    map_data.index = addMap(map_data);
                    map_data.map = map;
                    // add the actual main image
                    map_data.addImage(this);
                    // will create a duplicate of the main image, which we use as a background
                    map_data.addImage(null, this.src);
                    // add alt images
                    if (has_canvas) {
                        map_data.addImage(null, opts.render_highlight.altImage || opts.altImage, "highlight");
                        map_data.addImage(null, opts.render_select.altImage || opts.altImage, "select");
                    }
                    map_data.bindImages();
                }
            });
        };

        me.init = function (useCanvas) {
            var style, shapes;


            // check for excanvas explicitly - don't be fooled
            has_canvas = (document.namespaces && document.namespaces.g_vml_) ? false :
                $('<canvas></canvas>')[0].getContext ? true : false;

            is_touch = 'ontouchstart' in document.documentElement;

            if (!(has_canvas || document.namespaces)) {
                $.fn.mapster = function () {
                    return this;
                };
                return;
            }
            if (!u.isBool($.mapster.defaults.highlight)) {
                $.mapster.defaults.highlight = !is_touch;
            }

            configureGraphics(has_canvas);
            // for testing/debugging, use of canvas can be forced by initializing manually with "true" or "false"            
            if (u.isBool(useCanvas)) {
                has_canvas = useCanvas;
            }
            if ($.browser.msie && !has_canvas && !ie_config_complete) {
                document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                style = document.createStyleSheet();
                shapes = ['shape', 'rect', 'oval', 'circ', 'fill', 'stroke', 'imagedata', 'group', 'textbox'];
                $.each(shapes,
                function (i, el) {
                    style.addRule('v\\:' + el, "behavior: url(#default#VML); antialias:true");
                });
                ie_config_complete = true;
            }


        };

        return me;
    }
    ());

    // make sure closures are cleaned up
    $.mapster.unload = function () {
        this.impl.unload();
        $.mapster.utils.fader = null;
        $.mapster.utils = null;
        $.mapster.impl = null;
        $.fn.mapster = null;
        $.mapster = null;
        $('*').unbind();
    };

    /// Code that gets executed when the plugin is first loaded
    methods =
    {
        select: function () {
            $.mapster.impl.set.call(this, true);
        },
        deselect: function () {
            $.mapster.impl.set.call(this, false);
        }
    };
    $.each(["bind", "rebind", "unbind", "set", "get", "data", "highlight", "get_options", "set_options", "snapshot", "tooltip", "test", "resize", "state", "zoom"], function (i, el) {
        methods[el] = $.mapster.impl[el];
    });
    $.mapster.impl.init();
} (jQuery));
