mapster_tests = function (options)
{
    var has_canvas =  !$.browser.msie && !!document.createElement('canvas').getContext;
    var map_test = new test(options);

    me = this;
    var clickCalledBack=false;
    var onClickCallbackThis=null;
    var onClickCallback = function(e) {
        clickCalledBack=true;
        onClickCallbackThis=this;
    };
    var onGetStateArgs;
    var onGetStateThis;
    var onGetStateCallback = function() {
        onGetStateArgs=[];
        onGetStateThis=this;
        for (var arg in arguments) {
            if (arguments.hasOwnProperty(arg)) {
                onGetStateArgs.push(arguments[arg]);
            }
        }
    };
    
    var map_options = {
        isSelectable : true,
        singleSelect : false,
        mapKey : 'state',
        mapValue : 'full',
        listKey : 'name',
        listSelectedAttribute : 'checked',
        sortList : "asc",
        onGetList : onGetStateCallback,
        onClick : onClickCallback,
        showToolTip : true,
        toolTipClose : ["tooltip-click", "area-click"],
        areas : [
        {
            key : "TX",
            toolTip : $('<div>Don\'t mess with Texas. Why ? <a href = "http://dontmesswithtexas.org/" target="_blank" > Click here </a> for more info. </div> '),
            selected: true
        }
        ,
        {
            key : "ME",
            toolTip : $('<div style="clear:both;"></div><p>Trees, ocean, lobsters, it\'s all here. </p > ')
        }
        ,
        {
            key : "AK",
            toolTip : "Alaska.. wild, and cold. And, you cannot select this area, but you can see the tooltip.",
            isSelectable : false,
            selected: true
        }
        ,
        {
            key : "WA",
            staticState : true
        }
        ,
        {
            key : "OR",
            staticState : false
        }
        ]
    };
    
    map_test.addTest("Mapster-Basic-Tests", function (ut)
    {
        var map = $("#usa_image").mapster(map_options);
        
        ut.assertInstanceOf(map, "jQuery", "Plugin returns jQuery object");
        ut.assertArrayEq(map,$("#usa_image"),"Plugin returns jquery same object as invocation");

        // order is not guaranteed - this is the order the areas are created.
        var selected = map.mapster('get');
        ut.assertEq(selected,"AK,WA,TX","Initially selected items returned with 'get'");
        
        selected = map.mapster('get','WA');
        ut.assertEq(selected,true,"Initially selected single item returned true with 'get'");
        selected = map.mapster('get','ME');
        ut.assertEq(selected,false,"Initially deselected single item returned false with 'get'");
        
        // test clicking
        $('area[state="ME"]').first().click();
        selected = map.mapster('get','ME');
        ut.assertEq(selected,true,"Click-selected area returned 'get'");
        
        selected = map.mapster('get');
        ut.assertEq(selected,"AK,ME,WA,TX","Complete list returned with 'get'");
        
        /// try to click select "staticstate areas
        
        $('area[state="OR"]').first().click();
        selected = map.mapster('get','OR');
        ut.assertEq(selected,false,"Cannot select 'staticState=false' area with click");
        
        $('area[state="WA"]').first().click();
        selected = map.mapster('get','WA');
        ut.assertEq(selected,true,"Cannot deselect 'staticState=true' area with click");
        
        // do it programatically
        
        map.mapster('set',true,'OR');
        selected = map.mapster('get','OR');
        ut.assertEq(selected,true,"Can select 'staticState=false' area with 'set'");
        
        map.mapster('set',false,'WA');
        ut.assertEq(map.mapster('get','WA'),false,"Can deselect staticState=true' area with 'set'");
        
        // test rebind
        map.mapster('rebind',{ singleSelect: true });
        ut.assertEq(map.mapster('get'),'AK,ME,TX,OR',"Rebind with singleSelect preserved selections");



        map.mapster('set',true,"MI");
        ut.assertEq(map.mapster('get'),'MI',"Single select worked.");
        
        map.mapster('rebind',{isDeselectable: false });
        $('area[state="MI"]').first().click();
        ut.assertEq(map.mapster('get','MI'),true,"Cannot deselect single selected item with isDeselectable=false");

        $('area[state="RI"]').first().click();
        ut.assertEq(map.mapster('get'),'RI',"New single state selected");        

        map.mapster('rebind',{singleSelect: false, isDeselectable: true, areas: [{key:'ME', isDeselectable: false}] });

        $('area[state="RI"]').first().click();
        ut.assertEq(map.mapster('get','RI'),false,"Was able to deselect item after removing singleSelect");
        
        map.mapster('set',true,"CA,HI,ME");
        

        $('area[state="ME"]').first().click();
        ut.assertEq(map.mapster('get','ME'),true,"Could not deselect one item marked as !isDeselectable");
        $('area[state="CA"]').first().click();
        ut.assertEq(map.mapster('get','CA'),false,"Could deselect other items ");
        
        //TODO: 
        // document "rebind" 
        return;

        // cleanup tests - skip to play with map afterwards
        if (has_canvas) {
            ut.assertEq($('canvas').length,2,'There are 2 canvases.');
            map.mapster(map_options);
            ut.assertEq($('canvas').length,2,'There are 2 canvases (recreate was clean)');
        }
        
        map.mapster('unbind');
        ut.assertEq($('canvas').length,0,'No canvases remain after an unbind.');
        
    });
    return map_test;
};


