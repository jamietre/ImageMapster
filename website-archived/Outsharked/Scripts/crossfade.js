(function ($) {
    $.fn.cross = function (options) {
        return this.each(function (i) {
            // cache the copy of jQuery(this) - the start image
            var $$ = $(this);

            // get the target from the backgroundImage + regexp
            var target = $$.attr('altimage');

//            var target = $$.css('altimage').replace(/^url|[\(\)'"]/g, '');
//            $$.wrap('<span style="position: relative;"></span>')
//                    .parent()
//                    .prepend('<img>')
//                    .find(':first-child')
//                    .attr('src', target);

            

            /*
            // the CSS styling of the start image needs to be handled
            // differently for different browsers
            if ($.browser.msie || $.browser.mozilla) {
                $$.css({
                    'position': 'absolute',
                    'left': 0,
                    'background': '',
                    'top': this.offsetTop
                });
            } else if ($.browser.opera && $.browser.version < 9.5) {
                // Browser sniffing is bad - however opera < 9.5 has a render bug 
                // so this is required to get around it we can't apply the 'top' : 0 
                // separately because Mozilla strips the style set originally somehow...                    
                $$.css({
                    'position': 'absolute',
                    'left': 0,
                    'background': '',
                    'top': "0"
                });
            } else { // Safari
                $$.css({
                    'position': 'absolute',
                    'left': 0,
                    'background': ''
                });
            }
            */

            // similar effect as single image technique, except using .animate 
            // which will handle the fading up from the right opacity for us
            $$.hover(function () {
                $$.stop().animate({
                    opacity: 0,
                    backgroundImage: "url('" + target + "')"
                }, 250);
            }, function () {
                $$.stop().animate({
                    opacity: 1,
                    backgroundImage: "url('"+target+"')"
                }, 250);
            });
        });
    };

})(jQuery);