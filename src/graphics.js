/* graphics.js
   Graphics object handles all rendering.
*/
(function ($) {
    var p, m=$.mapster,
        u=m.utils;
    m.Graphics = function (map_data) {
        //$(window).unload($.mapster.unload);
        // create graphics functions for canvas and vml browsers. usage:
        // 1) init with map_data, 2) call begin with canvas to be used (these are separate b/c may not require canvas to be specified
        // 3) call add_shape_to for each shape or mask, 4) call render() to finish

        var me = this;
        me.active = false;
        me.canvas = null;
        me.width = 0;
        me.height = 0;
        me.shapes = [];
        me.masks = [];
        me.map_data = map_data;
    };
    p = m.Graphics.prototype;

    p.begin = function (curCanvas, curName) {
        var c = $(curCanvas);

        this.elementName = curName;
        this.canvas = curCanvas;

        this.width = c.width();
        this.height = c.height();
        this.shapes = [];
        this.masks = [];
        this.active = true;

    };
    p.addShape = function (mapArea, options) {
        var addto = options.isMask ? this.masks : this.shapes;
        addto.push({ mapArea: mapArea, options: options });
    };
    p.createVisibleCanvas = function (img) {
        return $(this.createCanvasFor(img)).addClass('mapster_el').css(m.canvas_style)[0];
    };
    p._addShapeGroupImpl = function (areaData, mode) {
        var me = this,
            md = me.map_data,
            opts = areaData.effectiveRenderOptions(mode);

        // first get area options. Then override fade for selecting, and finally merge in the "select" effect options.


        $.each(areaData.areas(), function (i,e) {

            //var opts = e.effectiveRenderOptions(mode);
            opts.isMask = opts.isMask || (e.nohref && md.options.noHrefIsMask);
            //if (!u.isBool(opts.staticState)) {
                me.addShape(e, opts);
            //}
        });

    };
    p.addShapeGroup = function (areaData, mode) {
        // render includeKeys first - because they could be masks
        var me = this,
            list, name, canvas,
            map_data = this.map_data,
            opts = areaData.effectiveRenderOptions(mode);

        if (mode === 'select') {
            name = "static_" + areaData.areaId.toString();
            canvas = map_data.base_canvas;
        } else {
            canvas = map_data.overlay_canvas;
        }

        me.begin(canvas, name);

        if (opts.includeKeys) {
            list = u.split(opts.includeKeys);
            $.each(list, function (i,e) {
                var areaData = map_data.getDataForKey(e.toString());
                me._addShapeGroupImpl(areaData, mode);
            });
        }

        me._addShapeGroupImpl(areaData, mode);
        me.render();
        if (opts.fade) {
           u.fader(canvas,0, (m.hasCanvas ? 1 : opts.fillOpacity), opts.fadeDuration);
        }

    };
    // configure remaining prototype methods for ie or canvas-supporting browser
    m.initGraphics = function() {
        if (m.hasCanvas) {
            p.hex_to_decimal = function (hex) {
                return Math.max(0, Math.min(parseInt(hex, 16), 255));
            };
            p.css3color = function (color, opacity) {
                return 'rgba(' + this.hex_to_decimal(color.substr(0, 2)) + ','
                        + this.hex_to_decimal(color.substr(2, 2)) + ','
                        + this.hex_to_decimal(color.substr(4, 2)) + ',' + opacity + ')';
            };

            p.renderShape = function (context, mapArea, offset) {
                var i,
                    c = mapArea.coords(null,offset);

                switch (mapArea.shape) {
                    case 'rect':
                        context.rect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
                        break;
                    case 'poly':
                        context.moveTo(c[0], c[1]);

                        for (i = 2; i < mapArea.length; i += 2) {
                            context.lineTo(c[i], c[i + 1]);
                        }
                        context.lineTo(c[0], c[1]);
                        break;
                    case 'circ':
                    case 'circle':
                        context.arc(c[0], c[1], c[2], 0, Math.PI * 2, false);
                        break;
                }
            };
            p.addAltImage = function (context, image, mapArea, options) {
                context.beginPath();

                this.renderShape(context, mapArea);
                context.closePath();
                context.clip();

                context.globalAlpha = options.altImageOpacity || options.fillOpacity;

                context.drawImage(image, 0, 0, mapArea.owner.scaleInfo.width, mapArea.owner.scaleInfo.height);
            };

            p.render = function () {
                // firefox 6.0 context.save() seems to be broken. to work around,  we have to draw the contents on one temp canvas,
                // the mask on another, and merge everything. ugh. fixed in 1.2.2. unfortunately this is a lot more code for masks,
                // but no other way around it that i can see.

                var maskCanvas, maskContext,
                            me = this,
                            hasMasks = me.masks.length,
                            shapeCanvas = me.createCanvasFor(me.canvas),
                            shapeContext = shapeCanvas.getContext('2d'),
                            context = me.canvas.getContext('2d');

                if (hasMasks) {
                    maskCanvas = me.createCanvasFor(me.canvas);
                    maskContext = maskCanvas.getContext('2d');
                    maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

                    $.each(me.masks, function (i,e) {
                        maskContext.save();
                        maskContext.beginPath();
                        me.renderShape(maskContext, e.mapArea);
                        maskContext.closePath();
                        maskContext.clip();
                        maskContext.lineWidth = 0;
                        maskContext.fillStyle = '#000';
                        maskContext.fill();
                        maskContext.restore();
                    });

                }

                $.each(me.shapes, function (i,s) {
                    shapeContext.save();
                    if (s.options.fill) {
                        if (s.options.alt_image) {
                            me.addAltImage(shapeContext, s.options.alt_image, s.mapArea, s.options);
                        } else {
                            shapeContext.beginPath();
                            me.renderShape(shapeContext, s.mapArea);
                            shapeContext.closePath();
                            //shapeContext.clip();
                            shapeContext.fillStyle = me.css3color(s.options.fillColor, s.options.fillOpacity);
                            shapeContext.fill();
                        }
                    }
                    shapeContext.restore();
                });


                // render strokes at end since masks get stroked too

                $.each(me.shapes.concat(me.masks), function (i,s) {
                    var offset = s.options.strokeWidth === 1 ? 0.5 : 0;
                    // offset applies only when stroke width is 1 and stroke would render between pixels.

                    if (s.options.stroke) {
                        shapeContext.save();
                        shapeContext.strokeStyle = me.css3color(s.options.strokeColor, s.options.strokeOpacity);
                        shapeContext.lineWidth = s.options.strokeWidth;

                        shapeContext.beginPath();

                        me.renderShape(shapeContext, s.mapArea, offset);
                        shapeContext.closePath();
                        shapeContext.stroke();
                        shapeContext.restore();
                    }
                });

                if (hasMasks) {
                    // render the new shapes against the mask

                    maskContext.globalCompositeOperation = "source-out";
                    maskContext.drawImage(shapeCanvas, 0, 0);

                    // flatten into the main canvas
                    context.drawImage(maskCanvas, 0, 0);
                } else {
                    context.drawImage(shapeCanvas, 0, 0);
                }

                me.active = false;
                return me.canvas;



            };

            // create a canvas mimicing dimensions of an existing element
            p.createCanvasFor = function (element) {
                var el = $(element),
                                    w = el.width() || el[0].width,
                                    h = el.height() || el[0].height,
                                    c = $('<canvas width="' + w + '" height="' + h + '"></canvas>')[0];

                //c.getContext("2d").clearRect(0, 0, w, h);
                return c;
            };
            p.clearHighlight = function () {
                var c = this.map_data.overlay_canvas;
                c.getContext('2d').clearRect(0, 0, c.width, c.height);
            };
            p.removeSelections = function () {

            };
            // Draw all items from selected_list to a new canvas, then swap with the old one. This is used to delete items when using canvases.
            p.refreshSelections = function () {
                var canvas_temp, map_data = this.map_data;
                // draw new base canvas, then swap with the old one to avoid flickering
                canvas_temp = map_data.base_canvas;

                map_data.base_canvas = this.createVisibleCanvas(map_data.image);
                $(map_data.base_canvas).hide();
                $(canvas_temp).before(map_data.base_canvas);

                map_data.redrawSelections();

                $(map_data.base_canvas).show();
                $(canvas_temp).remove();
            };

        } else {
            p.renderShape = function (mapArea, options, cssclass) {
                var me = this, stroke, e, t_fill, el_name, el_class, template, c = mapArea.coords();
                el_name = me.elementName ? 'name="' + me.elementName + '" ' : '';
                el_class = cssclass ? 'class="' + cssclass + '" ' : '';

                t_fill = '<v:fill color="#' + options.fillColor + '" opacity="' + (options.fill ? options.fillOpacity : 0) + '" /><v:stroke opacity="' + options.strokeOpacity + '"/>';

                if (options.stroke) {
                    stroke = 'strokeweight=' + options.strokeWidth + ' stroked="t" strokecolor="#' + options.strokeColor + '"';
                } else {
                    stroke = 'stroked="f"';
                }

                switch (mapArea.shape) {
                    case 'rect':
                        template = '<v:rect ' + el_class + el_name + ' filled="t" ' + stroke + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + c[0] + 'px;top:' + c[1]
                                    + 'px;width:' + (c[2] - c[0]) + 'px;height:' + (c[3] - c[1]) + 'px;">' + t_fill + '</v:rect>';
                        break;
                    case 'poly':
                        template = '<v:shape ' + el_class + el_name + ' filled="t" ' + stroke + ' coordorigin="0,0" coordsize="' + me.width + ',' + me.height
                                    + '" path="m ' + c[0] + ',' + c[1] + ' l ' + c.slice(2).join(',')
                                    + ' x e" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' + me.width + 'px;height:' + me.height + 'px;">' + t_fill + '</v:shape>';
                        break;
                    case 'circ':
                    case 'circle':
                        template = '<v:oval ' + el_class + el_name + ' filled="t" ' + stroke
                                    + ' style="zoom:1;margin:0;padding:0;display:block;position:absolute;left:' + (c[0] - c[2]) + 'px;top:' + (c[1] - c[2])
                                    + 'px;width:' + (c[2] * 2) + 'px;height:' + (c[2] * 2) + 'px;">' + t_fill + '</v:oval>';
                        break;
                }
                e = $(template);
                $(me.canvas).append(e);

                return e;
            };
            p.render = function () {
                var opts, me = this;

                $.each(this.shapes, function (i,e) {
                    me.renderShape(e.mapArea, e.options);
                });

                if (this.masks.length) {
                    $.each(this.masks, function (i,e) {
                        opts = u.updateProps({},
                            e.options, {
                                fillOpacity: 1,
                                fillColor: e.options.fillColorMask
                            });
                        me.renderShape(e.mapArea, opts, 'mapster_mask');
                    });
                }

                this.active = false;
                return this.canvas;
            };

            p.createCanvasFor = function (element) {
                var el = $(element),
                                w = el.width(),
                                h = el.height();
                return $('<var width="' + w + '" height="' + h + '" style="zoom:1;overflow:hidden;display:block;width:' + w + 'px;height:' + h + 'px;"></var>')[0];
            };

            p.clearHighlight = function () {
                $(this.map_data.overlay_canvas).children().remove();
            };
            // remove single or all selections
            p.removeSelections = function (area_id) {
                if (area_id >= 0) {
                    $(this.map_data.base_canvas).find('[name="static_' + area_id.toString() + '"]').remove();
                }
                else {
                    $(this.map_data.base_canvas).children().remove();
                }
            };
            p.refreshSelections = function () {
                return null;
            };

        }
    };
    m.initGraphics();
} (jQuery));
