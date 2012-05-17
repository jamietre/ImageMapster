/*global Test: true, iqtest */
/*jslint onevar: false */

this.tests = this.tests || [];

this.tests.push(
    iqtest.create("resize","resize feature")
    .add("Initial binding", function (a, r) {
        var img = $('img'),
                map = img.mapster();
        
        var x=img.width(), y=img.height();

        this.when(function(cb) {
            map.mapster('resize',200,0,cb);
        }).then(function() {
            var expectedHeight = Math.round(200/x*y);
            a.equals(200,img.width(),"image width is correct after resize");
            a.equals(expectedHeight,img.height(),"image height is correct after resize");

            var wrapper = img.closest('div');

            a.equals('mapster_wrap',wrapper.attr('id').substring(0,12),"sanity check - we have the wrapper element");
            a.equals(200,wrapper.width(),"wrapper width matches image width");
            a.equals(expectedHeight,wrapper.height(),"wrapper height matches image height");
        });
        

    }));



   
       
