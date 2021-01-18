/* hSlide plugin
Copyright 2011 James Treworgy
http://www.outsharked.com/hslide
https://github.com/jamietre/hslide

Simple horizontal slide

/// LICENSE (MIT License)
///
/// Permission is hereby granted, free of charge, to any person obtaining
/// a copy of this software and associated documentation files (the
/// "Software"), to deal in the Software without restriction, including
/// without limitation the rights to use, copy, modify, merge, publish,
/// distribute, sublicense, and/or sell copies of the Software, and to
/// permit persons to whom the Software is furnished to do so, subject to
/// the following conditions:
///
/// The above copyright notice and this permission notice shall be
/// included in all copies or substantial portions of the Software.
///
/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
/// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
/// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
/// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
/// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
/// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
/// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///

*/

(function ($) {
    var methods;
    $.fn.hslide = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method) {
            return methods.slide.apply(this, arguments);
        }
        else {
            $.error('Method ' + method + ' does not exist on jQuery.mapster');
        }
    };
    $.hslide = {};
    // utility functions

    $.hslide.defaults = {
        duration: 600,
        direction: 'left',
        callback: null
    };


    $.hslide.impl = (function () {
        var me = {},
            u = $.hslide.utils;
        me.slide = function (slideTo, opts) {
            var pane1, pane2, panes, wrapper, innerWrapper, ieWrapper, defaultFloat, defaultPosition, options,
                height, width;

            var do_slide = function () {
                var offset = (options.direction === 'left' ? '-=' : '+=') + width + 'px';

                function finish() {
                    wrapper.before(panes).remove();

                    pane1.hide();

                    pane2.css({ left: 0,
                        float: defaultFloat,
                        position: defaultPosition
                    });

                    //panes.removeAttr('hslide');
                    panes.each(function () {
                        $(this).data('slide.active', false);
                    });

                    if (options.callback) {
                        options.callback.call(null);
                    }


                }

                innerWrapper.animate({
                    left: offset
                },
                    options.duration,
                    function () { finish(); }
                );


            }


            pane1 = $(this);
            pane2 = $(slideTo);
            panes = pane1.add(pane2);
            ///if (panes.filter('[hslide="sliding"]').length>0) {
            ///    return false;
            ///}
            var inprogress = false;
            panes.each(function () {
                if ($(this).data('slide.active')) {
                    inprogress = true;
                }
            });
            if (inprogress) {
                return false;
            }
            panes.each(function () {
                $(this).data('slide.active', true);
            });

            options = $.hslide.defaults;
            if (opts) {
                $.extend(options, opts);
            }

            width = pane1.outerWidth();
            height = Math.max(pane1.outerHeight(), pane2.outerHeight());
            // store existing positioning css
            defaultFloat = pane1.css('float');
            defaultPosition = pane1.css('position');
            wrapper = $('<div style="word-wrap: break-word; overflow:hidden; width:' + width + 'px;height:' + height + 'px;position:relative;float:' + defaultFloat + ';"></div>');
            // add 10 px - something off with IE
            innerWrapper = $('<div style="position: absolute; display:block; width:' + (width * 2 + 10) + 'px; height: ' + height + 'px;"></div>');
            pane1.before(wrapper);
            wrapper.append(innerWrapper);

            if (options.direction === 'left') {
                innerWrapper.append(pane1).append(pane2);
                panes.css({ left: 0 });
            } else {
                innerWrapper.append(pane2).append(pane1);
                panes.css({ left: -1 * width });
            }
            panes.css({ float: 'left', position: 'relative' });
            pane2.css({ display: 'block', position: 'relative', width: width, height: height });

            do_slide();
            return this;
        };

        return me;
    }
    ());


    /// Code that gets executed when the plugin is first loaded
    methods =
    {
        slide: $.hslide.impl.slide
    };
})(jQuery);
