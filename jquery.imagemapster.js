/* ImageMapster 1.0.7
Copyright 2011 James Treworgy

Project home page http://www.outsharked.com/imagemapster

A jQuery plugin to enhance image maps. 

4/27/2011 version 1.0.7
-- rounded corners & dropshadow on default tooltip
-- added singleSelect option
-- don't show tooltip again when using 'tooltip-click' to close if mousing over the same area (causing flicker when hidden/reshown)
-- add tooltip itself to data passed in onShowTooltip (can be changed by client)


Based on code originally written by David Lynch
(c) 2011 https://github.com/kemayo/maphilight/

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

(function ($) {
    var methods;
    $.fn.mapster = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.create.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.mapster');
        }
    };
    $.mapster = {};
    $.mapster.default_tooltip_container = function () {
        return '<div style="border: 2px solid black; background: #EEEEEE; position:absolute; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
                '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; border-radius: 6px 6px 6px 6px;"></div>';
    }
    $.mapster.defaults = {
        fill: true,
        fillColor: '000000',
        fillOpacity: 0.2,
        stroke: true,
        strokeColor: 'ff0000',
        strokeOpacity: 1,
        strokeWidth: 1,
        fade: true,
        staticState: null,
        selected: false,
        isSelectable: true,
        singleSelect: false,
        wrapClass: false,
        boundList: null,
        sortList: false,
        listenToList: false,
        mapKey: 'title',
        mapValue: 'text',
        listKey: 'value',
        listSelectedAttribute: 'selected',
        listSelectedClass: null,
        showToolTips: false,
        toolTipClose: ['area-mouseout'],
        toolTipContainer: $.mapster.default_tooltip_container(),
        onClick: null,
        onShowToolTip: null,
        onGetList: null,
        onCreateTooltip: null,
        useAreaData: false,
        areas: []
    };
    // Used to filter the options when applied to an area
    $.mapster.area_defaults = (function () {
        return {
            fill: $.mapster.defaults.fill,
            fillColor: $.mapster.defaults.fillColor,
            fillOpacity: $.mapster.defaults.fillOpacity,
            stroke: $.mapster.defaults.stroke,
            strokeColor: $.mapster.defaults.strokeColor,
            strokeOpacity: $.mapster.defaults.strokeOpacity,
            strokeWidth: $.mapster.defaults.strokeWidth,
            fade: $.mapster.defaults.fade,
            staticState: null,
            selected: false,
            isSelectable: true
        };
    } ());

    $.mapster.impl = (function () {
        var me = this;
        me.map_cache = [];
        me.ie_config_complete = false;
        me.has_canvas = null;
        // rendering functions - defs are determined by browser in init code
        me.create_canvas_for = null;
        me.add_shape_to = null;
        me.clear_highlight = null;
        // other stuff
        me.canvas_style = {
            position: 'absolute',
            left: 0,
            top: 0,
            padding: 0,
            border: 0
        };
        // utility functions
        function isTrueFalse(obj) {
            return obj === true || obj === false;
        }
        // end utility functions
        function id_from_key(map_data, key) {
            if (key && map_data.xref && map_data.xref.hasOwnProperty(key)) {
                return map_data.xref[key];
            } else {
                return -1;
            }
        }
        function id_from_area(map_data, area) {
            var $area, key, area_id;
            $area = $(area);
            key = $area.attr(map_data.options.mapKey);
            area_id = id_from_key(map_data, key);
            return area_id;
        }

        function options_from_area_id(map_data, area_id, override_options) {
            var opts, area_option_id;
            area_option_id = map_data.data[area_id].area_option_id;

            if (area_option_id >= 0) {
                opts = map_data.options.areas[area_option_id];
            } else {
                opts = {};
            }
            if (isTrueFalse(map_data.options.staticState)) {
                opts.selected = map_data.options.staticState;
                opts.isSelectable = false;
            } else if (isTrueFalse(opts.staticState)) {
                opts.isSelectable = false;
            }
            opts.id = area_id;
            return $.extend({}, map_data.area_options, opts, override_options);
        }
        function options_from_key(map_data, key) {
            return options_from_area_id(map_data, id_from_key(map_data, key));
        }
        function options_from_area(map_data, area, override_options) {
            return options_from_area_id(map_data, id_from_area(map_data, area), override_options);
        }
        function shape_from_area(area) {
            var i, coords = area.getAttribute('coords').split(',');
            for (i = 0; i < coords.length; i++) { coords[i] = parseInt(coords[i], 10); }
            return [area.getAttribute('shape').toLowerCase().substr(0, 4), coords];
        }
        function create_canvas(img) {
            var $img = $(img);
            var canvas = me.create_canvas_for(img);
            $(canvas).css(me.canvas_style);
            canvas.width = $img.width();
            canvas.height = $img.height();
            return canvas;
        }
        // initialize the plugin
        // remember area_options.id === area_id id is just stored as an option
        function add_shape_group(map_data, specific_canvas, area_id, name, override_options) {
            var areas = map_data.map.find('area[' + map_data.options.mapKey + '="' + map_data.data[area_id].key + '"]');

            for (var i = areas.length - 1; i >= 0; i--) {
                var subarea_options = options_from_area(map_data, areas[i], override_options);
                var shape = shape_from_area(areas[i]);
                me.add_shape_to(specific_canvas, shape[0], shape[1], subarea_options, name);
            }
            // hack to ensure IE finishes rendering. still not sure why this is necessary.
            if (!me.has_canvas) {
                me.add_shape_to(specific_canvas, "rect", "0,0,0,0", { fillOpacity: 0 }, name);
            }
        }

        // Configures selections from a separate list. 
        function set_areas_selected(map_data, selected_list) {
            for (var i = 0; i < selected_list.length; i++) {
                if (selected_list[i]) {
                    me.add_selection(map_data, i);
                }
            }
        }
        function is_image_loaded(img) {
            if (!img.complete) { return false; } // IE
            if (typeof img.naturalWidth != "undefined" && img.naturalWidth === 0) { return false; } // Others
            return true;
        }
        /// return current map_data for an image or area
        function get_map_data(obj, remove) {
            var img, id, index;
            switch (obj.tagName.toLowerCase()) {
                case 'area':
                    id = $(obj).parent().attr('name');
                    img = $("img[usemap='#" + id + "']").get(0);
                    break;
                case 'img':
                    img = obj;
                    break;
            }
            if (!img) { return null; }

            index = $.mapster.utils.arrayIndexOfProp(me.map_cache, 'image', img);
            if (!remove) {
                return index >= 0 ? me.map_cache[index] : null;
            } else {
                return me.map_cache.splice(index, 1);
            }
        }

        function remove_map_data(obj) {
            get_map_data(obj, true);
        }
        // Causes changes to the bound list based on the user action (select or deselect)
        // area: the jQuery area object
        // returns the matching elements from the bound list for the first area passed (normally only one should be passed, but
        // a list can be passed 
        function setBoundListProperties(map_data, key_list, selected) {
            var list_target, opts, target;
            opts = map_data.options;
            target =
                opts.boundList.filter(':attrMatches("' + opts.listKey + '","' + key_list + '")')
                .each(function () {
                    if (opts.listSelectedClass) {
                        if (selected) {
                            $(this).addClass(opts.listSelectedClass);
                        } else {
                            $(this).removeClass(opts.listSelectedClass);
                        }
                    }
                    if (opts.listSelectedAttribute) {
                        if (selected) {
                            $(this).attr(opts.listSelectedAttribute, true);
                        } else {
                            $(this).removeAttr(opts.listSelectedAttribute);
                        }
                    }
                });
            if (!list_target) {
                list_target = target;
            }
            return list_target;
        }
        function clear_tooltip(map_data) {
            if (map_data.activeToolTip) {
                map_data.activeToolTip.remove();
                map_data.activeToolTip = null;
                map_data.activeToolTipID = -1;
                $(map_data.image).unbind('mouseout.mapster');
            }
        }
        // configure new canvas with area options 
        function initialize_map(map_data) {
            var $area, area, areas, i, opts, area_options, key, area_id, group, default_group, group_value, group_data_index, map_key_xref, group_list = [], selected_list = [];

            // avoid creating a function in a loop
            function mouseover_hook(e) {
                mouseover.call(this, map_data);
            }
            function mouseout_hook(e) {
                mouseout.call(this, map_data);
            }
            function onclick_hook(e) {
                click.call(this, map_data, e);
            }
            function listclick_hook(e) {
                list_click.call(this, map_data);
            }

            opts = map_data.options;
            areas = $(map_data.map).find('area[coords]');
            map_key_xref = {};
            default_group = opts.mapKey == "mapster_id";
            for (i = 0; i < areas.length; i++) {
                area_id = 0;
                area = areas[i];
                $area = $(area);

                group = $area.attr(opts.mapKey);

                if (group || default_group) {
                    if (opts.mapValue) {
                        group_value = $area.attr(opts.mapValue);
                    }
                    if (default_group) {
                        // set an attribute so we can refer to the area by index from the DOM object if no key
                        area_id = group_list.push({ key: -1, value: group_value, area_option_id: -1 }) - 1;
                        group = area_id;
                        group_list[area_id].key = area_id;
                        $area.attr('mapster_id', area_id);
                    } else {
                        group_data_index = $.mapster.utils.arrayIndexOfProp(group_list, 'key', group);
                        if (group_data_index >= 0) {
                            area_id = group_data_index;
                            if (group_value && !group_list[area_id].value) {
                                group_list[area_id].value = group_value;
                            }
                        } else {
                            area_id = group_list.push({ key: group, value: group_value, area_option_id: -1 }) - 1;
                        }
                    }
                    map_key_xref[group] = area_id;
                }

                if (map_data.options.useAreaData && !isTrueFalse(map_data.options.staticState)) {
                    area_options = $area.data('mapster');
                    key = $area.attr(map_data.options.mapKey);
                    // add any old format options to new format array
                    if (area_options) {
                        $.extend(area_options, { key: key });
                        map_data.options.areas.push(area_options);
                    }
                }
            }

            map_data.data = group_list;
            map_data.xref = map_key_xref;

            // build an xref of area-specific properties to speed access
            // refer by: map_data.options[map_data.data[x].area_option_id]
            for (i = 0; i < map_data.options.areas.length; i++) {
                area_id = id_from_key(map_data, map_data.options.areas[i].key);
                map_data.data[area_id].area_option_id = i;
                area_options = options_from_area_id(map_data, area_id);

                // if a static state, use it, otherwise use selected.
                selected_list[area_id] = (isTrueFalse(area_options.staticState)) ?
                            area_options.staticState : area_options.selected;
            }

            if (opts.isSelectable && opts.onGetList) {
                var sortFunc;
                var sorted_list = group_list.slice(0);
                if (opts.sortList) {
                    if (opts.sortList == "desc") {
                        sortFunc = function (a, b) {
                            return a == b ? 0 : (a > b ? -1 : 1);
                        };
                    } else {
                        sortFunc = function (a, b) {
                            return a == b ? 0 : (a < b ? -1 : 1);
                        };
                    }

                    sorted_list.sort(function (a, b) {
                        a = a.value;
                        b = b.value;
                        return sortFunc(a, b);
                    });
                }
                var returnedList = opts.onGetList.call(map_data.image, sorted_list);
                // allow assigning a returned list anyway and just not returning anything
                if (returnedList) {
                    opts.boundList = returnedList;
                }
            }

            if (opts.listenToList && opts.boundList) {
                opts.boundList.bind('click', listclick_hook);
            }

            areas.bind('click', onclick_hook);
            areas.mouseover(mouseover_hook).mouseout(mouseout_hook);

            set_areas_selected(map_data, selected_list);
        }

        function bind_tooltip_close(map_data, option, event, obj) {
            if (map_data.options.toolTipClose.indexOf(option) >= 0) {
                obj.unbind(event + '.mapster').bind(event + '.mapster', function () {
                    clear_tooltip(map_data);
                });
            }
        }
        function show_tooltip(map_data, area, area_options) {
            var opts, area_id, tooltip, left, top, alignLeft, alignTop, container, tooltipCss;
            opts = map_data.options;
            area_id = area_options.id;
            container = $(map_data.options.toolTipContainer);
            if (area_options.toolTip instanceof jQuery) {
                tooltip = container.html(area_options.toolTip);
            } else {
                tooltip = container.text(area_options.toolTip);
            }

            alignLeft = true;
            alignTop = true;
            var coords = $.mapster.utils.area_corner(area, alignLeft, alignTop);

            clear_tooltip(map_data);
            tooltip.hide();

            $(map_data.image).after(tooltip);
            map_data.activeToolTip = tooltip;
            map_data.activeToolTipID = area_id;

            // Try to upper-left align it first, if that doesn't work, change the parameters
            left = coords[0] - tooltip.outerWidth(true);
            top = coords[1] - tooltip.outerHeight(true);
            if (left < 0) {
                alignLeft = false;
            }
            if (top < 0) {
                alignTop = false;
            }
            coords = $.mapster.utils.area_corner(area, alignLeft, alignTop);
            left = coords[0] - (alignLeft ? tooltip.outerWidth(true) : 0);
            top = coords[1] - (alignTop ? tooltip.outerHeight(true) : 0);

            tooltipCss = { "left": left + "px", "top": top + "px" };

            if (!tooltip.css("z-index") || tooltip.css("z-index") == "auto") {
                tooltipCss["z-index"] = "2000";
            }
            tooltip.css(tooltipCss).addClass('mapster_tooltip');

            bind_tooltip_close(map_data, 'tooltip-click', 'click', tooltip);
            // not working properly- closes too soon sometimes
            bind_tooltip_close(map_data, 'img-mouseout', 'mouseout', $(map_data.image));

            if (me.has_canvas) {
                tooltip.css("opacity", "0");
                tooltip.show();
                fader(tooltip[0], 0);
            } else {
                tooltip.show();
            }
            if (opts.onShowToolTip && typeof opts.onShowToolTip == 'function') {
                var obj = {
                    target: area,
                    tooltip: tooltip,
                    areaTarget: $(area),
                    areaOptions: area_options,
                    key: map_data.data[area_id].key,
                    selected: map_data.selected_list[area_id]
                };
                opts.onShowToolTip.call(area, obj);
            }
        }
        // EVENTS
        function mouseover(map_data) {
            var area, area_options, area_id;
            area = this;

            if (isTrueFalse(map_data.options.staticState)) {
                return;
            }
            area_options = options_from_area(map_data, area);
            area_id = area_options.id;
            if (!isTrueFalse(area_options.staticState)) {
                add_shape_group(map_data, map_data.overlay_canvas, area_id, "highlighted");
            }
            if (map_data.options.showToolTip && area_options.toolTip && map_data.activeToolTipID != area_id) {
                show_tooltip(map_data, area, area_options);
            }
        }
        function mouseout(map_data) {
            if (map_data.options.toolTipClose && map_data.options.toolTipClose.indexOf('area-mouseout') >= 0) {
                clear_tooltip(map_data);
            }
            // clear the default canvas
            me.clear_highlight(map_data);
        }
        function click(map_data, e) {
            var area, key, selected, list_target, opts, area_id, area_options;

            e.preventDefault();
            area = this;
            opts = map_data.options;
            area_options = options_from_area(map_data, area);

            area_id = id_from_area(map_data, area);
            key = map_data.data[area_id].key;

            if (area_options.isSelectable) {
                selected = $.mapster.impl.toggle_selection(map_data, area_id);
            }
            if (opts.boundList && opts.boundList.length > 0) {
                list_target = setBoundListProperties(map_data, key, selected);
            }


            if (opts.onClick && typeof (opts.onClick == 'function')) {
                var obj = {
                    target: area,
                    listTarget: list_target,
                    areaTarget: $(area),
                    areaOptions: options_from_area(map_data, area),
                    key: key,
                    selected: map_data.selected_list[area_id]
                };
                opts.onClick.call(area, obj);
            }
        }
        function list_click(map_data) {
            //

        }
        function fader(element, opacity, interval) {
            if (opacity <= 1) {
                element.style.opacity = opacity;
                window.setTimeout(fader, 10, element, opacity + 0.1, 10);
            }
        }
        // PUBLIC FUNCTIONS
        // simulate a click event. This is like toggle, but causes events to run also. 
        me.click = function (selected, key) {
            var map_data, key_list;
            map_data = get_map_data(this.get(0));
            if (key instanceof Array) {
                key_list = key.join(",");
            } else {
                key_list = key;
            }

        }
        // Select or unselect areas identified by key -- a string, a csv string, or array of strings. 
        // if set_bound is true, the bound list will also be updated. Default is true

        me.set = function (selected, key, set_bound) {
            var lastParent, parent, map_data, key_list, area_id, do_set_bound;
            do_set_bound = isTrueFalse(set_bound) ? set_bound : true;
            map_data = get_map_data(this.get(0));
            function setSelection(area_id) {
                if (selected === true) {
                    $.mapster.impl.add_selection(map_data, area_id);
                } else if (selected === false) {
                    $.mapster.impl.remove_selection(map_data, area_id);
                } else {
                    $.mapster.impl.toggle_selection(map_data, area_id);
                }
            }
            if (this.get(0).tagName.toLowerCase() == 'img') {
                if (key instanceof Array) {
                    key_list = key.join(",");
                } else {
                    key_list = key;
                }
                for (var i = 0; i < map_data.data.length; i++) {
                    if ((key_list + ",").indexOf(map_data.data[i].key + ",") >= 0) {
                        area_id = i;
                        setSelection(area_id);
                    }
                }
            } else {
                key_list = '';
                this.each(function () {
                    // it is possible for areas from different mapsters to be passed, make sure we're on the right one.
                    parent = $(this).parent();
                    if (parent != lastParent) {
                        map_data = get_map_data(this);
                        lastParent = parent;
                    }
                    area_id = id_from_area(map_data, this);

                    setSelection(area_id);
                    if ((key_list + ",").indexOf(map_data.data[area_id].key) < 0) {
                        key_list += (key_list === '' ? '' : ',') + map_data.data[area_id].key;
                    }
                });
            }
            if (do_set_bound && map_data.options.boundList) {
                setBoundListProperties(map_data, key_list, selected);
            }
        };
        me.close_tooltip = function () {
            clear_tooltip();
        }
        me.remove_selection = function (map_data, area_id) {
            var canvas_temp, list_temp;

            if (!map_data.selected_list[area_id]) {
                return;
            }
            map_data.selected_list[area_id] = false;

            if (!me.has_canvas) {
                // for canvass-less browsers
                $(map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
            } else {
                // draw new base canvas, then swap with the old one to avoid flickering
                canvas_temp = map_data.base_canvas;
                list_temp = map_data.selected_list;
                map_data.base_canvas = create_canvas(map_data.image);
                $(map_data.base_canvas).hide();
                $(map_data.image).before(map_data.base_canvas);
                map_data.selected_list = [];
                set_areas_selected(map_data, list_temp);

                $(canvas_temp).remove();
                $(map_data.base_canvas).show();
            }
            me.clear_highlight(map_data);
        };
        me.add_selection = function (map_data, area_id) {
            var name, list;
            list = map_data.selected_list;
            if (list[area_id]) { return; }
            list[area_id] = true;

            // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
            if (map_data.options.singleSelect) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i] && i != area_id) {
                        me.remove_selection(map_data, i);
                    }
                }
            }
            // don't use effects for setting static canvas
            name = "static_" + area_id.toString();
            add_shape_group(map_data, map_data.base_canvas, area_id, name, { fade: false });
        };
        me.toggle_selection = function (map_data, area_id) {
            var selected;

            if (!map_data.selected_list[area_id]) {
                me.add_selection(map_data, area_id);
                selected = true;
            } else {
                me.remove_selection(map_data, area_id);
                selected = false;
            }
            return selected;
        };
        me.create = function (opts) {
            opts = $.extend({}, $.mapster.defaults, opts);

            if ($.browser.msie && !me.has_canvas && !me.ie_config_complete) {
                document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                var style = document.createStyleSheet();
                var shapes = ['shape', 'rect', 'oval', 'circ', 'fill', 'stroke', 'imagedata', 'group', 'textbox'];
                $.each(shapes,
				    function () {
				        style.addRule('v\\:' + this, "behavior: url(#default#VML); antialias:true");
				    }
			    );
                $.mapster.ie_config_complete = true;
            }
            if (!opts.mapKey) {
                opts.mapKey = 'mapster_id';
            }

            return this.each(function () {
                var img, wrap, options, area_options, map, canvas, overlay_canvas, usemap, map_data;
                img = $(this);

                if (!is_image_loaded(this)) {
                    // If the image isn't fully loaded, this won't work right.  Try again later.
                    return window.setTimeout(function () {
                        img.mapster(opts);
                    }, 200);
                }

                options = $.extend({}, opts, img.data('mapster'));
                area_options = $.extend({}, $.mapster.area_defaults);
                $.mapster.utils.mergeObjects(area_options, options);

                // jQuery bug with Opera, results in full-url#usemap being returned from jQuery's attr.
                // So use raw getAttribute instead.
                usemap = this.getAttribute('usemap');

                map = $('map[name="' + usemap.substr(1) + '"]');

                if (!(img.is('img') && usemap && map.size() > 0)) { return; }

                // make sure not already bound, reset if so
                if (get_map_data(this)) {
                    remove_map_data(this);
                }

                wrap = $('<div></div>').css({
                    display: 'block',
                    background: 'url(' + this.src + ')',
                    position: 'relative',
                    padding: 0,
                    width: this.width,
                    height: this.height
                });
                if (options.wrapClass) {
                    if (options.wrapClass === true) {
                        wrap.addClass($(this).attr('class'));
                    } else {
                        wrap.addClass(options.wrapClass);
                    }
                }
                img.before(wrap).css('opacity', 0).css(me.canvas_style).remove();
                if (!me.has_canvas) { img.css('filter', 'Alpha(opacity=0)'); }
                wrap.append(img);

                canvas = create_canvas(img.get(0));

                if (!me.has_canvas) {
                    overlay_canvas = canvas;
                } else {
                    overlay_canvas = create_canvas(img.get(0));
                }

                img.before(canvas);
                if (overlay_canvas !== canvas) {
                    img.before(overlay_canvas);
                }
                // save profile data in an object
                map_data = {
                    options: options,
                    area_options: area_options,
                    map: map,
                    image: img.get(0),
                    base_canvas: canvas,
                    overlay_canvas: overlay_canvas,
                    selected_list: []
                };

                initialize_map(map_data);
                $.mapster.impl.map_cache.push(map_data);

                //img.addClass('selected');
            });
        };
        me.init = function () {
            var has_VML = document.namespaces;
            // define indexOf for IE6
            if (!Array.prototype.indexOf) {
                Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
                    if (this === null) {
                        throw new TypeError();
                    }
                    var t = Object(this);
                    var len = t.length >>> 0;
                    if (len === 0) {
                        return -1;
                    }
                    var n = 0;
                    if (arguments.length > 0) {
                        n = Number(arguments[1]);
                        if (n !== n) // shortcut for verifying if it's NaN
                        { n = 0; }
                        else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
                        { n = (n > 0 || -1) * Math.floor(Math.abs(n)); }
                    }

                    if (n >= len)
                    { return -1; }

                    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);

                    for (; k < len; k++) {
                        if (k in t && t[k] === searchElement)
                        { return k; }
                    }
                    return -1;
                };
            }

            // force even IE9 to use VML mode. Although canvases are supported in IE9 the rollovers are not working properly
            // and I can't figure it out right now. VML works fine in all IEs.

            me.has_canvas = !$.browser.msie && !!document.createElement('canvas').getContext;

            if (!(me.has_canvas || has_VML)) {
                $.fn.mapster = function () { return this; };
                return;
            }

            if (me.has_canvas) {
                me.create_canvas_for = function (img) {
                    var c = $('<canvas style="width:' + img.width + 'px;height:' + img.height + 'px;"></canvas>').get(0);
                    c.getContext("2d").clearRect(0, 0, c.width, c.height);
                    return c;
                };
                me.add_shape_to = function (canvas, shape, coords, options, name) {
                    function css3color(color, opacity) {
                        function hex_to_decimal(hex) {
                            return Math.max(0, Math.min(parseInt(hex, 16), 255));
                        }
                        return 'rgba(' + hex_to_decimal(color.substr(0, 2)) + ',' + hex_to_decimal(color.substr(2, 2)) + ',' + hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
                    }
                    var i, context = canvas.getContext('2d');
                    context.beginPath();
                    if (shape == 'rect') {
                        context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
                    } else if (shape == 'poly') {
                        context.moveTo(coords[0], coords[1]);
                        for (i = 2; i < coords.length; i += 2) {
                            context.lineTo(coords[i], coords[i + 1]);
                        }
                    } else if (shape == 'circ') {
                        context.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, false);
                    }
                    context.closePath();
                    if (options.fill) {
                        context.fillStyle = css3color(options.fillColor, options.fillOpacity);
                        context.fill();
                    }
                    if (options.stroke) {
                        context.strokeStyle = css3color(options.strokeColor, options.strokeOpacity);
                        context.lineWidth = options.strokeWidth;
                        context.stroke();
                    }
                    if (options.fade) {
                        fader(canvas, 0);
                    }
                };
                me.clear_highlight = function (map_data) {
                    map_data.overlay_canvas.getContext('2d').clearRect(0, 0, map_data.overlay_canvas.width, map_data.overlay_canvas.height);
                };
            } else {   // ie executes this code
                me.create_canvas_for = function (img) {
                    return $('<var style="zoom:1;overflow:hidden;display:block;width:' + img.width + 'px;height:' + img.height + 'px;"></var>').get(0);
                };
                me.add_shape_to = function (canvas, shape, coords, options, name) {

                    var fill, stroke, opacity, e;
                    fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" />';
                    stroke = (options.stroke ? 'strokeweight="' + options.strokeWidth + '" stroked="t" strokecolor="#' + options.strokeColor + '"' : 'stroked="f"');
                    opacity = '<v:stroke opacity="' + options.strokeOpacity + '"/>';
                    if (shape == 'rect') {
                        e = $('<v:rect name="' + name + '" filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + coords[0] + 'px;top:' + coords[1] + 'px;width:' + (coords[2] - coords[0]) + 'px;height:' + (coords[3] - coords[1]) + 'px;"></v:rect>');
                    } else if (shape == 'poly') {
                        e = $('<v:shape name="' + name + '" filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + canvas.width + ',' + canvas.height + '" path="m ' + coords[0] + ',' + coords[1] + ' l ' + coords.join(',') + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + canvas.width + 'px;height:' + canvas.height + 'px;"></v:shape>');
                    } else if (shape == 'circ') {
                        e = $('<v:oval name="' + name + '" filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (coords[0] - coords[2]) + 'px;top:' + (coords[1] - coords[2]) + 'px;width:' + (coords[2] * 2) + 'px;height:' + (coords[2] * 2) + 'px;"></v:oval>');
                    }
                    e.get(0).innerHTML = fill + opacity;

                    $(canvas).append(e);
                };
                me.clear_highlight = function (map_data) {
                    var toClear = $(map_data.overlay_canvas).find('[name="highlighted"]');
                    toClear.remove();
                };
            }
        };
        return me;
    } ());
    // utility functions
    $.mapster.utils = {
        area_corner: function (area, left, top) {
            var bestX, bestY, curX, curY, coords;
            coords = $(area).attr('coords').split(',');
            bestX = left ? 999999 : -1;
            bestY = top ? 999999 : -1;
            for (var j = 0; j < coords.length; j += 2) {
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
        // sorta like $.extend but limits to updating existing properties on the base object.
        mergeObjects: function (base) {
            var obj;
            if (arguments) {
                for (var i = 0; i < arguments.length; i++) {
                    obj = arguments[i];
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop) && base.hasOwnProperty(prop)) {
                            base[prop] = obj[prop];
                        }
                    }
                }
            }
            return obj;
        },
        arrayIndexOfProp: function (arr, prop, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i][prop] === obj) {
                    return i;
                }
            }
            return -1;
        }
    };


    // A plugin selector to return nodes where an attribute matches any item from a comma-separated list. The list should not be quoted.
    // Will be more efficient (and easier) than selecting each one individually
    // usage: $('attrMatches("attribute_name","item1,item2,...");
    $.expr[':'].attrMatches = function (objNode, intStackIndex, arrProperties, arrNodeStack) {

        var quoteChar = arrProperties[2];
        var arrArguments = eval(
            "[" + quoteChar + arrProperties[3] + quoteChar + "]"
        );
        var compareList = arrArguments[1].split(',');

        var node = $(objNode);

        for (var i = 0; i < arrArguments.length; i++) {
            var curVal = node.attr(arrArguments[0]);
            for (var j = compareList.length - 1; j >= 0; j--) {
                if (curVal == compareList[j]) {
                    return true;
                }
            }
        }
        return false;
    };

    /// Code that gets executed when the plugin is first loaded
    methods = {
        create: $.mapster.impl.create,
        set: $.mapster.impl.set,
        select: function () {
            $.mapster.impl.set.call(this, true);
        },
        deselect: function () {
            $.mapster.impl.set.call(this, false);
        }
    };
    $.mapster.impl.init();
})(jQuery);
