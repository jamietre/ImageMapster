/*global iqtest, u, map_options, image, group_setup */
/*jslint onevar: false */

this.tests = this.tests || [];

this.tests.push(
    iqtest.create("data","data access features (non-UI)")
    .add("'keys' method", function (a, r) {
        var map;
        // create a promise from the "onConfigured" callback
        this.when(function(cb) {
            map=image.mapster(
                u.extend({},map_options,{
                    onConfigured: cb
                }
            ));
        }).then(function() {

            var keys=map.mapster('keys','TX');
            a.equals('TX',keys,"Got primary key for something with only one key");

            keys=map.mapster('keys','ME');
            a.equals('ME',keys,"Got primary key for something with multiple keys");

            keys=map.mapster('keys','new-england');
            a.collectionEquals('ME,VT,NH,CT,RI,MA',keys,"Got primary key for something with multiple keys");
            
            keys=map.mapster('keys','new-england',true);
            a.collectionEquals('ME,VT,NH,CT,RI,MA,new-england,really-cold',keys,"Got primary key for something with multiple keys");

            keys = $('area[state="HI"]').mapster('keys');
            a.equals('HI',keys,"Got primary key from an area");

            var areas = $('area[state="HI"],area[state*="new-england"]');
            keys = areas.mapster('keys');
            a.collectionEquals('HI,ME,VT,NH,CT,RI,MA',keys,"Got primary key for something with multiple keys");
        });
    }));



   
       
