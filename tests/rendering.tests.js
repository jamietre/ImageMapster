/*global Test: true, iqtest, image */
/*jslint onevar: false */

this.tests = this.tests || [];

this.tests.push(
    iqtest
        .create("resize","resize feature")
        .add("Initial binding", function (a, r) {
            var map = image.mapster();
            
            var x=image.width(), y=image.height();

            this.when(function(cb) {
                map.mapster('resize',200,0,cb);
            }).then(function() {
                var expectedHeight = Math.round(200/x*y);
                a.equals(200,image.width(),"image width is correct after resize");
                a.equals(expectedHeight,image.height(),"image height is correct after resize");

                var wrapper = image.closest('div');

                a.equals('mapster_wrap',wrapper.attr('id').substring(0,12),"sanity check - we have the wrapper element");
                a.equals(200,wrapper.width(),"wrapper width matches image width");
                a.equals(expectedHeight,wrapper.height(),"wrapper height matches image height");
            });
        }));



   
       
