/*
   Modified 9/11/11 by James A Treworgy from original source (v1.4) to be even simpler.
   Lets's call this ersion 1.0.1

   onNavigate: whenever the current location is changed (not just expand/collapse)
*/
/**
*	@name							Accordion
*	@descripton						This Jquery plugin makes creating accordions pain free
*	@version						1.4
*	@requires						Jquery 1.2.6+
*
*	@author							Jan Jarfalk
*	@author-email					jan.jarfalk@unwrongest.com
*	@author-website					http://www.unwrongest.com
*
*	@licens							MIT License - http://www.opensource.org/licenses/mit-license.php
*/

(function (jQuery) {
    jQuery.accordion = {
        bound: []
    };
    jQuery.fn.extend({
        accordion: function (opts) {
            var options = opts || {},
                curActive = null,
                a = jQuery.accordion;
            return this.each(function () {
                if ($.inArray(this, a.bound) >= 0) {
                    return true;
                }
                a.bound.push(this);

                var activateClass = 'accordion',
					activeClassName = 'active',
                    inactiveClassName = 'inactive',
					activationEffect = 'slideToggle',
					panelSelector = 'ul, div',
					activationEffectSpeed = 'fast',
					itemSelector = 'li',
                    $ul = $('.' + activateClass),
                    active = (location.hash) ?  
                        $ul.find('a[href=' + location.hash + ']').parent()[0] :
                        $ul.find('li.' + activeClassName)[0];

                function activate(el, effect) {

                    var newActive, cur = $(el).parent(itemSelector);
                    if (cur.hasClass(activeClassName)) {
                        cur.removeClass(activeClassName)
                            .addClass(inactiveClassName);
                    } else {
                        cur.addClass(activeClassName)
                            .removeClass(inactiveClassName);
                        newActive = cur;
                    }

                    cur.siblings()
                        .addClass(inactiveClassName)
                        .removeClass(activeClassName)
                        .children(panelSelector)
                        .slideUp(activationEffectSpeed);

                    $(el).siblings(panelSelector)[(effect || activationEffect)](((effect === "show") ? activationEffectSpeed : false));
                    if (newActive !== curActive && $.isFunction(options.onNavigate)) {
                        options.onNavigate(this, newActive);
                        curActive = newActive;
                    }
                }

                $.each($ul.find('li>ul, li>div'), function () {
                    var cur = $(this);

                    if (cur.parent()[0] === active) {
                        cur.parent().addClass(activeClassName);
                        cur.show();
                    } else {
                        cur.parent().addClass(inactiveClassName);
                        cur.hide();
                    }
                });

                $.each($ul.find('> li > a'), function () {
                    var cur = $(this);
                    cur.click(function (e) {
                        var urlParts = this.href.split('#');
                        e.preventDefault();
                        if (urlParts.length > 0) {
                            window.location.hash = urlParts[urlParts.length - 1];
                        }
                        activate(this, activationEffect);
                        return void (0);
                    });

                    cur.bind('activate-node', function () {
                        $ul.find(panelSelector).not(cur.parents()).not(cur.siblings()).slideUp(activationEffectSpeed);
                        activate(this, 'slideDown');
                    });
                });



                if (active) {
                    activate(active, false);
                }
            }); // each
        }
    });
} (jQuery));