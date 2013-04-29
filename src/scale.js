/* scale.js: resize and zoom functionality
   requires areacorners.js, when.js
*/


(function ($) {
    var m = $.mapster, u = m.utils, p = m.MapArea.prototype;

    m.utils.getScaleInfo = function (eff, actual) {
        var pct;
        if (!actual) {
            pct = 1;
            actual=eff;
        } else {
            pct = eff.width / actual.width || eff.height / actual.height;
            // make sure a float error doesn't muck us up
            if (pct > 0.98 && pct < 1.02) { pct = 1; }
        }
        return {
            scale: (pct !== 1),
            scalePct: pct,
            realWidth: actual.width,
            realHeight: actual.height,
            width: eff.width,
            height: eff.height,
            ratio: eff.width / eff.height
        };
    };
    // Scale a set of AREAs, return old data as an array of objects
    m.utils.scaleMap = function (image, imageRaw, scale) {
        
        // stunningly, jQuery width can return zero even as width does not, seems to happen only
        // with adBlock or maybe other plugins. These must interfere with onload events somehow.


        var vis=u.size(image),
            raw=u.size(imageRaw,true);

        if (!raw.complete()) {
            throw("Another script, such as an extension, appears to be interfering with image loading. Please let us know about this.");
        }
        if (!vis.complete()) {
            vis=raw;
        }
        return this.getScaleInfo(vis, scale ? raw : null);
    };
    
    /**
     * Resize the image map. Only one of newWidth and newHeight should be passed to preserve scale
     * 
     * @param  {int}   width       The new width OR an object containing named parameters matching this function sig
     * @param  {int}   height      The new height
     * @param  {int}   effectDuration Time in ms for the resize animation, or zero for no animation
     * @param  {function} callback    A function to invoke when the operation finishes
     * @return {promise}              NOT YET IMPLEMENTED
     */
    
    m.MapData.prototype.resize = function (width, height, duration, callback) {
        var p,promises,newsize,els, highlightId, ratio, 
            me = this;
        
        // allow omitting duration
        callback = callback || duration;

        function sizeCanvas(canvas, w, h) {
            if (m.hasCanvas()) {
                canvas.width = w;
                canvas.height = h;
            } else {
                $(canvas).width(w);
                $(canvas).height(h);
            }
        }

        // Finalize resize action, do callback, pass control to command queue

        function cleanupAndNotify() {

            me.currentAction = '';
            
            if ($.isFunction(callback)) {
                callback();
            }
            
            me.processCommandQueue();
        }

        // handle cleanup after the inner elements are resized
        
        function finishResize() {
            sizeCanvas(me.overlay_canvas, width, height);

            // restore highlight state if it was highlighted before
            if (highlightId >= 0) {
                var areaData = me.data[highlightId];
                areaData.tempOptions = { fade: false };
                me.getDataForKey(areaData.key).highlight();
                areaData.tempOptions = null;
            }
            sizeCanvas(me.base_canvas, width, height);
            me.redrawSelections();
            cleanupAndNotify();
        }

        function resizeMapData() {
            $(me.image).css(newsize);
            // start calculation at the same time as effect
            me.scaleInfo = u.getScaleInfo({
                    width: width,
                    height: height
                },
                { 
                    width: me.scaleInfo.realWidth,
                    height: me.scaleInfo.realHeight
                });
            $.each(me.data, function (i, e) {
                $.each(e.areas(), function (i, e) {
                    e.resize();
                });
            });
        }

        if (me.scaleInfo.width === width && me.scaleInfo.height === height) {
            return;
        }

        highlightId = me.highlightId;

        
        if (!width) {
            ratio = height / me.scaleInfo.realHeight;
            width = Math.round(me.scaleInfo.realWidth * ratio);
        }
        if (!height) {
            ratio = width / me.scaleInfo.realWidth;
            height = Math.round(me.scaleInfo.realHeight * ratio);
        }

        newsize = { 'width': String(width) + 'px', 'height': String(height) + 'px' };
        if (!m.hasCanvas()) {
            $(me.base_canvas).children().remove();
        }

        // resize all the elements that are part of the map except the image itself (which is not visible)
        // but including the div wrapper
        els = $(me.wrapper).find('.mapster_el').add(me.wrapper);

        if (duration) {
            promises = [];
            me.currentAction = 'resizing';
            els.each(function (i, e) {
                p = u.defer();
                promises.push(p);

                $(e).animate(newsize, {
                    duration: duration,
                    complete: p.resolve,
                    easing: "linear"
                });
            });

            p = u.defer();
            promises.push(p);

            // though resizeMapData is not async, it needs to be finished just the same as the animations,
            // so add it to the "to do" list.
            
            u.when.all(promises).then(finishResize);
            resizeMapData();
            p.resolve();
        } else {
            els.css(newsize);
            resizeMapData();
            finishResize();
            
        }
    };


    m.MapArea = u.subclass(m.MapArea, function () {
        //change the area tag data if needed
        this.base.init();
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
    
    m.impl.resize = function (width, height, duration, callback) {
        if (!width && !height) {
            return false;
        }
        var x= (new m.Method(this,
                function () {
                    this.resize(width, height, duration, callback);
                },
                null,
                {
                    name: 'resize',
                    args: arguments
                }
            )).go();
        return x;
    };

/*
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
    */
} (jQuery));