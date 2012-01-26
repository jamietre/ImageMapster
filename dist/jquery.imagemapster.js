/* ImageMapster
   Version: see $.mapster.version

Copyright 2011 James Treworgy
http://www.outsharked.com/imagemapster
https://github.com/jamietre/ImageMapster

A jQuery plugin to enhance image maps.
*/
/*
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


(function ($) {
    // all public functions in $.mapster.impl are methods
    $.fn.mapster = function (method) {
        var m = $.mapster.impl;
        if ($.isFunction(m[method])) {
            return m[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return m.bind.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.mapster');
        }
    };

    $.mapster = {
        version: "1.2.5b32",
        render_defaults: {
            fade: false,
            fadeDuration: 150,
            altImage: null,
            altImageOpacity: 0.7,
            fill: true,
            fillColor: '000000',
            fillColorMask: 'FFFFFF',
            fillOpacity: 0.5,
            highlight: null,
            stroke: false,
            strokeColor: 'ff0000',
            strokeOpacity: 1,
            strokeWidth: 1,
            includeKeys: '',
            alt_image: null // used internally
        },
        defaults: {
            wrapClass: null,
            wrapCss: null,
            onGetList: null,
            sortList: false,
            listenToList: false,
            mapKey: '',
            mapValue: '',
            singleSelect: false,
            listKey: 'value',
            listSelectedAttribute: 'selected',
            listSelectedClass: null,
            onClick: null,
            onMouseover: null,
            onMouseout: null,
            onStateChange: null,
            boundList: null,
            onConfigured: null,
            configTimeout: 10000,
            noHrefIsMask: true,
            scaleMap: true,
            safeLoad: false,
            areas: []
        },
        shared_defaults: {
            render_highlight: { fade: true },
            render_select: { fade: false },
            staticState: null,
            selected: null,
            isSelectable: true,
            isDeselectable: true
        },
        area_defaults:
        {
            includeKeys: '',
            isMask: false
        },
        canvas_style: {
            position: 'absolute',
            left: 0,
            top: 0,
            padding: 0,
            border: 0
        },
        hasCanvas: null,
        isTouch: null,
        windowLoaded: false,
        map_cache: [],
        hooks: {},
        addHook: function(name,callback) {
            this.hooks[name]=(this.hooks[name]||[]).push(callback);
        },
        callHooks: function(name,context) {
            $.each(this.hooks[name]||[],function() {
                this.apply(context);
            });
        },
        utils: {

            //            extend: function (target, sources, deep) {
            //                var i,u=this;
            //                $.extend.call(null, [target].concat(sources));
            //                for (i = 0; i < deep.length; i++) {
            //                    u.extend(
            //                }
            //            },
            // return four outer corners, as well as possible places

            // extends the constructor, returns a new object prototype. Does not refer to the
            // original constructor so is protected if the original object is altered. This way you
            // can "extend" an object by replacing it with its subclass.
            subclass: function (Obj, constr) {
                var proto = new Obj(),
                    sub = function () {
                        proto.constructor.apply(this, arguments);
                        constr.apply(this, arguments);
                    };
                sub.prototype = proto.constructor.prototype;
                return sub;
            },
            asArray: function (obj) {
                return obj.constructor === Array ?
                    obj : this.split(obj, ',');
            },
            // clean split: no padding or empty elements
            split: function (text) {
                var i, arr = text.split(',');
                for (i = arr.length - 1; i >= 0; i--) {
                    arr[i] = $.trim(arr[i]);
                    if (!arr[i]) {
                        arr = arr.splice(i, 1);
                    }
                }
                return arr;
            },
            setOpacity: function (e, opacity) {
                if (!$.mapster.hasCanvas) {
                    e.style.filter = "Alpha(opacity=" + String(opacity * 100) + ")";
                } else {
                    e.style.opacity = opacity;
                }
            },
            // similar to $.extend but does not add properties (only updates), unless the
            // first argument is an empty object, then all properties will be copied
            updateProps: function (_target, _template) {
                var onlyProps,
                    target = _target || {},
                    template = $.isEmptyObject(target) ? _template : _target;

                //if (template) {
                onlyProps = [];
                $.each(template, function (prop) {
                    onlyProps.push(prop);
                });
                //}

                $.each(Array.prototype.slice.call(arguments, 1), function (i, obj) {
                    $.each(obj || {}, function (prop, val) {
                        if (!onlyProps || $.inArray(prop, onlyProps) >= 0) {
                            var p = obj[prop];
                            if (typeof p !== 'undefined') {
                                if ($.isPlainObject(p)) {
                                    // not recursive - only copies 1 level of subobjects, and always merges
                                    target[prop] = $.extend(target[prop] || {}, p);
                                } else if (p && p.constructor === Array) {
                                    target[prop] = p.slice(0);
                                } else {
                                    target[prop] = obj[prop];
                                }
                            }
                        }
                    });
                });
                return target;
            },
            isElement: function (o) {
                return (typeof HTMLElement === "object" ? o instanceof HTMLElement :
                        o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string");
            },
            // finds element of array or object with a property "prop" having value "val"
            // if prop is not defined, then just looks for property with value "val"
            indexOfProp: function (obj, prop, val) {
                var result = obj.constructor === Array ? -1 : null;
                $.each(obj, function (i, e) {
                    if (e && (prop ? e[prop] : e) === val) {
                        result = i;
                        return false;
                    }
                });
                return result;
            },
            // returns "obj" if true or false, or "def" if not true/false
            boolOrDefault: function (obj, def) {
                return this.isBool(obj) ?
                        obj : def || false;
            },
            isBool: function (obj) {
                return typeof obj === "boolean";
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
            fader: (function () {
                var elements = {},
                        lastKey = 0,
                        fade_func = function (el, op, endOp, duration) {
                            var index, obj, u = $.mapster.utils;
                            if (typeof el === 'number') {
                                obj = elements[el];
                                if (!obj) {
                                    return;
                                }
                            } else {
                                index = u.indexOfProp(elements, null, el);
                                if (index) {
                                    delete elements[index];
                                }
                                elements[++lastKey] = obj = el;
                                el = lastKey;
                            }
                            endOp = endOp || 1;

                            op = (op + (endOp / 10) > endOp - 0.01) ? endOp : op + (endOp / 10);

                            u.setOpacity(obj, op);
                            if (op < endOp) {
                                setTimeout(function () {
                                    fade_func(el, op, endOp, duration);
                                }, duration ? duration / 10 : 15);
                            }
                        };
                return fade_func;
            } ())
        },
        getBoundList: function (opts, key_list) {
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
        },
        // Causes changes to the bound list based on the user action (select or deselect)
        // area: the jQuery area object
        // returns the matching elements from the bound list for the first area passed (normally only one should be passed, but
        // a list can be passed
        setBoundListProperties: function (opts, target, selected) {
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
        },
        getMapDataIndex: function (obj) {
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
                this.utils.indexOfProp(this.map_cache, 'image', img) : -1;
        },
        getMapData: function (obj) {
            var index = this.getMapDataIndex(obj);
            if (index >= 0) {
                return index >= 0 ? this.map_cache[index] : null;
            }
        },
        queueCommand: function (map_data, that, command, args) {
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
        },
        unload: function () {
            this.impl.unload();
            this.utils = null;
            this.impl = null;
            $.fn.mapster = null;
            $.mapster = null;
            $('*').unbind();
        }
    };

    // Config for object prototypes
    // first: use only first object (for things that should not apply to lists)
    /// calls back one of two fuinctions, depending on whether an area was obtained.
    // opts: {
    //    name: 'method name',
    //    key: 'key,
    //    args: 'args'
    //
    //}
    // name: name of method (required)
    // args: arguments to re-call with
    // Iterates through all the objects passed, and determines whether it's an area or an image, and calls the appropriate
    // callback for each. If anything is returned from that callback, the process is stopped and that data return. Otherwise,
    // the object itself is returned.
    var m = $.mapster;
    m.Method = function (that, func_map, func_area, opts) {
        var me = this;
        me.name = opts.name;
        me.output = that;
        me.input = that;
        me.first = opts.first || false;
        me.args = opts.args ? Array.prototype.slice.call(opts.args, 0) : [];
        me.key = opts.key;
        me.func_map = func_map;
        me.func_area = func_area;
        //$.extend(me, opts);
        me.name = opts.name;
    };
    m.Method.prototype.go = function () {
        var i,  data, ar, len, result, src = this.input,
                area_list = [],
                me = this;
        len = src.length;
        for (i = 0; i < len; i++) {
            data = $.mapster.getMapData(src[i]);
            if (data) {
                if (m.queueCommand(data, me.input, me.name, me.args)) {
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
                    result = this.func_map.apply(data, me.args);
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


    $.mapster.impl = (function () {
        var me = {},
            m = $.mapster,
            u = $.mapster.utils,
            removeMap, addMap;

        addMap = function (map_data) {
            return m.map_cache.push(map_data) - 1;
        };
        removeMap = function (map_data) {
            m.map_cache.splice(map_data.index, 1);
            for (var i = m.map_cache.length - 1; i >= this.index; i--) {
                m.map_cache[i].index--;
            }
        };
        /// return current map_data for an image or area

        // merge new area data into existing area options. used for rebinding.
        function merge_areas(map_data, areas) {
            var ar, index,
                map_areas = map_data.options.areas;
            if (areas) {
                $.each(areas, function (i, e) {
                    index = u.indexOfProp(map_areas, "key", this.key);
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
            var temp_opts = u.updateProps({}, options);
            delete temp_opts.areas;
            u.updateProps(map_data.options, temp_opts);

            merge_areas(map_data, options.areas);
            // refresh the area_option template
            u.updateProps(map_data.area_options, map_data.options);

            $.each(map_data.data, function (i, e) {
                e._effectiveOptions = null;
            });
        }

        // Returns a comma-separated list of user-selected areas. "staticState" areas are not considered selected for the purposes of this method.
        me.get = function (key) {
            return (new m.Method(this,
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
            return (new m.Method(this,
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


        // Set or return highlight state.
        //  $(img).mapster('highlight') -- return highlighted area key, or null if none
        //  $(area).mapster('highlight') -- highlight an area
        //  $(img).mapster('highlight','area_key') -- highlight an area
        //  $(img).mapster('highlight',false) -- remove highlight
        me.highlight = function (key) {
            return (new m.Method(this,
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
        me.select = function () {
            me.set.call(this, true);
        };
        me.deselect = function () {
            me.set.call(this, false);
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
                map_data = m.getMapData(this);
                if (!map_data) {
                    return true; // continue
                }
                key_list = '';
                if ($(this).is('img')) {
                    if (m.queueCommand(map_data, $(this), 'set', [selected, key, do_set_bound])) {
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
                        $.each(u.split(key_list), function (i, e) {
                            setSelection(map_data.getDataForKey(e.toString()));
                        });
                        if (!selected) {
                            map_data.removeSelectionFinish();
                        }
                    }

                } else {
                    parent = $(this).parent()[0];
                    // it is possible for areas from different mapsters to be passed, make sure we're on the right one.
                    if (lastParent && parent !== lastParent) {
                        map_data = m.getMapData(this);
                        if (!map_data) {
                            return true;
                        }
                        lastParent = parent;
                    }
                    lastParent = parent;

                    if (m.queueCommand(map_data, $(this), 'set', [selected, key, do_set_bound])) {
                        return true;
                    }

                    ar = map_data.getDataForArea(this);

                    if ($.inArray(ar, area_list) < 0) {
                        area_list.push(ar);
                        key_list+=key_list===''?'':','+ar.key;
                    }
                }
            });
            // set all areas collected from the loop

            $.each(area_list, function (i, el) {
                setSelection(el);
            });
            if (do_set_bound && map_data.options.boundList) {
                m.setBoundListProperties(map_data.options, m.getBoundList(map_data.options, key_list), selected);
            }

            return this;
        };
        me.unbind = function (preserveState) {
            return (new m.Method(this,
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


        // refresh options and update selection information.
        me.rebind = function (options, replaceOptions) {
            return (new m.Method(this,
                function () {
                    if (replaceOptions) {
                        this.options = u.updateProps({}, m.defaults, options);
                        $.each(this.data,function() {
                            this.options={};
                        });
                    }

                    merge_options(this, options);
                    this.setAreaOptions(options.areas || {});

                    this.redrawSelections();
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
            return (new m.Method(this,
                function () {
                    var opts = $.extend({}, this.options);
                    if (eff) {
                        opts.render_select = u.updateProps(
                            {},
                            m.render_defaults,
                            opts,
                            opts.render_select);

                        opts.render_highlight = u.updateProps(
                            {},
                            m.render_defaults,
                            opts,
                            opts.render_highlight);
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
            return (new m.Method(this,
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
            for (i = m.map_cache.length - 1; i >= 0; i--) {
                if (m.map_cache[i]) {
                    me.unbind.call($(m.map_cache[i].image));
                }
            }
            me.graphics = null;
        };

        me.snapshot = function () {
            return (new m.Method(this,
                function () {
                    $.each(this.data, function (i, e) {
                        e.selected = false;
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
                    md = m.getMapData(this);
                    if (md) {
                        result = md.state();
                    }
                    return false;
                }
            });
            return result;
        };

        me.bind = function (options) {
            var opts = u.updateProps({}, m.defaults, options);

            return this.each(function () {
                var img, map, usemap, map_data;

                // save ref to this image even if we can't access it yet. commands will be queued
                img = $(this);

                // sorry - your image must have border:0, things are too unpredictable otherwise.
                img.css('border', 0);

                map_data = m.getMapData(this);
                // if already bound completely, do a total rebind
                if (map_data) {
                    me.unbind.apply(img);
                    if (!map_data.complete) {
                        // will be queued
                        img.bind();
                        return true;
                    }
                    map_data = null;
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
                    map_data = new m.MapData(this, opts);

                    map_data.index = addMap(map_data);
                    map_data.map = map;
                    // add the actual main image
                    map_data.addImage(this);
                    // will create a duplicate of the main image, which we use as a background
                    map_data.addImage(null, this.src);
                    // add alt images
                    if ($.mapster.hasCanvas) {
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
            m.hasCanvas = (document.namespaces && document.namespaces.g_vml_) ? false :
                $('<canvas></canvas>')[0].getContext ? true : false;

            m.isTouch = 'ontouchstart' in document.documentElement;

            if (!(m.hasCanvas || document.namespaces)) {
                $.fn.mapster = function () {
                    return this;
                };
                return;
            }
            if (!u.isBool($.mapster.defaults.highlight)) {
                m.render_defaults.highlight = !m.isTouch;
            }

            $.extend(m.defaults, m.render_defaults,m.shared_defaults);
            $.extend(m.area_defaults, m.render_defaults,m.shared_defaults);

            // for testing/debugging, use of canvas can be forced by initializing manually with "true" or "false"
            if (u.isBool(useCanvas)) {
                m.hasCanvas = useCanvas;
            }
            if ($.browser.msie && !m.hasCanvas && !document.namespaces.v) {
                document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                style = document.createStyleSheet();
                shapes = ['shape', 'rect', 'oval', 'circ', 'fill', 'stroke', 'imagedata', 'group', 'textbox'];
                $.each(shapes,
                function (i, el) {
                    style.addRule('v\\:' + el, "behavior: url(#default#VML); antialias:true");
                });
            }

            // for safe load option
            $(window).bind('load', function () {
                m.windowLoaded = true;
                $(m.map_cache).each(function () {
                    if (!this.complete && this.isReadyToBind()) {
                        this.initialize();
                    }
                });
            });


        };
        me.test = function (obj) {
            return eval(obj);
        };
        return me;
    } ());

    $.mapster.impl.init();
} (jQuery));
/* graphics.js
   Graphics object handles all rendering.
*/
(function ($) {
    var p, m=$.mapster,
        u=m.utils;
    m.Graphics = function (map_data) {
        //$(window).unload($.mapster.unload);
        // create graphics functions for canvas and vml browsers. usage:
        // 1) init with map_data, 2) call begin with canvas to be used (these are separate b/c may not require canvas to be specified
        // 3) call add_shape_to for each shape or mask, 4) call render() to finish

        var me = this;
        me.hasCanvas=false;
        me.active = false;
        me.canvas = null;
        me.width = 0;
        me.height = 0;
        me.shapes = [];
        me.masks = [];
        me.map_data = map_data;
    };
    p = m.Graphics.prototype;

    p.begin = function (curCanvas, curName) {
        var c = $(curCanvas);

        this.elementName = curName;
        this.canvas = curCanvas;

        this.width = c.width();
        this.height = c.height();
        this.shapes = [];
        this.masks = [];
        this.active = true;

    };
    p.addShape = function (mapArea, options) {
        var addto = options.isMask ? this.masks : this.shapes;
        addto.push({ mapArea: mapArea, options: options });
    };
    p.createVisibleCanvas = function (img) {
        return $(this.createCanvasFor(img)).addClass('mapster_el').css(m.canvas_style)[0];
    };
    p._addShapeGroupImpl = function (areaData, mode) {
        var me = this,
            md = me.map_data;

        // first get area options. Then override fade for selecting, and finally merge in the "select" effect options.

        $.each(areaData.areas(), function (i,e) {
        
            var opts = e.effectiveRenderOptions(mode);
            opts.isMask = opts.isMask || (e.nohref && md.options.noHrefIsMask);
            //if (!u.isBool(opts.staticState)) {
                me.addShape(e, opts);
            //}
        });

    };
    p.addShapeGroup = function (areaData, mode) {
        // render includeKeys first - because they could be masks
        var me = this,
            list, name, canvas,
            map_data = this.map_data,
            opts = areaData.effectiveRenderOptions(mode);

        if (mode === 'select') {
            name = "static_" + areaData.areaId.toString();
            canvas = map_data.base_canvas;
        } else {
            canvas = map_data.overlay_canvas;
        }

        me.begin(canvas, name);

        if (opts.includeKeys) {
            list = u.split(opts.includeKeys);
            $.each(list, function (i,e) {
                var areaData = map_data.getDataForKey(e.toString());
                me._addShapeGroupImpl(areaData, mode);
            });
        }

        me._addShapeGroupImpl(areaData, mode);
        me.render();

        if (opts.fade) {
            u.fader(canvas, 0, 1, opts.fadeDuration);
        }

    };
    // configure remaining prototype methods for ie or canvas-supporting browser
    m.initGraphics = function(hasCanvas) {
        if (hasCanvas) {
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

                    $.each(me.masks, function (i,e) {
                        maskContext.save();
                        maskContext.beginPath();
                        me.renderShape(maskContext, e.mapArea);
                        maskContext.closePath();
                        maskContext.clip();
                        maskContext.lineWidth = 0;
                        maskContext.fillStyle = '#000';
                        maskContext.fill();
                        maskContext.restore();
                    });

                }

                $.each(me.shapes, function (i,s) {
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

                $.each(me.shapes.concat(me.masks), function (i,s) {
                    var offset = s.options.strokeWidth === 1 ? 0.5 : 0;
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
            p.clearHighlight = function () {
                var c = this.map_data.overlay_canvas;
                c.getContext('2d').clearRect(0, 0, c.width, c.height);
            };
            p.removeSelections = function () {

            };
            // Draw all items from selected_list to a new canvas, then swap with the old one. This is used to delete items when using canvases.
            p.refreshSelections = function () {
                var canvas_temp, map_data = this.map_data;
                // draw new base canvas, then swap with the old one to avoid flickering
                canvas_temp = map_data.base_canvas;

                map_data.base_canvas = this.createVisibleCanvas(map_data.image);
                $(map_data.base_canvas).hide();
                $(canvas_temp).before(map_data.base_canvas);

                map_data.redrawSelections();

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

                $.each(this.shapes, function (i,e) {
                    me.renderShape(e.mapArea, e.options);
                });

                if (this.masks.length) {
                    $.each(this.masks, function (i,e) {
                        opts = u.updateProps({},
                            e.options, {
                                fillOpacity: 1,
                                fillColor: e.options.fillColorMask
                            });
                        me.renderShape(e.mapArea, opts, 'mapster_mask');
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

            p.clearHighlight = function () {
                $(this.map_data.overlay_canvas).children().remove();
            };
            // remove single or all selections
            p.removeSelections = function (area_id) {
                if (area_id >= 0) {
                    $(this.map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
                }
                else {
                    $(this.map_data.base_canvas).children().remove();
                }
            };
            p.refreshSelections = function () {
                return null;
            };
        }
    };
    m.initGraphics(m.hasCanvas);
} (jQuery));
/* mapdata.js
   the MapData object, repesents an instance of a single bound imagemap
*/

(function ($) {
    var p, m = $.mapster, u = m.utils;
    m.MapData = function (image, options) {
        var me = this;
        this.index = -1;                 // index of this in map_cache - so we have an ID to use for wraper div

        this.image = image;              // (Image)  main map image
        this.options = options;          // {}       options passed buy user
        this.area_options = u.updateProps({}, // default options for any MapArea
            m.area_defaults,
            options);

        this.bindTries = options.configTimeout / 200;

        // save the initial style of the image for unbinding. This is problematic, chrome duplicates styles when assigning, and
        // cssText is apparently not universally supported. Need to do something more robust to make unbinding work universally.
        this.imgCssText = image.style.cssText || null;

        this.initializeDefaults();
        this.mousedown = function (e) {
            e.preventDefault();
        };

        this.mouseover = function (e) {
            var arData = me.getAllDataForArea(this),
                ar=arData.length ? arData[0] : null,
                opts;

            if (ar && !ar.owner.resizing) {

                opts = ar.effectiveOptions();

                me.inArea = true;
                if (!$.mapster.hasCanvas) {
                    this.blur();
                }
                if (me.currentAreaId === ar.areaId) {
                    return;
                }
                me.clearEffects(true);

                ar.highlight(!opts.highlight);

                if (me.options.showToolTip) {
                    $.each(arData,function() {
                        if (this.effectiveOptions().toolTip) {
                            this.showTooltip();
                        }
                    });
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

            if ((me.currentAreaId < 0 || force !== true) && me.inArea) {
                return;
            }

            me.ensureNoHighlight();

            if (opts.toolTipClose && $.inArray('area-mouseout', opts.toolTipClose) >= 0 && this.activeToolTip) {
                me.cancelClear=false;
                window.setTimeout(function() {
                    if (!me.cancelClear) {
                        me.clearTooltip();
                    }
                    me.cancelClear=false;
                },50);
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
            if (!$.mapster.hasCanvas) {
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

                list_target = m.getBoundList(opts, ar.key);
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
                    m.setBoundListProperties(opts, list_target, ar.isSelected());
                }
                areaOpts = ar.effectiveOptions();
                if (areaOpts.includeKeys) {
                    list = u.split(areaOpts.includeKeys);
                    $.each(list, function (i, e) {
                        var ar = me.getDataForKey(e.toString());
                        if (!ar.options.isMask) {
                            clickArea(ar);
                        }
                    });
                }
            }
            clickArea(ar);

        };
        this.graphics = new m.Graphics(this);

    };
    p = m.MapData.prototype;
    p.initializeDefaults = function () {
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
        this.data = [];                // MapData[] area groups
        this.mapAreas = [];            // MapArea[] list. AreaData entities contain refs to this array, so options are stored with each.
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
    p.state = function () {
        return {
            complete: this.complete,
            resizing: this.resizing,
            zoomed: this.zoomed,
            zoomedArea: this.zoomedArea,
            scaleInfo: this.scaleInfo
        };
    };
    p.isReadyToBind = function () {
        return this.imagesAdded && this.imagesLoaded && (!this.options.safeLoad || m.windowLoaded);
    };
    // bind a new image to a src, capturing load event. Return the new (or existing) image.
    p.addImage = function (img, src, altId) {
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
                        (!me.options.safeLoad || m.windowLoaded)) {
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
    p.bindImages = function (retry) {
        var alreadyLoaded = true,
                    me = this;

        me.imagesAdded = true;

        if (me.complete) {
            return;
        }
        // check to see if every image has already been loaded
        $.each(me.images, function (i, e) {
            if (!u.isImageLoaded(e)) {
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
    p.altImage = function (mode) {
        return this.images[this.altImagesXref[mode]];
    };
    p.wrapId = function () {
        return 'mapster_wrap_' + this.index;
    };
    p._idFromKey = function (key) {
        return this.complete && typeof key === "string" && this._xref.hasOwnProperty(key) ?
                    this._xref[key] : -1;
    };
    // getting all selected keys - return comma-separated string
    p.getSelected = function () {
        var result = '';
        $.each(this.data, function (i, e) {
            if (e.isSelected()) {
                result += (result ? ',' : '') + e.key;
            }
        });
        return result;
    };
    // Locate MapArea data from an HTML area
    p.getAllDataForArea = function (area) {
        var i,ar, result=[],
            me=this,
            key = $(area).attr(this.options.mapKey);

        if (key) {
            key = u.split(key);
        }
        for (i=0;i<key.length;i++) {
            ar = me.data[me._idFromKey(key[i])];
            // set the actual area moused over/selected
            // TODO: this is a brittle model for capturing which specific area - if this method was not used,
            // ar.area could have old data. fix this.
            result.push(ar);
        }


        return result;
    };
    p.getDataForArea = function(area) {
        var data = this.getAllDataForArea(area);
        if (data.length) {
            data[0].area = area.length?area[0]:area;
            return data[0];
        } else {
            data.area = null;
            return null;
        }
    };
    p.getDataForKey = function (key) {
        return this.data[this._idFromKey(key)];
    };
    p.getData = function (obj) {
        if (typeof obj === 'string') {
            return this.getDataForKey(obj);
        } else if (obj && obj.mapster || u.isElement(obj)) {
            return this.getDataForArea(obj);
        } else {
            return null;
        }
    };
    // remove highlight if present, raise event
    p.ensureNoHighlight = function () {
        var ar;
        if (this._highlightId >= 0) {
            this.graphics.clearHighlight();
            ar = this.data[this._highlightId];
            ar.changeState('highlight', false);
            this._highlightId = -1;
        }
    };
    p.setHighlightID = function (id) {
        this._highlightId = id;
    };
    p.clearSelections = function () {
        this.graphics.removeSelections();
        $.each(this.data, function (i, e) {
            e.selected = false;
        });
    };
    // rebind based on new area options. This copies info from array "areas" into the data[area_id].area_options property.
    // it returns a list of all selected areas.
    p.setAreaOptions = function (area_list) {
        var i, area_options, ar,
                    areas = area_list || {};
        // refer by: map_data.options[map_data.data[x].area_option_id]
        for (i = areas.length - 1; i >= 0; i--) {
            area_options = areas[i];
            ar = this.getDataForKey(area_options.key);
            if (ar) {
                u.updateProps(ar.options, area_options);
                // TODO: will not deselect areas that were previously selected, so this only works for an initial bind.
                if (u.isBool(area_options.selected)) {
                    ar.selected = area_options.selected;
                }
            }
        }
    };
    // keys: a comma-separated list
    p.drawSelections = function (keys) {
        var i, key_arr = u.asArray(keys);

        for (i = key_arr.length - 1; i >= 0; i--) {
            this.data[key_arr[i]].drawSelection();
        }
    };
    p.redrawSelections = function () {
        $.each(this.data, function (i, e) {
            if (e.isSelectedOrStatic()) {
                e.drawSelection();
            }
        });

    };
    ///called when images are done loading
    p.initialize = function () {
        var base_canvas, overlay_canvas, wrap, parentId, $area, area, css, sel, areas, i, j, keys, key, area_id, default_group, group_value, img,
                    sort_func, sorted_list, dataItem, mapArea, scale,  curKey, mapAreaId,
                    me = this,
                    opts = me.options;

        function addAreaData(key, value) {
            var dataItem = new m.AreaData(me, key, value);
            dataItem.areaId = me._xref[key] = me.data.push(dataItem) - 1;
            return dataItem.areaId;
        }

        if (me.complete) {
            return;
        }

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
        if (default_group) {
            opts.mapKey = 'data-mapster-key';
        }
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

                curKey = default_group ? '' : area.getAttribute(opts.mapKey);

                // conditions for which the area will be bound to mouse events
                // only bind to areas that don't have nohref. ie 6&7 cannot detect the presence of nohref, so we have to also not bind if href is missing.

                mapArea = new m.MapArea(me, area,
                    default_group || !curKey ? '' : curKey);
                keys = mapArea.keys; // converted to an array by mapArea

                me.mapAreas.push(mapArea);
                mapAreaId=me.mapAreas.length-1;

                // Iterate through each mapKey assigned to this area
                for (j = keys.length - 1; j >= 0; j--) {
                    key = keys[j];

                    if (opts.mapValue) {
                        group_value = $area.attr(opts.mapValue);
                    }
                    if (default_group) {
                        // set an attribute so we can refer to the area by index from the DOM object if no key
                        area_id = addAreaData(me.data.length, group_value);
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
                            area_id = addAreaData(key, group_value);
                            dataItem = me.data[area_id];
                        }
                    }
                    mapArea.areaDataXref.push(area_id);
                    dataItem.areasXref.push(mapAreaId);
                }

                if (!mapArea.nohref) {
                    $area.bind('mouseover.mapster', me.mouseover)
                                .bind('mouseout.mapster', me.mouseout)
                                .bind('click.mapster', me.click)
                                .bind('mousedown.mapster', me.mousedown);
                }
                // Create a key if none was assigned by the user

                if (default_group) {
                    $area.attr('data-mapster-key', key);
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

            img.css(m.canvas_style);
            me.images[1].style.cssText = me.image.style.cssText;

            wrap.append(me.images[1])
                        .append(base_canvas)
                        .append(overlay_canvas)
                        .append(img);



            // images[0] is the original image with map, images[1] is the copy/background that is visible

            u.setOpacity(me.image, 0);
            u.setOpacity(me.images[1],1);

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
            // TODO listenToList
            //            if (opts.listenToList && opts.nitG) {
            //                opts.nitG.bind('click.mapster', event_hooks[map_data.hooks_index].listclick_hook);
            //            }

            // populate areas from config options
            me.redrawSelections();

            // process queued commands
            if (me.commands.length) {
                $.each(me.commands, function (i, e) {
                    m.impl[e.command].apply(e.that, e.args);
                });
                me.commands = [];
            }
            if (opts.onConfigured && typeof opts.onConfigured === 'function') {
                opts.onConfigured.call(img, true);
            }
        });
    };
    p.clearEvents = function () {
        $(this.map).find('area')
                    .unbind('.mapster');
        $(this.images)
                    .unbind('.mapster');
    };
    p._clearCanvases = function (preserveState) {
        // remove the canvas elements created
        if (!preserveState) {
            $(this.base_canvas).remove();
        }
        $(this.overlay_canvas).remove();
    };
    p.clearMapData = function (preserveState) {
        var me = this;
        this._clearCanvases(preserveState);

        // release refs to DOM elements
        $.each(this.data, function (i, e) {
            e.reset(preserveState);
        });
        this.data = null;
        if (!preserveState) {
            // get rid of everything except the original image
            this.image.style.cssText = this.imgCssText;
            $(this.wrapper).before(this.image).remove();

        }
        // release refs

        $.each(this.images, function (i) {
            if (me.images[i] !== this.image) {
                me.images[i] = null;
            }
        });
        me.images = [];

        this.image = null;
        u.ifFunction(this.clearTooltip, this);
    };
    // Compelete cleanup process for deslecting items. Called after a batch operation, or by AreaData for single
    // operations not flagged as "partial"
    p.removeSelectionFinish = function () {
        var g = this.graphics;

        g.refreshSelections();
        // do not call ensure_no_highlight- we don't really want to unhilight it, just remove the effect
        g.clearHighlight();
    };
} (jQuery));
/* areadata.js
   AreaData and MapArea protoypes
*/

(function ($) {
    var p, m = $.mapster, u = m.utils;
    m.AreaData = function (owner, key, value) {
        this.owner = owner;
        this.key = key || '';
        this.areaId = -1;
        this.value = value || '';
        this.options = {};
        this.selected = null;   // "null" means unchanged. Use "isSelected" method to just test true/false
        this.areasXref = [];        // xref to MapArea objects
        this.area = null;       // (temporary storage) - the actual area moused over
        //this._effectiveOptions = null;
    };
    p = m.AreaData.prototype;
    p.areas = function() {
        var i,result=[];
        for (i=0;i<this.areasXref.length;i++) {
            result.push(this.owner.mapAreas[this.areasXref[i]]);
        }
        return result;
    };
    // return all coordinates for all areas
    p.coords = function (percent, offset) {
        var coords = [];
        $.each(this.areas(), function (i, el) {
            coords = coords.concat(el.coords(percent, offset));
        });
        return coords;
    };
    p.reset = function (preserveState) {
        $.each(this.areas(), function (i, e) {
            e.reset(preserveState);
        });
        this.areasXref = [];
        this.options = null;
        //this._effectiveOptions = null;
    };
    // Return the effective selected state of an area, incorporating staticState
    p.isSelectedOrStatic = function () {

        var o = this.effectiveOptions();
        return u.isBool(o.staticState) ? o.staticState :
                    this.isSelected();
    };
    p.isSelected = function () {
        return u.isBool(this.selected) ? this.selected :
            u.isBool(this.owner.area_options.selected) ? this.owner.area_options.selected : false;
    };
    p.isSelectable = function () {
        return u.isBool(this.effectiveOptions().staticState) ? false :
                    (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isSelectable);
    };
    p.isDeselectable = function () {
        return u.isBool(this.effectiveOptions().staticState) ? false :
                    (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isDeselectable);
    };
    //    p.setTemporaryOption = function (options) {
    //        this.tempOptions = options;
    //    };
    p.effectiveOptions = function (override_options) {
        //if (!this._effectiveOptions) {
        //TODO this isSelectable should cascade already this seems redundant
        var opts = u.updateProps({},
                this.owner.area_options,
                this.options,
                override_options || {},
                {id: this.areaId }
            );
        opts.selected = this.isSelected();
        return opts;
        //}
        //return this._effectiveOptions;
    };
    p.effectiveRenderOptions = function (mode, override_options) {
        var allOpts = this.effectiveOptions(override_options),
            opts = u.updateProps({},
            allOpts,
            allOpts["render_" + mode],
            { alt_image: this.owner.altImage(mode) });
        return opts;
    };
    // Fire callback on area state change
    p.changeState = function (state_type, state) {
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
    p.highlight = function (noRender) {
        var o = this.owner;
        if (!noRender) {
            o.graphics.addShapeGroup(this, "highlight");
        }
        o.setHighlightID(this.areaId);
        this.changeState('highlight', true);
    };
    // select this area. if "callEvent" is true then the state change event will be called. (This method can be used
    // during config operations, in which case no event is indicated)
    p.drawSelection = function () {
        this.owner.graphics.addShapeGroup(this, "select");
    };
    p.addSelection = function () {
        // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
        var o = this.owner;
        if (o.options.singleSelect) {
            o.clearSelections();
        }

        // because areas can overlap - we can't depend on the selection state to tell us anything about the inner areas.
        // don't check if it's already selected
        //if (!this.isSelected()) {
        this.drawSelection();
        this.selected = true;
        this.changeState('select', true);
        //}

        if (o.options.singleSelect) {
            o.graphics.refreshSelections();
        }
    };
    // Remove a selected area group. If the parameter "partial" is true, then this is a manual operation
    // and the caller mus call "finishRemoveSelection" after multiple "removeSelectionFinish" events
    p.removeSelection = function (partial) {

        //            if (this.selected === false) {
        //                return;
        //            }
        this.selected = false;
        this.changeState('select', false);
        this.owner.graphics.removeSelections(this.areaId);
        if (!partial) {
            this.owner.removeSelectionFinish();
        }
    };
    // Complete selection removal process. This is separated because it's very inefficient to perform the whole
    // process for multiple removals, as the canvas must be totally redrawn at the end of the process.ar.remove

    p.toggleSelection = function (partial) {
        if (!this.isSelected()) {
            this.addSelection();
        }
        else {
            this.removeSelection(partial);
        }
        return this.isSelected();
    };


    // represents an HTML area
    m.MapArea = function (owner,areaEl,keys) {
        if (!owner) {
            return;
        }
        var me = this;
        me.owner = owner;   // a MapData object
        me.area = areaEl;
        me.areaDataXref=[]; // a list of map_data.data[] id's for each areaData object containing this
        me.originalCoords = [];
        $.each(u.split(areaEl.coords), function (i, el) {
            me.originalCoords.push(parseFloat(el));
        });
        me.length = me.originalCoords.length;
        me.shape = areaEl.shape.toLowerCase();
        me.nohref = areaEl.nohref || !areaEl.href;
        me.keys = u.split(keys);

    };

    m.MapArea.prototype.coords = function () {
        return this.originalCoords;
    };
    // get effective options for a specific area - can be result of more than one key
    m.MapArea.prototype.effectiveRenderOptions = function(mode) {
        var i,ad,m=this.owner,
            opts=u.updateProps({},m.area_options);

        for (i=this.keys.length-1;i>=0;i--) {
            ad = m.getDataForKey(this.keys[i]);
            u.updateProps(opts,
                           ad.effectiveRenderOptions(mode),
                           ad.options["render_" + mode],
                { alt_image: this.owner.altImage(mode) });
        }
        return opts;

    };

} (jQuery));
/* areacorners.js
   functions shared by scale & tooltip
*/

(function ($) {
    $.mapster.utils.areaCorners = function (coords, width, height) {
        var minX, minY, maxX, maxY, bestMinX, bestMaxX, bestMinY, bestMaxY, curX, curY, nest, j;

        minX = minY = bestMinX = bestMinY = 999999;
        maxX = maxY = bestMaxX = bestMaxY = -1;

        for (j = coords.length - 2; j >= 0; j -= 2) {
            curX = parseInt(coords[j], 10);
            curY = parseInt(coords[j + 1], 10);
            if (curX < minX) {
                minX = curX;
                bestMaxY = curY;
            }
            if (curX > maxX) {
                maxX = curX;
                bestMinY = curY;
            }
            if (curY < minY) {
                minY = curY;
                bestMaxX = curX;
            }
            if (curY > maxY) {
                maxY = curY;
                bestMinX = curX;
            }

        }
        // try to figure out the best place for the tooltip
        if (width && height) {
            $([[bestMaxX - width, minY - height], [bestMinX, minY - height],
                             [minX - width, bestMaxY - height], [minX - width, bestMinY],
                             [bestMaxY - height, maxX], [bestMinY, maxX],
                             [bestMaxX - width, maxY], [bestMinX, maxY]
                      ]).each(function (i, e) {
                          if (e[0] > 0 && e[1] > 0) {
                              nest = e;
                              return false;
                          }
                      });
        }

        return { tl: [minX, minY],
            br: [maxX, maxY],
            tt: nest
        };
    };
} (jQuery));
/* scale.js: resize and zoom functionality
   requires areacorners.js
*/

// options {
//    padding: n,
//    duration: m,
//}
//
(function ($) {
    var m = $.mapster, u = m.utils, p = m.MapArea.prototype;

    m.utils.getScaleInfo = function (realW, realH, width, height) {
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
    };
    // Scale a set of AREAs, return old data as an array of objects
    m.utils.scaleMap = function (image, scale, callback) {
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
    };
    // options: duration = animation time (zero = no animation)
    // force: supercede any existing animation
    // css = any css to be applied to the wrapper
    m.MapData.prototype.resize = function (newWidth, newHeight, effectDuration) {
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
            if ($.mapster.hasCanvas) {
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

            me.redrawSelections();
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
        if (!$.mapster.hasCanvas) {
            $(me.base_canvas).children().remove();
        }
        els = $(me.wrapper).find('.mapster_el');

        if (me.resizing && opts.force) {
            $(els).stop();
            //(me.wrapper).stop();
        }
        me.resizing = true;

        if (opts.duration) {
            els.each(function (i, e) {
                $(e).animate(newsize, { duration: duration, complete: i===0 ? finishResize:null, easing: "linear" });
            });

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
        $.each(me.data, function (i, e) {
            $.each(e.areas, function (i, e) {
                e.resize();
            });
        });

    };


    m.MapArea = u.subclass(m.MapArea, function () {
        //change the area tag data if needed
        if (this.owner.scaleInfo.scale) {
            this.resize();
        }
    });

    p.coords = function (percent, coordOffset) {
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
    p.resize = function () {
        this.area.coords = this.coords().join(',');
    };

    p.reset = function () {
        this.area.coords = this.coords(1).join(',');
    };
    m.impl.resize = function (width, height, duration) {
        if (!width && !height) {
            return false;
        }
        return (new m.Method(this,
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

    m.impl.zoom = function (key, opts) {
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
        return (new m.Method(this,
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
} (jQuery));
/* tooltip.js - tooltip functionality
   requires areacorners.js
*/

(function ($) {
    var m = $.mapster, u = m.utils;
    $.extend(m.defaults, {
        toolTipContainer: '<div class="mapster-tooltip" style="border: 2px solid black; background: #EEEEEE; position:absolute; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
        '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; ' +
        'border-radius: 6px 6px 6px 6px;"></div>',
        showToolTip: false,
        toolTipFade: true,
        toolTipClose: ['area-mouseout'],
        onShowToolTip: null,
        onCreateTooltip: null
    });
    $.extend(m.area_defaults, {
        toolTip: null
    });
    m.MapData.prototype.clearTooltip = function () {
        if (this.activeToolTip) {
            this.activeToolTip.remove();
            this.activeToolTip = null;
            this.activeToolTipID = -1;
        }
        $.each(this._tooltip_events, function (i,e) {
            e.object.unbind(e.event);
        });
    };
   m.MapData.prototype.bindTooltipClose = function (option, event, obj) {
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
    // Show tooltip adjacent to DOM element "area"
    m.AreaData.prototype.showTooltip = function () {
        var tooltip, left, top, tooltipCss, corners, fromCoords, container,
                        opts = this.effectiveOptions(),
                        md = this.owner,
                        baseOpts = md.options,
                        template = md.options.toolTipContainer;

        // prevent tooltip from being cleared if it was in progress - area is in the same group

        md.cancelClear=true;
        if (md.activeToolTipID === this.areaId) {

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
            $.each(this.areas(), function (i,e) {
                fromCoords = fromCoords.concat(e.coords());
            });
        }

        md.clearTooltip();

        $(md.image).after(tooltip);
        md.activeToolTip = tooltip;
        md.activeToolTipID = this.areaId;

        corners = u.areaCorners(fromCoords,
                        tooltip.outerWidth(true),
                        tooltip.outerHeight(true));
        // Try to upper-left align it first, if that doesn't work, change the parameters

        left = corners.tt[0];
        top = corners.tt[1];

        tooltipCss = { "left": left + "px", "top": top + "px" };

        if (!tooltip.css("z-index") || tooltip.css("z-index") === "auto") {
            tooltipCss["z-index"] = "2000";
        }
        tooltip.css(tooltipCss).addClass('mapster_tooltip');

        md.bindTooltipClose('area-click', 'click', $(md.map));
        md.bindTooltipClose('tooltip-click', 'click', tooltip);
        // not working properly- closes too soon sometimes
        //md.bindTooltipClose('img-mouseout', 'mouseout', $(md.image));

        if (md.options.toolTipFade) {
            u.setOpacity(tooltip[0], 0);
            tooltip.show();
            u.fader(tooltip[0], 0, 1, opts.fadeDuration);
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
    // key is one of: (string) area key: target the area -- will use the largest
    //                (DOM el/jq) area: target specific area
    //                 any falsy value: close the tooltip

    // or you don't care which is used.
    m.impl.tooltip = function (key) {
        return (new m.Method(this,
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
} (jQuery));
