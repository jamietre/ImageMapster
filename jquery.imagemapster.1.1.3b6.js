/* ImageMapster 1.1.3 beta 6

Copyright 2011 James Treworgy
http://www.outsharked.com/imagemapster
https://github.com/jamietre/ImageMapster

A jQuery plugin to enhance image maps.


version 1.1.3
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

Based on code originally written by David Lynch
(c) 2011 https://github.com/kemayo/maphilight/

*/

/*jslint browser: true, white: true, sloppy:true, nomen: true, plusplus: true, evil: true, forin: true, type: true, windows: true */
/*global jQuery: true */

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
        area_corner: function (area, left, top) {
            var bestX, bestY, curX, curY, coords, j;
            coords = [];
            $(area).each(function () {
                coords = coords.concat(this.coords.split(','));
            });

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
            } else if (typeof obj === 'object' && obj) {
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
            if (this.isFunction(obj)) {
                obj.call(that, args);
            }
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
            } else {
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
        fader: (function () {
            function setOpacity(e, opacity) {
                e.style.filter = "Alpha(opacity=" + String(opacity * 100) + ")";
                e.style.opacity = opacity;
            }

            var elements = [],
                lastKey = 0,
                fade_func = function (el, op, endOp, duration) {
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

                    setOpacity(obj, op);
                    if (op < endOp) {
                        setTimeout(function () {
                            fade_func(el, op, endOp, duration);
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
        isMask: false,
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
        areas: []
    }, $.mapster.render_defaults]
    });
    $.mapster.area_defaults =
        $.mapster.utils.mergeObjects({
            source: [$.mapster.defaults, { toolTip: ''}],
            deep: "render_highlight, render_select",
            include: "fade,fadeDuration,fill,fillColor,fillOpacity,stroke,strokeColor,strokeOpacity,strokeWidth,staticState,selected,"
            + "isSelectable,isDeselectable,render_highlight,render_select,isMask, toolTip"
        });

    $.mapster.impl = (function () {
        var me = {},
        p,
        AreaData, MapData, Method,
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
        },
        is_image_loaded = function (map_data) {
            var img,
                images = u.mergeObjects({ source: [{ main: map_data }, map_data.alt_images] });

            return u.each(images, function () {
                img = this.image;
                var complete = img.complete || (img.width && img.height) ||
                    (typeof img.naturalWidth !== "undefined" && img.naturalWidth !== 0);

                return complete;

            });
        };
        me.test = function (obj) {
            return eval(obj);
        };

        // end utility functions

        function shape_from_area(area) {
            var i, coords = area.getAttribute('coords').split(',');
            for (i = coords.length - 1; i >= 0; i--) {
                coords[i] = parseInt(coords[i], 10);
            }
            return [area.getAttribute('shape').toLowerCase().substr(0, 4), coords];
        }
        function create_canvas(img) {
            return $(graphics.create_canvas_for(img)).css(canvas_style)[0];
        }
        function add_shape_group_impl(areaData, mode) {
            var opts, shape;
            // first get area options. Then override fade for selecting, and finally merge in the "select" effect options.
            opts = areaData.effectiveOptions();
            opts = u.mergeObjects({
                source: [$.mapster.render_defaults,
                        opts,
                        opts['render_' + mode], {
                            alt_image: areaData.owner.alt_images[mode]
                        }]
            });
            u.each(areaData.areas, function () {
                shape = shape_from_area(this);
                graphics.add_shape_to(shape[0], shape[1], opts, $(this).data('mapster_is_mask') || opts.isMask);
            });

            return opts;
        }

        function add_shape_group(areaData, mode) {
            var list, canvas, name,
                map_data = areaData.owner,
                opts = areaData.effectiveOptions();
            // render includeKeys first - because they could be masks

            if (mode === 'select') {
                name = "static_" + areaData.areaId.toString();
                canvas = map_data.base_canvas;
            } else {
                canvas = map_data.overlay_canvas;
            }
            graphics.init(areaData.owner);
            graphics.begin(canvas, name);

            if (opts.includeKeys) {
                list = opts.includeKeys.split(',');
                u.each(list, function () {
                    add_shape_group_impl(map_data.getDataForKey(this.toString()), mode);
                });
            }

            opts = add_shape_group_impl(areaData, mode);
            graphics.render();

            if (opts.fade) {
                u.fader(canvas, 0, opts.fillOpacity, opts.fadeDuration);
            }


        }

        // internal function to actually set the area

        // Configures selections from a separate list.


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

        function queue_command(map_data, command, args) {
            if (!map_data.complete) {
                map_data.commands.push(
                {
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
            // elements own index in parent array - so we have an ID to use for wraper div
            this.index = -1;
            this.image = image;
            this.map = null;
            this.options = options;
            this.area_options = u.mergeObjects({
                template: $.mapster.area_defaults,
                source: options
            });
            this.base_canvas = null;
            this.overlay_canvas = null;
            this.alt_images = {};
            this.complete = false;
            this.commands = [];
            this.data = [];
            this.img_style = image.getAttribute('style') || null;
            this.bind_tries = options.configTimeout / 200;
            // private members
            this._xref = {};
            this._highlightId = -1;
            this._tooltip_events = [];
            this.mouseover = function (e) {
                var opts, ar = me.getDataForArea(this);
                opts = ar.effectiveOptions();

                if (!u.isBool(opts.staticState)) {
                    ar.highlight();
                }

                if (me.options.showToolTip && opts.toolTip && me.activeToolTipID !== ar.areaId) {
                    ar.showTooltip(this);
                }
                if (u.isFunction(opts.onMouseover)) {
                    opts.onMouseover.call(this, e,
                    {
                        options: opts,
                        key: ar.key,
                        selected: ar.isSelected()
                    });
                }
            };
            this.mouseout = function (e) {
                var key, data,
                    opts = me.options;
                if (opts.toolTipClose && u.arrayIndexOf(opts.toolTipClose, 'area-mouseout') >= 0) {
                    me.clearTooltip();
                }
                data = me.highlightId ? me.data[me.highlightId] : null;
                key = data ? data.key : '';
                me.ensureNoHighlight();
                if (u.isFunction(opts.onMouseout)) {
                    opts.onMouseout.call(this,
                    {
                        e: e,
                        key: key,
                        selected: data ? data.isSelected() : null
                    });
                }
            };
            this.click = function (e) {
                var selected, list_target, newSelectionState, canChangeState,
                    ar = me.getDataForArea(this),
                    opts = me.options;

                e.preventDefault();

                opts = me.options;

                canChangeState = (ar.isSelectable() &&
                    (ar.isDeselectable() || !ar.isSelected()));
                if (canChangeState) {
                    newSelectionState = !ar.isSelected();
                } else {
                    newSelectionState = ar.isSelected();
                }

                list_target = getBoundList(opts, ar.key);
                if (u.isFunction(opts.onClick)) {
                    if (false === opts.onClick.call(this,
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
            };
        };
        p = MapData.prototype;
        p._idFromKey = function (key) {
            return typeof key === "string" && this._xref.hasOwnProperty(key) ?
                this._xref[key] : -1;
        };
        p.getDataForArea = function (area) {
            var ar, key = $(area).data('mapster_key');
            ar = this.data[this._idFromKey(key)];
            if (ar) {
                ar.area = area;
            }
            return ar;
        };
        p.getDataForKey = function (key) {
            return this.data[this._idFromKey(key)];
        };
        p.getData = function (obj) {
            if (typeof obj === 'string') {
                return this.getDataForKey(obj);
            } else if (obj instanceof jQuery || u.isElement(obj)) {
                return this.getDataForArea(obj);
            } else {
                return null;
            }
        };
        // remove highlight if present, raise event
        p.ensureNoHighlight = function () {
            var ar;
            if (this._highlightId >= 0) {
                graphics.init(this);
                graphics.clear_highlight();
                ar = this.data[this._highlightId];
                ar.changeState('highlight', false);
                this._highlightId = -1;
            }
        };
        p.setHighlight = function (id) {
            this._highlightId = id;
        };
        p.initGraphics = function () {
            graphics.init(this);
        };
        // rebind based on new area options. This copies info from array "areas" into the data[area_id].area_options property.
        // it returns a list of all selected areas.
        p.setAreaOptions = function (area_list) {
            var i, area_options, ar,
                selected_list = [],
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
            u.each(this.data, function (i) {
                if (this.isSelectedOrStatic()) {
                    selected_list.push(i);
                }
            });
            return selected_list;
        };

        p.setAreasSelected = function (selected_list) {
            var i;
            this.initGraphics();
            for (i = selected_list.length - 1; i >= 0; i--) {
                this.data[selected_list[i]].setAreaSelected();
            }
        };
        p.initialize = function () {
            var $area, area, sel, areas, i, j, keys, key, area_id, default_group, group_value,
                sort_func, sorted_list, is_mask, dataItem,
                me = this,
                selected_list = [],
                opts = this.options;

            function add_group(key, value) {
                var dataItem = new AreaData(me, key, value, opts);
                dataItem.areaId = me._xref[key] = me.data.push(dataItem) - 1;
                return dataItem.areaId;
            }
            this._xref = {};
            this.data = [];

            default_group = !opts.mapKey;
            sel = ($.browser.msie && $.browser.version <= 7) ? 'area' :
                (default_group ? 'area[coords]' : 'area[' + opts.mapKey + ']');
            areas = $(this.map).find(sel);

            for (i = areas.length - 1; i >= 0; i--) {
                area_id = 0;
                area = areas[i];
                $area = $(area);
                key = area.getAttribute(opts.mapKey);
                keys = (default_group || typeof key !== 'string') ? [''] : key.split(',');
                for (j = keys.length - 1; j >= 0; j--) {
                    key = keys[j];
                    if (opts.mapValue) {
                        group_value = $area.attr(opts.mapValue);
                    }
                    if (default_group) {
                        // set an attribute so we can refer to the area by index from the DOM object if no key
                        area_id = add_group(this.data.length, group_value);
                        dataItem = this.data[area_id];
                        dataItem.key = key = area_id.toString();
                        //$area.attr('data-mapster-id', area_id);
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
                            area_id = add_group(key, group_value);
                            dataItem = this.data[area_id];
                        }
                    }
                    dataItem.areas.push(area);
                }
                $area.data('mapster_key', key);
                is_mask = opts.isMask;
                // only bind to areas that don't have nohref. ie 6&7 cannot detect the presence of nohref, so we have to also not bind if href is missing.
                if (!area.getAttribute("nohref") && area.getAttribute("href")) {
                    $area.bind('mouseover.mapster', this.mouseover)
                    .bind('mouseout.mapster', this.mouseout)
                    .bind('click.mapster', this.click);

                } else {
                    is_mask = is_mask || opts.noHrefIsMask;
                    $area.data('mapster_is_mask', is_mask);
                }
            }

            selected_list = this.setAreaOptions(opts.areas);

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

            //            if (opts.listenToList && opts.nitG) {
            //                opts.nitG.bind('click.mapster', event_hooks[map_data.hooks_index].listclick_hook);
            //            }
            this.setAreasSelected(selected_list);
        };
        p.clearEvents = function () {
            $(this.map).find('area')
                .unbind('mouseover.mapster')
                .unbind('mouseout.mapster')
                .unbind('click.mapster');
        };
        p._clearCanvases = function (preserveState) {
            var canvases = [[this, "overlay_canvas"],
                    [this.alt_images.select, "canvas"],
                    [this.alt_images.highlight, "canvas"]];
            if (!preserveState) {
                canvases.push([this, "base_canvas"]);
            }

            u.each(canvases, function () {
                if (this[0] && this[0][this[1]]) {
                    $(this[0][this[1]]).remove();
                    this[0][this[1]] = null;
                }
            });
        };
        p.clearTooltip = function () {
            if (this.activeToolTip) {
                this.activeToolTip.remove();
                this.activeToolTip = null;
                this.activeToolTipID = -1;
            }
            u.each(this._tooltip_events, function () {
                this.object.unbind(this.event);
            });
        };
        p.clearMapData = function (preserveState) {
            var div;
            this._clearCanvases(preserveState);

            // release refs to DOM elements
            u.each(this.data, function () {
                this.areas = null;
            });
            this.data = null;
            if (!preserveState) {
                div = $('div#mapster_wrap_' + this.index);
                if (div.length) {
                    div.before(div.children()).remove();
                }
                if (!this.img_style) {
                    // jquery bug? - attr('style') works inconsistently
                    while ($(this.image).attr('style')) {
                        $(this.image).removeAttr('style');
                    }
                } else {
                    $(this.image).attr('style', this.img_style);
                }
            }
            this.image = null;
            u.each(this.alt_images, function () {
                this.canvas = null;
                this.image = null;
            });
            this.clearTooltip();
        };
        p.bindTooltipClose = function (option, event, obj) {
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
            this.selected = null;
            this.areas = [];
            this.area = null;
            this._effectiveOptions = null;
        };
        p = AreaData.prototype;
        // Return the effective selected state of an area, incorporating staticState
        p.isSelectedOrStatic = function () {
            var o = this.effectiveOptions();
            return u.isBool(this.selected) ? this.selected :
                (u.isBool(o.staticState) ? o.staticState :
                (u.isBool(this.owner.options.staticState) ? this.owner.options.staticState : false));
        };
        p.isSelected = function () {
            return this.selected || false;
        };
        p.isSelectable = function () {
            return u.isBool(this.effectiveOptions().staticState) ? false :
                (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isSelectable);
        };
        p.isDeselectable = function () {
            return u.isBool(this.effectiveOptions().staticState) ? false :
                (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isDeselectable);
        };
        p.effectiveOptions = function (override_options) {
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
        p.changeState = function (state_type, state) {
            if (u.isFunction(this.owner.options.onStateChange)) {
                this.owner.options.onStateChange.call(this.owner.image,
                {
                    key: this.key,
                    state: state_type,
                    selected: state
                });
            }
        };
        // highlight an area
        p.highlight = function () {
            add_shape_group(this, "highlight");
            this.owner.setHighlight(this.areaId);
            this.changeState('highlight', true);
        };

        p.setAreaSelected = function () {
            add_shape_group(this, "select");
            this.changeState('select', true);
        };

        p.addSelection = function () {
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
        p.removeSelection = function () {
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
        p.toggleSelection = function () {
            if (!this.isSelected()) {
                this.addSelection();
            }
            else {
                this.removeSelection();
            }
            return this.isSelected();
        };
        // Show tooltip adjacent to DOM element "area"
        p.showTooltip = function (forArea) {
            var tooltip, left, top, tooltipCss, coords, container,
                alignLeft = true,
	        alignTop = true,
	        opts = this.effectiveOptions(),
                map_data = this.owner,
                baseOpts = map_data.options,
                template = map_data.options.toolTipContainer,
                area = forArea || this.areas;

            if (typeof template === 'string') {
                container = $(template);
            } else {
                container = $(template).clone();
            }

            tooltip = container.html(opts.toolTip).hide();

            coords = u.area_corner(area, alignLeft, alignTop);

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
            coords = u.area_corner(area, alignLeft, alignTop);
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


            tooltip.show();
            if (opts.toolTipFade) {
                tooltip.css({ "opacity": 0 });
                u.fader(tooltip[0], 0, 1, opts.fadeDuration);
            }

            u.ifFunction(baseOpts.onShowToolTip, area,
            {
                toolTip: tooltip,
                areaOptions: opts,
                key: this.key,
                selected: this.isSelected()
            });

        };

        // PUBLIC FUNCTIONS

        // Returns a comma-separated list of user-selected areas. "staticState" areas are not considered selected for the purposes of this method.
        me.get = function (key) {
            var map_data, result;
            this.each(function () {
                map_data = get_map_data(this);
                if (!map_data) {
                    return true; // continue -- no data associated with this image
                }

                if (key) {
                    // getting data for specific key --- return true or false
                    result = map_data.getDataForKey(key).isSelected();
                    return false; // break
                }
                // getting all selected keys - return comma-separated string
                result = '';
                u.each(map_data.data, function () {
                    if (this.isSelected()) {
                        result += (result ? ',' : '') + this.key;
                    }
                });
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
                    if (queue_command(map_data, 'set', [selected, key, set_bound])) {
                        return true;
                    }
                    if (key instanceof Array) {
                        key_list = key.join(",");
                    }
                    else {
                        key_list = key;
                    }

                    u.each(key_list.split(','), function () {
                        setSelection(map_data.getDataForKey(this.toString()));
                    });

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
                    ar = map_data.getDataForArea(this);

                    if (queue_command(map_data, 'set', [selected, ar.key, do_set_bound])) {
                        return true;
                    }
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
                    if (queue_command(map_data, 'unbind')) {
                        return true;
                    }

                    map_data.clearEvents();
                    map_data.clearMapData(preserveState);
                    map_cache[map_data.index] = null;
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

        // refresh options.
        me.rebind = function (options) {
            var map_data, selected_list;
            this.filter('img').each(function () {
                map_data = get_map_data(this);
                if (map_data) {
                    if (queue_command(map_data, 'rebind', [options])) {
                        return true;
                    }

                    merge_options(map_data, options);
                    // this will only update new areas that may have been passed
                    selected_list = map_data.setAreaOptions(options.areas || {});
                    map_data.setAreasSelected(selected_list);
                }
            });
            return this;
        };
        // get options. nothing or false to get, or "true" to get effective options (versus passed options)
        me.get_options = function (key, effective) {
            var opts, ar, map_data,
                img = this.filter('img').first()[0];
            effective = u.isBool(key) ? key : effective; // allow 2nd parm as "effective" when no keys
            if (map_data = get_map_data(img)) {
                if (typeof key === 'string') {
                    if (ar = map_data.getDataForKey(key)) {
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
                if (queue_command(map_data, 'set_options', [options])) {
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
                var last, lastProp, img, wrap, map, canvas, context, overlay_canvas, usemap, map_data, parent_id, wrap_id;

                // save ref to this image even if we can't access it yet. commands will be queued
                img = $(this);

                map_data = get_map_data(this);
                if (map_data && map_data.complete) {
                    me.unbind.call(img);
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
                    map_data = new MapData(this, opts);
                    map_data.index = u.arrayReuse(map_cache, map_data);
                }

                if (has_canvas) {
                    last = {};
                    u.each(["highlight", "select"], function () {
                        var cur = opts["render_" + this].altImage || opts.altImage;
                        if (cur) {
                            if (cur !== last) {
                                last = cur;
                                lastProp = this;
                                if (!map_data.alt_images[this]) {
                                    map_data.alt_images[this] = { image: new Image() };
                                    map_data.alt_images[this].image.src = cur;
                                }
                            } else {
                                map_data.alt_images[this] = map_data.alt_images[lastProp];
                            }
                        }
                    });
                }

                // If the image isn't fully loaded, this won't work right.  Try again later.                   
                if (!is_image_loaded(map_data)) {
                    if (--map_data.bind_tries > 0) {
                        setTimeout(function () {
                            img.mapster(opts);
                        }, 200);
                    } else {
                        u.ifFunction(opts.onConfigured, this, false);
                    }
                    return true;
                }

                parent_id = img.parent().attr('id');
                wrap_id = 'mapster_wrap_' + map_data.index;
                // wrap only if there's not already a wrapper, otherwise, own it
                if (parent_id && parent_id.length >= 12 && parent_id.substring(0, 12) === "mapster_wrap") {
                    img.parent().attr('id', wrap_id);
                } else {
                    wrap = $('<div id="' + wrap_id + '"></div>').css(
                    {
                        display: 'block',
                        background: 'url(' + this.src + ')',
                        position: 'relative',
                        padding: 0,
                        width: this.width,
                        height: this.height
                    });
                    if (opts.wrapClass) {
                        if (opts.wrapClass === true) {
                            wrap.addClass($(this).attr('class'));
                        }
                        else {
                            wrap.addClass(opts.wrapClass);
                        }
                    }
                    img.before(wrap).css('opacity', 0).css(canvas_style);
                    if (!has_canvas) {
                        img.css('filter', 'Alpha(opacity=0)');
                    }
                    wrap.append(img);
                }

                canvas = create_canvas(this);
                img.before(canvas);

                overlay_canvas = create_canvas(this);
                img.before(overlay_canvas);

                if (has_canvas) {
                    last = {};
                    u.each(map_data.alt_images, function () {
                        if (this.image !== last.image) {
                            last = this;
                            this.canvas = graphics.create_canvas_for(this.image);
                            $(this.canvas).css({ display: "none" });
                            // do not need to add this one to the DOM 
                            context = this.canvas.getContext("2d");
                            context.drawImage(this.image, 0, 0);
                        } else {
                            this.canvas = last.canvas;
                        }
                    });
                }

                map_data.map = map;
                map_data.base_canvas = canvas;
                map_data.overlay_canvas = overlay_canvas;
                map_data.initialize();

                // process queued commands
                if (!map_data.complete) {
                    map_data.complete = true;
                    u.each(map_data.commands, function () {
                        methods[this.command].apply(img, this.args);
                    });
                    map_data.commands = [];
                }
                if (opts.onConfigured && typeof opts.onConfigured === 'function') {
                    opts.onConfigured.call(this, true);
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

            if (has_canvas) {
                graphics = (function () {
                    var map_data, canvas, context, masks, shapes, me = {};
                    me.active = false;
                    function css3color(color, opacity) {
                        function hex_to_decimal(hex) {
                            return Math.max(0, Math.min(parseInt(hex, 16), 255));
                        }
                        return 'rgba(' + hex_to_decimal(color.substr(0, 2)) + ',' + hex_to_decimal(color.substr(2, 2)) + ',' + hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
                    }
                    function render_shape(shape, coords) {
                        var i, len;
                        switch (shape) {
                            case 'rect':
                                context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
                                break;
                            case 'poly':
                                context.moveTo(coords[0], coords[1]);
                                len = coords.length;
                                for (i = 2; i < len; i += 2) {
                                    context.lineTo(coords[i], coords[i + 1]);
                                }
                                context.lineTo(coords[0], coords[1]);
                                break;
                            case 'circ':
                                context.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, false);
                                break;
                        }
                    }
                    function add_alt_image(src_canvas, shape, coords, options) {
                        context.save();
                        context.beginPath();
                        render_shape(shape, coords);
                        context.closePath();
                        context.clip();

                        context.globalAlpha = options.altImageOpacity;
                        context.drawImage(src_canvas, 0, 0);
                        context.restore();
                    }
                    me.init = function (_map_data) {
                        map_data = _map_data;
                    };
                    me.begin = function (_canvas) {
                        canvas = _canvas;
                        context = canvas.getContext('2d');
                        shapes = [];
                        masks = [];
                        me.active = true;
                    };
                    me.render = function () {
                        context.save();
                        if (masks.length) {
                            u.each(masks, function () {
                                context.beginPath();
                                render_shape(this.shape, this.coords);
                                context.closePath();
                                context.fill();

                            });
                            context.globalCompositeOperation = "source-out";
                        }

                        u.each(shapes, function () {
                            var s = this;
                            if (s.options.alt_image) {
                                add_alt_image(s.options.alt_image.canvas, s.shape, s.coords, s.options);
                            } else if (s.options.fill) {
                                context.save();
                                context.beginPath();
                                render_shape(s.shape, s.coords);
                                context.closePath();
                                context.clip();
                                context.fillStyle = css3color(s.options.fillColor, s.options.fillOpacity);
                                context.fill();
                                context.restore();
                            }

                        });


                        // render strokes at end since masks get stroked too
                        context.restore();

                        //context.globalCompositeOperation="source-over";
                        u.each(shapes.concat(masks), function () {
                            var s = this;
                            if (s.options.stroke) {
                                context.beginPath();
                                render_shape(s.shape, s.coords);
                                context.closePath();
                                context.strokeStyle = css3color(s.options.strokeColor, s.options.strokeOpacity);
                                context.lineWidth = s.options.strokeWidth;
                                context.stroke();
                            }
                        });
                        context = null;
                        me.active = false;
                        return canvas;
                    };
                    me.create_canvas_for = function (img, width, height) {
                        var c, $img;
                        if (img) {
                            $img = $(img);
                            height = img.height || $img.height();
                            width = img.width || $img.width();
                        }
                        c = $('<canvas></canvas>')[0];
                        c.width = width;
                        c.height = height;
                        c.getContext("2d").clearRect(0, 0, width, height);
                        return c;
                    };
                    me.add_shape_to = function (shape, coords, options, is_mask) {
                        var addto = is_mask ? masks : shapes;
                        addto.push({ shape: shape, coords: coords, options: options });
                    };
                    me.clear_highlight = function () {
                        map_data.overlay_canvas.getContext('2d').clearRect(0, 0, map_data.overlay_canvas.width, map_data.overlay_canvas.height);
                    };
                    me.clear_selections = function () {
                        return null;
                    };
                    // Draw all items from selected_list to a new canvas, then swap with the old one. This is used to delete items when using canvases. 
                    me.refresh_selections = function () {
                        var list_temp = [], canvas_temp;
                        // draw new base canvas, then swap with the old one to avoid flickering
                        canvas_temp = map_data.base_canvas;
                        u.each(map_data.data, function (i) {
                            if (this.isSelectedOrStatic()) {
                                list_temp.push(i);
                            }
                        });

                        map_data.base_canvas = create_canvas(map_data.image);
                        $(map_data.base_canvas).hide();
                        $(map_data.image).before(map_data.base_canvas);

                        map_data.setAreasSelected(list_temp);

                        $(map_data.base_canvas).show();
                        $(canvas_temp).remove();
                    };
                    return me;
                } ());

            } else {

                // ie executes this code
                graphics = (function () {
                    var t_fill, map_data, canvas, name, masks, shapes, me = {};

                    me.active = false;
                    function render_shape(shape, coords, options) {
                        var stroke, e, el_name, template;
                        el_name = name ? 'name="' + name + '" ' : '';

                        // fill
                        t_fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" /><v:stroke opacity="' + options.strokeOpacity + '"/>';
                        // stroke
                        if (options.stroke) {
                            stroke = 'strokeweight=' + options.strokeWidth + ' stroked="t" strokecolor="#' + options.strokeColor + '"';
                        } else {
                            stroke = 'stroked="f"';
                        }

                        switch (shape) {
                            case 'rect':
                                template = '<v:rect ' + el_name + ' filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + coords[0] + 'px;top:' + coords[1]
                                    + 'px;width:' + (coords[2] - coords[0]) + 'px;height:' + (coords[3] - coords[1]) + 'px;">' + t_fill + '</v:rect>';
                                break;
                            case 'poly':
                                template = '<v:shape ' + el_name + ' filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + canvas.width + ',' + canvas.height
                                    + '" path="m ' + coords[0] + ',' + coords[1] + ' l ' + coords.slice(2).join(',')
                                    + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + canvas.width + 'px;height:' + canvas.height + 'px;">' + t_fill + '</v:shape>';
                                break;
                            case 'circ':
                                template = '<v:oval ' + el_name + ' filled="t" ' + stroke
                                    + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (coords[0] - coords[2]) + 'px;top:' + (coords[1] - coords[2])
                                    + 'px;width:' + (coords[2] * 2) + 'px;height:' + (coords[2] * 2) + 'px;">' + t_fill + '</v:oval>';
                                break;
                        }
                        e = $(template);
                        $(canvas).append(e);

                        return e;
                    }
                    me.init = function (_map_data) {
                        map_data = _map_data;
                    };
                    me.begin = function (_canvas, _name) {
                        canvas = _canvas;
                        name = _name;
                        shapes = [];
                        masks = [];
                        me.active = true;
                    };
                    me.create_canvas_for = function (img) {
                        var $img = $(img),
                            width = $img.width(),
                            height = $img.height();
                        return $('<var width="' + width + '" height="' + height + '" style="zoom:1;overflow:hidden;display:block;width:' + width + 'px;height:' + height + 'px;"></var>')[0];
                    };
                    me.add_shape_to = function (shape, coords, options, is_mask) {
                        var addto = is_mask ? masks : shapes;
                        addto.push({ shape: shape, coords: coords, options: options });
                    };


                    me.render = function () {
                        var opts;
                        u.each(shapes, function () {
                            render_shape(this.shape, this.coords, this.options);
                        });

                        if (masks.length) {
                            u.each(masks, function () {
                                opts = u.mergeObjects({ source: [this.options, { fillOpacity: 1, fillColor: this.options.fillColorMask}] });
                                render_shape(this.shape, this.coords, opts);
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
                } ());

            }
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
        me.snapshot = function () {
            var d;
            return this.filter('img').each(function () {
                d = get_map_data(this);
                if (d) {
                    if (queue_command(d, 'snapshot')) {
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
        bind: $.mapster.impl.bind,
        rebind: $.mapster.impl.rebind,
        unbind: $.mapster.impl.unbind,
        set: $.mapster.impl.set,
        get: $.mapster.impl.get,
        data: $.mapster.impl.data,
        highlight: $.mapster.impl.highlight,
        select: function () {
            $.mapster.impl.set.call(this, true);
        },
        deselect: function () {
            $.mapster.impl.set.call(this, false);
        },
        get_options: $.mapster.impl.get_options,
        set_options: $.mapster.impl.set_options,
        snapshot: $.mapster.impl.snapshot,
        tooltip: $.mapster.impl.tooltip,
        test: $.mapster.impl.test
    };
    $.mapster.impl.init();
} (jQuery));
