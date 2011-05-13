/* ImageMapster 1.0.11
Copyright 2011 James Treworgy

Project home page http://www.outsharked.com/imagemapster

A jQuery plugin to enhance image maps.

version 1.0.11
-- add altImage options

version 1.0.10
-- ignore errors when binding mapster to invalid elements
-- minor performance improvements
-- fixed command queue problem (broke in 1.0.9)

version 1.0.9
-- add 'options' option
-- add 'rebind' option
-- add isDeselectable option
-- handle exceptions better (when acting on unbound images)
-- add 'get' method to retrieve selections
-- add unbind options
-- clear command queue after processing

5/5/2011 version 1.0.8
-- bug fix: properly handle commands issued after mapster binding if image wasn't ready at bind time

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
    $.fn.mapster = function (method)
    {
        if (methods[method])
        {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method)
        {
            return methods.bind.apply(this, arguments);
        }
        else
        {
            $.error('Method ' + method + ' does not exist on jQuery.mapster');
        }
    };
    $.mapster = {};
    $.mapster.default_tooltip_container = function ()
    {
        return '<div style="border: 2px solid black; background: #EEEEEE; position:absolute; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
        '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; ' +
        'border-radius: 6px 6px 6px 6px;"></div>';
    };
    $.mapster.defaults =
    {
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
        isDeselectable: true,
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
        showToolTip: false,
        toolTipClose: ['area-mouseout'],
        toolTipContainer: $.mapster.default_tooltip_container(),
        onClick: null,
        onShowToolTip: null,
        onGetList: null,
        onCreateTooltip: null,
        useAreaData: false,
        altImage: null,
        altImageFill: true,
        altImageStroke: false,
        altImageOpacity: 0.7,
        areas: []
    };
    // Used to filter the options when applied to an area
    $.mapster.area_defaults = (function ()
    {
        var def=$.mapster.defaults;
        return {
            fill: def.fill,
            fillColor: def.fillColor,
            fillOpacity: def.fillOpacity,
            stroke: def.stroke,
            strokeColor: def.strokeColor,
            strokeOpacity: def.strokeOpacity,
            strokeWidth: def.strokeWidth,
            fade: def.fade,
            staticState: def.staticState,
            selected: def.selected,
            isSelectable: def.isSelectable,
            isDeselectable: def.isDeselectable,
            altImageFill: def.altImageFill,
            altImageStroke: def.altImageStroke,
            altImageOpacity: def.altImageOpacity
        };
    }());
    // utility functions
    $.mapster.utils = {
        // returns the best corner it can find
        area_corner: function (area, left, top) {
            var bestX, bestY, curX, curY, coords,j,len;
            coords = $(area).attr('coords').split(',');
            bestX = left ? 999999 : -1;
            bestY = top ? 999999 : -1;
            len=coords.length;
            for (j = 0; j < len; j += 2) {
                curX = parseInt(coords[j], 10);
                curY = parseInt(coords[j + 1], 10);

                if (top ? curY < bestY : curY > bestY) {
                    bestY = curY;
                    if (left ? curX < bestX : curX > bestX)
                    {
                        bestX = curX;
                    }
                }
            }
            return [bestX, bestY];
        },
        //returns actual corners
        coords_corners: function (coords) {
            var curX,curY,minX=999999,minY=999999,maxX=0,maxY=0,j,len;        
            len=coords.length;
            for (j = 0; j < len; j += 2) {
                curX = parseInt(coords[j], 10);
                curY = parseInt(coords[j + 1], 10);
                if (curX<minX) {minX=curX;}
                if (curY<minY) {minY=curY;}
                if (curX>maxX) {maxX=curX;}
                if (curY>maxY) {maxY=curY;}
            }
            return [minX,minY,maxX,maxY];
        },
        // sorta like $.extend but limits to updating existing properties on the base object.
        mergeObjects: function (base)
        {
            var obj,i,len,prop;
            if (arguments)
            {
                len=arguments.length;
                for (i = 1; i < len; i++)
                {
                    obj = arguments[i];
                    for (prop in obj)
                    {
                        if (obj.hasOwnProperty(prop) && base.hasOwnProperty(prop))
                        {
                            base[prop] = obj[prop];
                        }
                    }
                }
            }
            return base;
        },
        arrayIndexOfProp: function (arr, prop, obj)
        {
            var i = arr.length;
            while (i--)
            {
                if (arr[i][prop] === obj)
                {
                    return i;
                }
            }
            return -1;
        },
        isTrueFalse: function(obj)
        {
            return obj === true || obj === false;
        },
        whenReady: (function() {
            var conditions=[],i,len,item,defaults;
            var do_timer_ref;
            var do_timer= function(options,no_reset) {
                if (!no_reset) {
                    defaults= {
                        iterations: 20,
                        description: "No description",
                        that: null
                        //object,property,value,callback
                    };
                    conditions.push($.extend(defaults,options));
                }
                len=conditions.length;
                for (i=0; i<len; i++) {
                    item=conditions[i];
                    if (item.object[item.property]===item.value) {
                        conditions.splice(i, 1);
                        item.callback.apply(item.that,item.args);
                    }
                    else {
                        if (item.iterations-- > 0) {
                            setTimeout(function() {
                                do_timer_ref(options,true);
                            },100);
                        }
                        else {
                            alert("Required condition never met: '" + item.description + "'");
                        }
                    }
                }
            }
            ;
            do_timer_ref=do_timer;
            return do_timer;
        })()
    };
    $.mapster.impl = (function ()
    {
        var me = {},
        u = $.mapster.utils,
        map_cache = [],
        ie_config_complete = false,
        has_canvas = null,
        create_canvas_for = null,
        add_shape_to = null,
        add_alt_shape=null,
        clear_highlight = null,
        clear_selections = null,
        refresh_selections = null,
        is_image_loaded=null,
        tooltip_events= [],
        alt_image=null,
        canvas_style =
        {
            position: 'absolute',
            left: 0,
            top: 0,
            padding: 0,
            border: 0
        };
        me.test = function(obj)
        {
            return eval(obj);
        };
        is_image_loaded=function(img)
        {
            if (!img.complete)
            {
                return false;

            }
            // IE
            if (typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0)
            {
                return false;

            }
            // Others
            return true;
        };
        // end utility functions
        function id_from_key(map_data, key)
        {
            if (key && map_data.xref && map_data.xref.hasOwnProperty(key))
            {
                return map_data.xref[key];
            }
            else
            {
                return -1;
            }
        }
        function id_from_area(map_data, area)
        {
            var $area, key, area_id;
            $area = $(area);
            key = $area.attr(map_data.options.mapKey);
            area_id = id_from_key(map_data, key);
            return area_id;
        }

        function options_from_area_id(map_data, area_id, override_options)
        {
            var opts;

            opts = map_data.data[area_id].area_options;
            if (u.isTrueFalse(map_data.options.staticState))
            {
                opts.selected = map_data.options.staticState;
                opts.isSelectable = false;
            }
            else if (u.isTrueFalse(opts.staticState))
            {
                opts.isSelectable = false;
            }
            opts.id = area_id;
            return $.extend({}, map_data.area_options, opts, override_options);
        }
        function options_from_area(map_data, area, override_options)
        {
            return options_from_area_id(map_data, id_from_area(map_data, area), override_options);
        }
        function shape_from_area(area)
        {
            var i, coords = area.getAttribute('coords').split(',');
            for (i = 0; i < coords.length; i++)
            {
                coords[i] = parseInt(coords[i], 10);

            }
            return [area.getAttribute('shape').toLowerCase().substr(0, 4), coords];
        }
        function create_canvas(img)
        {
            var $img = $(img),
            canvas = create_canvas_for(img);
            $(canvas).css(canvas_style);
            canvas.width = $img.width();
            canvas.height = $img.height();
            return canvas;
        }
        // initialize the plugin
        // remember area_options.id === area_id id is just stored as an option
        function add_shape_group(map_data, specific_canvas, area_id, name, override_options)
        {
            var subarea_options,shape,i,
            areas = map_data.map.find('area[' + map_data.options.mapKey + '="' + map_data.data[area_id].key + '"]'),
            areas_length=areas.length;

            for (i = areas_length - 1; i >= 0; i--)
            {
                subarea_options = options_from_area(map_data, areas[i], override_options);
                shape = shape_from_area(areas[i]);
                add_shape_to(map_data,specific_canvas, shape[0], shape[1], subarea_options, name);
            }
            // hack to ensure IE finishes rendering. still not sure why this is necessary.
            if (!has_canvas)
            {
                add_shape_to(map_data,specific_canvas, "rect", "0,0,0,0",
                {
                    fillOpacity: 0
                }, name);
            }
        }
        // internal function to actually set the area
        function set_area_selected(map_data,area_id)
        {
            var name,
            list = map_data.selected_list;
            if (list[area_id])
            {
                return;

            }
            list[area_id] = true;

            // don't use effects for setting static canvas
            name = "static_" + area_id.toString();
            add_shape_group(map_data, map_data.base_canvas, area_id, name,
            {
                fade: false
            });
        }
        // Configures selections from a separate list.
        function set_areas_selected(map_data, selected_list)
        {
            var i, list_len = selected_list.length;
            for (i = 0; i < list_len; i++)
            {
                if (selected_list[i])
                {
                    set_area_selected(map_data, i);
                }
            }
        }

        /// return current map_data for an image or area
        function get_map_data_index(obj)
        {
            var img, id, index=-1;
            switch (obj.tagName && obj.tagName.toLowerCase())
            {
                case 'area':
                    id = $(obj).parent().attr('name');
                    img = $("img[usemap='#" + id + "']")[0];
                    break;
                case 'img':
                    img = obj;
                    break;
            }
            if (img)
            {
                index = u.arrayIndexOfProp(map_cache, 'image', img);
            }
            return index;
        }
        function get_map_data(obj, ignore_errors)
        {
            var index = get_map_data_index(obj);
            if (index>=0)
            {
                return map_cache[index];
            }

            if (!ignore_errors)
            {
                throw ('Unable to obtain map data for object');
            }
            else
            {
                return null;
            }
        }
        function clear_tooltip(map_data)
        {
            var i,
            len=tooltip_events.length;
            if (map_data.activeToolTip)
            {
                map_data.activeToolTip.remove();
                map_data.activeToolTip = null;
                map_data.activeToolTipID = -1;
            }
            for (i=0; i<len; i++)
            {
                tooltip_events[i].object.unbind(tooltip_events[i].event);
            }
        }
        function clear_map_data(map_data)
        {
            var $canvas = $(map_data.base_canvas);
            if ($canvas.length)
            {
                $canvas.remove();
            }
            $canvas = $(map_data.overlay_canvas);
            if ($canvas.length)
            {
                $canvas.remove();
            }
            clear_tooltip(map_data);
        }
        function clear_events(map_data)
        {
            var areas = $(map_data.map).find('area[coords]');
            areas.unbind('click.mapster').unbind('mouseover.mapster').unbind('mouseout.mapster');

        }
        function remove_map_data(obj)
        {
            var index = get_map_data_index(obj);
            if (index>=0)
            {
                map_cache.splice(index, 1);
            }
        }
        // Causes changes to the bound list based on the user action (select or deselect)
        // area: the jQuery area object
        // returns the matching elements from the bound list for the first area passed (normally only one should be passed, but
        // a list can be passed
        function setBoundListProperties(map_data, key_list, selected)
        {
            var list_target, opts, target;
            opts = map_data.options;
            target =
            opts.boundList.filter(':attrMatches("' + opts.listKey + '","' + key_list + '")').each(function ()
            {
                if (opts.listSelectedClass)
                {
                    if (selected)
                    {
                        $(this).addClass(opts.listSelectedClass);
                    }
                    else
                    {
                        $(this).removeClass(opts.listSelectedClass);
                    }
                }
                if (opts.listSelectedAttribute)
                {
                    if (selected)
                    {
                        $(this).attr(opts.listSelectedAttribute, true);
                    }
                    else
                    {
                        $(this).removeAttr(opts.listSelectedAttribute);
                    }
                }
            }
            );
            if (!list_target)
            {
                list_target = target;
            }
            return list_target;
        }
        // configure options that require doing special things
        function set_options(map_data,options,callback,args) {
            var configureAltImage = function(map_data,alt_image,callback,args) {
                map_data.alt_canvas =  $('<canvas width="' + map_data.image.width + '" height="' + map_data.image.height + '"></canvas>')[0];       
                map_data.alt_context = map_data.alt_canvas.getContext("2d");
                map_data.alt_context.drawImage(alt_image,0,0);
                callback.apply(null,args);
            };
            if (has_canvas && options.altImage) {
                alt_image = new Image();
                alt_image.src = options.altImage;

            u.whenReady({
                object: alt_image,
                property: "complete",
                value: true,
                callback: configureAltImage,
                args: [map_data,alt_image,callback,args],
                description: "Alternate image '" + options.altImage+"' loaded."
                 });
            } else {
                callback.apply(null,args);
            }
        }
        // rebind based on new area options
        function set_area_options(map_data,areas)
        {
            var i,area_id,area_options,
            selected_list = [];
            // refer by: map_data.options[map_data.data[x].area_option_id]
            for (i = 0; i < areas.length; i++)
            {
                area_options = areas[i];
                area_id = id_from_key(map_data,area_options.key);
                if (area_id>=0)
                {
                    //map_data.data[area_id].area_option_id = i;
                    map_data.data[area_id].area_options = area_options;
                    //area_options = options_from_area_id(map_data, area_id);

                    // if a static state, use it, otherwise use selected.
                    selected_list[area_id] = (u.isTrueFalse(area_options.staticState)) ?
                    area_options.staticState : area_options.selected;
                }
            }
            set_areas_selected(map_data, selected_list);

        }
        // configure new canvas with area options
        function initialize_map(map_data)
        {
            var $area, area, areas, i, opts, area_options, key, area_id, group, default_group, group_value, group_data_index, map_key_xref, group_list = [],
            sort_func,sorted_list,returned_list;

            // avoid creating a function in a loop
            function mouseover_hook(e)
            {
                mouseover.call(this, map_data);
            }
            function mouseout_hook(e)
            {
                mouseout.call(this, map_data);
            }
            function onclick_hook(e)
            {
                click.call(this, map_data, e);
            }
            function listclick_hook(e)
            {
                list_click.call(this, map_data);
            }

            opts = map_data.options;
            areas = $(map_data.map).find('area[coords]');
            map_key_xref = {};
            default_group = opts.mapKey === "mapster_id";
            for (i = 0; i < areas.length; i++)
            {
                area_id = 0;
                area = areas[i];
                $area = $(area);

                group = $area.attr(opts.mapKey);

                if (group || default_group)
                {
                    if (opts.mapValue)
                    {
                        group_value = $area.attr(opts.mapValue);
                    }
                    if (default_group)
                    {
                        // set an attribute so we can refer to the area by index from the DOM object if no key
                        area_id = group_list.push(
                        {
                            key: -1, 
                            value: group_value, 
                            area_options: {}
                        }) - 1;
                        group = area_id;
                        group_list[area_id].key = area_id;
                        $area.attr('mapster_id', area_id);
                    }
                    else
                    {
                        group_data_index = u.arrayIndexOfProp(group_list, 'key', group);
                        if (group_data_index >= 0)
                        {
                            area_id = group_data_index;
                            if (group_value && !group_list[area_id].value)
                            {
                                group_list[area_id].value = group_value;
                            }
                        }
                        else
                        {
                            area_id = group_list.push(
                            {
                                key: group, 
                                value: group_value, 
                                area_options:
                                {}
                            }) - 1;
                        }
                    }
                    map_key_xref[group] = area_id;
                }

                if (opts.useAreaData && !u.isTrueFalse(opts.staticState))
                {
                    area_options = $area.data('mapster');
                    key = $area.attr(opts.mapKey);
                    // add any old format options to new format array
                    if (area_options)
                    {
                        $.extend(area_options,
                        {
                            key: key
                        }
                        );
                        opts.areas.push(area_options);
                    }
                }
            }

            map_data.data = group_list;
            map_data.xref = map_key_xref;

            set_area_options(map_data,opts.areas);

            if (opts.isSelectable && opts.onGetList)
            {
                sorted_list = group_list.slice(0);
                if (opts.sortList)
                {
                    if (opts.sortList === "desc")
                    {
                        sort_func = function (a, b)
                        {
                            return a === b ? 0 : (a > b ? -1 : 1);
                        };
                    }
                    else
                    {
                        sort_func = function (a, b)
                        {
                            return a === b ? 0 : (a < b ? -1 : 1);
                        };
                    }

                    sorted_list.sort(function (a, b)
                    {
                        a = a.value;
                        b = b.value;
                        return sort_func(a, b);
                    }
                    );
                }
                returned_list=opts.onGetList.call(map_data.image, sorted_list);
                // allow assigning a returned list anyway and just not returning anything
                if (returned_list)
                {
                    opts.boundList = returned_list;
                }
            }

            if (opts.listenToList && opts.boundList)
            {
                opts.boundList.bind('click', listclick_hook);
            }

            areas.bind('click.mapster', onclick_hook);
            areas.bind('mouseover.mapster',mouseover_hook).bind('mouseout.mapster',mouseout_hook);

        }

        function bind_tooltip_close(map_data, option, event, obj)
        {
            var event_name=event + '.mapster-tooltip';
            if (map_data.options.toolTipClose.indexOf(option) >= 0)
            {
                obj.unbind(event_name).bind(event_name, function ()
                {
                    clear_tooltip(map_data);
                });
                tooltip_events.push(
                {
                    object: obj, event: event_name
                });
            }
        }
        function show_tooltip(map_data, area, area_options)
        {
            var tooltip, left, top, tooltipCss,coords,
            opts = map_data.options,
            area_id = area_options.id,
            alignLeft = true,
            alignTop = true,
            container = $(map_data.options.toolTipContainer);
            if (area_options.toolTip instanceof jQuery)
            {
                tooltip = container.html(area_options.toolTip);
            }
            else
            {
                tooltip = container.text(area_options.toolTip);
            }

            coords = u.area_corner(area, alignLeft, alignTop);

            clear_tooltip(map_data);
            tooltip.hide();

            $(map_data.image).after(tooltip);
            map_data.activeToolTip = tooltip;
            map_data.activeToolTipID = area_id;

            // Try to upper-left align it first, if that doesn't work, change the parameters
            left = coords[0] - tooltip.outerWidth(true);
            top = coords[1] - tooltip.outerHeight(true);
            if (left < 0)
            {
                alignLeft = false;
            }
            if (top < 0)
            {
                alignTop = false;
            }
            coords = u.area_corner(area, alignLeft, alignTop);
            left = coords[0] - (alignLeft ? tooltip.outerWidth(true) : 0);
            top = coords[1] - (alignTop ? tooltip.outerHeight(true) : 0);

            tooltipCss =  { "left": left + "px", "top": top + "px" };

            if (!tooltip.css("z-index") || tooltip.css("z-index") === "auto")
            {
                tooltipCss["z-index"] = "2000";
            }
            tooltip.css(tooltipCss).addClass('mapster_tooltip');

            bind_tooltip_close(map_data, 'area-click', 'click', $(map_data.map));
            bind_tooltip_close(map_data, 'tooltip-click', 'click', tooltip);
            // not working properly- closes too soon sometimes
            bind_tooltip_close(map_data, 'img-mouseout', 'mouseout', $(map_data.image));

            if (has_canvas)
            {
                tooltip.css("opacity", "0");
                tooltip.show();
                fader(tooltip[0], 0);
            }
            else
            {
                tooltip.show();
            }
            if (opts.onShowToolTip && typeof opts.onShowToolTip === 'function')
            {

                opts.onShowToolTip.call(area,
                {
                    target: area,
                    tooltip: tooltip,
                    areaTarget: $(area),
                    areaOptions: area_options,
                    key: map_data.data[area_id].key,
                    selected: map_data.selected_list[area_id]
                }
                );
            }
        }
        // EVENTS
        function mouseover(map_data)
        {
            var area, area_options, area_id;
            area = this;

            if (u.isTrueFalse(map_data.options.staticState))
            {
                return;
            }
            area_options = options_from_area(map_data, area);
            area_id = area_options.id;
            if (!u.isTrueFalse(area_options.staticState))
            {
                add_shape_group(map_data, map_data.overlay_canvas, area_id, "highlighted");
            }
            if (map_data.options.showToolTip && area_options.toolTip && map_data.activeToolTipID !== area_id)
            {
                show_tooltip(map_data, area, area_options);
            }
        }
        function mouseout(map_data)
        {
            if (map_data.options.toolTipClose && map_data.options.toolTipClose.indexOf('area-mouseout') >= 0)
            {
                clear_tooltip(map_data);
            }
            // clear the default canvas
            clear_highlight(map_data);
        }
        function click(map_data, e)
        {
            var area, key, selected, list_target, opts, area_id, area_options;

            e.preventDefault();
            area = this;
            opts = map_data.options;
            area_options = options_from_area(map_data, area);

            area_id = id_from_area(map_data, area);
            key = map_data.data[area_id].key;
            selected = map_data.selected_list[area_id];

            if (area_options.isSelectable &&
            (area_options.isDeselectable || !selected))
            {
                selected = me.toggle_selection(map_data, area_id);
            }

            if (opts.boundList && opts.boundList.length > 0)
            {
                list_target = setBoundListProperties(map_data, key, selected);
            }


            if (opts.onClick && typeof (opts.onClick === 'function'))
            {
                opts.onClick.call(area,
                {
                    target: area,
                    listTarget: list_target,
                    areaTarget: $(area),
                    areaOptions: options_from_area(map_data, area),
                    key: key,
                    selected: map_data.selected_list[area_id]
                });
            }
        }
        // NOT IMPLEMENTED
        function list_click(map_data)
        {
            //

        }
        function fader(element, opacity, interval)
        {
            if (opacity <= 1)
            {
                element.style.opacity = opacity;
                window.setTimeout(fader, 10, element, opacity + 0.1, 10);
            }
        }
        // PUBLIC FUNCTIONS

        // simulate a click event. This is like toggle, but causes events to run also.
        // NOT IMPLEMENTED
        me.click = function (key)
        {
            me.set(null,key,true);
        }
        ;

        me.get = function(key)
        {
            var i, map_data,len,result,area_id;
            this.each(function() {
                map_data = get_map_data(this,true);
                if (!map_data)
                {
                    return true; // continue
                }
                if (key)
                {
                    area_id = id_from_key(map_data, key);
                    result = map_data.selected_list[area_id] ? true: false;
                    return false; // break
                }
                len=map_data.selected_list.length;
    
                result = '';
                for (i=0; i<len; i++)
                {
                    if (map_data.selected_list[i])
                    {
                        result+=(result?',':'')+map_data.data[i].key;
                    }
                }
                return false; // break
            });
            return result;
        };
        // Select or unselect areas identified by key -- a string, a csv string, or array of strings.
        // if set_bound is true, the bound list will also be updated. Default is true. If neither true nor false,
        // it will be toggled.

        me.set = function (selected, key, set_bound)
        {
            var lastParent, parent, map_data, key_list, area_id, do_set_bound,i,len;
    
            function setSelection(area_id)
            {
                if (selected === true)
                {
                    me.add_selection(map_data, area_id);
                }
                else if (selected === false)
                {
                    me.remove_selection(map_data, area_id);
                }
                else
                {
                    me.toggle_selection(map_data, area_id);
                }
            }
            function queue_command(command,args) {
                map_data.commands.push(
                {
                    command: 'set', args: args
                });        
            }
            
            do_set_bound = u.isTrueFalse(set_bound) ? set_bound : true;
            this.each(function() {
                map_data = get_map_data(this,true);
                if (!map_data) {
                    return true; // continue
                }

//                tag = this.tagName.toLowerCase();
//                if (map_data.complete) {
//                    if (tag==='area') {
//                        cmd= {command: 'set',args: [arguments[0],$(this).attr(map_data.options.
//                    }
//                    return;
//                }

                key_list='';
                if ($(this).is('img'))
                {
                    if (!map_data.complete) {
                        queue_command('set',[selected,key,set_bound]);
                        return true;
                    }
                    if (key instanceof Array)
                    {
                        key_list = key.join(",");
                    }
                    else
                    {
                        key_list = key;
                    }
                    len=map_data.data.length;
                    for (i = 0; i < len; i++)
                    {
                        if ((key_list + ",").indexOf(map_data.data[i].key + ",") >= 0)
                        {
                            area_id = i;
                            setSelection(area_id);
                        }
                    }
                }
                else
                {
                    parent = $(this).parent()[0];
                    // it is possible for areas from different mapsters to be passed, make sure we're on the right one.
                    if (lastParent && parent !== lastParent)
                    {
                        map_data = get_map_data(this);
                        lastParent = parent;
                    }
                    lastParent=parent;
                    area_id = id_from_area(map_data, this);
                    key = map_data.data[area_id].key;

                    if (!map_data.complete) {
                        queue_command('set',[selected,key,do_set_bound]);
                        return true;
                    }
                    if ((key_list + ",").indexOf(key) < 0)
                    {
                        key_list += (key_list === '' ? '' : ',') + key;
                    }
                    
                    setSelection(area_id);

                }
                if (do_set_bound && map_data.options.boundList)
                {
                    setBoundListProperties(map_data, key_list, selected);
                }
            });
            return this;
        };
        me.close_tooltip = function ()
        {
            clear_tooltip();
        };
        me.remove_selection = function (map_data, area_id)
        {
            if (!map_data.selected_list[area_id])
            {
                return;
            }
            map_data.selected_list[area_id] = false;
            clear_selections(map_data,area_id);
            refresh_selections(map_data);
            clear_highlight(map_data);
        };
        me.add_selection = function (map_data, area_id)
        {
            // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect

            if (map_data.options.singleSelect)
            {
                clear_selections(map_data);
                map_data.selected_list=[];
            }

            set_area_selected(map_data,area_id);

            if (map_data.options.singleSelect)
            {
                refresh_selections(map_data);
            }
        };
        me.toggle_selection = function (map_data, area_id)
        {
            var selected;

            if (!map_data.selected_list[area_id])
            {
                me.add_selection(map_data, area_id);
                selected = true;
            }
            else
            {
                me.remove_selection(map_data, area_id);
                selected = false;
            }
            return selected;
        };

        me.unbind = function(preserveState)
        {
            var map_data;
            return this.each(function(e)
            {
                map_data= get_map_data(this,true);
                if (map_data)
                {
                    if (!preserveState)
                    {
                        clear_map_data(map_data);
                        remove_map_data(this);
                    }
                    else
                    {
                        map_data.unbound=true;
                    }
                    clear_events(map_data);
                }
            });
        };
        function merge_areas(map_data,areas)
        {
            var i,index,len,
            map_areas=map_data.options.areas;
            if (areas)
            {
                len = areas.length;
                for (i=0; i<len; i++)
                {
                    index=u.arrayIndexOfProp(map_areas,"key",areas[i].key);
                    if (index>=0)
                    {
                        $.extend(map_areas[index],areas[i]);
                    }
                    else
                    {
                        map_areas.push(areas[i]);
                    }
                }
            }
        }
        function merge_options(map_data,options)
        {
            var areas;
            areas=map_data.options.areas;
            $.extend(map_data.options,options);
            map_data.options.areas=areas;
            merge_areas(map_data,options.areas);
            // refreshe the area_option template
            u.mergeObjects(map_data.area_options, options);
        }

        // refresh options.
        me.rebind = function(options)
        {
            var map_data;
            this.filter('img').each(function()
            {
                map_data=get_map_data(this,true);
                if (map_data)
                {
                    merge_options(map_data,options);
                    // this will only update new areas that may have been passed
                    set_area_options(map_data,options.areas || {} );
                }
            });
            return this;
        };
        me.options=function(options)
        {
            var map_data,
            img = this.filter('img').first().get(0);
            map_data=get_map_data(img,true);
            if (!map_data)
            {
                return;
            }
            if (options)
            {
                merge_options(map_data,options);
                return this;
            }
            else
            {
                return map_data.options;
            }
        };
        me.bind = function (opts)
        {
            function complete_bind(map_data)
            {
                var i;
                initialize_map(map_data);
                if (!map_data.complete) {
                    map_data.complete = true;
                    for (i = 0; i < map_data.commands.length; i++)
                    {
                        methods[map_data.commands[i].command].apply($(this), map_data.commands[i].args);
                    }
                    map_data.commands=[];
                }
            }

            var style,shapes;
            opts = $.extend({}, $.mapster.defaults, opts);

            if ($.browser.msie && !has_canvas && !ie_config_complete)
            {
                document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                style = document.createStyleSheet();
                shapes = ['shape', 'rect', 'oval', 'circ', 'fill', 'stroke', 'imagedata', 'group', 'textbox'];
                $.each(shapes,
                function () {
                    style.addRule('v\\:' + this, "behavior: url(#default#VML); antialias:true");
                });
                ie_config_complete = true;
            }
            if (!opts.mapKey)
            {
                opts.mapKey = 'mapster_id';
            }

            return this.each(function ()
            {
                var img, wrap, options, area_options, map, canvas, overlay_canvas, usemap, map_data,i;

                // save ref to this image even if we can't access it yet. commands will be queued
                img = $(this);

                map_data = get_map_data(this,true);
                if (map_data && map_data.complete)
                {
                    if (!map_data.unbound)
                    {
                        clear_events(map_data);
                    }
                    clear_map_data(map_data);
                    remove_map_data(this);
                    map_data=null;
                }
                
                // ensure it's a valid image
                // jQuery bug with Opera, results in full-url#usemap being returned from jQuery's attr.
                // So use raw getAttribute instead.
                usemap = this.getAttribute('usemap');
                map = usemap && $('map[name="' + usemap.substr(1) + '"]');
                if (!(img.is('img') && usemap && map.size() > 0))
                {
                    return true;
                }
                
                if (!map_data) {
                    map_data =
                    {
                        unbound: false,
                        image: this,
                        complete: false,
                        commands: [],
                        data: [],
                        selected_list: [],
                        xref: {}
                    };
                    map_cache.push(map_data);
                }

                // If the image isn't fully loaded, this won't work right.  Try again later.                   

                if (!is_image_loaded(this))
                {
                    u.whenReady({
                        object: this,
                        property: "complete",
                        value: true,
                        callback: img.mapster,
                        that: img,
                        args: [opts],
                        description: "Image loading for '" + img.attr('src') + "' never completed, missing?"
                    });
                    return true;
                }
//                    return window.setTimeout(function ()
//                    {
//                        img.mapster(opts);
//                    }, 200);
//                }

                // for backward compatibility with jquery "data" on areas
                options = $.extend({}, opts, img.data('mapster'));
                area_options = $.extend({}, $.mapster.area_defaults);
                u.mergeObjects(area_options, options);

                wrap = $('<div></div>').css(
                {
                    display: 'block',
                    background: 'url(' + this.src + ')',
                    position: 'relative',
                    padding: 0,
                    width: this.width,
                    height: this.height
                });
                if (options.wrapClass)
                {
                    if (options.wrapClass === true)
                    {
                        wrap.addClass($(this).attr('class'));
                    }
                    else
                    {
                        wrap.addClass(options.wrapClass);
                    }
                }
                img.before(wrap).css('opacity', 0).css(canvas_style).remove();
                if (!has_canvas)
                {
                    img.css('filter', 'Alpha(opacity=0)');
                }
                wrap.append(img);

                canvas = create_canvas(this);

                if (!has_canvas)
                {
                    overlay_canvas = canvas;
                }
                else
                {
                    overlay_canvas = create_canvas(this);
                }

                img.before(canvas);
                if (overlay_canvas !== canvas)
                {
                    img.before(overlay_canvas);
                }
                // save profile data in an object
                $.extend(map_data,
                {
                    options: options,
                    area_options: area_options,
                    map: map,
                    base_canvas: canvas,
                    overlay_canvas: overlay_canvas,
                    selected_list: []
                });
                
                set_options(map_data,map_data.options,complete_bind,[map_data]);

                // process queued commands
            });
        };
        function render_shape(context,shape,coords) {
            var i;
            switch(shape) {
                case 'rect':
                    context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
                    break;
                case 'poly':
                    context.moveTo(coords[0], coords[1]);
                    for (i = 2; i < coords.length; i += 2)
                    {
                        context.lineTo(coords[i], coords[i + 1]);
                    }
                    break;
                case 'circ':
                    context.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, false);
                    break;
            }
        }
        function add_alt_image(map_data,context ,shape,coords,options) {
            var temp_canvas,temp_context,data,
            corners = u.coords_corners(coords),
            width = corners[2]-corners[0],
            height = corners[3]-corners[1];
    		  
            context.save();
            context.beginPath();
            render_shape(context,shape,coords);
            context.clip();
    
    		// shape outline is now rendered on image. Overlay the cutout.
    
            temp_canvas = $('<canvas width="' + width + '" height="' + height + '"></canvas>');        
    		temp_context = temp_canvas[0].getContext('2d');
            
            data =map_data.alt_context.getImageData(corners[0],corners[1],corners[2],corners[3]);
            temp_context.putImageData(data,0,0);

            //render the cropped area
    
            //context.globalCompositeOperation = "source-in";
            context.globalAlpha = options.altImageOpacity;
            context.drawImage(temp_canvas[0],corners[0],corners[1]);
            context.restore();
        }

        me.init = function ()
        {
            var i,context,
            has_VML = document.namespaces;
            // define indexOf for IE6
            if (!Array.prototype.indexOf)
            {
                Array.prototype.indexOf = function (searchElement /*, fromIndex */)
                {
                    var t,n,k,len;
                    if (this === null)
                    {
                        throw new TypeError();
                    }
                    t = Object(this);
                    len = t.length >>> 0;
                    if (len === 0)
                    {
                        return -1;
                    }
                    n = 0;
                    if (arguments.length > 0)
                    {
                        n = Number(arguments[1]);
                        if (n !== n) // shortcut for verifying if it's NaN
                        {
                            n = 0;

                        }
                        else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
                        {
                            n = (n > 0 || -1) * Math.floor(Math.abs(n));

                        }
                    }

                    if (n >= len)
                    {
                        return -1;

                    }

                    k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);

                    for (; k < len; k++)
                    {
                        if (k in t && t[k] === searchElement)
                        {
                            return k;

                        }
                    }
                    return -1;
                };
            }

            // force even IE9 to use VML mode. Although canvases are supported in IE9 the rollovers are not working properly
            // and I can't figure it out right now. VML works fine in all IEs.

            has_canvas = !$.browser.msie && !!document.createElement('canvas').getContext;

            if (!(has_canvas || has_VML))
            {
                $.fn.mapster = function ()
                {
                    return this;

                };
                return;
            }

            if (has_canvas)
            {
                create_canvas_for = function (img)
                {
                    var c = $('<canvas style="width:' + img.width + 'px;height:' + img.height + 'px;"></canvas>').get(0);
                    c.getContext("2d").clearRect(0, 0, c.width, c.height);
                    return c;
                };
                add_shape_to = function (map_data,canvas, shape, coords, options, name)
                {
                    var fill=options.fill,
                        stroke = options.stroke;
                    function css3color(color, opacity)
                    {
                        function hex_to_decimal(hex)
                        {
                            return Math.max(0, Math.min(parseInt(hex, 16), 255));
                        }
                        return 'rgba(' + hex_to_decimal(color.substr(0, 2)) + ',' + hex_to_decimal(color.substr(2, 2)) + ',' + hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
                    }
                    context = canvas.getContext('2d');
                    if (map_data.options.altImage) {
                        add_alt_image(map_data,context,shape,coords,options);
                        fill=options.altImageFill;
                        stroke =options.altImageStroke;
                    } else {
                        context.beginPath();
                        render_shape(context,shape,coords);
                        context.closePath();
                    }
                    if (fill)
                    {
                        context.fillStyle = css3color(options.fillColor, options.fillOpacity);
                        context.fill();
                    }
                    if (stroke)
                    {
                        context.strokeStyle = css3color(options.strokeColor, options.strokeOpacity);
                        context.lineWidth = options.strokeWidth;
                        context.stroke();
                    }
                    if (options.fade)
                    {
                        fader(canvas, 0);
                    }
                };
                clear_highlight = function (map_data)
                {
                    map_data.overlay_canvas.getContext('2d').clearRect(0, 0, map_data.overlay_canvas.width, map_data.overlay_canvas.height);
                };
                clear_selections = function()
                {
                    return null;
                };
                refresh_selections = function(map_data)
                {
                    var list_temp,canvas_temp;
                    // draw new base canvas, then swap with the old one to avoid flickering
                    canvas_temp = map_data.base_canvas;
                    list_temp = map_data.selected_list;
                    map_data.base_canvas = create_canvas(map_data.image);
                    $(map_data.base_canvas).hide();
                    $(map_data.image).before(map_data.base_canvas);
                    map_data.selected_list = [];
                    set_areas_selected(map_data, list_temp);
    
                    $(map_data.base_canvas).show();
                    $(canvas_temp).remove();
                };
            }
            else
            {
                // ie executes this code
                create_canvas_for = function (img)
                {
                    return $('<var style="zoom:1;overflow:hidden;display:block;width:' + img.width + 'px;height:' + img.height + 'px;"></var>').get(0);
                };
                add_shape_to = function (map_data,canvas, shape, coords, options, name)
                {

                    var fill, stroke, opacity, e;
                    fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" />';
                    stroke = (options.stroke ? 'strokeweight="' + options.strokeWidth + '" stroked="t" strokecolor="#' + options.strokeColor + '"' : 'stroked="f"');
                    opacity = '<v:stroke opacity="' + options.strokeOpacity + '"/>';
                     switch(shape) {
                        case 'rect':
                        e = $('<v:rect name="' + name + '" filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + coords[0] + 'px;top:' + coords[1] + 'px;width:' + (coords[2] - coords[0]) + 'px;height:' + (coords[3] - coords[1]) + 'px;"></v:rect>');
                        break;
                    case 'poly':
                        e = $('<v:shape name="' + name + '" filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + canvas.width + ',' + canvas.height + '" path="m ' + coords[0] + ',' + coords[1] + ' l ' + coords.join(',') + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + canvas.width + 'px;height:' + canvas.height + 'px;"></v:shape>');
                        break;
                    case 'circ':
                        e = $('<v:oval name="' + name + '" filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (coords[0] - coords[2]) + 'px;top:' + (coords[1] - coords[2]) + 'px;width:' + (coords[2] * 2) + 'px;height:' + (coords[2] * 2) + 'px;"></v:oval>');
                        break;
                    }
                    e[0].innerHTML = fill + opacity;

                    $(canvas).append(e);
                }
                ;
                clear_highlight = function (map_data)
                {
                    var toClear = $(map_data.overlay_canvas).find('[name="highlighted"]');
                    toClear.remove();
                };
                clear_selections = function(map_data,area_id)
                {
                    if (area_id)
                    {
                        $(map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
                    }
                    else
                    {
                        $(map_data.base_canvas).find('[name^="static"]').remove();
                    }
                };
                refresh_selections = function() {
                    return null;
                };
            }
        };
        return me;
    }
    ());

    // A plugin selector to return nodes where an attribute matches any item from a comma-separated list. The list should not be quoted.
    // Will be more efficient (and easier) than selecting each one individually
    // usage: $('attrMatches("attribute_name","item1,item2,...");
    $.expr[':'].attrMatches = function (objNode, intStackIndex, arrProperties, arrNodeStack)
    {
        var i, j,curVal,
        quoteChar = arrProperties[2],
        arrArguments = eval("[" + quoteChar + arrProperties[3] + quoteChar + "]"),
        compareList = arrArguments[1].split(','),
        node = $(objNode);

        for (i = 0; i < arrArguments.length; i++)
        {
            curVal = node.attr(arrArguments[0]);
            for (j = compareList.length - 1; j >= 0; j--)
            {
                if (curVal === compareList[j])
                {
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
        select: function ()
        {
            $.mapster.impl.set.call(this, true);
        }
        ,
        deselect: function ()
        {
            $.mapster.impl.set.call(this, false);
        }
        ,
        options: $.mapster.impl.options,
        test: $.mapster.impl.test
    };
    $.mapster.impl.init();
})(jQuery);