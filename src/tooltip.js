/* tooltip.js - tooltip functionality
   requires areacorners.js
*/

(function ($) {

    var m = $.mapster, u = m.utils;
    
    $.extend(m.defaults, {
        toolTipContainer: '<div style="border: 2px solid black; background: #EEEEEE; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
        '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; ' +
        'border-radius: 6px 6px 6px 6px;"></div>',
        showToolTip: false,
        toolTipFade: true,
        toolTipClose: ['area-mouseout','image-mouseout'],
        onShowToolTip: null,
        onCreateTooltip: null
    });
    
    $.extend(m.area_defaults, {
        toolTip: null
    });
    

    /**
     * Show a tooltip positioned near this area.
     * 
     * @param {string|jquery} html A string of html or a jQuery object containing the tooltip content.
     * @param {string|jquery} [template] The html template in which to wrap the content
     * @param {string|object} [css] CSS to apply to the outermost element of the tooltip 
     * @return {jquery} The tooltip that was created
     */
    
    function createToolTip(html, template, css) {
        var tooltip;

        // wrap the template in a jQuery object, or clone the template if it's already one.
        // This assumes that anything other than a string is a jQuery object; if it's not jQuery will
        // probably throw an error.
        
        if (template) {
            tooltip = typeof template === 'string' ?
                $(template) : 
                $(template).clone();

            tooltip.append(html);
        } else {
            tooltip=$(html);
        }

        // always set display to block, or the positioning css won't work if the end user happened to
        // use a non-block type element.

        tooltip.css($.extend((css || {}),{
                display:"block",
                position:"absolute"
            })).hide();
        
        $('body').append(tooltip);

        // we must actually add the tooltip to the DOM and "show" it in order to figure out how much space it
        // consumes, and then reposition it with that knowledge.
        
        u.setOpacity(tooltip[0], 0);
        
        // doesn't really show it because opacity=0
        
        return tooltip.show();
    }


    /**
     * Show a tooltip positioned near this area.
     * 
     * @param {jquery} tooltip The tooltip
     * @param {object} [options] options for displaying the tooltip.
     *  @config {int} [left] The 0-based absolute x position for the tooltip
     *  @config {int} [top] The 0-based absolute y position for the tooltip
     *  @config {string|object} [css] CSS to apply to the outermost element of the tooltip 
     *  @config {bool} [fadeDuration] When non-zero, the duration in milliseconds of a fade-in effect for the tooltip.
     */
    
    function showToolTipImpl(tooltip,options)
    {
        var tooltipCss = { 
                "left":  options.left + "px",
                "top": options.top + "px"
            },  
            zindex = tooltip.css("z-index");
        
        if (parseInt(zindex,10)===0 
            || zindex === "auto") {
            tooltipCss["z-index"] = 9999;
        }

        tooltip.css(tooltipCss)
            .addClass('mapster_tooltip');

        
        if (options.fadeDuration && options.fadeDuration>0) {
            u.fader(tooltip[0], 0, 1, options.fadeDuration);
        } else {
            u.setOpacity(tooltip[0], 1);
        }
    }

    /**
     * Hide and remove active tooltips
     * 
     * @param  {MapData} this The mapdata object to which the tooltips belong
     */
    
    function clearToolTip() {
        
        if (this) {
            if (this.activeToolTip) {
                this.activeToolTip.stop().remove();
                this.activeToolTip = null;
                this.activeToolTipID = -1;
            }
            $.each(this._tooltip_events, function (i,e) {
                e.object.unbind(e.event);
            });
        } else {
            $('.mapster_tooltip').stop().remove();
        }

    }

      
    /**
     * Hide and remove active tooltips
     * 
     * @param  {MapData} this The mapdata object to which the tooltips belong
     */
    
    m.MapData.prototype.clearToolTip = clearToolTip;

    /**
     * Configure the binding between a named tooltip closing option, and a mouse event.
     *
     * If a callback is passed, it will be called when the activating event occurs, and the tooltip will
     * only closed if it returns true.
     *
     * @param  {MapData}  [this]     The MapData object to which this tooltip belongs.
     * @param  {String}   option     The name of the tooltip closing option
     * @param  {String}   event      UI event to bind to this option
     * @param  {Element}  target     The DOM element that is the target of the event
     * @param  {Function} [callback] Callback after the tooltip is closed
     */
    m.MapData.prototype.bindToolTipClose = function(options, bindOption, event, target, callback) {
        var event_name = event + '.mapster-tooltip',
            me=this;
        
        if ($.inArray(bindOption, options) >= 0) {
            target.unbind(event_name)
                .bind(event_name, function (e) {
                    if (!callback || callback.call(this,e)) {
                        clearToolTip.call(me);
                    }
                });
            this._tooltip_events.push(
            {
                object: target, 
                event: event_name,
                callback: callback
            });
        }
    };
    
    /**
     * Show a tooltip positioned near this area.
     * 
     * @param {string|jquery}   [content]       A string of html or a jQuery object containing the tooltip content.
     * @param {object|string|jQuery} [options]  options to apply when creating this tooltip - OR -
     *                                          The markup, or a jquery object, containing the data for the tooltip 
     *                                         
     *  @config {bool}          [template]      a template to use instead of the default. If this property exists and is null,
     *                                          then no template will be used.
     *  @config {string}        [closeEvents]   A string with one or more comma-separated values that determine when the tooltip
     *                                          closes: 'area-click','tooltip-click','image-mouseout' are valid values
     *                                          then no template will be used.
     *  @config {int}           [left]          The 0-based absolute x position for the tooltip
     *  @config {int}           [top]           The 0-based absolute y position for the tooltip                                    
     *  @config {int}           [offsetx]       the horizontal amount to offset the tooltip 
     *  @config {int}           [offsety]       the vertical amount to offset the tooltip 
     *  @config {string|object} [css]           CSS to apply to the outermost element of the tooltip 
     */
    
    function showToolTip(content,options) {
        var offset, tooltip, corners, areaSrc, closeOpts,
            ttopts = {},

            // if there's no this context then use an empty object so the tests won't crash
            
            ad = this || {},
            md = ad.owner;
    
        options = options || {};
        content = content || areaOpts.toolTip;
        closeOpts = options.closeEvents;

        if (ad) {
            options = ad.effectiveOptions();
            closeOpts =  closeOpts || ad.options.toolTipClose;
        }

        closeOpts = closeOpts || 'tooltip-click';


        if (typeof closeOpts === 'string') {
            closeOpts = u.split(closeOpts);
        }

        // prevent a tooltip from being cleared if it was already active on an area in the same group.
        // also bail out if there was no content to display.

        if (!content || md.activeToolTipID === ad.areaId) {
            return;
        }

        md.clearToolTip();

        tooltip = createToolTip(content,
            typeof options.template !== 'undefined' ? 
                options.template :
                md.options.toolTipContainer,
            options.css);


        md.activeToolTip = tooltip;
        md.activeToolTipID = ad.areaId;
            
        if (ad && u.isUndef(options.left) && u.isUndef(options.top)) {
            areaSrc = ad.area ? 
                [ad.area] :
                $.map(ad.areas(),
                    function(e) {
                        return e.area;
                    });

            corners = u.areaCorners(areaSrc,
                                    tooltip.outerWidth(true),
                                    tooltip.outerHeight(true));

            // Try to upper-left align it first, if that doesn't work, change the parameters

            offset = $(md.image).offset();
            ttopts.left = offset.left+corners.tt[0];
            ttopts.top =offset.top+corners.tt[1];

        } else {
            
            ttopts.left = options.left;
            ttopts.top = options.top;
        }

        ttopts.left += (options.offsetx || 0);
        ttopts.top +=(options.offsety || 0);

        md.bindToolTipClose(closeOpts,'area-click', 'click', $(md.map));
        md.bindToolTipClose(closeOpts,'tooltip-click', 'click', tooltip);
        md.bindToolTipClose(closeOpts,'image-mouseout', 'mouseout', $(md.image), function(e) {
            return (e.relatedTarget && e.relatedTarget.nodeName!=='AREA' && e.relatedTarget!==ad.area);
        });

        ttopts.css= options.css;
        ttopts.fadeDuration= options.fadeDuration ||
                (md.options.toolTipFade ? areaOpts.fadeDuration: 0);

        showToolTipImpl(tooltip,ttopts);

        //"this" will be null unless they passed something to forArea
        
        u.ifFunction(md.options.onShowToolTip, ad.area || null,
        {
            toolTip: tooltip,
            options: ttopts,
            areaOptions: areaOpts,
            key: ad.key,
            selected: ad.isSelected()
        });

    }
    
    m.AreaData.prototype.showToolTip=showToolTip;

    /**
     * Parse an object that could be a string, a jquery object, or an object with a "contents" property
     * containing html or a jQuery object.
     * 
     * @param  {object|string|jQuery} options The parameter to parse
     * @return {string|jquery} A string or jquery object
     */
    function getHtmlFromOptions(options) {

            // see if any html was passed as either the options object itself, or the content property

            return (options ?
                ((typeof options === 'string' || options.jquery) ?
                    options :
                    options.content) :
                null);
    }

    /**
     * Activate or remove a tooltip for an area. When this method is called on an area, the
     * key parameter doesn't apply and "options" is the first parameter.
     *
     * When called with no parameters, or "key" is a falsy value, any active tooltip is cleared.
     * 
     * When only a key is provided, the default tooltip for the area is used. 
     * 
     * When html is provided, this is used instead of the default tooltip.
     * 
     * When "noTemplate" is true, the default tooltip template will not be used either, meaning only
     * the actual html passed will be used.
     *  
     * @param  {string|AreaElement} key The area for which to activate a tooltip 
     * 
     * @param {object|string|jquery} [options] options to apply when creating this tooltip - OR -
     *                                         The markup, or a jquery object, containing the data for the tooltip 
     *                                         
     *  @config {string|jQuery} [content]   the inner content of the tooltip; the tooltip text or HTML
     *  @config {bool}          [template]  a template to use instead of the default. If this property exists and is null,
     *                                      then no template will be used.
     *  @config {int}           [offsetx]   the horizontal amount to offset the tooltip
     *  @config {int}           [offsety]   the vertical amount to offset the tooltip
     *  @config {string|object} [css]       CSS to apply to the outermost element of the tooltip 
     *  @config {int}           [left] The 0-based absolute x position for the tooltip
     *  @config {int}           [top] The 0-based absolute y position for the tooltip
     *  @config {string|object} [css] CSS to apply to the outermost element of the tooltip 
     *  @config {bool}          [fadeDuration] When non-zero, the duration in milliseconds of a fade-in effect for the tooltip.
     * @return {jQuery} The jQuery object
     */
    
    m.impl.tooltip = function (key,options) {

        
        return (new m.Method(this,
        function mapData() {
            options = key;
            if (!options) {
                this.clearToolTip();
            } else {
                showToolTip(getHtmlFromOptions(options),options);

            }
        },
        function areaData() {
            if ($.isPlainObject(key) && !options) {
                options = key;
            }

            this.showToolTip(getHtmlFromOptions(options),options);
        },
        { 
            name: 'tooltip',
            args: arguments,
            key: key
        }
    )).go();
    };
} (jQuery));
