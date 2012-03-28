/* areadata.js
   AreaData and MapArea protoypes
*/

(function ($) {
    var p, m = $.mapster, u = m.utils;
    m.AreaData = function (owner, key, value) {
        $.extend(this,{
            owner: owner, 
            key: key || '',
            // means this represents the first key in a list of keys (it's the area group that gets highlighted on mouseover)
            isPrimary: true,
            areaId: -1,
            href: '',
            value: value || '',
            options:{},
            // "null" means unchanged. Use "isSelected" method to just test true/false 
            selected: null,       
            // xref to MapArea objects
            areasXref: [],
            // (temporary storage) - the actual area moused over
            area: null,
            // the last options used to render this. Cache so when re-drawing after a remove, changes in options won't
            // break already selected things. 
            optsCache: null
         });
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
    p.coords = function(offset) {
        var coords = [];
        $.each(this.areas(), function (i, el) {
            coords = coords.concat(el.coords(offset));
        });
        return coords;
    };
    p.reset = function () {
        $.each(this.areas(), function (i, e) {
            e.reset();
        });
        this.areasXref = [];
        this.options = null;
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
                    (u.isBool(this.owner.options.staticState) ? false : u.boolOrDefault(this.effectiveOptions().isSelectable,true));
    };
    p.isDeselectable = function () {
        return u.isBool(this.effectiveOptions().staticState) ? false :
                    (u.isBool(this.owner.options.staticState) ? false : u.boolOrDefault(this.effectiveOptions().isDeselectable,true));
    };
    p.isNotRendered = function() {
        var area = $(this.area);
        return area.attr('nohref') ||
            !area.attr('href') ||
            this.effectiveOptions().isMask;

    };

    
    p.effectiveOptions = function (override_options) {
        //TODO this isSelectable should cascade already this seems redundant
        var opts = u.updateProps({},
                this.owner.area_options,
                this.options,
                override_options || {},
                {id: this.areaId }
            );
        opts.selected = this.isSelected();
        return opts;
    };
    // Return the options effective for this area for a "render" or "highlight" mode. This should get the default options,
    // merge in the areas-specific options, and then the mode-specific options.
    
    p.effectiveRenderOptions = function (mode, override_options) {
        var allOpts,opts=this.optsCache;
        
        if (!opts || mode==='highlight') {
            allOpts = this.effectiveOptions(override_options);
            opts = u.updateProps({},
                allOpts,
                allOpts["render_" + mode],
                { 
                    alt_image: this.owner.altImage(mode) 
                });
            if (mode!=='highlight') {
                this.optsCache=opts;
            }
        }
        return $.extend({},opts);
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
    p.highlight = function (options) {
        var o = this.owner;
        if (this.effectiveOptions().highlight) {
            o.graphics.addShapeGroup(this, "highlight",options);
        }
        o.setHighlightId(this.areaId);
        this.changeState('highlight', true);
    };
    // select this area. if "callEvent" is true then the state change event will be called. (This method can be used
    // during config operations, in which case no event is indicated)
    p.drawSelection = function () {
        this.owner.graphics.addShapeGroup(this, "select");
    };
    p.addSelection = function (options) {
        // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
        var o = this.owner;
        if (o.options.singleSelect) {
            o.clearSelections();
        }

        // because areas can overlap - we can't depend on the selection state to tell us anything about the inner areas.
        // don't check if it's already selected
        if (!this.isSelected()) {
            if (options) {
                this.optsCache = $.extend(this.effectiveRenderOptions('select'),options);
            }
            this.drawSelection();
            if (options) {
                this.optsCache=null;
            }
            this.selected = true;
            this.changeState('select', true);
        }

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
        // release information about last area options when deselecting.
        this.optsCache=null;
        this.owner.graphics.removeSelections(this.areaId);

        // Complete selection removal process. This is separated because it's very inefficient to perform the whole
        // process for multiple removals, as the canvas must be totally redrawn at the end of the process.ar.remove
        if (!partial) {
            this.owner.removeSelectionFinish();
        }
    };


    p.toggleSelection = function (options) {
        if (!this.isSelected()) {
            this.addSelection(options);
        }
        else {
            this.removeSelection();
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
        me.configure(keys);
    };
    m.MapArea.prototype.configure=function(keys) {
        this.keys = u.split(keys);
    };
    m.MapArea.prototype.reset = function() {
        this.area=null;
    };
    m.MapArea.prototype.coords = function (offset) {
        return $.map(this.originalCoords,function(e) {
            return offset ? e : e+offset;
        });
    };
    // Get effective options for a specific area. Because areas can be part of multiple groups, this is problematic
    // and I have not found a perfect solution yet. When highlighting an area by mouseover, the options should reflect
    // the primary group. When highlighting by association, they should reflect the other area's primary group. Right
    // now this function has no knowledge of context though, so attempting to define different sets of options for 
    // areas depending on group context will not work as expected.
    
    // At this point this function is not used. I am leaving it here until we possibly have a better answer.
    
//     m.MapArea.prototype.effectiveRenderOptions_obsolete = function(mode,keys) {
//         var i,ad,me=this,m=me.owner,opts;
//        
//         if (!me.lastOpts) {
//            opts=u.updateProps({},m.area_options);
// 
//            for (i=this.keys.length-1;i>=0;i--) {
//                ad = m.getDataForKey(this.keys[i]);
//                u.updateProps(opts,
//                               ad.effectiveRenderOptions(mode),
//                               ad.options["render_" + mode],
//                    { alt_image: this.owner.altImage(mode) });
//            }
//
//           me.lastOpts=opts;
//        }
//        return me.lastOpts;
//    };

} (jQuery));
