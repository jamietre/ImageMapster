function startupConfigureNav() {
    if (!ie6) {
        $('.navigation a[altimage], .navlink').live('click',function (e) {
            switchNav.call(this, e);
        });
    }
    configureNav();
}
var tries = 20;
var ie6;
var contentHtml;
function loadAfterAnimation() {
    if (tries < 0) {
        loadErrorContent();
        return;
    }
    if (!contentHtml) {
        tries--;
        window.setTimeout(loadAfterAnimation, 200);
    } else {
        loadPageContent(contentHtml);
    }
}

function switchNav(e) {
    // Clear out duplicates from bg swap
    e.preventDefault();
    tries = 20;

    $('.main-content').addClass('loading');
    $('.rollover').remove();
    doSwitchNav($(this).attr('cpage'));
    
}
function doSwitchNav(toPage) {
    $.get("/getnav.aspx?page=" + toPage, function (data) {
        // use the async data as the quicksand target - it needs the new order
        navigatePage(toPage, function (html) {
            contentHtml = html;
        });
        if (!ie6) {
            $('.navigation ul').quicksand(
                $(data).find('li'), {
                    attribute: 'qsid',
                    adjustHeight: 'false'
                },
                function () {
                    configureNav();
                    loadAfterAnimation();
                }
            );
        } else {
            loadAfterAnimation();
        }
    });

}
// Must be run after each quicksand - "live" doesn't do it 
function configureNav() {
    // Clear out cache from bg swap - otherwise the entities from quicksand (same IDs, different things) will confuse it
    jQuery.BgImageTransitions = [];
    // bind mouse events to the nav items
    if (!ie6) {
        $('.fade').each(function (i) {
            var elm, swap, orig, target;
            elm = $(this);
            swap = elm.find('a');
            orig = swap.css('backgroundImage').replace(/^url|[\(\)'"]/g, '');
            target = swap.attr('altimage');
            elm.unbind("mouseenter").unbind("mouseleave");
            if (target) {
                elm.hover(
                function () {
                    enter(swap, resolvePath(target), orig);
                },
                function () {
                    leave(swap, orig);
                }
            );
            }
        });
    }

    function enter(elm, target, orig) {
        elm.BgImageTransition(target, {
            duration: 250
        });
    }
    function leave(elm, orig) {
        elm.stop().BgImageTransition(orig, {
            duration: 250
        });
    }

}
// Load page content asynchronously using "cpage" attr
function navigatePageFromLink(e) {
    //var selImage = e.attr('selimage');
    // e.BgImageTransition(selImage,{duration:100});
    navigatePage(e.attr('cpage'));
}

// Load page content asynchronously
// if a callback is provided, then don't show it
function navigatePage(pageNum,callback) {
    $.get(resolvePath('~/getcontent.aspx?page=' + pageNum), function (data) {
        // set page location for reloads
        var loc = window.location.href;
        window.location.href = (loc + '#').substring(0, loc.indexOf('#')) + '#p' + (pageNum || '1');
        var innerHtml = $(getForm($(data))).html();
        if (callback) {
            callback(innerHtml);
        } else {
            loadPageContent(innerHtml);
        }
    });
}
function loadPageContent(html) {
    $('.main-content').removeClass('loading').html(html);
    var ie6div = $('#ie6');
    if (ie6) {
        ie6div.show();
    } else {
        ie6div.remove();
    }
}
function loadErrorContent() {
    $('.main-content').removeClass('loading').html('<p><b>Error: unable to load page content.</b> I waited for a while but it never arrived, perhaps there is a server problem.</p>');
}
// For some reason jquery ajax .get can't parse the data from a full html page directly, so extract the form element and go from there
function getForm (obj) {
    for (var elm in obj) {
        tagName = obj[elm].tagName;
        if (tagName && tagName.toLowerCase() === 'form') {
            return obj[elm];
        }
    }
    return null;
}

$(document).ready(function () {
    ie6 = ($.browser.msie && $.browser.version < 7);
    startupConfigureNav();
    var page
    //var pageFromLink = $('#LoadPage'),
    var pagePos = window.location.href.indexOf('#');
    if (pagePos > 0) {
        page = window.location.href.substring(pagePos + 2);
        doSwitchNav(page);
    } 
//    else if (pageFromLink.length > 0) {
//        page = pageFromLink.val();
//        navigatePage(page);
//    } else {
//        var elm = $('#nav0').find('a');
//        navigatePageFromLink(elm);
//    }
});