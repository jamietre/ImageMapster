/* ImageMapster 1.2.4

Copyright 2011 James Treworgy
http://www.outsharked.com/imagemapster
https://github.com/jamietre/ImageMapster

A jQuery plugin to enhance image maps.
*/
/*
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

version 1.1.3
-- skipping to version 1.2
-- revised "highlight" method and added tests
-- added a generic prototype for parsing method data
-- added (area).mapster('tooltip')
-- added .mapster('tooltip',key);
-- Bug fix for get_options, showToolTip (related)
-- Added tests for event handling
-- Bug fix - area id 0 on VML rendereding deselection causes all selections to disappear (introduced in beta 2)
-- Changed "get" to return true "selected" state and not "isSelected()" which includes staticState items in selected.
-- Bug fix - stroke sometimes rendered improperly when using render-specific options
-- change onClick handler to BEFORE action, permit canceling of action by returning false
-- refactor into mostly OO design - functional design was getting unwieldy.
-- fix bugs related to cascading of "staticState" options
-- add "snapshot" option
-- check for existing wrapper, skip if it already exists
-- remove map data when unbinding+preserveState -- it should act as if not there
-- IE performance improvements (optimizing rendering code a little bit)

version 1.1.1
-- Fixed Opera fading
-- IE fading (everything except 8) fixed again
-- fixed IE prob with masks
-- add "isMask" option
-- add multiple 'mapKey's per area
-- added "includeKeys" option (area-specific)
-- bugfix: ignore areas with no mapkey when it is provided
-- bugfix: not binding properly when no mapkey provided
-- added 'highlight' option

version 1.1
-- added per-action options (highlight, select)
-- fixed memory leaks
-- minor performance improvements
-- cleanup in VML mode
-- fix IE9 canvas support (fader problem)
-- fix flickering on fades when moving quickly
-- add altImage options
-- added onConfigured callback
-- fixed problems with cleanup (not removing wrap)
-- added failure timeout for configure


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


/*global HTMLElement: true */

