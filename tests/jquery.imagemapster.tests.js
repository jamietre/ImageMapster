

mapster_tests = function (options)
{
    var map_test = new Test(options);
    var map;

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
    
    map_test.addTest("Mapster Utility Function Tests",function(ut) {

    	var result;
        var u = $.mapster.utils;
        
        ut.assertEq(function() {
            return u.isBool(true);
        },
        true,"isTrueFalse returns true=true");

         ut.assertEq(function() {
            return u.isBool(false);
         },
         true,"isBool returns false=true");
            
         ut.assertEq(function() { return u.isBool(null);},
            false,"isBool returns null=false");   

        ut.assertEq(u.boolOrDefault(true),true,"boolOrDefault(true) returns true");
        ut.assertEq(u.boolOrDefault(false),false,"boolOrDefault(false) returns false");
        ut.assertEq(u.boolOrDefault("something"),false,"boolOrDefault('something') (a truthy value) returns false");
        ut.assertEq(u.boolOrDefault(null),false,"boolOrDefault(null) (a falsy value)  returns false");
        ut.assertEq(u.boolOrDefault(true,"foo"),true,"boolOrDefault(true) with default value returns true");
        ut.assertEq(u.boolOrDefault(false,"foo"),false,"boolOrDefault(false) with default value returns false");
        ut.assertEq(u.boolOrDefault("something","foo"),"foo","boolOrDefault('something') (a falsy value) with default value returns default");        
        ut.assertEq(u.boolOrDefault(undefined,"foo"),"foo","boolOrDefault(undefined) (a falsy value) with default value returns default");                
        
       var obj = {a: "a", b: "b"};
       var otherObj = {a: "a2", b: "b2", c: "c"};
       
       var func = function() {
        return u.mergeObjects({add:false,target:obj,source:otherObj});
       };
       ut.assertPropsEq(func,{a:"a2",b:"b2"},"Merge with extra properties - no add");
       // input object should be affected
       ut.assertPropsEq(obj,{a:"a2",b:"b2"},"Test input object following merge matches output");
       
       result = u.mergeObjects({target:obj,source:otherObj});
       ut.assertPropsEq(result,{a:"a2",b:"b2",c:"c"},"Merge with extra properties - add");
       
       
       otherObj={a:"a3" };
       var result = func();
       ut.assertPropsEq(function() {return u.mergeObjects({add:false,target:result,source:otherObj});},{a:"a3",b:"b2",c:"c"},"Merge with missing properties");
       
       // test several at once
       otherObj= {b:"b4"};
       otherObj2 = {a:"a4"};
       
       ut.assertPropsEq(u.mergeObjects({add:false,target:obj,source:[otherObj,otherObj2]}),{a:"a4",b:"b4",c:"c"}, "Merge with mutiple inputs");

        var templateObj = {p1: "prop1", p2: "prop2"};
        otherObj={p1: "newProp1", p3: "prop3", p4: "prop4"};
        
        ut.assertPropsEq(u.mergeObjects({template: templateObj, source: otherObj, add: false}),{p1:"newProp1",p2:"prop2"},"Template works.");

        var expectedResult={p1:"newProp1",p2:"prop2", p4: "prop4"};
        ut.assertPropsEq(u.mergeObjects({template: templateObj, source: otherObj, add: true, ignore: "p3"}),expectedResult,"Ignore works.");
        
        templateObj.p3={subp1: "subprop1", subp2: "subprop2"};
        result={ p3: null };
        expectedResult.p3 = otherObj.p3;
        
        u.mergeObjects({target:result,source: [templateObj,otherObj], add: true  })
        ut.assertPropsEq(result,expectedResult,"Copying a sub-object - start");

        delete otherObj.p3;
        result.p3={existing: "bar"};
        
        expectedResult.p3 = templateObj.p3;
        expectedResult.p3.existing="bar";
        
        u.mergeObjects({target: result, source: [templateObj,otherObj], add: true, deep:"p3"})
        ut.assertPropsEq(result,expectedResult,"Deep works");

        // test arrayIndexOfProp
       
       obj={test:"test"};
       var arr = [{name:"test1",value:"value1"},{name:"test2",value:"value2"},{name:"test3",value:obj}];

       var index = u.arrayIndexOfProp(arr,"name","test2");
        ut.assertEq(index,1,"arrayIndexOfProp returns correct value for string");
        index = u.arrayIndexOfProp(arr,"value",obj);
        ut.assertEq(index,2,"arrayIndexOfProp returns correct value for object & last element");
        index = u.arrayIndexOfProp(arr,"name","test1");
        ut.assertEq(index,0,"arrayIndexOfProp returns correct value for first element");
        index = u.arrayIndexOfProp(arr,"foo","bar");
        ut.assertEq(index,-1,"Missing property handled correctly");
        index = u.arrayIndexOfProp(arr,"name","bar");
        ut.assertEq(index,-1,"Missing property value handled correctly");
        

    });
    

    var basicTests = function (ut,disableCanvas)
    {       
    	var domCount = $('#test_elements *').length;
    	var u = $.mapster.utils;

        map = $('img').mapster();
        // testing with no canvas on a browser that doesn't support it anyway doesn't make sense, regular test will cover it

        var has_canvas =  map.mapster("test","has_canvas");
        if (!has_canvas && disableCanvas) {
            map.mapster('unbind');
            return;
        }
        if (disableCanvas) {
            map.mapster('test','has_canvas=false');
        }

        // test using only bound images

        ut.assertEq(map.mapster("test","map_cache.length"),1,"Only imagemap bound images were obtained on generic create");
        map = $('img,div').mapster({mapKey:"state"});
        ut.assertEq(map.mapster("test","map_cache.length"),1,"Only imagemap bound images were obtained on generic create with other elements");
        $('area:attrMatches("state","AK,HI,WI")').mapster('set',true);
        var area_sel = map.mapster('get');
        ut.assertCsvElementsEq(area_sel,"HI,AK,WI","Set using area works");
        

        // test command queue
 
        map = $("#usa_image").mapster(map_options);
        
        // TO TEST-
        // set from areas from 
        // queue options 
        
        // options

        var initialOpts = u.mergeObjects({template:$.mapster.defaults });
        var opts = map.mapster('get_options');
        ut.assertPropsEq(opts,initialOpts,"Options retrieved match initial options");
        
        // todo - test new options options
        //opts = map.mapster('get_options',null,true);
        //initialOpts.render_select = u.mergeObjects({template:$.mapster.render_defaults }); 
        
        var newOpts = {isSelectable: false, areas: [{key:'MT',isDeselectable:false}]};
        map.mapster('set_options',newOpts);
        opts = map.mapster('get_options');
        ut.assertPropsEq(opts,$.extend(true,{},initialOpts,newOpts),"Options retrieved match updated value");
        ut.assertEq(opts.areas.length,6,"Area option was added");
        // put them back or nothing will work...
        opts = map.mapster('set_options',{isSelectable:true, areas: [{key: 'MT',isDeselectable:true}]});
                
        ut.assertInstanceOf(map, "jQuery", "Plugin returns jQuery object");
        ut.assertArrayEq(map,$("#usa_image"),"Plugin returns jquery same object as invocation");

        // order is not guaranteed - this is the order the areas are created.
        var selected = map.mapster('get');
        ut.assertCsvElementsEq(selected,"AK,WA,TX","Initially selected items returned with 'get'");
        
        selected = map.mapster('get','WA');
        ut.assertEq(selected,true,"Initially selected single item returned true with 'get'");
        selected = map.mapster('get','ME');
        ut.assertEq(selected,false,"Initially deselected single item returned false with 'get'");
        
        // test clicking
        $('area[state="ME"]').first().click();
        selected = map.mapster('get','ME');
        ut.assertEq(selected,true,"Click-selected area returned 'get'");
        
        selected = map.mapster('get');
        ut.assertCsvElementsEq(selected,"AK,ME,WA,TX","Complete list returned with 'get'");
        
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
        ut.assertCsvElementsEq(map.mapster('get'),'AK,ME,TX,OR',"Rebind with singleSelect preserved selections");



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


        // restore internal canvas setting or these tests won't work
        if (disableCanvas) {
            map.mapster('test','has_canvas=true');    
        } else {
    
            // cleanup tests - skip to play with map afterwards
            // return;
    
            if (has_canvas) {
                ut.assertEq($('canvas').length,2,'There are 2 canvases.');
                map.mapster(map_options);
                ut.assertEq($('canvas').length,2,'There are 2 canvases (recreate was clean)');
            }
        }
        map.mapster('unbind');
        ut.assertEq($('canvas').length,0,'No canvases remain after an unbind.');
        
        ut.assertEq($('#test_elements *').length,domCount,"# elements in DOM is the same.");
    };

     map_test.addTest("Mapster Basic Tests - hasCanvas disabled",function(ut) {
        basicTests(ut,true);
     });    
     
     map_test.addTest("Mapster Basic Tests",basicTests);    

	
    map_test.addTest("Mapster Command Queue Tests",function(ut) {
    	var map,complete,
    	    domCount= $('#test_elements *').length;
	function continueTests() {
	    var testName="Master Command Queue (async completion)";
	    var map=$(this);
	    map_test.addTest(testName,function(ut) {
	    	var newDomCount;
	    	ut.assertCsvElementsEq(map.mapster('get'),"AK,KY,WA,TX,KS","Only initial options present when simulating non-ready image");
	    	newDomCount=$('#test_elements *').length;
	    	ut.assertNotEq(newDomCount,domCount,"Dom size is unequal before unbinding at test end");
	    	map.mapster('unbind');
	    	newDomCount=$('#test_elements *').length;
	        ut.assertEq(newDomCount,domCount,"Dom size is equal at test end");
	    });
	    map_test.run(testName);
        }
        
        complete=false;
        map = $("#usa_image");
        //map.removeProp('complete')
        map.mapster('test','is_image_loaded=function(){return false;};');
        
        var queue_opts = $.extend({},map_options,{onConfigured: continueTests});
        
        map.mapster(queue_opts);
        //map.mapster('test','map_data=get_map_data(this[0]); map_data.complete=false;');
        map.mapster('set',true,'KS,KY');
        
        ut.assertEq(map.mapster('get'),"","No options present when simulating non-ready image");
        // simulate the timer callback, should simply run command queue instead of recreating b/c we set complete=false
        map.mapster('test','is_image_loaded=function(){return true;};');
        
    });
    

    return map_test;
};
