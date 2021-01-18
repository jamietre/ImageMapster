/*
* SimplerModal 1.0 - jQuery Plugin
* Copyright (c) 2011 James Treworgy 
* http://www.outsharked.com/simplermodal
*
* Forked from Simplemodal 1.4.1 
* http://www.ericmmartin.com/projects/simplemodal/
* Copyright (c) 2010 Eric Martin (http://twitter.com/ericmmartin)
* Dual licensed under the MIT and GPL licenses
* Revision: $Id: jquery.simplemodal.js 261 2010-11-05 21:16:20Z emartin24 $
*/

/* Differences from stock: 
- iFrame is not created automatically for IE6, instead "select" controls are hidden
- $.modal.iframe() and $.modal.url() to load content from a URL asynchronously
- $.modal.block() and $.modal.unblock() to allow user control of UI blocking
- options to ensure dialog stays within window confines
- better "close" handling
- Rewrite of sizing code: Account for margins on container when resizing automatically
- Options to ensure dialog always fits in window confines
*/
(function ($) {
    $.fn.modal = function (options) {
        return $.modal.impl.modal(this, options);
    };
    $.modal = {};
    /*
    * SimplerModal default options
    *
    * NEW to Simplermodal
    * inWindowX:         (Boolean: true) when true, dialog will always remain inside the boundaries 
    * inWindowY:             of the window for that dimensionregardless of the dialog size
    * iframeSrc:         (String: null) When the data is an iframe, this is the source. The source should not be set
    *                        directly to prevent it from loading before the dialog is called (unless this is what you want)
    *                        This option is set transparently by $.modal.iframe()
    * iframeWait:        (Boolean: true) Prevents displaying dialog until iframe contents are loaded, instead adds 'loadingClass' to
    *                        a div inside the overlay. The overlay is always displayed immediately
    * iframeCss          (object: {}) Css applied to an iframe
    * ajaxError          (Function: null) Callback on ajax error when loading async
      
    * appendTo:		(String:'body') The jQuery selector to append the elements to. For .NET, use 'form'.
    * focus:			(Boolean:true) Focus in the first visible, enabled element?
    * opacity:			(Number:50) The opacity value for the overlay div, from 0 - 100
    * overlayId:		(String:'simplemodal-overlay') The DOM element id for the overlay div
    * overlayCss:		(Object:{}) The CSS styling for the overlay div
    * containerId:		(String:'simplemodal-container') The DOM element id for the container div
    * containerCss:	(Object:{}) The CSS styling for the container div
    * dataId:			(String:'simplemodal-data') The DOM element id for the data div
    * dataCss:			(Object:{}) The CSS styling for the data div
    * minHeight:		(Number:null) The minimum height for the container
    * minWidth:		(Number:null) The minimum width for the container
    * maxHeight:		(Number:null) The maximum height for the container. If not specified, the window height is used.
    * maxWidth:		(Number:null) The maximum width for the container. If not specified, the window width is used.
    * autoResize:		(Boolean:false) Automatically resize the container if it exceeds the browser window dimensions?
    * autoPosition:	(Boolean:true) Automatically position the container upon creation and on window resize?
    * zIndex:			(Number: 1000) Starting z-index value
    * close:			(Boolean:true) If true, closeHTML, escClose and overClose will be used if set.
    If false, none of them will be used.
    * closeHTML:		(String:'<a class="modalCloseImg" title="Close"></a>') The HTML for the default close link.
    SimpleModal will automatically add the closeClass to this element.
    * closeClass:		(String:'simplemodal-close') The CSS class used to bind to the close event
    * escClose:		(Boolean:true) Allow Esc keypress to close the dialog?
    * overlayClose:	(Boolean:false) Allow click on overlay to close the dialog?
    * position:		(Array:null) Position of container [top, left]. Can be number of pixels or percentage
    * persist:			(Boolean:false) Persist the data across modal calls? Only used for existing
    DOM elements. If true, the data will be maintained across modal calls, if false,
    the data will be reverted to its original state.
    * modal:			(Boolean:true) User will be unable to interact with the page below the modal or tab away from the dialog.
    If false, the overlay, iframe, and certain events will be disabled allowing the user to interact
    with the page below the dialog.
    * onOpen:			(Function:null) The callback function used in place of SimpleModal's open
    * onShow:			(Function:null) The callback function used after the modal dialog has opened
    * onClose:			(Function:null) The callback function used in place of SimpleModal's close
    */

    $.modal.defaults = {
        iframeSrc: null,
        iframeWait: true,
        ajaxError: null,
        ajaxData: {},
        modal: true,
        opacity: 50,
        minHeight: 200,
        minWidth: 200,
        maxHeight: null,
        maxWidth: null,
        inWindowX: true,
        inWindowY: true,
        onOpen: null,
        onShow: null,
        onClose: null,
        close: true,
        overlayClose: true,
        escClose: true,
        closeHTML: '<a class="modalCloseImg" title="Close"></a>',
        closeClass: 'simplemodal-close',
        loadingClass: 'simplemodal-loading',
        dataCss: {},
        overlayCss: {},
        containerCss: {},
        iframeCss: {},
        appendTo: 'body',
        overlayId: 'simplemodal-overlay',
        containerId: 'simplemodal-container',
        zIndex: 1000,
        persist: true
    };
    $.modal.iframe = function (url, options) {
        var iframe = $('<iframe src=""></iframe>');

        iframe.modal($.extend({}, options, { iframeSrc: url }));
    };
    $.modal.url = function (url, options, ajaxData) {
        // ensure ajaxData gets set to nothing if not passed
        var opts = $.extend({}, options, { ajaxData: ajaxData });
        $.modal.init(opts);
        $.modal.impl.loadFromUrl(url);
    };
    /*
    * Close the modal dialog.
    */
    $.modal.close = function () {
        $.modal.impl.close();
    };
    // Block UI with "loading" class
    $.modal.block = function () {
        $.modal.init();
        $.modal.impl.blockUI(true);
    };
    $.modal.unblock = function () {
        $.modal.impl.unblockUI();
    };
    $.modal.init = function (options) {
        $.modal.impl.init(options);
    };
    $.modal.impl = (function () {
        var WinSize,
            winSize, // instance of WinSize
            asyncID = 0,
            active = false, // dialog is currently active
            inputs = [], // input controls for managing focus
            dataParent, // parent node of data, if from DOM
            dataDisplay, // display CSS class of data
            iframe, iframeSrc, overlay, container, wrap, data, hiddenSelects = [],
            me = {},
            options = $.extend({}, $.modal.defaults),
            quirks = false;

            //!$.support.boxModel;|| ($.browser.msie && parseInt($.browser.version, 10) === 6);
        // return true of a jQuery selection is part of the DOM. parent() used by simplemodal is not robust
        function inDom(jq) {
            // Get the first element in the jQuery selection
            var node = jq[0];

            while (node) {
                if (node.nodeType === 9) { // DOCUMENT_NODE
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        }

        function hideSelects() {
            if (hiddenSelects.length || !quirks) { return; }
            $('select:visible').each(function () {
                hiddenSelects.push(this);
                $(this).css("visibility", "hidden");
            });
        }

        function showSelects() {
            if (!quirks) { return; }
            var s, i = hiddenSelects.length;
            while (i--) {
                s = hiddenSelects[i];
                if (s) {
                    $(s).css("visibility", "visible");
                }
            }
            hiddenSelects = [];
        }


      

        function create(dialogData) {
            var closeData,
                asyncLoading = iframe && options.iframeWait,
                data = dialogData;
            // create the overlay. It could have been created already, this method will ignore repeated calls
            if (options.modal) {
                me.blockUI(asyncLoading);
            }

            // create the container
            container = $('<div></div>')
				.addClass('simplemodal-container')
                .attr('id', options.containerId)
				.css($.extend(options.containerCss, {
				    display: 'none',
				    position: 'fixed',
				    width: winSize.maxWidth,
				    height: winSize.maxHeight,
				    zIndex: options.zIndex + 2
				}));

            if (options.close && options.closeHTML) {
                closeData = $(options.closeHTML)
                    .addClass(options.closeClass)
                    .css("zIndex", options.zIndex + 3);

                container.append(closeData);
                $(closeData).bind('click.simplemodal', me.close);
            }
            container.appendTo(options.appendTo);

            wrap = $('<div></div>')
			    .attr('tabIndex', -1)
			    .addClass('simplemodal-wrap')
                .css({ "width": "100%", "height": "100%" })
                .appendTo(container);

            // add styling and attributes to the data
            // append to body to get correct dimensions, then move to wrap
            if (data) {
                data.addClass('simplemodal-data')
				    .css(options.dataCss);
                if (!dataParent && !iframe) {
                    data.appendTo('body');
                }
            }
            winSize.capture(me.data());
            winSize.captureWrapper();
            winSize.captureDataWidth();

            if (data) {
                data.appendTo(wrap);
            }

            if (iframe) {
                iframe
                .css($.extend(options.iframeCss, {
                    display: 'none',
                    //opacity: 0,
                    outline: 0,
                    margin: 0,
                    padding: 0,
                    border: 0,
                    //position: 'fixed',
                    width: options.maxWidth,
                    height: options.maxHeight,
                    zIndex: options.zIndex,
                    top: 0,
                    left: 0
                })).attr('frameborder', 0)
                .attr("width", options.maxWidth)
                .attr("height", options.maxHeight)
                .appendTo(wrap)
                .attr('src', iframeSrc);

                if (options.iframeWait) {
                    iframe.bind('load.simplemodal', me.show);
                }
            }
            $(window).bind('resize.simplemodal', me.resize);
        }

        me.init = function (opts) {
            if (opts) {
                $.extend(options, opts);
            }
            if (!winSize) {
                winSize = new WinSize();
            }
        };
        // public method -- will bail if active
        me.modal = function (source, options) {
            if (active) {
                // already open
                return;
            }
            active = true;
            $.modal.init(options);
            me.main(source);
        };
        // internal method
        me.main = function (source) {
            // Must be active now - otherwise indicates an async operation was canceled
            var isInDom;
            if (!active || !source) {
                return;
            }
            // determine how to handle the data based on its type
            if (typeof source === 'object') {
                // convert DOM object to a jQuery object
                data = source instanceof jQuery ? source : $(source);

                if (data.length) {
                    if (data[0].tagName === 'IFRAME') {
                        iframe = $(data[0]);
                        iframeSrc = iframe.attr('src') || options.iframeSrc;
                        iframe.attr('src', '');
                        data = null;
                    } else {

                        isInDom = inDom(data);
                        if (isInDom) {
                            dataParent = source.parent();
                            dataDisplay = source.css('display');
                        } else {
                            data = $('<span></span>').append(data);
                        }
                        if (isInDom) {
                            showSelects(); 
                        }
                        if (!options.persist) {
                            // need to reshow before cloning, then hide, in quirks mode. 

                            data = data.clone();
                            dataParent = null;
                            if (isInDom) {
                                hideSelects();
                            }
                        }
                    }
                }
            }
            else if (typeof source === 'string' || typeof source === 'number') {
                // just insert the data as innerHTML
                data = $('<div></div>').html(source);
            }
            else {
                // unsupported data type!
                alert('SimpleModal Error: Unsupported data type: ' + typeof source);
                return me;
            }

            create(data);

            if ($.isFunction(options.onOpen)) {
                options.onOpen.call(me, me.data());
            }


            if (!iframe || !options.iframeWait) {
                me.show();
            }

        };

        me.blockUI = function (loading) {
            if (overlay) { return; }

            winSize.captureWindow();
            overlay = $('<div></div>')
				.addClass('simplemodal-overlay')
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

            // bind keydown event whenever blocking UI to be sure it can be removed regardless of outcome
            $(document).bind('keydown.simplemodal', function (e) {
                if (options.modal && e.keyCode === 9) { // TAB
                    me.watchTab(e);
                }
                if ((options.close && options.escClose) && e.keyCode === 27) { // ESC
                    e.preventDefault();
                    me.close.call(this, e);
                }
            });
            // bind the overlay click to the close function, if enabled
            if (options.close && options.overlayClose) {
                overlay.bind('click.simplemodal', me.close);
            }

        };
        me.unblockUI = function () {
            $(overlay).remove();
        };

        // manage tab key operation
        me.watchTab = function (e) {
            var pos, s = this;

            if ($(e.target).parents('.simplemodal-container').length > 0) {
                // save the list of inputs
                inputs = $(':input:enabled:visible:first, :input:enabled:visible:last', data[0]);

                // if it's the first or last tabbable element, refocus
                if ((!e.shiftKey && e.target === s.inputs[inputs.length - 1]) ||
						(e.shiftKey && e.target === inputs[0]) ||
						inputs.length === 0) {
                    e.preventDefault();
                    pos = e.shiftKey ? 'last' : 'first';
                    me.focus(pos);
                }
            }
            else {
                // might be necessary when custom onShow callback is used
                e.preventDefault();
                me.focus();
            }
        };
        me.focus = function (pos) {
            // focus on dialog or the first visible/enabled input element

            var p = pos && $.inArray(pos, ['first', 'last']) !== -1 ? pos : 'first',
                input = $(':input:enabled:visible:' + p, wrap);
            setTimeout(function () {
                if (input.length > 0) {
                    input.focus();
                } else {
                    wrap.focus();
                }
            }, 10);
        };
        me.data = function () {
            return {
                overlay: overlay,
                data: data,
                container: container,
                wrap: wrap,
                iframe: iframe
            };
        };
        me.show = function () {
            // ensure any pending async operation doesn't do anything
            if (!active) {
                return;
            }
            if (quirks) {
                hideSelects();
            }
            $(overlay).find("." + options.loadingClass).remove();
            container.show();
            if (iframe) {
                iframe.show();
            }
            winSize.captureDataHeight();

            if (data) {
                data.show();
            }
            winSize.captureWindow();
            winSize.configure();

            if ($.isFunction(options.onShow)) {
                options.onShow.call(me, me.data());
            }
        };

        me.close = function (e) {
            // Deal with "occb" problem. Assume if close is not called from a DOM element event, then we want to really close it
            // otherwise, treat it as an event and capture any user defined callback
            if (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                    if ($.isFunction(options.onClose) && typeof e === 'object') {
                        options.onClose.call(this, me.data());
                        return;
                    }
                }
            }

            active = false;

            // Restore the dialog source to its original location if it came from the DOM
            if (dataParent) {
                dataParent.append(data.css("display", dataDisplay));
                dataParent = null;
            }

            $('.' + options.closeClass).unbind('click.simplemodal');
            $(overlay).unbind('click.simplemodal');
            $(window).unbind('resize.simplemodal');
            $(document).unbind('keydown.simplemodal');

            // Restore hidden SELECT elements in IE6
            showSelects();
            if (container) {
                container.remove();
                container = null;
            }
            wrap = null;
            if (overlay) {
                overlay.remove();
                overlay = null;
            }
            data = null;
        };
        me.resize = function () {
            winSize.captureWindow();
            winSize.configure();

        };
        me.loadFromUrl = function (url) {
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
                    html= obj;
                }
                return $( $.parseHTML(html));

            }
            // called on ajax load success, or immediately if in same page
            function loaded(obj) {
                var cur, sub,
                    content = obj instanceof jQuery ?
                    obj :
                    extractBodyHtml(obj);



                if (anchor) {
                    sub = content.find('#' + anchor).children()

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
                    $.modal.impl.main(content);
                }
            }

            if (active) {
                return;
            }
            active = true;
            $.modal.init(options);
            $.modal.block();

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
        };
        return me;
    } ());


} (jQuery));