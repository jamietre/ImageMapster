/*global Test: true, iqtest, image, map_options, areas,  */
/*jslint onevar: false */



this.tests = this.tests || [];

this.tests.push(
    iqtest.create("tooltips","tests for imagemapster tooltips")
    .add("Imagemap tooltips", function (a, r) {
        
        var me=this,
            getPromise= function(name) {
                return me.promises(name);
            },
            options = $.extend(map_options, {
                onConfigured: getPromise("configured").resolve
            }),
            map = image.mapster(options);

        function setCallback(option,cb) {
            var obj = {};
            obj[option]=cb ?
                    function(e) {
                    e = e || {};
                    e.this_context = this;
                    cb(e);
                }: null;
            map.mapster('set_options', obj);
        }


        map.mapster('set_options',{ 
            areas: [{
                key: 'TX',
                toolTip: "Don't mess with Texas",
                toolTipClose: 'tooltip-click'
            }]
        });

        getPromise("configured").then(function() {
            a.equals(0,$('.mapster_tooltip').length);

            setCallback("onShowToolTip",getPromise("shown1").resolve);
            $('area[state=TX]').mouseover();

            getPromise("shown1").then(function() {
                a.equals(1,$('.mapster_tooltip').length,"Tooltip was shown");
                
                setCallback("onShowToolTip",null);
                setCallback("onMouseover",getPromise("removed1").resolve);
                $('area[state=NV]').mouseover();
            });

            getPromise("removed1").then(function() {
                a.equals(0,$('.mapster_tooltip').length,"Activating another area removes tooltip");
                
                setCallback("onMouseover",null);
                setCallback("onShowToolTip",getPromise("shown2").resolve);
                $('area[state=TX]').mouseover();
            });

            getPromise("shown2").then(function() {
                a.equals(1,$('.mapster_tooltip').length,"Tooltip whas shown again");
                
                setCallback("onShowToolTip",null);
                setCallback("onHideToolTip",getPromise("click1").resolve);
                $('.mapster_tooltip').click();
            });

            getPromise("click1").then(function() {
                a.equals(0,$('.mapster_tooltip').length,"Clicking tooltip removes it");
                getPromise("finished").resolve();
            });
        });

        a.resolves(getPromise("finished"),"The last test resolved");


    }));



   
       
