/*jslint onevar: false */
(function ($) {
    var asyncID = 0,
        WinSize, winSize, overlay, options;

    var show;
    var active = false;
    var hiddenSelects = [];


    // WinSize object to manage dialog size
    WinSize = function (options) {
        var me = this;
        me.options = options;
        me.captureWindow();
    };

    // Should be called whenever the window is resized
    WinSize.prototype.captureWindow = function () {
        var me = this, win = $(window), options = me.options;
        me.winWidth = win.width();
        me.winHeight = win.height();
        // if inWindow, then maximum is the defined maximum, or window size (- padding), whichever is smaller
        // if not, then the maximum is just the defined maximum. Min values are not respected for window size
        // to ensure that close is always visible.
        me.maxHeight = options.inWindowY ?
                Math.min(options.maxHeight || me.winHeight, me.winHeight) :
                options.maxHeight;

        me.maxWidth = options.inWindowX ?
                Math.min(options.maxWidth || me.winWidth, me.winWidth) :
                options.maxWidth;

        me.minHeight = options.minHeight;
        me.minWidth = options.minWidth;
    };
    WinSize.prototype.capture = function (objects) {
        var me = this;
        me.overlay = objects.overlay;
        me.container = objects.container;
        me.iframe = objects.iframe;
        me.wrap = objects.wrap;
        me.data = objects.data;

    };
    // populate with current state of dialog objects. This is separate from the "configure" method because
    // sometimes we want to capture data about the inner content size before it's ready to render (e.g. "realWidth/realHeight")
    WinSize.prototype.captureWrapper = function () {
        var me = this;

        me.wrapWidthPad = me.wrap ? (me.wrap.outerWidth(true) - me.wrap.width()) : 0;
        me.wrapHeightPad = me.wrap ? (me.wrap.outerHeight(true) - me.wrap.height()) : 0;

        me.ctrWidthPad = me.container ? (me.container.outerWidth(true) - me.container.width()) : 0;
        me.ctrHeightPad = me.container ? (me.container.outerHeight(true) - me.container.height()) : 0;

    };
    WinSize.prototype.captureDataWidth = function () {
        var me = this;
        me.dataWidth = me.data ? me.data.outerWidth(true) : me.maxWidth - me.wrapWidthPad;
    };
    WinSize.prototype.captureDataHeight = function () {
        var me = this;
        me.dataHeight = me.data ? me.data.outerHeight(true) + me.ctrHeightPad : me.maxHeight - me.wrapHeightPad;
    };

    WinSize.prototype.configure = function () {
        var me = this, height, width;

      
        //dimension needs to be: the space consumed by the data, plus the difference between the height/width properties of the container & the actual space consumed by the container.
        // maximum size is correct when limited by viewport.

        height = Math.min(me.maxHeight - me.ctrHeightPad, Math.max(me.dataHeight, me.minHeight) + me.wrapHeightPad);
        width = Math.min(me.maxWidth - me.ctrWidthPad, Math.max(me.dataWidth, me.minWidth) + me.wrapWidthPad);

        // check if we didn't use full width, but height is > max height, meaning a vscroll bar appeared 
        // if so, add 20 px so it won't appear.
        if (width < me.maxWidth - me.ctrWidthPad &&
            height - me.ctrHeightPad < me.dataHeight + me.wrapHeightPad) {
            width = Math.min(me.maxWidth - me.ctrWidthPad, width + 20);
        }

        if (me.overlay) {
            me.overlay.width(me.winWidth)
                    .height(me.winHeight);
        }


        if (me.container) {
            // Chrome seems to have trouble removing the scrollbars once they've been added. Set overflow to hidden on the
            // wrap before resizing the container, then set them to auto afterwards, and it works.
            me.wrap.css({ overflow: 'hidden' });
            me.container.width(width).height(height);
            me.container.css({
                left: Math.round((me.winWidth - me.container.outerWidth(true)) / 2),
                top: Math.round((me.winHeight - me.container.outerHeight(true)) / 2)
            });

            me.wrap.css("overflow", "auto");

        }
        if (me.iframe) {
            me.iframe.css({ width: "100%", height: "100%" });
        }
    };

    /* MAIN CODE */


    function hideSelects() {
        if (hiddenSelects.length) { return; }

        $('select:visible').each(function () {
            hiddenSelects.push(this);
            $(this).css("visibility", "hidden");
        });
    }

   function blockUI(loading) {
        if (overlay) { return; }

        winSize.captureWindow();
        overlay = $('<div></div>')
            .addClass('block-ui-overlay')
            .attr('id', options.overlayId)
            .css($.extend(options.overlayCss, {
                display: 'none',
                opacity: options.opacity / 100,
                height: winSize.winHeight,
                width: winSize.winWidth,
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: options.zIndex + 1
            }))
            .appendTo(options.appendTo);

        if (loading) {
            overlay.append($('<div style="width:100%;height:100%;"></div>').addClass(options.loadingClass));
        }
        winSize.capture({ overlay: overlay });
        winSize.configure();

        hideSelects();

        overlay.show();

       

    }


    function showSelects() {

        var s, i = hiddenSelects.length;
        while (i--) {
            s = hiddenSelects[i];
            if (s) {
                $(s).css("visibility", "visible");
            }
        }
        hiddenSelects = [];
    }
    function unblockUI() {
        active = false;
        $(overlay).remove();
        showSelects();
    }
    function loadFromUrl(url) {
        var lastAsyncID,
            cleanurl = url,
            anchor = null,
            parts = url.split('#');

        function extractBodyHtml(obj) {
            var regex = /<body.*?>([\s\S]*?)<\/body>/g;
            var html;
            if (regex.test(obj)) {
                html = RegExp.$1;
            } else {
                html = obj;
            }
            return $($.parseHTML(html));

        }
        // called on ajax load success, or immediately if in same page
        function loaded(obj) {
            var cur, sub, content;

            unblockUI();

            content = obj instanceof jQuery ?
                obj :
                extractBodyHtml(obj);

            if (anchor) {
                sub = content.find('#' + anchor).children();

                if (sub.length > 0) {
                    content = sub;
                } else {
                    // if no ID, then look for an anchor tag.
                    content = content.find("a[name='" + anchor + "']");
                    cur = content.next();

                    while (cur && cur.length) {
                        if (!cur.is("a[name]")) {
                            content = content.add(cur);
                            cur = cur.next();
                        } else {
                            cur = null;
                        }
                    }
                }
            }
            // ensure that a new operation wasn't started as a result of previous one being canceled.
            if (asyncID === lastAsyncID) {
               
                show(content);
            }
        }

        if (active) {
            return;
        }
        active = true;

        blockUI();

        if (parts.length > 0) {
            cleanurl = parts[0];
            anchor = parts[1];
        }
        lastAsyncID = ++asyncID;

        if (!cleanurl && anchor) {
            loaded($('body'));
        } else {
            $.ajax({
                url: cleanurl,
                type: "GET",
                data: options.ajaxData,
                dataType: "html",
                async: true,
                success: loaded,
                error: function (data, textStatus, jqXHR) {
                    unblockUI();
                    if ($.isFunction(options.ajaxError)) {
                        options.ajaxError.call(null, data, textStatus, jqXHR);
                    } else {
                        if (jqXHR.responseText) {
                            throw (jqXHR.responseText);
                        }
                    }
                }
            });
        }
    }
    function init(opts) {
        winSize = new WinSize({
            inWindowX : true,
            inWindowY: true

        });
        options = {
            appendTo: 'body',
            loadingClass: 'simplemodal-loading',
            onClose: function () {
                $.modal.close();
            },
            onShow: function (dialog) {
                var d = dialog.data.parent().parent();
                d.width(d.width() + 20);
                d.height(d.height() + 44);
            },
            maxWidth: winSize.maxWidth-80,
            maxHeight: winSize.maxHeight - 80,
            autoResize: true
            
        };
        if (opts) {
            $.extend(options, opts);
        }

    }

    show = function (source) {

        var wrap = $('<div style="padding: 20px;" />').append(source);
        wrap.css({
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
        });
        $(wrap).modal(options);
    };
    $.modal.simple = function (source, options) {
        init(options);
        if (active) {
            // already open
            return;
        }
        show(source);
        
    };

    $.modal.modaliframe = function (url, options) {
        var iframe = $('<iframe src=""></iframe>');

        $.modal.simple(iframe,$.extend({}, options, { iframeSrc: url }));
    };
    $.modalurl = function (url, options, ajaxData) {
        // ensure ajaxData gets set to nothing if not passed
        var opts = $.extend({}, options, { ajaxData: ajaxData });
        init(opts);
        loadFromUrl(url);
    };


}(jQuery));
