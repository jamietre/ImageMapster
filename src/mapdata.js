/* mapdata.js
   the MapData object, repesents an instance of a single bound imagemap
*/

(function ($) {

    var p, m = $.mapster, u = m.utils;
    m.MapData = function (image, options) {
        var me = this;

        function queueMouseEvent(delay,area,callback) {
            //var eventId = "id"+area.areaId;
            function cbFinal(areaId) {
                if (me.currentAreaId!==areaId && me.highlightId>=0) {
                    callback();
                }
            }
            if (me.activeAreaEvent) {
                window.clearTimeout(me.activeAreaEvent);
                me.activeAreaEvent=0;
            }
            if (delay<0) {
                return;
            }

            if (area.owner.currentAction || delay) {
                me.activeAreaEvent = window.setTimeout((function() {
                            return function() {
                            queueMouseEvent(0,area,callback);
                        };
                    }(area)),
                    delay || 100);
            } else {
                 cbFinal(area.areaId);
            }
        }


   
        this.image = image;              // (Image)  main map image

        // save the initial style of the image for unbinding. This is problematic, chrome duplicates styles when assigning, and
        // cssText is apparently not universally supported. Need to do something more robust to make unbinding work universally.
        this.imgCssText = image.style.cssText || null;

        this.initializeDefaults();
        this.configureOptions(options);

        /**
         * Mousedown event. This is captured only to prevent browser from drawing an outline around an
         * area when it's clicked.
         * 
         * @param  {EventData} e jQuery event data
         */
        this.mousedown = function (e) {
            if (!$.mapster.hasCanvas) {
                this.blur();
            }
            e.preventDefault();
        };

        /**
         * Mouseover event. Handle highlight rendering and client callback on mouseover
         * 
         * @param  {EventData} e jQuery event data
         * @return {[type]}   [description]
         */
        
        this.mouseover = function (e) {
            var arData = me.getAllDataForArea(this),
                ar=arData.length ? arData[0] : null;

            // mouseover events are ignored entirely while resizing, though we do care about mouseout events
            // and must queue the action to keep things clean.

            if (!ar || ar.isNotRendered() || ar.owner.currentAction) {
                return;
            }

            if (me.currentAreaId === ar.areaId) {
                return;
            }
            if (me.highlightId !== ar.areaId) {
                me.clearEffects();

                ar.highlight();

                if (me.options.showToolTip) {
                    $.each(arData,function(i,e) {
                        if (e.effectiveOptions().toolTip) {
                            e.showTooltip();
                        }
                    });
                }
            }
            me.currentAreaId = ar.areaId;

            if ($.isFunction(me.options.onMouseover)) {
                me.options.onMouseover.call(this,
                {
                    e: e,
                    options:ar.effectiveOptions(),
                    key: ar.key,
                    selected: ar.isSelected()
                });
            }

        };

        this.mouseout = function (e) {
            var newArea,ar = me.getDataForArea(this),
                    opts = me.options;


            if (me.currentAreaId<0 || !ar) {
                return;
            }

            newArea=me.getDataForArea(e.relatedTarget);
            if (newArea === ar) {
                return;
            }
            //me.legacyAreaId = me.currentAreaId;

            me.currentAreaId = -1;
            ar.area=null;

            queueMouseEvent(opts.mouseoutDelay,ar,me.clearEffects);

            if ($.isFunction(opts.onMouseout)) {
                opts.onMouseout.call(this,
                {
                    e: e,
                    options: opts,
                    key: ar.key,
                    selected: ar.isSelected()
                });
            }

        };

        this.clearEffects = function () {
            var opts = me.options;

            //me.legacyAreaId=-1;
            me.ensureNoHighlight();

            if (opts.toolTipClose && $.inArray('area-mouseout', opts.toolTipClose) >= 0 && me.activeToolTip) {
                me.clearTooltip();
            }
        };
        this.click = function (e) {
            var selected, list, list_target, newSelectionState, canChangeState, cbResult, target,
                    that = this,
                    ar = me.getDataForArea(this),
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
                    cbResult= opts.onClick.call(that,
                    {
                        e: e,
                        listTarget: list_target,
                        key: ar.key,
                        selected: newSelectionState
                    });
                    if (u.isBool(cbResult)) {
                        if (!cbResult) {
                            return false;
                        }
                        target = $(ar.area).attr('href');
                        if (target!=='#') {
                            window.location.href=target;
                            return false;
                        }
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

            me.mousedown.call(this,e);
            if (opts.clickNavigate && ar.href) {
                window.location.href=ar.href;
                return;
            }

            if (ar && !ar.owner.currentAction) {
                opts = me.options;
                clickArea(ar);
            }

        };
        this.graphics = new m.Graphics(this);

    };
    p = m.MapData.prototype;

    p.configureOptions=function(options) {
        // this is done here instead of the consturc
        this.area_options = u.updateProps({}, // default options for any MapArea
            m.area_defaults,
            options);
        this.options= u.updateProps({}, m.defaults, options);
        this.bindTries = this.options.configTimeout / 200;
    };
    p.initializeDefaults = function () {
        $.extend(this,{
            images: [],               // (Image)  all images associated with this map. this will include a "copy" of the main one
            imageSources: [],         // (string) src for each image
            imageStatus: [],          // (bool)   the loaded status of each indexed image in images
            altImagesXref: {},        // (int)    xref of "render_xxx" to this.images
            map: null,                // ($)      the image map
            base_canvas: null,       // (canvas|var)  where selections are rendered
            overlay_canvas: null,    // (canvas|var)  where highlights are rendered
            imagesLoaded: false,     // (bool)    when all images have finished loading (config can proceed)
            complete: false,         // (bool)    when configuration is complete
            commands: [],            // {}        commands that were run before configuration was completed (b/c images weren't loaded)
            data: [],                // MapData[] area groups
            mapAreas: [],            // MapArea[] list. AreaData entities contain refs to this array, so options are stored with each.
            _xref: {},               // (int)      xref of mapKeys to data[]
            highlightId: -1,        // (int)      the currently highlighted element.
            currentAreaId: -1,
            _tooltip_events: [],     // {}         info on events we bound to a tooltip container, so we can properly unbind them
            scaleInfo: null,         // {}         info about the image size, scaling, defaults
            index: -1,                 // index of this in map_cache - so we have an ID to use for wraper div
            activeAreaEvent: null
        });
    };

    p.isActive = function() {
        return !this.complete || this.currentAction;
    };
    p.state = function () {
        return {
            complete: this.complete,
            resizing: this.currentAction==='resizing',
            zoomed: this.zoomed,
            zoomedArea: this.zoomedArea,
            scaleInfo: this.scaleInfo
        };
    };
    p.isReadyToBind = function () {
        return this.imagesLoaded && (!this.options.safeLoad || m.windowLoaded);
    };
    // bind a new image to a src, capturing load event. Return the new (or existing) image.
    p.addImage = function (img, src, altId) {
        var image, source, me = this,
        getImageIndex=function(img) {
            return $.inArray(img, me.images);
        },

        // fires on image onLoad evens, could mean everything is ready
        load=function() {
            var index = getImageIndex(this);
            if (index>=0) {

                me.imageStatus[index] = true;
                if ($.inArray(false, me.imageStatus) < 0 &&
                            (!me.options.safeLoad || m.windowLoaded)) {
                    me.initialize();
                }
            }
        },
        storeImage=function(image) {
            var index = me.images.push(image) - 1;
            me.imageSources[index] = source;
            me.imageStatus[index] = false;
            if (altId) {
                me.altImagesXref[altId] = index;
            }
        };

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
            $(image).bind('onload',load).bind('onerror',function(e) {
                me.imageLoadError.call(me,e);
            });
            $(image).attr('src', source);

        } else {
            storeImage(image);
        }

    };
    // Checks status & updates if it's loaded
    p.isImageLoaded= function (index) {
        var status,img,me=this;
        if (me.imageStatus[index]) { return true; }
        img = me.images[index];
        
        if (typeof img.complete !== 'undefined') {
            status=img.complete;
        } else {
            status=!!u.imgWidth(img);
        }
        // if complete passes, the image is loaded, but may STILL not be available because of stuff like adblock.
        // make sure it is.

        me.imageStatus[index]=status;
        return status;
    };
    // Wait until all images are loaded then call initialize. This is difficult because browsers are incosistent about
    // how or if "onload" works and in how one can actually detect if an image is already loaded. Try to check first,
    // then bind onload event, and finally use a timer to keep checking.
    
    // the "first" parameter means this was the first time it was called

    p.bindImages = function (first,callback) {
        var i,
            me = this,
            loaded=true,
            opts=me.options,
            retry=function() {
                me.bindImages.call(me,false,callback);
            };
            

        if (first) {
            me.complete=false;
            me.triesLeft = me.bindTries;
            me.imagesLoaded=false;
            // reset the images if this is a rebind
            if (me.images.length>2) {
                me.images=me.images.slice(0,2);
                me.imageSources=me.imageSources.slice(0,2);
                me.imageStatus=me.imageStatus.slice(0,2);
                me.altImagesXref={};
            }
            me.altImagesXref={};
            if (me.images.length===0) {
                // add the actual main image
                me.addImage(me.image);
                // will create a duplicate of the main image, we need this to get raw size info
                me.addImage(null,me.image.src);
            }
            // add alt images
            if ($.mapster.hasCanvas) {
                me.addImage(null, opts.render_highlight.altImage || opts.altImage, "highlight");
                me.addImage(null, opts.render_select.altImage || opts.altImage, "select");
            }
        }

        if (me.imagesLoaded) {
            return;
        }

        // check to see if every image has already been loaded
        i=me.images.length;
        while (i-->0) {
            if (!me.isImageLoaded(i)) {
                loaded=false;
                break;
            }
        }
        me.imagesLoaded=loaded;

        if (me.isReadyToBind()) {
            if (callback) {
                callback();
            } else {
                me.initialize();
            }
        } else {
            // to account for failure of onLoad to fire in rare situations
            if (me.triesLeft-- > 0) {
                me.imgTimeout=window.setTimeout(retry, 200);
            } else {
                me.imageLoadError.call(me);
            }
        }
    };
    p.imageLoadError=function(e) {
        clearTimeout(this.imgTimeout);
        this.triesLeft=0;
        var err = e ? 'The image ' + e.target.src + ' failed to load.' : 
        'The images never seemed to finish loading. You may just need to increase the configTimeout if images could take a long time to load.';
        throw err;
    };
    p.altImage = function (mode) {
        return this.images[this.altImagesXref[mode]];
    };
    p.wrapId = function () {
        return 'mapster_wrap_' + this.index;
    };
    p._idFromKey = function (key) {
        return typeof key === "string" && this._xref.hasOwnProperty(key) ?
                    this._xref[key] : -1;
    };
    // getting all selected keys - return comma-separated string
    p.getSelected = function () {
        var result = '';
        $.each(this.data, function (i,e) {
            if (e.isSelected()) {
                result += (result ? ',' : '') + this.key;
            }
        });
        return result;
    };
    // Locate MapArea data from an HTML area. atMost limits it to x keys.
    // Usually you would be using 1 to just get the primary key areas
    p.getAllDataForArea = function (area,atMost) {
        var i,ar, result,
            me=this,
            key = $(area).filter('area').attr(me.options.mapKey);

        if (key) {
            result=[];
            key = u.split(key);

            for (i=0;i<(atMost || key.length);i++) {
                ar = me.data[me._idFromKey(key[i])];
                ar.area=area.length ? area[0]:area;
                // set the actual area moused over/selected
                // TODO: this is a brittle model for capturing which specific area - if this method was not used,
                // ar.area could have old data. fix this.
                result.push(ar);
            }
        }

        return result;
    };
    p.getDataForArea = function(area) {
        var ar=this.getAllDataForArea(area,1);
        return ar ? ar[0] || null : null;
    };
    p.getDataForKey = function (key) {
        return this.data[this._idFromKey(key)];
    };
    // Return the primary keys associated with an area group. If this is a primary key, it will be returned.
    p.getKeysForGroup = function(key) {
        var ar=this.getDataForKey(key);
        
        return !ar ? '':
            ar.isPrimary ? 
                ar.key :
                this.getPrimaryKeysForMapAreas(ar.areas()).join(',');
    };
    // given an array of MapArea object, return an array of its unique primary  keys
    p.getPrimaryKeysForMapAreas=function(areas)
    {
        var keys=[];
        $.each(areas,function(i,e) {
            if ($.inArray(e.keys[0],keys)<0) {
                keys.push(e.keys[0]);
            }
        });
        return keys;
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
        if (this.highlightId >= 0) {
            this.graphics.clearHighlight();
            ar = this.data[this.highlightId];
            ar.changeState('highlight', false);
            this.setHighlightId(-1);
        }
    };
    p.setHighlightId = function(id) {
        this.highlightId = id;
    };
    p.clearSelections = function () {
        //this.graphics.removeSelections();
        $.each(this.data, function (i,e) {
            if (e.selected) {
                e.removeSelection(true);
             }
        });
        this.removeSelectionFinish();
        
    };

    // rebind based on new area options. This copies info from array "areas" into the data[area_id].area_options property.
    // it returns a list of all selected areas.
    
    /**
     * Set area options from an array of option data.
     * 
     * @param {object[]} areas An array of objects containing area-specific options
     */
    
    p.setAreaOptions = function (areas) {
        var i, area_options, ar;
        areas = areas || [];

        // refer by: map_data.options[map_data.data[x].area_option_id]
        
        for (i = areas.length - 1; i >= 0; i--) {
            area_options = areas[i];
            if (area_options) {
                ar = this.getDataForKey(area_options.key);
                if (ar) {
                    u.updateProps(ar.options, area_options);
                    
                    // TODO: will not deselect areas that were previously selected, so this only works
                    // for an initial bind.
                    
                    if (u.isBool(area_options.selected)) {
                        ar.selected = area_options.selected;
                    }
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
        var imgCopy, base_canvas, overlay_canvas, wrap, parentId, css, i,size,
            img,sort_func, sorted_list,  scale,  
                    me = this,
                    opts = me.options;

        if (me.complete) {
            return;
        }

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
                    wrap.addClass(img[0].className);
                }
                else {
                    wrap.addClass(opts.wrapClass);
                }
            }
        }
        me.wrapper = wrap;
        
        // me.images[1] is the copy of the original image. It should be loaded & at its native size now so we can obtain the true
        // width & height. This is needed to scale the imagemap if not being shown at its native size. It is also needed purely
        // to finish binding in case the original image was not visible. It can be impossible in some browsers to obtain the
        // native size of a hidden image.

        me.scaleInfo = scale = u.scaleMap(me.images[0],me.images[1], opts.scaleMap);
        
        base_canvas = me.graphics.createVisibleCanvas(me);
        overlay_canvas = me.graphics.createVisibleCanvas(me);

        me.base_canvas = base_canvas;
        me.overlay_canvas = overlay_canvas;

        // Now we got what we needed from the copy -clone from the original image again to make sure any other attributes are copied
        imgCopy = $(me.images[1])
            .addClass('mapster_el')
            .addClass(me.images[0].className)
            .attr({id:null, usemap: null});
            
        size=u.size(me.images[0]);
        if (size.complete) {
            imgCopy.css({
                width: size.width,
                height: size.height
            });
        }
 
        me.buildDataset();

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

        $(me.images.slice(2)).hide();
        for (i = 1; i < me.images.length; i++) {
            wrap.append(me.images[i]);
        }

        //me.images[1].style.cssText = me.image.style.cssText;

        wrap.append(base_canvas)
                    .append(overlay_canvas)
                    .append(img.css(m.canvas_style));

        // images[0] is the original image with map, images[1] is the copy/background that is visible

        u.setOpacity(me.images[0], 0);
        $(me.images[1]).show();

        u.setOpacity(me.images[1],1);

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
        
        me.complete=true;
        me.processCommandQueue();
        
        if (opts.onConfigured && typeof opts.onConfigured === 'function') {
            opts.onConfigured.call(img, true);
        }
    };

    // when rebind is true, the MapArea data will not be rebuilt.
    p.buildDataset=function(rebind) {
        var sel,areas,j,area_id,$area,area,curKey,mapArea,key,keys,mapAreaId,group_value,dataItem,href,
            me=this,
            opts=me.options,
            default_group;

        function addAreaData(key, value) {
            var dataItem = new m.AreaData(me, key, value);
            dataItem.areaId = me._xref[key] = me.data.push(dataItem) - 1;
            return dataItem.areaId;
        }

        me._xref = {};
        me.data = [];
        if (!rebind) {
            me.mapAreas=[];
        }

        default_group = !opts.mapKey;
        if (default_group) {
            opts.mapKey = 'data-mapster-key';
        }
        sel = ($.browser.msie && $.browser.version <= 7) ? 'area' :
                    (default_group ? 'area[coords]' : 'area[' + opts.mapKey + ']');
        areas = $(me.map).find(sel).unbind('.mapster');
                    
        for (mapAreaId = 0;mapAreaId<areas.length; mapAreaId++) {
            area_id = 0;
            area = areas[mapAreaId];
            $area = $(area);

            // skip areas with no coords - selector broken for older ie
            if (!area.coords) {
                continue;
            }
            // Create a key if none was assigned by the user

            if (default_group) {
                 curKey=String(mapAreaId);
                $area.attr('data-mapster-key', curKey);
               
            } else {
                curKey = area.getAttribute(opts.mapKey);
            }

            // conditions for which the area will be bound to mouse events
            // only bind to areas that don't have nohref. ie 6&7 cannot detect the presence of nohref, so we have to also not bind if href is missing.

            if (rebind) {
                mapArea = me.mapAreas[$area.data('mapster')-1];
                mapArea.configure(curKey);
            } else {
                mapArea = new m.MapArea(me, area,curKey);
                me.mapAreas.push(mapArea);
            }

            keys = mapArea.keys; // converted to an array by mapArea


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
                        dataItem.isPrimary=j===0;
                    }
                }
                mapArea.areaDataXref.push(area_id);
                dataItem.areasXref.push(mapAreaId);
            }

            href=$area.attr('href');
            if (href && href!=='#' && !dataItem.href)
            {
                dataItem.href=href;
            }

            if (!mapArea.nohref) {
                $area.bind('mouseover.mapster', me.mouseover)
                    .bind('mouseout.mapster', me.mouseout)
                    .bind('click.mapster', me.click)
                    .bind('mousedown.mapster', me.mousedown);
            }

            // store an ID with each area. 
            $area.data("mapster", mapAreaId+1);
        }

       
        // TODO listenToList
        //            if (opts.listenToList && opts.nitG) {
        //                opts.nitG.bind('click.mapster', event_hooks[map_data.hooks_index].listclick_hook);
        //            }

        // populate areas from config options
        me.setAreaOptions(opts.areas);
        me.redrawSelections();

    };
    p.processCommandQueue=function() {
        
        var cur,me=this;
        while (!me.currentAction && me.commands.length) {
            cur = me.commands[0];
            me.commands.splice(0,1);
            m.impl[cur.command].apply(cur.that, cur.args);
        }
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
            e.reset();
        });
        this.data = null;
        if (!preserveState) {
            // get rid of everything except the original image
            this.image.style.cssText = this.imgCssText;
            $(this.wrapper).before(this.image).remove();

        }
        // release refs

        $.each(this.images, function (i,e) {
            if (me.images[i] !== e.image) {
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
