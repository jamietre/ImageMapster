/*global outsharked: true */
$(document).ready(function () {

    var hasCanvas = null,
        forkme = $('#forkme'),
        forkme_options = {
            mapKey: 'data-group',
            isSelectable: false,
            fadeDuration: 400,
            fillOpacity: 0.5,
            noHrefIsMask: false,
            onMouseover: function () {
                if (hasCanvas) {
                    setTimeout(function () {
                        if (forkme.mapster('highlight') === 'main') {
                            forkme.mapster('set', true, 'main');
                            forkme.mapster('highlight', false);
                            forkme.mapster('highlight', 'fork');
                        }
                    }, 500);
                }
            },
            onConfigured: function () {
                if (hasCanvas === null) {
                    hasCanvas = $.mapster.hasCanvas;
                    if (!hasCanvas) {
                        forkme.unbind();
                        forkme.mapster($.extend(true, {}, forkme_options, {
                            render_highlight: { altImage: null }
                        }));
                    }
                }
            },
            onMouseout: function () {
                $('#forkme').mapster('set', false, 'main');
            },
            onClick: function () {
                window.open("https://www.github.com/jamietre/imagemapster");
            },
            render_highlight: {
                altImage: 'images/fork-alt.gif'
            },
            render_select: {
                altImage: 'images/fork-alt.gif'
            }
        },
        modalDefaults = {
            minWidth: 600,
            minHeight: 100,
            maxWidth: 1000,
            maxHeight: 700,
            loadingClass: 'modal-loading',
            persist: false,
            iFrameWait: true,
            opacity: 20,
            zIndex: 10000
        };

    // git logo animation
    forkme.mapster(forkme_options);

    // Configure main menu animation
    $('#logo_img').mapster({
        fillColor: 'e21a1a',
        stroke: true,
        strokeWidth: 2,
        strokeColor: 'ffffff',
        singleSelect: true 
     });



    // popup urls
    $(document).on('click','a.popup',function (e) {
        e.preventDefault();
        $.modal.close();
        var target = $(this).attr("href");
        if (target.substring(0, 1) === "#") {
            $.modal.simple($(target).clone().show());
        } else {
            $.modalurl(target, modalDefaults);
        }

    });

    function onLoad(content) {
        //$('#content').find('.scripts').each(function () {
        //    $.getScript($(this).attr('data-src'));
        //});
        //$('.accordion').accordion({ autoHeight: false });
        if (window.configure) {
            window.configure(content, true);
        }
    }

    menu = new outsharked.Menu('ul.menu');
    menu.BaseUrl = "Default.aspx?raw=1&page={0}";
    menu.onLoad = onLoad;
    menu.SetNavState();

    onLoad($('#content'));


});