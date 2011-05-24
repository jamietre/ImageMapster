/* ImageMapster 1.1 
Copyright 2011 James Treworgy
http://www.outsharked.com/imagemapster
https://github.com/jamietre/ImageMapster

A jQuery plugin to enhance image maps.

version 1.1 (beta)
-- added per-action options (highlight, select)
-- fixed memory leaks
-- minor performance improvements
-- cleanup in VML mode
-- fix IE9 canvas support (fader problem)
-- enable fading in most IEs (all except 8 apparently)
-- fix flickering on fades when moving quickly
-- add altImage options
-- added onConfigured callback
-- fixed problems with cleanup (not removing wrap)
-- added failure timeout for configure
-- very untested right now

5/13/2011 version 1.0.10
-- ignore errors when binding mapster to invalid elements
-- minor performance improvements
-- fixed command queue problem (broke in 1.0.9)
-- add 'options' option
-- add 'rebind' option
-- add isDeselectable option
-- handle exceptions better (when acting on unbound images)
-- add 'get' method to retrieve selections
-- add unbind options
-- clear command queue after processing

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

(function ($) {
    var methods;
    $.fn.mapster = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method) {
            return methods.bind.apply(this, arguments);
        }
        else {
            $.error('Method ' + method + ' does not exist on jQuery.mapster');
        }
    };
    $.mapster = {};
     // utility functions
    $.mapster.utils = {
        area_corner: function (area, left, top) {
            var bestX, bestY, curX, curY, coords, j;
            coords = $(area).attr('coords').split(',');
            bestX = left ? 999999 : -1;
            bestY = top ? 999999 : -1;

            for (j = coords.length-2; j >=0; j -= 2) {
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
                add=this.trueFalseDefault(options.add,options.template ? false : true),
                ignore = options.ignore ? options.ignore.split(','):'',
                include=options.include ? options.include.split(','):'',
                deep = options.deep ? options.deep.split(','):'',
                target=options.target || {},
                source=[].concat(options.source);
            if (options.template) {
                target = this.mergeObjects({ target: {}, source: [options.template,target] });
            }
            len = source.length;
            for (i=0; i<len;i++) {
                obj = source[i];
                if (obj) {
                    for (prop in obj) {
                        if ((!ignore || this.arrayIndexOf(ignore,prop)===-1) 
                          && (!include || this.arrayIndexOf(include,prop)>=0)
                          && obj.hasOwnProperty(prop) 
                          && (add || target.hasOwnProperty(prop))) {
        
                            if (deep && this.arrayIndexOf(deep,prop)>=0 && typeof obj[prop]==='object') {
                                if (typeof target[prop] !=='object' && add) {
                                    target[prop]={};
                                }
                                this.mergeObjects({target: target[prop],source:obj[prop],add: add });
                            } else {
                                target[prop] = obj[prop];
                            }
                        }
                    }
                }
            }
            return target;
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
        trueFalseDefault: function (obj,def) {
            return this.isTrueFalse(obj) ?
                obj : def || false;
        },
        isTrueFalse: function(obj) {
            return (obj === true || obj === false);
        },
        arrayIndexOf: function(arr,el) {
            if (arr.indexOf) {
                return arr.indexOf(el);
            } else {
                var i;
                for (i=arr.length-1;i>=0;i--) {
                    if (arr[i]===el) {
                        return i;
                    }
                }
                return -1;
            }
        },
        // recycle empty array elements
        arrayReuse:function(arr,obj) {
            var index = this.arrayIndexOf(arr,null);
            if (index===-1) {
                index = arr.push(obj)-1;
            } else {
                arr[index]=obj;
            }
            return index;
        },
        // iterate over each property of opj, calling fn on each one
        each: function(obj,fn) {
            var i;
            if (obj.constructor===Array) {
                for (i=obj.length-1;i>=0;i--) {
                    if (fn.call(obj[i],i)===false) {
                        return false;
                    }
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        if (fn.call(obj[i],i)===false) {
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        objectToArray: function(obj) {
            var arr=[];
            this.each(obj,function() {
                arr.push(obj);
            });
            return arr;
        },
        fader: (function () {
            var elements = [], 
                lastKey = 0,
                obj;
            function setOpacity(e, opacity) {
                e.style.opacity=opacity;
                e.style.filter="Alpha(opacity="+opacity*100+")";
            }
            var fade_func = function (el, op, endOp ,duration) {
                var index,u=$.mapster.utils;
                if (typeof el === 'number') {
                    index = u.arrayIndexOfProp(elements,'key',el);
                    if (index===-1) {
                        return;
                    } else {
                        obj=elements[index];
                    }
                } else {
                    obj=null;
                    index = u.arrayIndexOfProp(elements,'element',el);
                    if (index>=0) {
                        elements[index]=null;
                    }
                    obj={"element": el, "key": (el = ++lastKey) };
                    u.arrayReuse(elements,obj);
                }
                endOp = endOp || 1;

                op = (op+(endOp/10) > endOp-0.01)? endOp: op+(endOp/10);
                setOpacity(obj.element,op);
                if (op < endOp) {
                    setTimeout(function() {
                        fade_func(el,op,endOp,duration);
                    }, duration ? duration/10 : 15);
                } 
            };
            return fade_func;
        })()
    };
    $.mapster.default_tooltip_container = function () {
        return '<div style="border: 2px solid black; background: #EEEEEE; position:absolute; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
        '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; ' +
        'border-radius: 6px 6px 6px 6px;"></div>';
    };
    $.mapster.render_defaults =
    {
        fade: false,
        fadeDuration: 150,
        altImage: null,
        altImageOpacity: 0.7,
        fill: true,        
        fillColor: '000000',
        fillOpacity: 0.3,
        stroke: false,
        strokeColor: 'ff0000',
        strokeOpacity: 1,
        strokeWidth: 1,
        alt_image: null // used internally
    };

    $.mapster.defaults =  $.mapster.utils.mergeObjects({source:
    [{
        render_highlight: {fade: true },
        render_select: { },
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
        onConfigured: null,
        configTimeout: 10000,
        areas: []
    },$.mapster.render_defaults]});
    $.mapster.area_defaults =
        $.mapster.utils.mergeObjects({
            source: $.mapster.defaults,
            deep: "render_highlight, render_select",
            include:"fade,fadeDuration,fill,fillColor,fillOpacity,stroke,strokeColor,strokeOpacity,strokeWidth,staticState,selected,"
            +"isSelectable,isDeselectable,render_highlight,render_select"
        });
   
    $.mapster.impl = (function () {
        var me = {},
        u = $.mapster.utils,
        map_cache = [],
        ie_config_complete = false,
        has_canvas = null,
        create_canvas_for = null,
        add_shape_to = null,
        clear_highlight = null,
        clear_selections = null,
        refresh_selections = null,
        tooltip_events = [],
        event_hooks=[],
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
                images = u.mergeObjects({source: [{ main: map_data }, map_data.alt_images]});
            var result;
            return u.each(images,function() {
                img = this.image;
                if (!img.complete || !img.width || !img.height ||
                    (typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0)) {
                    return false;
                }
            });
        };
        me.test = function (obj) {
            return eval(obj);
        };
        // end utility functions
        function id_from_key(map_data, key) {
            return key && map_data.xref && map_data.xref.hasOwnProperty(key) ?
                map_data.xref[key]:-1;
        }
        function id_from_area(map_data, area) {
            return id_from_key(map_data, $(area).attr(map_data.options.mapKey));
        }

        function options_from_area_id(map_data, area_id, override_options) {
            var opts;
            //TODO this isSelectable should cascade already this seems redundant
            opts = u.mergeObjects({
                source:[map_data.options,
                    map_data.data[area_id].area_options,
                    override_options,
                    {id:area_id}],
                deep:"render_highlight,render_select"
                });
                
            if (u.isTrueFalse(map_data.options.staticState)) {
                opts.selected = map_data.options.staticState;
                opts.isSelectable = false;
            }
            else if (u.isTrueFalse(opts.staticState)) {
                opts.isSelectable = false;
            }
            return opts;
            
        }
        function options_from_area(map_data, area, override_options) {
            return options_from_area_id(map_data, id_from_area(map_data, area), override_options);
        }
        function shape_from_area(area) {
            var i, coords = area.getAttribute('coords').split(',');
            for (i = coords.length-1; i >=0 ; i--) {
                coords[i] = parseInt(coords[i], 10);
            }
            return [area.getAttribute('shape').toLowerCase().substr(0, 4), coords];
        }
        function create_canvas(img) {
            return $(create_canvas_for(img)).css(canvas_style)[0];
        }
        // initialize the plugin
        // remember area_options.id === area_id id is just stored as an option
        function add_shape_group(map_data, specific_canvas, area_options,name) {
            var shape, i,
                data = map_data.data[area_options.id],
                areas=data.areas || map_data.map.find('area[' + map_data.options.mapKey + '="' + data.key + '"]');

            // update cache with jQuery selector result for areas (potentially expensive)
            if (!data.areas) {
               data.areas = areas;
            }

            for (i = areas.length - 1; i >= 0; i--) {
                shape = shape_from_area(areas[i]);
                add_shape_to(map_data, specific_canvas, shape[0], shape[1], area_options, name);
            }
            if (has_canvas && area_options.fade) {
	            u.fader(specific_canvas, 0, 1,area_options.fadeDuration);
            }
        }
        // internal function to actually set the area
        function set_area_selected(map_data, area_id) {
            var name, opts,
                data = map_data.data[area_id];
            if (data.selected) {
                return;
            }
            data.selected = true;

            name = "static_" + area_id.toString();
            // first get area options. Then override fade for selecting, and finally merge in the "select" effect options.
            opts = options_from_area_id(map_data,area_id);
            opts = u.mergeObjects({
                source: [opts, 
                        opts.render_select, {
                            fade:false,
                            alt_image: map_data.alt_images.select
                        }]
            });
            add_shape_group(map_data, map_data.base_canvas, opts, name);
        }
        // Configures selections from a separate list.
        function set_areas_selected(map_data, selected_list) {
            var i;
            for (i = selected_list.length-1; i >= 0; i--) {
                set_area_selected(map_data, selected_list[i]);
            }
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
        function get_map_data(obj, ignore_errors) {
            var index = get_map_data_index(obj);
            if (index>=0) {
                return map_cache[index];
            }

            if (!ignore_errors) {
                throw ('Unable to obtain map data for object');
            }
            else {
                return null;
            }
        }
        function clear_tooltip(map_data) {
            var i;
            if (map_data.activeToolTip) {
                map_data.activeToolTip.remove();
                map_data.activeToolTip = null;
                map_data.activeToolTipID = -1;
            }
            for (i = tooltip_events.length-1; i >=0; i--) {
                tooltip_events[i].object.unbind(tooltip_events[i].event);
            }
        }
        function clear_map_data(map_data) {
            var div,
                canvases=[[map_data,"base_canvas"],
                    [map_data,"overlay_canvas"],
                    [map_data.alt_images.select,"canvas"],
                    [map_data.alt_images.highlight,"canvas"]];
                    
            u.each(canvases,function(i) {
                if (this[0] && this[0][this[1]]) {
                     $(this[0][this[1]]).remove();
                     this[0][this[1]]=null;
                }
            });
            // release refs to DOM elements
            u.each(map_data.data,function(i) {
                map_data.data[i].areas=null;
                map_data.data[i]=null;
            });
            if (!map_data.img_style) {
                // jquery bug? - attr('style') works inconsistently
                while ($(map_data.image).attr('style')) { 
                    $(map_data.image).removeAttr('style'); 
                }
            } else {
                $(map_data.image).attr('style',map_data.img_style);
            }
            div=$('div#mapster_wrap_'+map_data.index);
            div.before(div.children()).remove();
            map_data.image=null;
            u.each(map_data.alt_images,function(prop) {
                this.canvas=null;
                this.image=null;
            });
            clear_tooltip(map_data);
        }
        
        function clear_events(map_data) {
            var opts=map_data.options;

            $(map_data.map).find('area')
                .unbind('mouseover.mapster')
                .unbind('mouseout.mapster')
                .unbind('click.mapster');
            
            if (map_data.hooks_index && map_data.hooks_index>=0) {
                event_hooks[map_data.hooks_index].map_data=null;
                event_hooks[map_data.hooks_index]=null;
                map_data.hooks_index=null;
            }
            
            if (opts && opts.listenToList && opts.boundList) {
                opts.boundList.unbind('click.mapster');
            }
            
        }

        // Causes changes to the bound list based on the user action (select or deselect)
        // area: the jQuery area object
        // returns the matching elements from the bound list for the first area passed (normally only one should be passed, but
        // a list can be passed
        function setBoundListProperties(map_data, key_list, selected) {
            var opts, target;
            opts = map_data.options;
            target = opts.boundList.filter(':attrMatches("' + opts.listKey + '","' + key_list + '")')
                .each(function () {
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
            return target;
        }

        // rebind based on new area options. This copies info from array "areas" into the data[area_id].area_options property.
        function set_area_options(map_data, areas) {
            var i, area_id, area_options,data, selected_list=[];
            // refer by: map_data.options[map_data.data[x].area_option_id]
            for (i = areas.length-1; i >=0 ; i--) {
                area_options = areas[i];
                area_id = id_from_key(map_data, area_options.key);
                if (area_id >= 0) {
                    data = map_data.data[area_id];
                    
                    u.mergeObjects({target:data.area_options,source:area_options});

                    // if a static state, use it, otherwise use selected.
                    if ((u.isTrueFalse(area_options.staticState)) ?
                        area_options.staticState : area_options.selected) {
                        selected_list.push(area_id);
                    }
                    // TODO: will not deselect areas that were previously selected, so this only works for an initial bind.
                }
            }
            set_areas_selected(map_data, selected_list);

        }
        // configure new map with area options
        function initialize_map(map_data) {
            var $area, area, areas, i, opts, area_options, key, area_id, default_group, group_value, map_key_xref,
                sort_func, sorted_list, returned_list,
                group_list = [];

            map_data.hooks_index=u.arrayReuse(event_hooks,(function() {
                var me={};
                me.map_data=map_data;
                me.mouseover_hook= function(e) {
                        mouseover.call(this, me.map_data);
                    };
                me.mouseout_hook=function(e) {
                        mouseout.call(this, me.map_data);
                    };
                me.onclick_hook=function(e) {
                        click.call(this, me.map_data, e);
                    };
                me.listclick_hook=function(e) {
                        list_click.call(this, me.map_data);
                    };
                return me;
                })());
            function add_group(key,value,opts) {
                return (map_key_xref[key] = group_list.push({
                    key: key,
                    value: value,
                    area_options: opts,
                    selected: false
                })-1);
            }
            opts = map_data.options;
            areas = $(map_data.map).find('area[coords]');
            map_key_xref = {};
            default_group = opts.mapKey === "mapster_id";
            for (i = areas.length-1; i >=0; i--) {
                area_id = 0;
                area = areas[i];
                $area = $(area);

                key = $area.attr(opts.mapKey);

                if (key || default_group) {
                    if (opts.mapValue) {
                        group_value = $area.attr(opts.mapValue);
                    }
                    if (default_group) {
                        // set an attribute so we can refer to the area by index from the DOM object if no key
                        area_id = add_group(-1,group_value,{});
                        group_list[area_id].key = key = area_id;
                        $area.attr('mapster_id', area_id);
                    }
                    else {
                        //group_data_index = u.arrayIndexOfProp(group_list, 'key', group);
                        
                        if ((area_id = map_key_xref[key]) >= 0) {
                            if (group_value && !group_list[area_id].value) {
                                group_list[area_id].value = group_value;
                            }
                        }
                        else {
                            area_id = add_group(key,group_value,{});
                        }
                    }
                }
            }

            map_data.data = group_list;
            map_data.xref = map_key_xref;
            
            set_area_options(map_data, opts.areas);

            if (opts.isSelectable && opts.onGetList) {
                sorted_list = group_list.slice(0);
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
                returned_list = opts.onGetList.call(map_data.image, sorted_list);
                // allow assigning a returned list anyway and just not returning anything
                if (returned_list) {
                    opts.boundList = returned_list;
                }
            }

            if (opts.listenToList && opts.boundList) {
                opts.boundList.bind('click.mapster', event_hooks[map_data.hooks_index].listclick_hook);
            }

                areas.bind('mouseover.mapster', event_hooks[map_data.hooks_index].mouseover_hook)
                    .bind('mouseout.mapster',event_hooks[map_data.hooks_index].mouseout_hook)
                    .bind('click.mapster',event_hooks[map_data.hooks_index].onclick_hook);
        }

        function bind_tooltip_close(map_data, option, event, obj) {
            var event_name = event + '.mapster-tooltip';
            if (u.arrayIndexOf(map_data.options.toolTipClose,option) >= 0) {
                obj.unbind(event_name).bind(event_name, function () {
                    clear_tooltip(map_data);
                });
                tooltip_events.push(
                {
                    object: obj, event: event_name
                });
            }
        }
        function show_tooltip(map_data, area, area_options) {
            var tooltip, left, top, tooltipCss, coords, data,
            opts = map_data.options,
            area_id = area_options.id,
            alignLeft = true,
            alignTop = true,
            container = $(map_data.options.toolTipContainer);
            tooltip = container.html(area_options.toolTip);
            
            coords = u.area_corner(area, alignLeft, alignTop);

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
            coords = u.area_corner(area, alignLeft, alignTop);
            left = coords[0] - (alignLeft ? tooltip.outerWidth(true) : 0);
            top = coords[1] - (alignTop ? tooltip.outerHeight(true) : 0);

            tooltipCss = { "left": left + "px", "top": top + "px" };

            if (!tooltip.css("z-index") || tooltip.css("z-index") === "auto") {
                tooltipCss["z-index"] = "2000";
            }
            tooltip.css(tooltipCss).addClass('mapster_tooltip');

            bind_tooltip_close(map_data, 'area-click', 'click', $(map_data.map));
            bind_tooltip_close(map_data, 'tooltip-click', 'click', tooltip);
            // not working properly- closes too soon sometimes
            bind_tooltip_close(map_data, 'img-mouseout', 'mouseout', $(map_data.image));

            tooltip.css({"opacity":0});
            tooltip.show();
            u.fader(tooltip[0], 0,1,  opts.fadeDuration);

            if (opts.onShowToolTip && typeof opts.onShowToolTip === 'function') {
                data = map_data.data[area_id];
                opts.onShowToolTip.call(area,
                {
                    target: area,
                    tooltip: tooltip,
                    areaTarget: $(area),
                    areaOptions: area_options,
                    key: data.key,
                    selected: data.selected
                });
            }        }
        // EVENTS
        function mouseover(map_data) {
            var area, opts;
            area = this;
            //TODO why is this first check reuqired?
            if (u.isTrueFalse(map_data.options.staticState)) {
                return;
            }
            opts = options_from_area(map_data, area);
            opts =u.mergeObjects({
                source: [
                    opts,
                    opts.render_highlight,
                    { alt_image: map_data.alt_images.highlight }
                ]});
            
            if (!u.isTrueFalse(opts.staticState)) {
                add_shape_group(map_data, map_data.overlay_canvas, opts);
            }
            if (map_data.options.showToolTip && opts.toolTip && map_data.activeToolTipID !== opts.id) {
                show_tooltip(map_data, area, opts);
            }
        }
        function mouseout(map_data) {
            if (map_data.options.toolTipClose && u.arrayIndexOf(map_data.options.toolTipClose,'area-mouseout') >= 0) {
                clear_tooltip(map_data);
            }
            // clear the default canvas
            clear_highlight(map_data);
        }
        function click(map_data, e) {
            var area, key, selected, list_target, opts, area_id, area_options,
                data;

            e.preventDefault();
            area = this;
            opts = map_data.options;
            area_options = options_from_area(map_data, area);

            area_id = id_from_area(map_data, area);
            data = map_data.data[area_id];
            key = data.key;
            selected = data.selected;

            if (area_options.isSelectable &&
            (area_options.isDeselectable || !selected)) {
                selected = me.toggle_selection(map_data, area_id);
            }

            if (opts.boundList && opts.boundList.length > 0) {
                list_target = setBoundListProperties(map_data, key, selected);
            }


            if (opts.onClick && typeof (opts.onClick === 'function')) {
                opts.onClick.call(area,
                {
                    e: e,
                    target: area,
                    listTarget: list_target,
                    areaTarget: $(area),
                    areaOptions: options_from_area(map_data, area),
                    key: key,
                    selected: data.selected
                });
            }
        }
        // NOT IMPLEMENTED
        function list_click(map_data) {
            //

        }
        
        // PUBLIC FUNCTIONS

        // simulate a click event. This is like toggle, but causes events to run also.
        // NOT IMPLEMENTED
        me.click = function (key) {
            me.set(null, key, true);
        };

        me.get = function (key) {
            var i, map_data, result, area_id;
            this.each(function () {
                map_data = get_map_data(this, true);
                if (!map_data) {
                    return true; // continue
                }
                if (key) {
                    area_id = id_from_key(map_data, key);
                    result = map_data.data[area_id].selected;
                    return false; // break
                }

                result = '';
                u.each(map_data.data,function() {
                    if (this.selected) {
                        result += (result ? ',' : '') + this.key;
                    }
                });
                return false; // break
            });
            return result;
        };
        // Select or unselect areas identified by key -- a string, a csv string, or array of strings.
        // if set_bound is true, the bound list will also be updated. Default is true. If neither true nor false,
        // it will be toggled.

        me.set = function (selected, key, set_bound) {
            var lastParent, parent, map_data, key_list, area_id, do_set_bound, i;

            function setSelection(area_id) {
                switch(selected) {
                    case true:
                        me.add_selection(map_data, area_id); break;
                    case false:
                        me.remove_selection(map_data, area_id); break;
                    default:
                        me.toggle_selection(map_data, area_id); break;
                }
            }
            function queue_command(command, args) {
                map_data.commands.push(
                {
                    command: 'set', args: args
                });
            }

            do_set_bound = u.isTrueFalse(set_bound) ? set_bound : true;
            this.each(function () {
                map_data = get_map_data(this, true);
                if (!map_data) {
                    return true; // continue
                }
                key_list = '';
                if ($(this).is('img')) {
                    if (!map_data.complete) {
                        queue_command('set', [selected, key, set_bound]);
                        return true;
                    }
                    if (key instanceof Array) {
                        key_list = key.join(",");
                    }
                    else {
                        key_list = key;
                    }
                    // TODO this looks horribly inefficient
                    u.each(map_data.data,function(i) {
                        if ((key_list + ",").indexOf(this.key + ",") >= 0) {
                            area_id = i;
                            setSelection(area_id);
                        }
                    });
                } else {
                    parent = $(this).parent()[0];
                    // it is possible for areas from different mapsters to be passed, make sure we're on the right one.
                    if (lastParent && parent !== lastParent) {
                        map_data = get_map_data(this);
                        lastParent = parent;
                    }
                    lastParent = parent;
                    area_id = id_from_area(map_data, this);
                    key = map_data.data[area_id].key;

                    if (!map_data.complete) {
                        queue_command('set', [selected, key, do_set_bound]);
                        return true;
                    }
                    if ((key_list + ",").indexOf(key) < 0) {
                        key_list += (key_list === '' ? '' : ',') + key;
                    }

                    setSelection(area_id);

                }
                if (do_set_bound && map_data.options.boundList) {
                    setBoundListProperties(map_data, key_list, selected);
                }
            });
            return this;
        };
        me.close_tooltip = function () {
            clear_tooltip();
        };
        me.remove_selection = function (map_data, area_id) {
            var data = map_data.data[area_id];
            if (!data.selected) {
                return;
            }
           data.selected = false;
            clear_selections(map_data, area_id);
            refresh_selections(map_data);
            clear_highlight(map_data);
        };
        me.add_selection = function (map_data, area_id) {
            // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
            var i;
            if (map_data.options.singleSelect) {
                clear_selections(map_data);
                u.each(map_data.data,function() {
                    this.selected = false;
                });
            }

            set_area_selected(map_data, area_id);

            if (map_data.options.singleSelect) {
                refresh_selections(map_data);
            }
        };
        me.toggle_selection = function (map_data, area_id) {
            var selected;

            if (!map_data.data[area_id].selected) {
                me.add_selection(map_data, area_id);
                selected = true;
            }
            else {
                me.remove_selection(map_data, area_id);
                selected = false;
            }
            return selected;
        };

        me.unbind = function (preserveState) {
            var map_data;
            return this.each(function (e) {
                map_data = get_map_data(this, true);
                if (map_data) {
                    clear_events(map_data);
                    if (!preserveState) {
                        clear_map_data(map_data);
                        map_cache[map_data.index]=null;
                    }
                    else {
                        map_data.unbound = true;
                    }
                }
            });
        };
        // merge new area data into existing area options. used for rebinding.
        function merge_areas(map_data, areas) {
            var i, index,
                map_areas = map_data.options.areas;
            if (areas) {
                for (i = areas.length-1; i >=0; i--) {
                    index = u.arrayIndexOfProp(map_areas, "key", areas[i].key);
                    if (index >= 0) {
                        $.extend(map_areas[index], areas[i]);
                    }
                    else {
                        map_areas.push(areas[i]);
                    }
                }
            }
        }
        function merge_options(map_data, options) {
            u.mergeObjects({
                ignore: "areas",
                target: map_data.options, 
                source: options, 
                deep:"render_select,render_highlight"
            });

            merge_areas(map_data, options.areas);
            // refresh the area_option template
            u.mergeObjects({target: map_data.area_options, source: map_data.options, add: false});
        }

        // refresh options.
        me.rebind = function (options) {
            var map_data;
            this.filter('img').each(function () {
                map_data = get_map_data(this, true);
                if (map_data) {
                    merge_options(map_data, options);
                    // this will only update new areas that may have been passed
                    set_area_options(map_data, options.areas || {} );
                }
            });
            return this;
        };
        // set or get options. pass an object with options to set, nothing or false to get, or "true" to get effective options (versus passed options)
        me.options = function (options) {
            var opts,map_data,
            img = this.filter('img').first()[0];
            map_data = get_map_data(img, true);
            if (!map_data) {
                return;
            }
            if (u.isTrueFalse(options) || !options) {
                if (u.trueFalseDefault(options,false)) {
                    opts = map_data.options;
                    opts.render_select=u.mergeObjects({template: $.mapster.render_defaults, source:[opts,opts.render_select]});
                    opts.render_highlight=u.mergeObjects({template: $.mapster.render_defaults, source:[opts,opts.render_highlight]});                    
                    return opts;
                } else {
                    return map_data.options;
                }
            } else {
                merge_options(map_data, options);
                return this;
            }
        };
        me.bind = function (opts) {                   
            opts = u.mergeObjects({
                source: [$.mapster.defaults,opts],
                deep: "render_select,render_highlight"
            });

            if (!opts.mapKey) {
                opts.mapKey = 'mapster_id';
            }

            return this.each(function () {

                var last,lastProp,ren,img, wrap, area_options, map, canvas, context, overlay_canvas, usemap, map_data, i;

                // save ref to this image even if we can't access it yet. commands will be queued
                img = $(this);

                map_data = get_map_data(this, true);
                if (map_data && map_data.complete) {
                    me.unbind.call(img);
                    map_data=null;
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
                    map_data = {
                        unbound: false,
                        image: this,
                        alt_images: {},
                        complete: false,
                        commands: [],
                        data: [],
                        xref: {},
                        img_style:img.attr('style') || null,
                        bind_tries: opts.configTimeout/200
                    };
                    map_data.index = u.arrayReuse(map_cache,map_data);
                }
                
                
                if (has_canvas) {
                    last={};
                    u.each(["highlight","select"],function(i) {
                        var cur = opts["render_"+this].altImage || opts.altImage;
                        if (cur) {
                            if (cur!==last) {
                                last=cur;
                                lastProp=this;
                                if (!map_data.alt_images[this]) {
                                    map_data.alt_images[this]= {image: new Image()};
                                    map_data.alt_images[this].image.src = cur;               
                                }
                            } else {
                                map_data.alt_images[this]=map_data.alt_images[lastProp];
                            }
                        }
                    });
                }

                // If the image isn't fully loaded, this won't work right.  Try again later.                   
                if (!is_image_loaded(map_data)) {
                    if (--map_data.bind_tries>0) {
                        setTimeout(function () {
                            img.mapster(opts);
                        }, 200);
                    } else {
                        if (opts.onConfigured && typeof opts.onConfigured==='function') {
                            opts.onConfigured.call(this,false);
                        }
                    }
                    return true;
                }

                wrap = $('<div id="mapster_wrap_'+map_data.index+'"></div>').css(
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

                canvas = create_canvas(this);
                img.before(canvas);

                overlay_canvas=create_canvas(this);
                img.before(overlay_canvas);
                    
                if (has_canvas) {
                    last={};
                    u.each(map_data.alt_images,function() {
                        if (this.image !== last.image) {
                            last = this;
                            this.canvas = create_canvas_for(this.image);
                            $(this.canvas).css({ display: "none" }); 
                          // do not need to add this one to the DOM 
                            context = this.canvas.getContext("2d");
                            context.drawImage(this.image, 0, 0);
                        } else {
                            this.canvas = last.canvas;
                        }
                    });
                }


                
                $.extend(map_data,
                {
                    options: opts,
                    area_options: u.mergeObjects({
                        template:$.mapster.area_defaults,
                        source:opts
                    }),
                    map: map,
                    base_canvas: canvas,
                    overlay_canvas: overlay_canvas
                });
                

                initialize_map(map_data);
                // process queued commands
                if (!map_data.complete) {
                    map_data.complete = true;
                    for (i =  map_data.commands.length-1; i>=0; i--) {
                        methods[map_data.commands[i].command].apply($(this), map_data.commands[i].args);
                    }
                    map_data.commands = [];
                }
                if (opts.onConfigured && typeof opts.onConfigured==='function') {
                    opts.onConfigured.call(this,true);
                }
            });
        };


        me.init = function () {
            var context,style,shapes;

            has_canvas = $('<canvas></canvas>')[0].getContext;

            if (!(has_canvas || document.namespaces)) {
                $.fn.mapster = function () {
                    return this;
                };
                return;
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
            
            $(window).unload($.mapster.unload);
            if (has_canvas) {
                create_canvas_for = function (img, width, height) {
                    var c,$img;
                    if (img) {
                        $img=$(img);
                        height = img.height || $img.height();
                        width = img.width || $img.width();
                    }
                    c = $('<canvas></canvas>')[0];
                    c.width = width;
                    c.height = height;
                    c.getContext("2d").clearRect(0, 0, width, height);
                    return c;
                };
                add_shape_to = function (map_data, canvas, shape, coords, options) {
                    function render_shape(context, shape, coords) {
                        var i;
                        switch (shape) {
                            case 'rect':
                                context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
                                break;
                            case 'poly':
                                context.moveTo(coords[0], coords[1]);
                                for (i = 2; i < coords.length; i += 2) {
                                    context.lineTo(coords[i], coords[i + 1]);
                                }
                                break;
                            case 'circ':
                                context.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, false);
                                break;
                        }
                    }
                    function add_alt_image(canvas, context, shape, coords, options) {
                        context.save();
                        context.beginPath();
                        render_shape(context, shape, coords);
                        context.clip();
            
                        context.globalAlpha = options.altImageOpacity;
                        context.drawImage(canvas, 0, 0);
            
                        context.restore();
                    }
                    function css3color(color, opacity) {
                        function hex_to_decimal(hex) {
                            return Math.max(0, Math.min(parseInt(hex, 16), 255));
                        }
                        return 'rgba(' + hex_to_decimal(color.substr(0, 2)) + ',' + hex_to_decimal(color.substr(2, 2)) + ',' + hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
                    }
                    
                    var fill = options.fill,
                        stroke = options.stroke;

                    context = canvas.getContext('2d');
                    if (options.alt_image) {
                        add_alt_image(options.alt_image.canvas, context, shape, coords, options);
                    } else {
                        context.beginPath();
                        render_shape(context, shape, coords);
                        context.closePath();
                        if (fill) {
                            context.fillStyle = css3color(options.fillColor, options.fillOpacity);
                            context.fill();
                        }
                    }
                    if (stroke) {
                        context.strokeStyle = css3color(options.strokeColor, options.strokeOpacity);
                        context.lineWidth = options.strokeWidth;
                        context.stroke();
                    }
                    return canvas;
                };
                clear_highlight = function (map_data) {
                    map_data.overlay_canvas.getContext('2d').clearRect(0, 0, map_data.overlay_canvas.width, map_data.overlay_canvas.height);
                };
                clear_selections = function () {
                    return null;
                };
                // Draw all items from selected_list to a new canvas, then swap with the old one. This is used to delete items when using canvases. 
                refresh_selections = function (map_data) {
                    var i,list_temp=[], canvas_temp,data;
                    // draw new base canvas, then swap with the old one to avoid flickering
                    canvas_temp = map_data.base_canvas;
                    for (i=map_data.data.length-1;i>=0;i--) {
                        data = map_data.data[i];
                        if (data.selected) {
                            data.selected=false;
                            list_temp.push(i);
                        }
                    }
                    map_data.base_canvas = create_canvas(map_data.image);
                    $(map_data.base_canvas).hide();
                    $(map_data.image).before(map_data.base_canvas);
                    set_areas_selected(map_data, list_temp);

                    $(map_data.base_canvas).show();
                    $(canvas_temp).remove();
                };
            } else {
                // ie executes this code
                create_canvas_for = function (img) {
                    var $img = $(img),
                        width = $img.width(),
                        height=$img.height();
                    return $('<var width="' + width + '" height="' + height + '" style="zoom:1;overflow:hidden;display:block;width:' + width + 'px;height:' + height + 'px;"></var>')[0];
                };
                add_shape_to = function (map_data, canvas, shape, coords, options, name) {
                    var fill, stroke, opacity, e;
                    name = name ? 'name="'+name+'" ' : '';
                    fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" />';
                    stroke = (options.stroke ? 'strokeweight="' + options.strokeWidth + '" stroked="t" strokecolor="#' + options.strokeColor + '"' : 'stroked="f"');
                    opacity = '<v:stroke opacity="' + options.strokeOpacity + '"/>';
                    switch (shape) {
                        case 'rect':
                            e = $('<v:rect ' + name + ' filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + coords[0] + 'px;top:' + coords[1] + 'px;width:' + (coords[2] - coords[0]) + 'px;height:' + (coords[3] - coords[1]) + 'px;"></v:rect>')[0];
                            break;
                        case 'poly':
                            e = $('<v:shape ' + name + ' filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + canvas.width + ',' + canvas.height + '" path="m ' + coords[0] + ',' + coords[1] + ' l ' + coords.slice(2).join(',') + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + canvas.width + 'px;height:' + canvas.height + 'px;"></v:shape>')[0];
                            break;
                        case 'circ':
                            e = $('<v:oval ' + name + ' filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (coords[0] - coords[2]) + 'px;top:' + (coords[1] - coords[2]) + 'px;width:' + (coords[2] * 2) + 'px;height:' + (coords[2] * 2) + 'px;"></v:oval>')[0];
                            break;
                    }
                    e.innerHTML = fill + opacity;

                    $(canvas).append(e);
                    return e;
                };
                clear_highlight = function (map_data) {
                    $(map_data.overlay_canvas).children().remove();
                };
                clear_selections = function (map_data, area_id) {
                    if (area_id) {
                        $(map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
                    }
                    else {
                        $(map_data.base_canvas).children().remove();
                    }
                };
                refresh_selections = function () {
                    return null;
                };
            }
        };
        me.unload = function() {
            var i;
            for (i=map_cache.length-1;i>=0;i--) {
                if (map_cache[i]) {
                    me.unbind.call($(map_cache[i].image));
                }
            }    
        };
        return me;
    }
    ());

    // make sure closures are cleaned up
    $.mapster.unload = function() {
        $('*').unbind();
        $.mapster.impl.unload();
        $.mapster.utils.fader=null;
        $.mapster.impl=null;
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
        select: function () {
            $.mapster.impl.set.call(this, true);
        }
        ,
        deselect: function () {
            $.mapster.impl.set.call(this, false);
        }
        ,
        options: $.mapster.impl.options,
        test: $.mapster.impl.test
    };
    $.mapster.impl.init();
})(jQuery);
