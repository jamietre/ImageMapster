/* scale.js: resize and zoom functionality
   requires areacorners.js
*/

// options {
//    padding: n,
//    duration: m,
//}
//
(function ($) {
    var m = $.mapster, u = m.utils, p = m.MapArea.prototype;

    m.utils.getScaleInfo = function (realW, realH, width, height) {
        var pct;
        if (!width && !height) {
            pct = 1;
        } else {
            pct = width / realW || height / realH;
            // make sure a float error doesn't muck us up
            if (pct > 0.98 && pct < 1.02) { pct = 1; }
        }
        return {
            scale: (pct !== 1),
            scalePct: pct,
            realWidth: realW,
            realHeight: realH,
            width: width,
            height: height,
            ratio: width / height
        };
    };
    // Scale a set of AREAs, return old data as an array of objects
    m.utils.scaleMap = function (image, imageRaw, scale) {
        var  realH, realW, width, height, 
            img = $(image),
            imgRaw = $(imageRaw);
                
        width = img.width();
        height = img.height();
        realW= imgRaw.width();
        realH = imgRaw.height();

        return this.getScaleInfo(realW, realH, width, height);
    };
    // options: duration = animation time (zero = no animation)
    // force: supercede any existing animation
    // css = any css to be applied to the wrapper
    m.MapData.prototype.resize = function (newWidth, newHeight, effectDuration) {
        var highlightId, ratio, width, height, duration, opts = {}, newsize, els, me = this;
        if (typeof newWidth === 'object') {
            opts = newWidth;
        } else {
            opts.width = newWidth;
            opts.height = newHeight;
            opts.duration = effectDuration;
        }
        width = opts.width;
        height = opts.height;
        duration = opts.duration || 1000;

        if (me.scaleInfo.width === width && me.scaleInfo.height === height) {
            return;
        }
        highlightId = me.highlightId;

        function sizeCanvas(canvas, w, h) {
            if ($.mapster.hasCanvas) {
                canvas.width = w;
                canvas.height = h;
            } else {
                $(canvas).width(w);
                $(canvas).height(h);
            }
        }
        function finishResize() {
            sizeCanvas(me.overlay_canvas, width, height);

            // restore highlight state if it was highlighted before
            if (opts.highlight) {
                if (highlightId >= 0) {
                    var areaData = me.data[highlightId];
                    areaData.tempOptions = { fade: false };
                    me.getDataForKey(areaData.key).highlight();
                    areaData.tempOptions = null;
                }
            }
            sizeCanvas(me.base_canvas, width, height);

            me.redrawSelections();
            me.resizing = false;
            if ($.isFunction(opts.callback)) {
                opts.callback();
            }
        }
        if (!width) {
            ratio = height / me.scaleInfo.realHeight;
            width = Math.round(me.scaleInfo.realWidth * ratio);
        }
        if (!height) {
            ratio = width / me.scaleInfo.realWidth;
            height = Math.round(me.scaleInfo.realHeight * ratio);
        }

        newsize = { 'width': String(width) + 'px', 'height': String(height) + 'px' };
        if (!$.mapster.hasCanvas) {
            $(me.base_canvas).children().remove();
        }
        els = $(me.wrapper).find('.mapster_el');

        if (me.resizing && opts.force) {
            $(els).stop();
            //(me.wrapper).stop();
        }
        me.resizing = true;

        if (opts.duration) {
            els.each(function (i, e) {
                $(e).animate(newsize, { duration: duration, complete: i===0 ? finishResize:null, easing: "linear" });
            });

            $(me.wrapper).animate({
                scrollLeft: opts.scrollLeft || 0,
                scrollTop: opts.scrollTop || 0
            },
                    { duration: duration, easing: "linear" });
        } else {
            els.css(newsize);
            finishResize();
            //                if (opts.css) {
            //                    me.wrapper.css(opts.css);
            //                }
        }
        $(this.image).css(newsize);
        // start calculation at the same time as effect
        me.scaleInfo = u.getScaleInfo(me.scaleInfo.realWidth, me.scaleInfo.realHeight, width, height);
        $.each(me.data, function (i, e) {
            $.each(e.areas(), function (i, e) {
                e.resize();
            });
        });

    };


    m.MapArea = u.subclass(m.MapArea, function () {
        //change the area tag data if needed
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
    m.impl.resize = function (width, height, duration) {
        if (!width && !height) {
            return false;
        }
        return (new m.Method(this,
                function () {
                    this.resize(width, height, duration);
                },
                null,
                {
                    name: 'resize',
                    args: arguments
                }
            )).go();
    };

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
} (jQuery));