(function ($) {
    var methods;
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
    // utility functions
    $.mapster.utils = {
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
            var obj, i, len, prop,
	                add = this.boolOrDefault(options.add, options.template ? false : true),
	                ignore = options.ignore ? options.ignore.split(',') : '',
	                include = options.include ? options.include.split(',') : '',
	                deep = options.deep ? options.deep.split(',') : '',
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
                        if ((!ignore || this.arrayIndexOf(ignore, prop) === -1)
	                          && (!include || this.arrayIndexOf(include, prop) >= 0)
	                          && obj.hasOwnProperty(prop)
	                          && (add || target.hasOwnProperty(prop))) {

                            if (deep && this.arrayIndexOf(deep, prop) >= 0 && typeof obj[prop] === 'object') {
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
                typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string");
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
        arrayIndexOf: function (arr, el) {
            if (arr.indexOf) {
                return arr.indexOf(el);
            } else {
                var i;
                for (i = arr.length - 1; i >= 0; i--) {
                    if (arr[i] === el) {
                        return i;
                    }
                }
                return -1;
            }
        },
        // recycle empty array elements
        arrayReuse: function (arr, obj) {
            var index = this.arrayIndexOf(arr, null);
            if (index === -1) {
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
        scaleInfo: function (image, scale) {
            var imgCopy, realH, realW, width, height, img = $(image);
            if (!img.length) { return; }

            width = img.width();
            height = img.height();

            if (scale) {
                imgCopy = $('<img src="' + img.attr('src') + '" />').hide();
                $('body').append(imgCopy);
                realH = imgCopy.height();
                realW = imgCopy.width();
                imgCopy.remove();
            } else {
                realH = height;
                realW = width;
            }
            return this.getScaleInfo(realW, realH, width, height);
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
        fade: true,
        fadeDuration: 150,
        altImage: null,
        altImageOpacity: 0.7,
        fill: true,
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
        staticState: null,
        selected: false,
        isSelectable: true,
        isDeselectable: true,
        singleSelect: false,
        wrapClass: false,
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
            include: "fade,fadeDuration,fill,fillColor,fillOpacity,stroke,strokeColor,strokeOpacity,strokeWidth,staticState,selected,"
            + "isSelectable,isDeselectable,render_highlight,render_select,isMask,toolTip"
        });

    $.mapster.impl = (function () {
        var me = {},
        AreaData, MapData, MapArea, Method,
        u = $.mapster.utils,
        map_cache = [],
        ie_config_complete = false,
        has_canvas = null,
        graphics = null,
        canvas_style =
        {
            position: 'absolute',
            left: 0,
            top: 0,
            padding: 0,
            border: 0
        };
        me.test = function (obj) {
            return eval(obj);
        };

        // end utility functions

        function create_canvas(img) {
            return $(graphics.create_canvas_for(img)).css(canvas_style)[0];
        }

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
                u.arrayIndexOfProp(map_cache, 'image', img) : -1;
        }
        function get_map_data(obj) {
            var index = get_map_data_index(obj);
            if (index >= 0) {
                return index >= 0 ? map_cache[index] : null;
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
            return opts.boundList ? opts.boundList.filter(':attrMatches("' + opts.listKey + '","' + key_list + '")') : null;
        }

        // EVENTS

        function queue_command(map_data, that, command, args) {
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
        // first: use only first object
        /// calls back one of two fuinctions, depending on whether an area was obtained.

        Method = function (that, args, func_map, func_area, opts) {
            var me = this;
            me.output = that;
            me.input = that;
            me.first = false;
            me.args = Array.prototype.slice.call(args, 0);
            me.key = '';
            me.func_map = func_map;
            me.func_area = func_area;
            $.extend(me, opts);
        };
        Method.prototype.go = function () {
            var i, data, ar, len, result, src = this.input;
            len = src.length;
            for (i = 0; i < len; i++) {
                data = get_map_data(src[i]);
                if (data) {
                    ar = data.getData(src[i].nodeName === 'AREA' ? src[i] : this.key);
                    if (ar) {
                        result = this.func_area.apply(ar, this.args);
                    } else {
                        result = this.func_map.apply(data, this.args);
                    }
                    if (this.first) {
                        break;
                    }
                }
            }
            if (typeof result !== 'undefined') {
                return result;
            } else {
                return me.output;
            }
        };

        MapData = function (image, options) {
            var me = this;
            this.index = -1;                // index of this in map_cache - so we have an ID to use for wraper div

            this.image = image;             // (Image)  main map image
            this.images = [];               // (Image)  all images associated with this map. this will include a "copy" of the main one
            this.imageSources = [];         // (string) src for each image
            this.imageStatus = [];          // (bool)   the loaded status of each indexed image in images
            this.altImagesXref = {};        // (int)    xref of "render_xxx" to this.images
            this.map = null;                // ($)      the image map
            this.options = options;         // {}       options passed buy user
            this.area_options = u.mergeObjects({
                template: $.mapster.area_defaults,
                source: options
            });
            this.base_canvas = null;       // (canvas|var)  where selections are rendered
            this.overlay_canvas = null;    // (canvas|var)  where highlights are rendered

            this.complete = false;         // (bool)    when all images have finished loading
            this.commands = [];            // {}        commands that were run before configuration was completed (b/c images weren't loaded)
            this.data = [];                // (MapData) area groups

            // save the initial style of the image for unbinding. This is problematic, chrome duplicates styles when assigning, and
            // cssText is apparently not universally supported. Need to do something more robust to make unbinding work universally.
            this.imgCssText = image.style.cssText || null;

            this.bindTries = options.configTimeout / 200;

            // private members
            this._xref = {};               // (int)      xref of mapKeys to data[]
            this._highlightId = -1;        // (int)      the currently highlighted element.
            this._tooltip_events = [];     // {}         info on events we bound to a tooltip container, so we can properly unbind them
            this.scaleInfo = null;         // {}         info about the image size, scaling, defaults

            this.mouseover = function (e) {
                var ar = me.getDataForArea(this),
                    opts = ar.effectiveOptions();

                if (!has_canvas) {
                    this.blur();
                }
                ar.highlight();

                if (me.options.showToolTip && opts.toolTip && me.activeToolTipID !== ar.areaId) {
                    ar.showTooltip(this);
                }
                if ($.isFunction(me.options.onMouseover)) {
                    me.options.onMouseover.call(this,
                    {
                        e: e,
                        options: opts,
                        key: ar.key,
                        selected: ar.isSelected()
                    });
                }
            };
            this.mouseout = function (e) {
                var key,
                    ar = me.getDataForArea(this),
                    opts = me.options;

                if (opts.toolTipClose && u.arrayIndexOf(opts.toolTipClose, 'area-mouseout') >= 0) {
                    me.clearTooltip();
                }
                me.ensureNoHighlight();
                if ($.isFunction(opts.onMouseout)) {
                    opts.onMouseout.call(this,
                    {
                        e: e,
                        options: opts,
                        key: key,
                        selected: ar.isSelected()
                    });
                }
            };
            this.click = function (e) {
                var selected, list, list_target, newSelectionState, canChangeState,
                    that = this,
                    ar = me.getDataForArea(this),
                    opts = me.options;

                e.preventDefault();

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
                        list = areaOpts.includeKeys.split(',');
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

        };
        MapData.prototype.resize = function (width, height, duration) {
            var newsize, me = this;
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
                me.scaleInfo = u.getScaleInfo(me.scaleInfo.realWidth, me.scaleInfo.realHeight, width, height);
                u.each(me.data, function () {
                    u.each(this.areas, function () {
                        this.resize();
                    });
                });
                sizeCanvas(me.base_canvas, width, height);
                sizeCanvas(me.overlay_canvas,width,height);
                me.setAreasSelected();
            }
            if (!width) {
                width = height * me.scaleInfo.ratio;
            }
            if (!height) {
                height = width / me.scaleInfo.ratio;
            }

            newsize = { 'width': String(width) + 'px', 'height': String(height) + 'px' };
            if (!has_canvas) {
                $(me.base_canvas).children().remove();
            }

            if (duration) {
                $(me.wrapper).find('.mapster_el').add(me.wrapper).animate(newsize, duration || 1000);
                $(this.image).animate(newsize, 1100, finishResize);
            } else {
                $(me.wrapper).find('.mapster_el').add(me.wrapper).add(this.image).css(newsize);
                finishResize();
            }
        };
        // bind a new image to a src, capturing load event. Return the new (or existing) image.
        MapData.prototype.addImage = function (src, altId) {
            var index;
            if (!src) { return; }
            index = $.inArray(src, this.imageSources);

            if (index <= 0) {
                index = this.imageSources.push(src) - 1;
                this.imageStatus[index] = false;
            }
            if (altId) {
                this.altImagesXref[altId] = index;
            }
        };
        // Wait until all images are loaded then call initialize. This is difficult because browsers are incosistent about
        // how or if "onload" works and in how one can actually detect if an image is already loaded. Try to check first,
        // then bind onload event, and finally use a timer to keep checking.
        MapData.prototype.bindImages = function (dontBind) {
            var alreadyLoaded = true,
                me = this;

            function onLoad() {
                var index;
                if (alreadyLoaded) {
                    return;
                }
                index = $.inArray(this, me.images);
                if (index < 0) {
                    throw ("Unable to find ref to image '" + this.src + "'.");
                }
                me.imageStatus[index] = true;
                if ($.inArray(false, me.imageStatus) < 0) {
                    me.initialize();
                }
            }
            if (me.complete) {
                return;
            }

            u.each(this.imageSources, function (i) {
                var img = new Image();
                img.src = this;
                if (u.isImageLoaded(img)) {
                    me.images[i] = img;
                    me.imageStatus[i] = true;
                } else if (!dontBind) {
                    alreadyLoaded = false;
                    img = new Image();
                    me.images[i] = img;
                    img.onload = onLoad;
                    img.src = this;
                }
            });
            if (alreadyLoaded) {
                me.initialize();
            } else {
                // to account for failure of onLoad to fire in rare situations
                if (me.bindTries-- > 0) {
                    window.setTimeout(function () {
                        me.bindImages(true);
                    }, 1000);
                } else {
                    throw ("Images never seemed to finish loading.");
                }
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
        MapData.prototype.getDataForArea = function (area) {
            var ar,
                key = $(area).data('mapster_key');
            ar = this.data[this._idFromKey(key)];
            if (ar) {
                ar.area = area;
            }
            return ar;
        };
        MapData.prototype.getDataForKey = function (key) {
            return this.data[this._idFromKey(key)];
        };
        MapData.prototype.getData = function (obj) {
            if (typeof obj === 'string') {
                return this.getDataForKey(obj);
            } else if (obj instanceof jQuery || u.isElement(obj)) {
                return this.getDataForArea(obj);
            } else {
                return null;
            }
        };
        // remove highlight if present, raise event
        MapData.prototype.ensureNoHighlight = function () {
            var ar;
            if (this._highlightId >= 0) {
                graphics.init(this);
                graphics.clear_highlight();
                ar = this.data[this._highlightId];
                ar.changeState('highlight', false);
                this._highlightId = -1;
            }
        };
        MapData.prototype.setHighlight = function (id) {
            this._highlightId = id;
        };
        MapData.prototype.initGraphics = function () {
            graphics.init(this);
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
            this.initGraphics();
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
                sort_func, sorted_list, dataItem, mapArea, scale,
                me = this,
                opts = me.options;

            function addGroup(key, value) {
                var dataItem = new AreaData(me, key, value, opts);
                dataItem.areaId = me._xref[key] = me.data.push(dataItem) - 1;
                return dataItem.areaId;
            }

            if (me.complete) { return; }

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

            base_canvas = create_canvas(me.image);
            overlay_canvas = create_canvas(me.image);

            me.base_canvas = base_canvas;
            me.overlay_canvas = overlay_canvas;

            me._xref = {};
            me.data = [];

            default_group = !opts.mapKey;
            sel = ($.browser.msie && $.browser.version <= 7) ? 'area' :
                (default_group ? 'area[coords]' : 'area[' + opts.mapKey + ']');
            areas = $(me.map).find(sel);

            scale = me.scaleInfo = u.scaleInfo(me.image, opts.scaleMap);

            for (i = areas.length - 1; i >= 0; i--) {
                area_id = 0;
                area = areas[i];
                $area = $(area);
                key = area.getAttribute(opts.mapKey);
                keys = (default_group || typeof key !== 'string') ? [''] : key.split(',');
                // conditions for which the area will be bound to mouse events
                // only bind to areas that don't have nohref. ie 6&7 cannot detect the presence of nohref, so we have to also not bind if href is missing.
                for (j = keys.length - 1; j >= 0; j--) {
                    key = keys[j];
                    if (opts.mapValue) {
                        group_value = $area.attr(opts.mapValue);
                    }
                    if (default_group) {
                        // set an attribute so we can refer to the area by index from the DOM object if no key
                        area_id = addGroup(this.data.length, group_value);
                        dataItem = this.data[area_id];
                        dataItem.key = key = area_id.toString();
                    }
                    else {
                        area_id = this._xref[key];
                        if (area_id >= 0) {
                            dataItem = this.data[area_id];
                            if (group_value && !this.data[area_id].value) {
                                dataItem.value = group_value;
                            }
                        }
                        else {
                            area_id = addGroup(key, group_value);
                            dataItem = this.data[area_id];
                        }
                    }
                    mapArea = new MapArea(this, area);
                    dataItem.areas.push(mapArea);
                }

                if (!mapArea.nohref) {
                    $area.bind('mouseover.mapster', this.mouseover)
                        .bind('mouseout.mapster', this.mouseout)
                        .bind('click.mapster', this.click);
                    $area.data('mapster_key', key);
                }
            }

            // now that we have processed all the areas, set css for wrapper, scale map if needed

            css = {
                display: 'block',
                position: 'relative',
                padding: 0,
                width: scale.width,
                height: scale.height
            };

            img.css(canvas_style);

            me.images[0].style.cssText = me.image.style.cssText;
            me.images[0].className = 'mapster_el';
            u.setOpacity(me.images[0], 1, !has_canvas);
            // if we were rebinding with an existing wrapper, the image will aready be in it
            if (img.parent()[0] !== me.wrapper[0]) {
                img.before(me.wrapper);
            }
            $(me.wrapper)
                .css(css)
                .append(me.images[0])
                .append(base_canvas)
                .append(overlay_canvas)
                .append(img);

            u.setOpacity(me.image, 0, !has_canvas);

            this.setAreaOptions(opts.areas);

            if (opts.isSelectable && opts.onGetList) {
                sorted_list = this.data.slice(0);
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

                this.options.boundList = opts.onGetList.call(this.image, sorted_list);
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
        };
        MapData.prototype.clearEvents = function () {
            $(this.map).find('area')
                .unbind('mouseover.mapster')
                .unbind('mouseout.mapster')
                .unbind('click.mapster');
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
                this.reset(preserveState);
            });
            this.data = null;
            if (!preserveState) {
                // get rid of everything except the original image
                this.image.style.cssText = this.imgCssText;
                $(this.wrapper).before(this.image).remove();
                $(this.images[0]).remove();
            }
            // release image refs
            this.image = null;
            u.each(this.images, function (i) {
                me.images[i] = null;
            });

            this.clearTooltip();
        };
        MapData.prototype.bindTooltipClose = function (option, event, obj) {
            var event_name = event + '.mapster-tooltip', me = this;
            if (u.arrayIndexOf(this.options.toolTipClose, option) >= 0) {
                obj.unbind(event_name).bind(event_name, function () {
                    me.clearTooltip();
                });
                this._tooltip_events.push(
                {
                    object: obj, event: event_name
                });
            }
        };
        // END MAPDATA
        AreaData = function (owner, key, value) {
            this.owner = owner;
            this.key = key || '';
            this.areaId = -1;
            this.value = value || '';
            this.options = {};
            this.selected = null;   // "null" means unchanged. Use "isSelected" method to just test true/false
            this.areas = [];        // MapArea objects
            this.area = null;
            this._effectiveOptions = null;
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
        AreaData.prototype.effectiveOptions = function (override_options) {
            if (!this._effectiveOptions) {
                //TODO this isSelectable should cascade already this seems redundant
                this._effectiveOptions = u.mergeObjects({
                    source: [this.owner.area_options,
                        this.options,
                        override_options || {},
                        { id: this.areaId}],
                    deep: "render_highlight,render_select"
                });
            }
            return this._effectiveOptions;
        };
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
        // highlight an area
        AreaData.prototype.highlight = function () {
            graphics.addShapeGroup(this, "highlight");
            this.owner.setHighlight(this.areaId);
            this.changeState('highlight', true);
        };

        AreaData.prototype.setAreaSelected = function () {
            graphics.addShapeGroup(this, "select");
            this.changeState('select', true);
        };

        AreaData.prototype.addSelection = function () {
            // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
            var o = this.owner;
            o.initGraphics();
            if (o.options.singleSelect) {
                graphics.clear_selections();
                u.each(o.data, function () {
                    this.selected = false;
                });
            }

            if (!this.isSelected()) {
                this.setAreaSelected();
                this.selected = true;
            }

            if (o.options.singleSelect) {
                graphics.refresh_selections();
            }
        };
        AreaData.prototype.removeSelection = function () {
            var o = this.owner;
            o.initGraphics();
            if (this.selected === false) {
                return;
            }
            this.selected = false;
            graphics.clear_selections(this.areaId);
            graphics.refresh_selections();
            // do not call ensure_no_highlight- we don't really want to unhilight it, just remove the effect
            graphics.clear_highlight();
            this.changeState('select', false);
        };
        AreaData.prototype.toggleSelection = function () {
            if (!this.isSelected()) {
                this.addSelection();
            }
            else {
                this.removeSelection();
            }
            return this.isSelected();
        };
        // Show tooltip adjacent to DOM element "area"
        AreaData.prototype.showTooltip = function (forArea) {
            var tooltip, left, top, tooltipCss, coords, fromCoords, container,
                alignLeft = true,
	        alignTop = true,
	        opts = this.effectiveOptions(),
                map_data = this.owner,
                baseOpts = map_data.options,
                template = map_data.options.toolTipContainer;

            if (typeof template === 'string') {
                container = $(template);
            } else {
                container = $(template).clone();
            }

            tooltip = container.html(opts.toolTip).hide();

            if (forArea) {
                fromCoords = $(forArea).attr("coords").split(",");
            } else {
                fromCoords = [];
                u.each(this.areas, function () {
                    fromCoords = fromCoords.concat(this.coords);
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
            u.ifFunction(baseOpts.onShowToolTip, forArea || null,
            {
                toolTip: tooltip,
                areaOptions: opts,
                key: this.key,
                selected: this.isSelected()
            });

        };

        // represents an area
        MapArea = function (owner, areaEl) {
            var me = this;
            me.owner = owner;
            me.area = areaEl;
            me.originalCoords = areaEl.coords.split(',');
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
        MapArea.prototype.coords = function (pct) {
            var j, newCoords = [];
            pct = pct || this.owner.scaleInfo.scalePct;
            if (pct === 1) {
                return this.originalCoords;
            }

            for (j = 0; j < this.length; j++) {
                //amount = j % 2 === 0 ? xPct : yPct;
                newCoords.push(Math.round(this.originalCoords[j] * pct).toString());
            }
            return newCoords;
        };
        // PUBLIC FUNCTIONS

        // Returns a comma-separated list of user-selected areas. "staticState" areas are not considered selected for the purposes of this method.
        me.get = function (key) {
            var ar, map_data, result = '';
            this.each(function () {
                map_data = get_map_data(this);
                if (!map_data) {
                    return true; // continue -- no data associated with this image
                }

                if (key) {
                    // getting data for specific key --- return true or false
                    ar = map_data.getDataForKey(key);
                    if (ar) { result = ar.isSelected(); }
                    return false; // break
                } else {
                    result = map_data.getSelected();
                }
                return false; // break
            });
            return result;
        };
        me.data = function (key) {
            return (new Method(this, arguments,
                null,
                function () {
                    return this;
                },
                { key: key }
            )).go();
        };
        // key is one of: (string) area key: target the area -- will use the largest
        //                (DOM el/jq) area: target specific area
        //                 any falsy value: close the tooltip

        // or you don't care which is used.
        me.tooltip = function (key) {
            return (new Method(this, arguments,
                function () {
                    this.clearTooltip();
                },
                function () {
                    if (this.effectiveOptions().toolTip) {
                        //TODO warning: will this.area be set even if called witout an area? I hope not
                        this.showTooltip(this.area);
                    }
                },
                { key: key }
            )).go();
        };

        // Set or return highlight state. 
        //  $(img).mapster('highlight') -- return highlighted area key, or null if none
        //  $(area).mapster('highlight') -- highlight an area
        //  $(img).mapster('highlight','area_key') -- highlight an area
        //  $(img).mapster('highlight',false) -- remove highlight
        me.highlight = function (key) {
            return (new Method(this, arguments,
                function (selected) {
                    var id;
                    if (key === false) {
                        this.ensureNoHighlight();
                    } else {
                        id = this._highlightId;
                        return id >= 0 ? this.data[id].key : null;
                    }
                },
                function () {
                    this.highlight();
                },
                { key: key }
            )).go();
        };

        // Select or unselect areas identified by key -- a string, a csv string, or array of strings.
        // if set_bound is true, the bound list will also be updated. Default is true. If neither true nor false,
        // it will be toggled.
        me.set = function (selected, key, set_bound) {
            var lastParent, parent, map_data, key_list, do_set_bound;


            function setSelection(ar) {
                switch (selected) {
                    case true:
                        ar.addSelection(); break;
                    case false:
                        ar.removeSelection(); break;
                    default:
                        ar.toggleSelection(); break;
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
                        u.each(key_list.split(','), function () {
                            setSelection(map_data.getDataForKey(this.toString()));
                        });
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

                    if ((key_list + ",").indexOf(ar.key) < 0) {
                        key_list += (key_list === '' ? '' : ',') + ar.key;
                    }

                    setSelection(ar);

                }
                if (do_set_bound && map_data.options.boundList) {
                    setBoundListProperties(map_data.options, getBoundList(map_data.options, key_list), selected);
                }
            });
            return this;
        };

        me.unbind = function (preserveState) {
            var map_data;
            return this.each(function () {
                map_data = get_map_data(this);
                if (map_data) {
                    if (queue_command(map_data, $(this), 'unbind')) {
                        return true;
                    }

                    map_data.clearEvents();
                    map_data.clearMapData(preserveState);
                    map_cache.splice(map_data.index, 1);
                }
            });
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
            var map_data;
            if (!options) { return; }
            this.filter('img').each(function () {
                map_data = get_map_data(this);
                if (map_data) {
                    if (queue_command(map_data, $(this), 'rebind', [options])) {
                        return true;
                    }

                    merge_options(map_data, options);

                    map_data.setAreaOptions(options.areas || {});
                    map_data.setAreasSelected();
                }
            });
            return this;
        };
        // get options. nothing or false to get, or "true" to get effective options (versus passed options)
        me.get_options = function (key, effective) {
            var opts, ar, map_data,
                img = this.filter('img').first()[0];
            effective = u.isBool(key) ? key : effective; // allow 2nd parm as "effective" when no keys
            map_data = get_map_data(img);
            if (map_data) {
                if (typeof key === 'string') {
                    ar = map_data.getDataForKey(key);
                    if (ar) {
                        opts = effective ? ar.effectiveOptions() : ar.options;
                    }
                } else {
                    opts = map_data.options;
                    if (effective) {
                        opts.render_select = u.mergeObjects({ template: $.mapster.render_defaults, source: [opts, opts.render_select] });
                        opts.render_highlight = u.mergeObjects({ template: $.mapster.render_defaults, source: [opts, opts.render_highlight] });
                    }
                }
                return opts;
            }
            return null;
        };

        // set options - pass an object with options to set, 
        me.set_options = function (options) {
            var img = this.filter('img')[0],
                map_data = get_map_data(img);
            if (map_data) {
                if (queue_command(map_data, $(this), 'set_options', [options])) {
                    return true;
                }
                merge_options(map_data, options);
            }
            return this;
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
                    if (queue_command(map_data, $(this), 'bind', [options])) {
                        return true;
                    } else {
                        me.unbind.call(img);
                        map_data = null;
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
                    map_data.index = map_cache.push(map_data) - 1;
                    map_data.map = map;
                    map_data.addImage(this.src);
                    if (has_canvas) {
                        map_data.addImage(opts.render_highlight.altImage || opts.altImage, "highlight");
                        map_data.addImage(opts.render_select.altImage || opts.altImage, "select");
                    }
                    map_data.bindImages();
                }
            });
        };

        me.init = function (useCanvas) {
            var style, shapes;

            has_canvas = $('<canvas></canvas>')[0].getContext ? true : false;

            if (!(has_canvas || document.namespaces)) {
                $.fn.mapster = function () {
                    return this;
                };
                return;
            }

            // for testing/debugging, use of canvas can be forced by initializing manually with "true" or "false"            
            if (u.isBool(useCanvas)) {
                has_canvas = useCanvas;
            }
            if ($.browser.msie && !has_canvas && !ie_config_complete) {
                document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                style = document.createStyleSheet();
                shapes = ['shape', 'rect', 'oval', 'circ', 'fill', 'stroke', 'imagedata', 'group', 'textbox'];
                $.each(shapes,
                function () {
                    style.addRule('v\\:' + this, "behavior: url(#default#VML); antialias:true");
                });
                ie_config_complete = true;
            }

            //$(window).unload($.mapster.unload);
            // create graphics functions for canvas and vml browsers. usage: 
            // 1) init with map_data, 2) call begin with canvas to be used (these are separate b/c may not require canvas to be specified
            // 3) call add_shape_to for each shape or mask, 4) call render() to finish

            graphics = (function () {

                var element_name, map_data, canvas, context, width, height, masks, shapes, css3color, render_shape, addAltImage, me = {};
                me.active = false;

                function addShapeGroupImpl(areaData, mode) {
                    var opts, areaOpts;
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

                    return areaOpts;
                }
                me.init = function (_map_data) {
                    map_data = _map_data;
                };
                me.begin = function (curCanvas, curName) {
                    canvas = curCanvas;
                    width = $(canvas).width();
                    height = $(canvas).height();
                    shapes = [];
                    masks = [];
                    me.active = true;
                    me.beginSpecific(curName);
                };
                me.addShape = function (mapArea, options) {
                    var addto = options.isMask ? masks : shapes;
                    addto.push({ mapArea: mapArea, options: options });
                };
                me.addShapeGroup = function (areaData, mode) {
                    var list, name,
                         opts = areaData.effectiveOptions();
                    // render includeKeys first - because they could be masks
                    me.init(areaData.owner);
                    if (mode === 'select') {
                        name = "static_" + areaData.areaId.toString();
                        canvas = map_data.base_canvas;
                    } else {
                        canvas = map_data.overlay_canvas;
                    }
                    me.begin(canvas, name);

                    if (opts.includeKeys) {
                        list = opts.includeKeys.split(',');
                        u.each(list, function () {
                            addShapeGroupImpl(map_data.getDataForKey(this.toString()), mode);
                        });
                    }

                    opts = addShapeGroupImpl(areaData, mode);
                    me.render();

                    if (opts.fade && mode === 'highlight') {
                        u.fader(canvas, 0, 1, opts.fadeDuration, !has_canvas);
                    }
                };

                if (has_canvas) {
                    css3color = function (color, opacity) {
                        function hex_to_decimal(hex) {
                            return Math.max(0, Math.min(parseInt(hex, 16), 255));
                        }
                        return 'rgba(' + hex_to_decimal(color.substr(0, 2)) + ',' + hex_to_decimal(color.substr(2, 2)) + ',' + hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
                    };
                    // mapArea
                    render_shape = function (context, mapArea) {
                        var i, c = mapArea.coords();
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
                    addAltImage = function (context, image, mapArea, options) {
                        context.beginPath();

                        render_shape(context, mapArea);
                        context.closePath();
                        context.clip();

                        context.globalAlpha = options.altImageOpacity;

                        context.drawImage(image, 0, 0, mapArea.owner.scaleInfo.width, mapArea.owner.scaleInfo.height);
                    };

                    me.beginSpecific = function () {
                        context = canvas.getContext('2d');
                    };
                    me.render = function () {

                        // firefox 6.0 context.save() seems to be broken. to work around,  we have to draw the contents on one temp canvas, 
                        // the mask on another, and merge everything. ugh. fixed in 1.2.2. unfortunately this is a lot more code for masks,
                        // but no other way around it that i can see.

                        var maskCanvas = $('<canvas width=' + canvas.width + ' height=' + canvas.height + '></canvas>')[0],
                            maskContext = maskCanvas.getContext('2d'),
                            shapeCanvas = $('<canvas width=' + canvas.width + ' height=' + canvas.height + '></canvas>')[0],
                            shapeContext = shapeCanvas.getContext('2d');

                        if (masks.length) {
                            u.each(masks, function () {
                                maskContext.beginPath();
                                render_shape(maskContext, this.mapArea);
                                maskContext.closePath();
                                maskContext.fillStyle = '#fff';
                                maskContext.fill();
                            });
                        }

                        u.each(shapes, function () {

                            var s = this;
                            shapeContext.save();
                            if (s.options.alt_image) {
                                addAltImage(shapeContext, s.options.alt_image, s.mapArea, s.options);
                            } else if (s.options.fill) {

                                shapeContext.beginPath();
                                render_shape(shapeContext, s.mapArea);
                                shapeContext.closePath();
                                shapeContext.clip();
                                shapeContext.fillStyle = css3color(s.options.fillColor, s.options.fillOpacity);
                                shapeContext.fill();
                            }
                            shapeContext.restore();
                        });


                        // render strokes at end since masks get stroked too

                        u.each(shapes.concat(masks), function () {
                            var s = this;
                            if (s.options.stroke) {
                                shapeContext.save();
                                shapeContext.strokeStyle = css3color(s.options.strokeColor, s.options.strokeOpacity);
                                shapeContext.lineWidth = s.options.strokeWidth;

                                shapeContext.beginPath();
                                render_shape(shapeContext, s.mapArea);
                                shapeContext.closePath();
                                shapeContext.stroke();
                                shapeContext.restore();
                                shapeContext.restore();
                            }
                        });

                        // render the new shapes against the mask
                        maskContext.globalCompositeOperation = "source-out";
                        maskContext.drawImage(shapeCanvas, 0, 0);
                        // flatten into the main canvas
                        context.drawImage(maskCanvas, 0, 0);

                        context = null;
                        me.active = false;
                        return canvas;
                    };
                    me.create_canvas_for = function (img, width, height) {
                        var c,
                         $img = $(img);

                        c = $('<canvas width=' + $img.width() + ' height=' + $img.height() + '></canvas>').addClass("mapster_el")[0];
                        c.getContext("2d").clearRect(0, 0, $img.width(), $img.height());
                        return c;
                    };
                    me.clear_highlight = function () {
                        map_data.overlay_canvas.getContext('2d').clearRect(0, 0, map_data.overlay_canvas.width, map_data.overlay_canvas.height);
                    };
                    me.clear_selections = function () {
                        return null;
                    };
                    // Draw all items from selected_list to a new canvas, then swap with the old one. This is used to delete items when using canvases. 
                    me.refresh_selections = function () {
                        var canvas_temp;
                        // draw new base canvas, then swap with the old one to avoid flickering
                        canvas_temp = map_data.base_canvas;

                        map_data.base_canvas = create_canvas(map_data.image);
                        $(map_data.base_canvas).hide();
                        $(map_data.image).before(map_data.base_canvas);

                        map_data.setAreasSelected();

                        $(map_data.base_canvas).show();
                        $(canvas_temp).remove();
                    };
                    return me;
                } else {
                    render_shape = function (mapArea, options) {
                        var stroke, e, t_fill, el_name, template, c = mapArea.coords();
                        el_name = element_name ? 'name="' + element_name + '" ' : '';

                        t_fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" /><v:stroke opacity="' + options.strokeOpacity + '"/>';

                        if (options.stroke) {
                            stroke = 'strokeweight=' + options.strokeWidth + ' stroked="t" strokecolor="#' + options.strokeColor + '"';
                        } else {
                            stroke = 'stroked="f"';
                        }

                        switch (mapArea.shape) {
                            case 'rect':
                                template = '<v:rect ' + el_name + ' filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + c[0] + 'px;top:' + c[1]
                                    + 'px;width:' + (c[2] - c[0]) + 'px;height:' + (c[3] - c[1]) + 'px;">' + t_fill + '</v:rect>';
                                break;
                            case 'poly':
                                template = '<v:shape ' + el_name + ' filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + width + ',' + height
                                    + '" path="m ' + c[0] + ',' + c[1] + ' l ' + c.slice(2).join(',')
                                    + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + width + 'px;height:' + height + 'px;">' + t_fill + '</v:shape>';
                                break;
                            case 'circ':
                            case 'circle':
                                template = '<v:oval ' + el_name + ' filled="t" ' + stroke
                                    + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (c[0] - c[2]) + 'px;top:' + (c[1] - c[2])
                                    + 'px;width:' + (c[2] * 2) + 'px;height:' + (c[2] * 2) + 'px;">' + t_fill + '</v:oval>';
                                break;
                        }
                        e = $(template);
                        $(canvas).append(e);

                        return e;
                    };
                    me.beginSpecific = function (name) {
                        element_name = name;
                    };
                    me.create_canvas_for = function (img) {
                        var $img = $(img),
                            width = $img.width(),
                            height = $img.height();
                        return $('<var width="' + width + '" height="' + height + '" style="zoom:1;overflow:hidden;display:block;width:' + width + 'px;height:' + height + 'px;"></var>')[0];
                    };
                    me.render = function () {
                        var opts;
                        u.each(shapes, function () {
                            render_shape(this.mapArea, this.options);
                        });

                        if (masks.length) {
                            u.each(masks, function () {
                                opts = u.mergeObjects({ source: [this.options, { fillOpacity: 1, fillColor: this.options.fillColorMask}] });
                                render_shape(this.mapArea, opts);
                            });
                        }

                        me.active = false;
                        return canvas;
                    };
                    me.clear_highlight = function () {
                        $(map_data.overlay_canvas).children().remove();
                    };
                    me.clear_selections = function (area_id) {
                        if (area_id >= 0) {
                            $(map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
                        }
                        else {
                            $(map_data.base_canvas).children().remove();
                        }
                    };
                    me.refresh_selections = function () {
                        return null;
                    };
                    return me;
                }

            } ());

        };
        me.unload = function () {
            var i;
            for (i = map_cache.length - 1; i >= 0; i--) {
                if (map_cache[i]) {
                    me.unbind.call($(map_cache[i].image));
                }
            }
            graphics = null;
        };
        me.resize = function (width, height, duration) {
            var d;
            return this.each(function () {
                d = get_map_data(this);
                if ((!width && !height)
                     || !d
                     || queue_command(d, $(this), 'snapshot')) {
                    return true;
                }
                d.resize(width, height, duration);
            });
        };
        me.snapshot = function () {
            var d;
            return this.filter('img').each(function () {
                d = get_map_data(this);
                if (d) {
                    if (queue_command(d, $(this), 'snapshot')) {
                        return true;
                    }
                    u.each(d.data, function () {
                        this.selected = false;
                    });

                    d.base_canvas = create_canvas(d.image);
                    $(d.base_canvas);
                    $(d.image).before(d.base_canvas);
                }
            });
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
    // A plugin selector to return nodes where an attribute matches any item from a comma-separated list. The list should not be quoted.
    // Will be more efficient (and easier) than selecting each one individually
    // usage: $('attrMatches("attribute_name","item1,item2,...");
    $.expr[':'].attrMatches = function (objNode, intStackIndex, arrProperties, arrNodeStack) {
        var i, j, curVal,
        quoteChar = arrProperties[2],
        arrArguments = eval("[" + quoteChar + arrProperties[3] + quoteChar + "]"),
        compareList = arrArguments[1].split(','),
        node = $(objNode);

        for (i = 0; i < arrArguments.length; i++) {
            curVal = node.attr(arrArguments[0]);
            for (j = compareList.length - 1; j >= 0; j--) {
                if (curVal === compareList[j]) {
                    return true;
                }
            }
        }
        return false;
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
    $.each(["bind", "rebind", "unbind", "set", "get", "data", "highlight", "get_options", "set_options", "snapshot", "tooltip", "test", "resize"], function () {
        methods[this] = $.mapster.impl[this];
    });
    $.mapster.impl.init();
} (jQuery));
