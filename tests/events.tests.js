/*global Test: true, iqtest, image, map_options, areas */
/*jslint onevar: false */

this.tests = this.tests || [];

this.tests.push(
    iqtest.create("events","tests for imagemapster events")
    .add("Mouse Events", function (a, r) {
        
        var i,test=[],
            map = image.mapster(map_options);

        function setCallback(opt,cb) {
            var obj = {};
            obj[opt]=function(e) {
                e.this_context = this;
                cb(e);
            };
            map.mapster('set_options', obj);
        }

        // set up a bunch of promises for each test resolution
        for (i=0;i<=4;i++) {
            test[i]=this.defer();
        }

        setCallback('onMouseover',test[0].resolve);

        areas.find('area[state="NV"]').first().mouseover();

        test[0].then(function(e) {
            a.truthy(e, "Mouseover fired for Nevada");
            a.equals(e.selected, false, "Selected state returned correctly");
            a.equals(e.key, "NV", "Key returned correctly");
        
            setCallback('onMouseover',test[1].resolve);
            areas.find('area[state="AK"]').first().mouseover();
        });      

        
        test[1].then(function(e) {
            a.truthy(e, "Mouseover fired for Alaska");
            a.equals(e.selected, true, "Selected state returned correctly");
            a.equals(e.key, "AK", "Key returned correctly");
        
            setCallback('onMouseout',test[2].resolve);
            areas.find('area[state="AK"]').first().mouseout();
        });
        
        test[2].then(function(e) {
            a.truthy(e, "Mouseout fired for Nevada");
            a.equals("AK",e.key,"Correct key returned by mouseout");
            a.equals(e.selected, true, "Selected state returned correctly");        

            setCallback('onClick',test[3].resolve);
            areas.find('area[state="GA"]').first().click();
        }); 


        test[3].then(function(e) {
            a.equals(e.key, "GA", "Click callback fired for Georgia, and key was correct");
            a.equals(e.selected, true, "Click callback fired for Georgia, and selected was correct");
            a.equals(e.this_context, areas.find('area[state="GA"]')[0], "Click callback fired for Georgia, and 'this' was correct");

            setCallback('onClick',test[4].resolve);
            areas.find('area[state="OR"]').first().click();
        });
        
        test[4].then(function(e) {
            a.equals(e.key, "OR", "Click callback fired for Oregon, and key was correct");
            a.equals(e.selected, false, "Click callback fired for Oregon, and selected was correct");
        });


    }));



   
       
