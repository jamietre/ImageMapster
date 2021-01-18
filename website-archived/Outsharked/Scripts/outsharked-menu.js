/*global _gaq: true, outsharked: true */

if (typeof outsharked === 'undefined') {
    outsharked = {};
}
(function (ns) {
    ns.Menu = function (list) {
        var useJavascript,me = this;
        function shrink(animEl) {
            animEl.stop().animate({
                'font-size': me.normalSize,
                'padding-top': me.paddingTopNormal
            }, me.duration * 2);
            animEl.removeClass(me.activeClass);
        }
        function enlarge(animEl) {
            animEl.stop().animate({
                'font-size': me.activeSize,
                'padding-top': me.paddingTopActive
            }, me.duration,
            function () {
                animEl.addClass(me.activeClass);
            });
        }
        useJavascript = (function() {
            var agent = navigator.userAgent;
            return agent.indexOf('Android')<0 ;
        }());
        me.normalSize=24;
        me.activeSize = 38;
        me.paddingTopNormal = 20;
        me.paddingTopActive = 10;
        me.activeClass = 'big';

        me.active = null;
        me.BaseUrl = null;
        me.duration = 200;
        me.state = null;            // html5 history - state seems broken in chrome
        me.menu = $(list);
        if (useJavascript) {
            this.menu.find('li a').bind('mouseover', function () {
                var animEl = me.getElement(this);

                if (animEl && animEl[0] !== me.active) {
                    enlarge(animEl);
                }
            }).bind('mouseout', function () {
                if (this === me.active) {
                    return;
                }
                var animEl = me.getElement(this);
                if (animEl) {
                    shrink(animEl);
                }
            }).bind('click', function (e) {
                var wrapper, animEl,outsideUrl;
                this.blur();
                e.preventDefault();
               animEl= me.getElement(this);
                outsideUrl = me.NavigateLink(this,animEl[0].id);

            
                if (outsideUrl) {
                    wrapper = $('<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden;"></div>');
                    $('body').append(wrapper);
                    wrapper.append($('body').children().not(wrapper))
                            .animate({
                                'width': 0,
                                'height': 0,
                                'left': $(window).width() / 2,
                                'top': $(window).height() / 2
                            }, me.duration * 2,
                            function () {
                                window.location = outsideUrl;
                            });
                    return;
                }
                me.SetActiveMenu(animEl);
            }).bind('mousedown', function (e) {
                e.preventDefault();
                this.blur();
                return false;
            });
            
            //$('.nav').not(this.menu).live('click', function (e) {
            $(document).on('click', '.nav', function (e) {
                e.preventDefault();
                if (e.target.parentElement !== me.active) {

                    me.NavigateLink(this, null);
                }
            });
        }
        

        window.onpopstate = function(e) {  
            if (e.state && e.state.nav) {
                me.Navigate(window.location.href);
                if (e.state.active) {
                    me.SetActiveMenu($('#'+e.state.active));
                }
            }
        };

    };

    ns.Menu.prototype.SetActiveMenu=function(activeEl) {
        this.menu.find('li div').removeClass('selected');
        this.active = activeEl[0];
        if (activeEl) {
            activeEl.addClass('selected');
        }
    };
    ns.Menu.prototype.getElement = function (activator) {
        return $(activator).closest('div');
    };
    ns.Menu.prototype.getIfIdle = function (activator) {
        var el = this.getElement(activator);
        if (!el.is(":animated")) {
            return el;
        }
        return null;
    };
    ns.Menu.prototype.NavigateLink = function (anchor,activeMenuID) {
        var el, activeEl,
            a=$(anchor),
            href= a.attr('href'),
            local=a.attr('data-local');

        if (!local) {
            return href;
        }
        // TODO - this is sort of sloppy. we should be passing activeEl to this function instead aand always setting active menu here
        if (!activeMenuID) {
            el = this.menu.find('a[href="'+href+'"]');
            if (el.length) {
                activeEl = this.getElement(el);
                activeMenuID = activeEl[0].id;
                this.SetActiveMenu(activeEl);
            }
        }
        this.SetNavState(href,activeMenuID);
        this.Navigate(href);
    };
    ns.Menu.prototype.SetNavState=function(href,activeMenuID)
    {
        var his = window.history, action,
            stateHref=href || window.location.href,
            stateActiveMenuID = activeMenuID || this.menu.find('.selected').attr('id');

        if (his && his.pushState) {
           // if same URL but different hashtag, don't add a state, just replace
            if (this.state && this.state.href.split('#')[0] === stateHref.split('#')[0]) {
                // why can't i alias the native functions? nothing works except wrapping it
                action = function(a1,a2,a3) { his.replaceState(a1,a2,a3); };
            } else {
                action = function(a1,a2,a3) { his.pushState(a1,a2,a3); };
            }
            this.state = {
                "nav": true, 
                "active": stateActiveMenuID,
                "href": stateHref
            };
            action(this.state, "", stateHref);
        }
    };
    ns.Menu.prototype.Navigate=function(href) {
        var urlTarget, urlFinal, parms,loaded=false,
            me=this;

        function clearUi() {
            $('.modal-loading').remove();
        }
        function blockUi() {
            var pos, win;
            pos = $('#content').position();
            win = $(window);
            $('body').append($('<div></div>')
                .addClass('modal-loading')
                .css({
                    position: 'absolute',
                    'background-color': '#bbbbbb',
                    width: win.width() - pos.left + "px",
                    height: win.height() - pos.top+ "px",
                    opacity:  0.2,
                    top: pos.top,
                    left: pos.left
                  }));
        }

        urlTarget = href.split('?');

        if (urlTarget.length>1) {
           parms = urlTarget[1];
        } else {
            parms="default";
        }
        urlFinal = this.BaseUrl.replace("{0}",parms);

        // set a callback to show ajax loader only if it doesn't come up right away
        window.setTimeout(function() {
            if (!loaded) {
                blockUi();
            }
        },200);

        $.get(urlFinal, function (data) {
            var content,
                oldContent = $('#content');

            loaded=true;
            clearUi();
            _gaq.push(['_trackPageview'], window.location.href);

            oldContent.find('img').mapster('unbind');
            oldContent.find('area').unbind();
            oldContent.empty();

            content = $("<div></div>").append($(data)).find('#content').children();

                
            oldContent.html(content);
                        
            if ($.isFunction(me.onLoad)) {
                me.onLoad();
            }
        



          }
        ).error(function() { 
            alert('Unable to load content for url: ' + urlFinal); 
        });

         
        return false;
    };
}(outsharked));
