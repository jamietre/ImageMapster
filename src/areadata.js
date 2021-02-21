/* areadata.js
   AreaData and MapArea protoypes
*/

(function ($) {
  'use strict';

  var m = $.mapster,
    u = m.utils;

  function optsAreEqual(opts1, opts2) {
    // deep compare is not trivial and current testing framework
    // doesn't provide a way to detect this accurately so only
    // implementing basic compare at this time.
    // TODO: Implement deep obj compare or for perf reasons shallow
    //       with a short-circuit if deep is required for full compare
    //       since config options should only require shallow
    return opts1 === opts2;
  }

  /**
   * Update selected state of this area
   *
   * @param {boolean} selected Determines whether areas are selected or deselected
   */
  function updateSelected(selected) {
    var me = this,
      prevSelected = me.selected;

    me.selected = selected;
    me.staticStateOverridden = u.isBool(me.effectiveOptions().staticState)
      ? true
      : false;

    return prevSelected !== selected;
  }

  /**
   * Select this area
   *
   * @param {AreaData} me  AreaData context
   * @param {object} options Options for rendering the selection
   */
  function select(options) {
    function buildOptions() {
      // map the altImageId if an altimage was passed
      return $.extend(me.effectiveRenderOptions('select'), options, {
        altImageId: o.images.add(options.altImage)
      });
    }

    var me = this,
      o = me.owner,
      hasOptions = !$.isEmptyObject(options),
      newOptsCache = hasOptions ? buildOptions() : null,
      // Per docs, options changed via set_options for an area that is
      // already selected will not be reflected until the next time
      // the area becomes selected.
      changeOptions = hasOptions
        ? !optsAreEqual(me.optsCache, newOptsCache)
        : false,
      selectedHasChanged = false,
      isDrawn = me.isSelectedOrStatic();

    // This won't clear staticState === true areas that have not been overridden via API set/select/deselect.
    // This could be optimized to only clear if we are the only one selected.  However, there are scenarios
    // that do not respect singleSelect (e.g. initialization) so we force clear if there should only be one.
    // TODO: Only clear if we aren't the only one selected (depends on #370)
    if (o.options.singleSelect) {
      o.clearSelections();
      // we may (staticState === true)  or may not still be visible
      isDrawn = me.isSelectedOrStatic();
    }

    if (changeOptions) {
      me.optsCache = newOptsCache;
    }

    // Update before we start drawing for methods
    // that rely on internal selected value.
    // Force update because area can be selected
    // at multiple levels (selected / area_options.selected / staticState / etc.)
    // and could have been cleared.
    selectedHasChanged = me.updateSelected(true);

    if (isDrawn && changeOptions) {
      // no way to remove just this area from canvas so must refresh everything

      // explicitly remove vml element since it uses removeSelections instead of refreshSelections
      // TODO: Not sure why removeSelections isn't incorporated in to refreshSelections
      //       need to investigate and possibly consolidate
      o.graphics.removeSelections(me.areaId);
      o.graphics.refreshSelections();
    } else if (!isDrawn) {
      me.drawSelection();
    }

    // don't fire until everything is done
    if (selectedHasChanged) {
      me.changeState('select', true);
    }
  }

  /**
   * Deselect this area, optionally deferring finalization so additional areas can be deselected
   * in a single operation
   *
   * @param  {boolean} partial when true, the caller must invoke "finishRemoveSelection" to render
   */

  function deselect(partial) {
    var me = this,
      selectedHasChanged = false;

    // update before we start drawing for methods
    // that rely on internal selected value
    // force update because area can be selected
    // at multiple levels (selected / area_options.selected / staticState / etc.)
    selectedHasChanged = me.updateSelected(false);

    // release information about last area options when deselecting.
    me.optsCache = null;
    me.owner.graphics.removeSelections(me.areaId);

    // Complete selection removal process. This is separated because it's very inefficient to perform the whole
    // process for multiple removals, as the canvas must be totally redrawn at the end of the process.ar.remove
    if (!partial) {
      me.owner.removeSelectionFinish();
    }

    // don't fire until everything is done
    if (selectedHasChanged) {
      me.changeState('select', false);
    }
  }

  /**
   * Toggle the selection state of this area
   * @param  {object} options Rendering options, if toggling on
   * @return {bool} The new selection state
   */
  function toggle(options) {
    var me = this;
    if (!me.isSelected()) {
      me.select(options);
    } else {
      me.deselect();
    }
    return me.isSelected();
  }

  function isNoHref(areaEl) {
    var $area = $(areaEl);
    return u.hasAttribute($area, 'nohref') || !u.hasAttribute($area, 'href');
  }

  /**
   * An AreaData object; represents a conceptual area that can be composed of
   * one or more MapArea objects
   *
   * @param {MapData} owner The MapData object to which this belongs
   * @param {string} key   The key for this area
   * @param {string} value The mapValue string for this area
   */

  m.AreaData = function (owner, key, value) {
    $.extend(this, {
      owner: owner,
      key: key || '',
      // means this represents the first key in a list of keys (it's the area group that gets highlighted on mouseover)
      isPrimary: true,
      areaId: -1,
      href: '',
      hrefTarget: null,
      value: value || '',
      options: {},
      // "null" means unchanged. Use "isSelected" method to just test true/false
      selected: null,
      // "true" means selected has been set via API AND staticState is true/false
      staticStateOverridden: false,
      // xref to MapArea objects
      areasXref: [],
      // (temporary storage) - the actual area moused over
      area: null,
      // the last options used to render this. Cache so when re-drawing after a remove, changes in options won't
      // break already selected things.
      optsCache: null
    });
  };

  /**
   * The public API for AreaData object
   */

  m.AreaData.prototype = {
    constuctor: m.AreaData,
    select: select,
    deselect: deselect,
    toggle: toggle,
    updateSelected: updateSelected,
    areas: function () {
      var i,
        result = [];
      for (i = 0; i < this.areasXref.length; i++) {
        result.push(this.owner.mapAreas[this.areasXref[i]]);
      }
      return result;
    },
    // return all coordinates for all areas
    coords: function (offset) {
      var coords = [];
      $.each(this.areas(), function (_, el) {
        coords = coords.concat(el.coords(offset));
      });
      return coords;
    },
    reset: function () {
      $.each(this.areas(), function (_, e) {
        e.reset();
      });
      this.areasXref = [];
      this.options = null;
    },
    // Return the effective selected state of an area, incorporating staticState
    isSelectedOrStatic: function () {
      var o = this.effectiveOptions();
      return !u.isBool(o.staticState) || this.staticStateOverridden
        ? this.isSelected()
        : o.staticState;
    },
    isSelected: function () {
      return u.isBool(this.selected)
        ? this.selected
        : u.isBool(this.owner.area_options.selected)
        ? this.owner.area_options.selected
        : false;
    },
    isSelectable: function () {
      return u.isBool(this.effectiveOptions().staticState)
        ? false
        : u.isBool(this.owner.options.staticState)
        ? false
        : u.boolOrDefault(this.effectiveOptions().isSelectable, true);
    },
    isDeselectable: function () {
      return u.isBool(this.effectiveOptions().staticState)
        ? false
        : u.isBool(this.owner.options.staticState)
        ? false
        : u.boolOrDefault(this.effectiveOptions().isDeselectable, true);
    },
    isNotRendered: function () {
      return isNoHref(this.area) || this.effectiveOptions().isMask;
    },
    /**
     * Return the overall options effective for this area.
     * This should get the default options, and merge in area-specific options, finally
     * overlaying options passed by parameter
     *
     * @param  {[type]} options  options which will supercede all other options for this area
     * @return {[type]}          the combined options
     */

    effectiveOptions: function (options) {
      var opts = u.updateProps(
        {},
        this.owner.area_options,
        this.options,
        options || {},
        {
          id: this.areaId
        }
      );

      opts.selected = this.isSelected();

      return opts;
    },

    /**
     * Return the options effective for this area for a "render" or "highlight" mode.
     * This should get the default options, merge in the areas-specific options,
     * and then the mode-specific options.
     * @param  {string} mode    'render' or 'highlight'
     * @param  {[type]} options  options which will supercede all other options for this area
     * @return {[type]}          the combined options
     */

    effectiveRenderOptions: function (mode, options) {
      var allOpts,
        opts = this.optsCache;

      if (!opts || mode === 'highlight') {
        allOpts = this.effectiveOptions(options);
        opts = u.updateProps({}, allOpts, allOpts['render_' + mode]);

        if (mode !== 'highlight') {
          this.optsCache = opts;
        }
      }
      return $.extend({}, opts);
    },

    // Fire callback on area state change
    changeState: function (state_type, state) {
      if (u.isFunction(this.owner.options.onStateChange)) {
        this.owner.options.onStateChange.call(this.owner.image, {
          key: this.key,
          state: state_type,
          selected: state
        });
      }
      if (state_type === 'select' && this.owner.options.boundList) {
        this.owner.setBoundListProperties(
          this.owner.options,
          m.getBoundList(this.owner.options, this.key),
          state
        );
      }
    },

    // highlight this area

    highlight: function (options) {
      var o = this.owner;
      o.ensureNoHighlight();
      if (this.effectiveOptions().highlight) {
        o.graphics.addShapeGroup(this, 'highlight', options);
      }
      o.setHighlightId(this.areaId);
      this.changeState('highlight', true);
    },

    // select this area. if "callEvent" is true then the state change event will be called. (This method can be used
    // during config operations, in which case no event is indicated)

    drawSelection: function () {
      this.owner.graphics.addShapeGroup(this, 'select');
    }
  };
  // represents an HTML area
  m.MapArea = function (owner, areaEl, keys) {
    if (!owner) {
      return;
    }
    var me = this;
    me.owner = owner; // a MapData object
    me.area = areaEl;
    me.areaDataXref = []; // a list of map_data.data[] id's for each areaData object containing this
    me.originalCoords = [];
    $.each(u.split(areaEl.coords), function (_, el) {
      me.originalCoords.push(parseFloat(el));
    });
    me.length = me.originalCoords.length;
    me.shape = u.getShape(areaEl);
    me.nohref = isNoHref(areaEl);
    me.configure(keys);
  };
  m.MapArea.prototype = {
    constructor: m.MapArea,
    configure: function (keys) {
      this.keys = u.split(keys);
    },
    reset: function () {
      this.area = null;
    },
    coords: function (offset) {
      return $.map(this.originalCoords, function (e) {
        return offset ? e : e + offset;
      });
    }
  };
})(jQuery);
