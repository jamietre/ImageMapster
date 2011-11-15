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

                ar.highlight(!me.options.highlight);

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
            u.setOpacity(me.images[1]);

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
