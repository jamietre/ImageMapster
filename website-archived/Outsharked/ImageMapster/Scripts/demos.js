/*global outsharked: true, configure: true, menu: true */
$(document).ready(function () {
    var demos = {};
    demos.configured = false;
    demos.configured_safari = false;
    // use to test whether the page has been reloaded

    demos.usaimg = null;

    configure = function (content, async) {

        var demoPage, i, items, ver,
            browserInfo = navigator.userAgent.split(' '),
            isBadSafari = (navigator.userAgent.indexOf('Safari') >= 0 && navigator.userAgent.indexOf('Version/5.0.5') >= 0),
            confCount = 0;

        isBadSafari = false;

        //alert(navigator.userAgent);
        //        for (i = 0; i < browserInfo.length; i++) {
        //            items = browserInfo[i].split('/');
        //            if (items[0] == 'Version') {
        //                ver = parseFloat(items[1]);

        //            }
        //        }

        content = content || $('body');
        demoPage = content.find('#accordion').length;


        if (!demoPage) {
            return;
        }
        //        if (demos.configured) {
        //            // force full page reload with Safari if we are being reconfigured (e.g. async load). No idea why it broke.
        //            if (isBadSafari) {
        //                // hilariously, this is the only way I can figure to get Mac to load this page properly. It refuses
        //                // to acknowledge that the <map> is part of the same DOM. 
        //                $('body').hide();
        //                window.location.href = window.location.href;
        //            }
        //        }
        // this script is going to run before the stuff is added to the DOM so need to ensure we don't try to configure too soon



        demos.configured = true;
        demos.usaimg = content.find('#usa')[0];



        content.find('#accordion').accordion({
            onNavigate: function () {
                menu.SetNavState();
            }
        });

        function configured() {
            return;
        }
        // usa (inline) demo code


        var commonOpts = {
            safeLoad: isBadSafari
        };

        var opts = $.extend({}, commonOpts, {
            fillOpacity: 0.5,
            render_highlight: {
                fillColor: '2aff00',
                stroke: true,
                altImage: 'examples/images/usa_map_720_alt_4.jpg'
            },
            configTimeout: 30000,
            render_select: {
                fillColor: 'ff000c',
                stroke: false,
                altImage: 'examples/images/usa_map_720_alt_5.jpg'
            },
            fadeInterval: 50,
            mapKey: 'data-state',
            areas: [
            {
                key: 'TX',
                selected: true
            },
            {
                key: 'ME',
                selected: true
            },
            {
                key: 'WA',
                staticState: false
            },
            {
                key: 'OR',
                isSelectable: false
            }
            ]
        });

        content.find('#usa')
            .mapster('unbind')
            .mapster(opts);

        // veg demo code
        // a cross reference of area names to text for each area's tooltip
        var xref = {
            carrots: "<b>Carrots</b> are delicious and may turn your skin orange!",
            asparagus: "<b>Asparagus</b> is one of the first vegetables of the spring. Being a dark green, it's great for you, and has interesting side effects.",
            squash: "<b>Squash</b> is a winter vegetable, and not eaten raw too much. Is that really squash?",
            redpepper: "<b>Red peppers</b> are actually the same as green peppers, they've just been left on the vine longer. Delicious when fire-roasted.",
            yellowpepper: "Similar to red peppers, <b>yellow peppers</b> are sometimes sweeter.",
            celery: "<b>Celery</b> is a fascinating vegetable. Being mostly water, it actually takes your body more calories to process it than it provides.",
            cucumbers: "<b>Cucumbers</b> are cool.",
            broccoli: "<b>Broccoli</b> is like a forest of goodness in your mouth. And very good for you. Eat lots of broccoli!",
            dip: "Everything here is good for you but this one. <b>Don't be a dip!</b>"
        };

        var defaultDipTooltip = 'I know you want the dip. But it\'s loaded with saturated fat, just skip it and enjoy as many delicious, crisp vegetables as you can eat.';

        var image = content.find('#vegetables');

        opts = $.extend({}, commonOpts, {
            fillOpacity: 0.4,
            fillColor: "d42e16",
            strokeColor: "3320FF",
            strokeOpacity: 0.8,
            strokeWidth: 4,
            stroke: true,
            isSelectable: true,
            singleSelect: true,
            mapKey: 'data-name',
            listKey: 'data-name',
            onClick: function (e) {
                var newToolTip = defaultDipTooltip;
                $('#selections').html(xref[e.key]);
                if (e.key === 'asparagus') {
                    newToolTip = "OK. I know I have come down on the dip before, but let's be real. Raw asparagus without any of that " +
                            "delicious ranch and onion dressing slathered all over it is not so good.";
                }
                image.mapster('set_options', { areas: [{
                    key: "dip",
                    toolTip: newToolTip
                }]
                });
            },
            showToolTip: true,
            toolTipClose: ["tooltip-click", "area-click", "image-mouseout"],
            areas: [
                    {
                        key: "redpepper",
                        fillColor: "ffffff"
                    },
                    {
                        key: "yellowpepper",
                        fillColor: "000000"
                    },
                    {
                        key: "carrots",
                        fillColor: "000000"
                    },
                    {
                        key: "dip",
                        toolTip: defaultDipTooltip
                    },
                    {
                        key: "asparagus",
                        strokeColor: "FFFFFF"
                    }
                    ]
        });

        image.mapster('unbind').mapster(opts);

        // frog

        opts = $.extend({}, commonOpts, {
            onConfigured: configured,
            mapKey: 'name',
            singleSelect: true,
            altImage: 'examples/images/frog_map_alt.jpg',
            altImageOpacity: 0.8,
            fillOpacity: 0.5,
            fillColor: 'f4ff75',
            areas: [
            {
                key: 'menu1hot',
                staticState: false,
                includeKeys: 'menu1'
            },
            {
                key: 'menu2hot',
                staticState: false,
                includeKeys: 'menu2'
            },
            {
                key: 'menu3hot',
                staticState: false,
                includeKeys: 'menu3'
            },
            {
                key: 'menu4hot',
                staticState: false,
                includeKeys: 'menu4'
            }
            ]
        });

        content.find('#frog')
            .mapster('unbind')
            .mapster(opts);

        // shapes

        opts = $.extend({}, commonOpts, {
            onConfigured: configured,
            noHrefIsMask: false,
            fillColor: '0a7a0a',
            fillOpacity: 0.7,
            mapKey: 'data-group',
            strokeWidth: 2,
            stroke: true,
            strokeColor: 'F88017',
            render_select: {
                fillColor: 'adadad'
            },
            areas: [
		    {
		        key: 'blue-circle',
		        includeKeys: 'rectangle',
		        stroke: false
		    },
		    {
		        key: 'rectangle',
		        stroke: true,
		        strokeWidth: 3
		    },
		    {
		        key: 'outer-circle',
		        includeKeys: 'inner-circle-mask,outer-circle-mask',
		        stroke: true
		    },
		    {
		        key: 'outer-circle-mask',
		        isMask: true,
		        fillColorMask: 'ff002a'
		    },
		    {
		        key: 'inner-circle-mask',
		        fillColorMask: 'ffffff',
		        isMask: true
		    }
	    ]
        });

        content.find('#shapes')
            .mapster('unbind')
            .mapster(opts);

        // gelderland - "resize" demo

        opts = $.extend({}, commonOpts, {
            onConfigured: configured,
            mapKey: 'data-title',
            stroke: true,
            strokeWidth: 2,
            strokeColor: 'ff0000'
        });
        content.find('#gelderland')
            .mapster('unbind')
            .mapster(opts);

        content.find('#make-small').bind('click', function () {
            $('#gelderland').mapster('resize', 200, 0, 1000);
        });
        content.find('#make-big').bind('click', function () {
            $('#gelderland').mapster('resize', 720, 0, 1000);
        });
        $('#make-any').bind('click', function () {
            $('#gelderland').mapster('resize', $('#new-size').val(), 0, 1000);
        });

        // beatles demo

        // Set up some options objects: 'single_opts' for when a single area is selected, which will show just a border
        // 'all_opts' for when all are highlighted, to use a different effect - shaded white with a white border
        // 'initial_opts' for general options that apply to the whole mapster. 'initial_opts' also includes callbacks
        // onMouseover and onMouseout, which are fired when an area is entered or left. We will use these to show or
        // remove the captions, and also set a flag to let the other code know if we're currently in an area.


        var inArea,
            map = content.find('#beatles'),
            captions = {
                paul: ["Paul McCartney - Bass Guitar and Vocals",
                    "Paul McCartney's song, Yesterday, recently voted the most popular song "
                      + "of the century by a BBC poll, was initially composed without lyrics. "
                      + "Paul used the working title 'scrambled eggs' before coming up with the final words."],
                ringo: ["Ringo Starr - Drums",
                  "Dear Prudence was written by John and Paul about Mia Farrow's sister, Prudence, "
                    + "when she wouldn't come out and play with Mia and the Beatles at a religious retreat "
                    + "in India."],
                john: ["John Lennon - Guitar and Vocals",
                  "In 1962, The Beatles won the Mersyside Newspaper's biggest band in Liverpool "
                    + "contest principally because they called in posing as different people and voted "
                    + "for themselves numerous times."],
                george: ["George Harrison - Lead Guitar and Vocals",
                 "The Beatles' last public concert was held in San Francisco's Candlestick "
                    + "Park on August 29, 1966."]
            },
            single_opts = {
                fillColor: '000000',
                fillOpacity: 0,
                stroke: true,
                strokeColor: 'ff0000',
                strokeWidth: 2
            },
            all_opts = {
                fillColor: 'ffffff',
                fillOpacity: 0.6,
                stroke: true,
                strokeWidth: 2,
                strokeColor: 'ffffff'
            },
            initial_opts = {
                mapKey: 'data-name',
                isSelectable: false,
                onMouseover: function (data) {
                    inArea = true;
                    $('#beatles-caption-header').text(captions[data.key][0]);
                    $('#beatles-caption-text').text(captions[data.key][1]);
                    $('#beatles-caption').show();
                },
                onMouseout: function (data) {
                    inArea = false;
                    $('#beatles-caption').hide();
                }
            };
        opts = $.extend({}, commonOpts, initial_opts, single_opts);


        // Bind to the image 'mouseover' and 'mouseout' events to activate or deactivate ALL the areas, like the
        // original demo. Check whether an area has been activated with "inArea" - IE&lt;9 fires "onmouseover" 
        // again for the image when entering an area, so all areas would stay highlighted when entering
        // a specific area in those browsers otherwise. It makes no difference for other browsers.

        map.mapster(opts)
            .bind('mouseover', function () {
                if (!inArea) {
                    map.mapster('set_options', all_opts)
                    .mapster('set', true, 'all')
                    .mapster('set_options', single_opts);
                }
            }).bind('mouseout', function () {
                if (!inArea) {
                    map.mapster('set', false, 'all');
                }
            });
    };

    configure($('#content'));

});