/*global Test: true, iqtest, image, map_options, areas */
/*jslint onevar: false */

this.tests = this.tests || [];

this.tests.push(
    iqtest.create("events","tests for imagemapster events")
    .add("Mouse Events", function (a, r) {
        
        var me = this,
            getPromise = function(name) {
                return me.promises(name);
            },
            map = image.mapster($.extend(map_options, {
                onConfigured: getPromise("configured").resolve
            }));

        function setCallback(opt,cb) {
            var obj = {};
            obj[opt]=function(e) {
                e.this_context = this;
                cb(e);
            };
            map.mapster('set_options', obj);
        }

        getPromise("configured").then(function() {
            setCallback('onMouseover',getPromise("mouseover1").resolve);
            areas.find('area[state="NV"]').first().mouseover();
        });
        
        getPromise("mouseover1").then(function(e) {
            a.truthy(e, "Mouseover fired for Nevada");
            a.equals(e.selected, false, "Selected state returned correctly");
            a.equals(e.key, "NV", "Key returned correctly");
        
            setCallback('onMouseover',getPromise("mouseover2").resolve);
            areas.find('area[state="AK"]').first().mouseover();
        });      

        
        getPromise("mouseover2").then(function(e) {
            a.truthy(e, "Mouseover fired for Alaska");
            a.equals(e.selected, true, "Selected state returned correctly");
            a.equals(e.key, "AK", "Key returned correctly");
        
            setCallback('onMouseout',getPromise("mouseout1").resolve);
            areas.find('area[state="AK"]').first().mouseout();
        });
        
        getPromise("mouseout1").then(function(e) {
            a.truthy(e, "Mouseout fired for Nevada");
            a.equals("AK",e.key,"Correct key returned by mouseout");
            a.equals(e.selected, true, "Selected state returned correctly");        

            setCallback('onClick',getPromise("click1").resolve);
            areas.find('area[state="GA"]').first().click();
        }); 


        getPromise("click1").then(function(e) {
            a.equals(e.key, "GA", "Click callback fired for Georgia, and key was correct");
            a.equals(e.selected, true, "Click callback fired for Georgia, and selected was correct");
            a.equals(e.this_context, areas.find('area[state="GA"]')[0], "Click callback fired for Georgia, and 'this' was correct");

            setCallback('onClick',getPromise("click2").resolve);
            areas.find('area[state="OR"]').first().click();
        });
        
        getPromise("click2").then(function(e) {
            a.equals(e.key, "OR", "Click callback fired for Oregon, and key was correct");
            a.equals(e.selected, false, "Click callback fired for Oregon, and selected was correct");
            getPromise("finished").resolve();
        });

        a.resolves(getPromise("finished"),"The last test was run");

    }));



   
       
