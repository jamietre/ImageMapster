/* Will not usually work on IE9 when simulating VML mode, because image-loaded callback doesn't fire in time.
   Too hard to fix the test right now. In practice this shouldn't ever matter unless you actually want to 
   test the selection state (as initially configured) before anything's been done.
*/
/*jslint onevar: false */
/*global mapster_tests: true, Test: true */

mapster_tests = function (options) {

    var CallbackTest = function (onCallback) {
        var me = this;
        me.cbData = false;
        me.cbThis = null;
        this.onCallback = onCallback;
        CallbackTest.prototype.callback = function (data) {
            me.cbData = data;
            me.cbThis = this;
            me.onCallback.call(me);
        };
    };

    var attrMatches = function (jq, attr, matches) {
        var list = matches.split(','), result = $();
        jq.each(function () {
            for (var i = 0; i < list.length; i++) {
                if ($(this).is("[" + attr + "='" + list[i] + "']")) {
                    result = result.add(this);
                    i = list.length;
                }
            }
        });
        return result;
    };

    var map,
        map_test = new Test(options),
        callBackData = false,
        callBackThis = null,
        callBack = function (data) {
            callBackData = data;
            callBackThis = this;
        },
        callBackReset = function () {
            callBackData = null;
            callBackThis = null;
        },
        onGetStateArgs,
        onGetStateThis,
        onGetStateCallback = function () {
            onGetStateArgs = [];
            onGetStateThis = this;
            for (var arg in arguments) {
                if (arguments.hasOwnProperty(arg)) {
                    onGetStateArgs.push(arguments[arg]);
                }
            }
        },
        map_options = {
            isSelectable: true,
            singleSelect: false,
            mapKey: 'state',
            mapValue: 'full',
            listKey: 'name',
            listSelectedAttribute: 'checked',
            sortList: "asc",
            onGetList: onGetStateCallback,
            onClick: callBack,
            onMouseover: callBack,
            onMouseout: callBack,
            showToolTip: true,
            onShowToolTip: callBack,
            toolTipClose: ["area-mouseout"],
            areas: [
            {
                key: "TX",
                selected: true
            }
            ,
            {
                key: "AK",
                isSelectable: false,
                selected: true
            }
            ,
            {
                key: "WA",
                staticState: true
            }
            ,
            {
                key: "OR",
                staticState: false
            },
            {
                key: "CA",
                toolTip: $('<div>Don\'t mess with Louisiana. Why ? <a href = "http://dontmesswithtexas.org/" target="_blank" > Click here </a> for more info. </div> ')
            }

            ]
        };

    map_test.addTest("Mapster Utility Function Tests", function (ut) {

        var result;
        var u = $.mapster.utils;

        ut.assertEq(function () {
            return u.isBool(true);
        },
        true, "isTrueFalse returns true=true");

        ut.assertEq(function () {
            return u.isBool(false);
        },
         true, "isBool returns false=true");

        ut.assertEq(function () { return u.isBool(null); },
            false, "isBool returns null=false");

        ut.assertEq(u.boolOrDefault(true), true, "boolOrDefault(true) returns true");
        ut.assertEq(u.boolOrDefault(false), false, "boolOrDefault(false) returns false");
        ut.assertEq(u.boolOrDefault("something"), false, "boolOrDefault('something') (a truthy value) returns false");
        ut.assertEq(u.boolOrDefault(null), false, "boolOrDefault(null) (a falsy value)  returns false");
        ut.assertEq(u.boolOrDefault(true, "foo"), true, "boolOrDefault(true) with default value returns true");
        ut.assertEq(u.boolOrDefault(false, "foo"), false, "boolOrDefault(false) with default value returns false");
        ut.assertEq(u.boolOrDefault("something", "foo"), "foo", "boolOrDefault('something') (a falsy value) with default value returns default");
        ut.assertEq(u.boolOrDefault(undefined, "foo"), "foo", "boolOrDefault(undefined) (a falsy value) with default value returns default");

        var obj = { a: "a", b: "b" };
        var otherObj = { a: "a2", b: "b2", c: "c" };
        var arrObj = { a: [1, 2], b: { a: "a2", b: "b2"} };

        ut.assertArrayEq([1, 2], u.mergeObjects({ source: arrObj }).a, "Array copied as array");

        var func = function () {
            return u.mergeObjects({ add: false, target: obj, source: otherObj });
        };
        ut.assertPropsEq(func, { a: "a2", b: "b2" }, "Merge with extra properties - no add");
        // input object should be affected
        ut.assertPropsEq(obj, { a: "a2", b: "b2" }, "Test input object following merge matches output");

        result = u.mergeObjects({ target: obj, source: otherObj });
        ut.assertPropsEq(result, { a: "a2", b: "b2", c: "c" }, "Merge with extra properties - add");


        otherObj = { a: "a3" };
        result = func();
        ut.assertPropsEq(function () { return u.mergeObjects({ add: false, target: result, source: otherObj }); }, { a: "a3", b: "b2", c: "c" }, "Merge with missing properties");

        // test several at once
        otherObj = { b: "b4" };
        var otherObj2 = { a: "a4" };

        ut.assertPropsEq(u.mergeObjects({ add: false, target: obj, source: [otherObj, otherObj2] }), { a: "a4", b: "b4", c: "c" }, "Merge with mutiple inputs");

        var templateObj = { p1: "prop1", p2: "prop2" };
        otherObj = { p1: "newProp1", p3: "prop3", p4: "prop4" };

        ut.assertPropsEq(u.mergeObjects({ template: templateObj, source: otherObj, add: false }), { p1: "newProp1", p2: "prop2" }, "Template works.");

        var expectedResult = { p1: "newProp1", p2: "prop2", p4: "prop4" };
        ut.assertPropsEq(u.mergeObjects({ template: templateObj, source: otherObj, add: true, ignore: "p3" }), expectedResult, "Ignore works.");

        templateObj.p3 = { subp1: "subprop1", subp2: "subprop2" };
        result = { p3: null };
        expectedResult.p3 = otherObj.p3;

        u.mergeObjects({ target: result, source: [templateObj, otherObj], add: true });
        ut.assertPropsEq(result, expectedResult, "Copying a sub-object - start");

        delete otherObj.p3;
        result.p3 = { existing: "bar" };

        expectedResult.p3 = templateObj.p3;
        expectedResult.p3.existing = "bar";

        u.mergeObjects({ target: result, source: [templateObj, otherObj], add: true, deep: "p3" });
        ut.assertPropsEq(result, expectedResult, "Deep works");

        // test arrayIndexOfProp

        obj = { test: "test" };
        var arr = [{ name: "test1", value: "value1" }, { name: "test2", value: "value2" }, { name: "test3", value: obj}];

        var index = u.arrayIndexOfProp(arr, "name", "test2");
        ut.assertEq(index, 1, "arrayIndexOfProp returns correct value for string");
        index = u.arrayIndexOfProp(arr, "value", obj);
        ut.assertEq(index, 2, "arrayIndexOfProp returns correct value for object & last element");
        index = u.arrayIndexOfProp(arr, "name", "test1");
        ut.assertEq(index, 0, "arrayIndexOfProp returns correct value for first element");
        index = u.arrayIndexOfProp(arr, "foo", "bar");
        ut.assertEq(index, -1, "Missing property handled correctly");
        index = u.arrayIndexOfProp(arr, "name", "bar");
        ut.assertEq(index, -1, "Missing property value handled correctly");


    });


    var basicTests = function (ut, disableCanvas) {
        var u = $.mapster.utils;

        // Save current state to see if we cleaned up properly later
        var domCount = $('#test_elements *').length;


        map = $('img').mapster();

        // testing with no canvas on a browser that doesn't support it anyway doesn't make sense, regular test will cover it
        var has_canvas = map.mapster("test", "has_canvas");
        if (!has_canvas && disableCanvas) {
            map.mapster('unbind');
            return;
        }
        map.mapster('unbind');

        if (disableCanvas) {
            $.mapster.impl.init(false);
        }
        map = $('img').mapster(map_options);


        // test using only bound images

        ut.assertEq(map.mapster("test", "me.map_cache.length"), 1, "Only imagemap bound images were obtained on generic create");
        map = $('img,div').mapster({ mapKey: "state" });
        ut.assertEq(map.mapster("test", "me.map_cache.length"), 1, "Only imagemap bound images were obtained on generic create with other elements");

        map = $("#usa_image").mapster(map_options);

        // TO TEST-
        // set from areas from 
        // queue options 

        // options
        var x = $();
        var initialOpts = u.mergeObjects({ template: $.mapster.defaults, source: [map_options], deep: "areas" });
        var opts = map.mapster('get_options');
        ut.assertPropsEq(opts, initialOpts, "Options retrieved match initial options");

        // todo - test new options options
        //opts = map.mapster('get_options',null,true);
        //initialOpts.render_select = u.mergeObjects({template:$.mapster.render_defaults }); 

        var newOpts = { isSelectable: false, areas: [{ key: 'MT', isDeselectable: false}] };
        map.mapster('set_options', newOpts);
        opts = map.mapster('get_options');

        ut.assertPropsEq(opts, $.extend({}, initialOpts, newOpts), "Options retrieved match updated value");
        ut.assertEq(opts.areas.length, 6, "Area option was added");

        // put them back or nothing will work...
        opts = map.mapster('set_options', { isSelectable: true, areas: [{ key: 'MT', isDeselectable: true}] });

        ut.assertEq(map.isJquery, true, "Plugin returns jQuery object");
        ut.assertArrayEq(map, $("#usa_image"), "Plugin returns jquery same object as invocation");

        // order is not guaranteed - this is the order the areas are created.
        var selected = map.mapster('get');

        // This test should NOT show "WA" because StaticState items are not considered "selected"

        ut.assertCsvElementsEq(selected, "AK,TX", "Initially selected items returned with 'get'");


        selected = map.mapster('get', 'TX');
        ut.assertEq(selected, true, "Initially selected single item returned true with 'get'");
        selected = map.mapster('get', 'ME');
        ut.assertEq(selected, false, "Initially deselected single item returned false with 'get'");


        // Test setting/getting via area

        // AK was already selected, should be ignored

        attrMatches($('area'), "state", "AK,HI,LA").mapster('set', true);
        var area_sel = map.mapster('get');
        ut.assertCsvElementsEq(area_sel, "HI,AK,LA,TX", "Set using area works");

        map.mapster('set', false, 'LA,TX');
        ut.assertCsvElementsEq("HI,AK", map.mapster('get'), "unset using keys works");

        map.mapster('set', true, 'ME,OH,TX');
        ut.assertCsvElementsEq("HI,AK,ME,OH,TX", map.mapster('get'), "set using keys works");

        // test toggling: AK should go off, MT should go on
        attrMatches($('area'), "state", "AK,MT").mapster('set');
        ut.assertCsvElementsEq("HI,ME,OH,TX,MT", map.mapster('get'), "toggling keys works");

        // test clicking
        $('area[state="AZ"]').first().click();
        selected = map.mapster('get', 'AZ');
        ut.assertEq(true, selected, "Click-selected area returned 'get'");
        ut.assertCsvElementsEq("HI,ME,OH,TX,MT,AZ", map.mapster('get'), "Complete list returned with 'get'");

        /// try to click select "staticstate areas

        $('area[state="OR"]').first().click();
        selected = map.mapster('get', 'OR');
        ut.assertEq(selected, false, "Cannot select 'staticState=false' area with click");

        selected = map.mapster('get', 'WA');
        ut.assertEq(selected, false, "staticState=true area is considered not selected");

        opts = map.mapster('get_options', 'WA');
        ut.assertEq(opts.staticState, true, "get effective options returned correct static state for WA");

        opts = map.mapster('get_options', 'OR');
        ut.assertEq(opts.staticState, false, "get effective options returned correct static state for OR");


        $('area[state="WA"]').first().click();
        selected = map.mapster('get', 'WA');
        ut.assertEq(selected, false, "Cannot change selection state of 'staticState=true' area with click");

        // do it programatically

        map.mapster('set', true, 'OR');
        selected = map.mapster('get', 'OR');
        ut.assertEq(selected, true, "Can select 'staticState=false' area with 'set'");

        map.mapster('set', false, 'WA');
        ut.assertEq(map.mapster('get', 'WA'), false, "Can deselect staticState=true' area with 'set'");

        // test rebind
        map.mapster('rebind', { singleSelect: true });
        ut.assertCsvElementsEq(map.mapster('get'), 'OR,AZ,TX,MT,OH,ME,HI', "Rebind with singleSelect preserved selections");



        map.mapster('set', true, "MI");
        ut.assertEq(map.mapster('get'), 'MI', "Single select worked.");

        map.mapster('rebind', { isDeselectable: false });
        $('area[state="MI"]').first().click();
        ut.assertEq(map.mapster('get', 'MI'), true, "Cannot deselect single selected item with isDeselectable=false");

        $('area[state="RI"]').first().click();
        ut.assertEq(map.mapster('get'), 'RI', "New single state selected");

        map.mapster('rebind', { singleSelect: false, isDeselectable: true, areas: [{ key: 'ME', isDeselectable: false}] });

        $('area[state="RI"]').first().click();
        ut.assertEq(map.mapster('get', 'RI'), false, "Was able to deselect item after removing singleSelect");

        map.mapster('set', true, "CA,HI,ME");


        $('area[state="ME"]').first().click();
        ut.assertEq(map.mapster('get', 'ME'), true, "Could not deselect one item marked as !isDeselectable");
        $('area[state="CA"]').first().click();
        ut.assertEq(map.mapster('get', 'CA'), false, "Could deselect other items ");

        // Test manual highlighting

        ut.assertEq(map.mapster('highlight'), null, "nothing is highlighted");

        $('area[state="CA"]').first().mapster('highlight');

        ut.assertEq(map.mapster('highlight'), "CA", "highlighted manually");

        map.mapster('highlight', "LA");

        ut.assertEq(map.mapster('highlight'), "LA", "highlighted manually using other technique");

        map.mapster('highlight', false);

        ut.assertEq(map.mapster('highlight'), null, "everything unhighlighted");

        // restore internal canvas setting or these tests won't work
        if (disableCanvas) {
            map.mapster('test', 'has_canvas=true');
        } else {

            // cleanup tests - skip to play with map afterwards
            // return;

            if (has_canvas) {
                ut.assertEq($('canvas').length, 2, 'There are 2 canvases.');
                map.mapster(map_options);
                ut.assertEq($('canvas').length, 2, 'There are 2 canvases (recreate was clean)');
            }
        }
        map.mapster('unbind');
        ut.assertEq($('canvas').length, 0, 'No canvases remain after an unbind.');

        ut.assertEq($('#test_elements *').length, domCount, "# elements in DOM is the same.");

        if (disableCanvas) {
            $.mapster.impl.init();
        }
    };

    if (!($.browser.msie && $.browser.version < 9)) {
        map_test.addTest("Mapster Basic Tests - hasCanvas disabled", function (ut) {
            basicTests(ut, true);
        });
    }

    map_test.addTest("Mapster Basic Tests", basicTests);


    map_test.addTest("Event/Tooltip Tests", function (ut) {
        var map = $('img').mapster(map_options);

        callBackReset();
        $('area[state="NV"]').first().mouseover();
        ut.assertIsTruthy(callBackData, "Mouseover fired for Nevada");
        ut.assertEq(callBackData.selected, false, "Selected state returned correctly");
        ut.assertEq(callBackData.key, "NV", "Key returned correctly");

        callBackReset();
        $('area[state="AK"]').first().mouseover();
        ut.assertIsTruthy(callBackData, "Mouseover fired for Alaska");
        ut.assertEq(callBackData.selected, true, "Selected state returned correctly");
        ut.assertEq(callBackData.key, "AK", "Key returned correctly");

        callBackReset();
        $('area[state="NV"]').first().mouseout();
        ut.assertIsTruthy(callBackData, "Mouseout fired for Nevada");
        ut.assertEq(callBackData.selected, false, "Selected state returned correctly");

        callBackReset();

        $('area[state="GA"]').first().click();
        ut.assertIsTruthy(callBackData, "Click callback fired for Georgia");
        if (callBackData) {
            ut.assertEq(callBackData.key, "GA", "Click callback fired for Georgia, and key was correct");
            ut.assertEq(callBackData.selected, true, "Click callback fired for Georgia, and selected was correct");
            ut.assertEq(callBackThis, $('area[state="GA"]')[0], "Click callback fired for Georgia, and this was correct");
        }

        callBackReset();

        $('area[state="OR"]').first().click();
        if (callBackData) {
            ut.assertEq(callBackData.key, "OR", "Click callback fired for Oregon, and key was correct");
            ut.assertEq(callBackData.selected, false, "Click callback fired for Oregon, and selected was correct");
        }

        // Now try tooltips

        //var opts = map.mapster('get_options', true);

        ut.assertEq($(".mapster-tooltip").length, 0, "No tooltip showing");

        callBackReset();
        $('area[state="CA"]').first().mouseover();
        ut.assertEq($(".mapster-tooltip").length, 1, "Tooltip was shown");
        ut.assertEq($(".mapster-tooltip").css("display"), "block", "Tooltip is visible");
        ut.assertIsTruthy(callBackData, "Click callback fired for LA tooltip");
        if (callBackData) {
            ut.assertEq(callBackData.key, "CA", "Tooltip show callback fired for CA, and key was correct");
            ut.assertEq(callBackData.selected, false, "Tooltip show callback fired for Louisiana, and selected was correct");
            ut.assertEq(callBackThis, $('area[state="CA"]')[0], "Tooltip show callback fired for Lousisiana, and this was correct");
        }

        var cbtest = new CallbackTest(function () {
            ut.assertEq($(".mapster-tooltip").length, 0, "No tooltip showing after mouseout");

            map.mapster('tooltip', "CA");
            ut.assertEq($(".mapster-tooltip").length, 1, "Tooltip appeared when activated manually");
            map.mapster('tooltip');
            ut.assertEq($(".mapster-tooltip").length, 0, "Tooltip hidden after manual activation");
            $('area[state="CA"]').first().mapster('tooltip');
            ut.assertEq($(".mapster-tooltip").length, 1, "Tooltip appeared when activated manually calling mapster on an area");

            var first = $(".mapster-tooltip").position();
            if ($.browser.chrome) {
                ut.assertPropsEq(first, { left: 50, top: 199 }, "Tooltip for CA when no area was specified used first area");
            }
            //ut.assertPropsEq($(".mapster-tooltip").position(),{left: 50, top: 198},"Sanity check -0- should fail");
            // clear and reset tooltip, this time calling for a specific area
            map.mapster('tooltip');
            map.mapster('tooltip', $("area[state='CA']").eq(2));

            ut.assertEq($(".mapster-tooltip").length, 1, "Tooltip appeared when activated manually with specific area");

            var second = $(".mapster-tooltip").position();

            if ($.browser.chrome) {
                ut.assertPropsEq(second, { left: 38, top: 178 }, "Tooltip for CA when 2nd area was specified was different");
            }

            ut.assertPropsNotEq(first, second, "Tooltip locations should be different when called with and without an area.");

            map.mapster('tooltip', "VT");
            ut.assertEq($(".mapster-tooltip").length, 1, "Nothing happened when calling tooltip on an area with no tooltips");

            map.mapster('tooltip', false);
            ut.assertEq($(".mapster-tooltip").length, 0, "Tooltip closed appeared when deactivated manually");


            $('img').mapster('unbind');



        });
        map.mapster('set_options', { onMouseout: cbtest.callback });

        $('area[state="CA"]').first().mouseout();


        // Try tooltips manually



    });


    map_test.addTest("Mapster Command Queue Tests", function (ut) {
        var map, complete, opts_should_be,
        domCount = $('#test_elements *').length;

        function continueTests() {
            var testName = "Master Command Queue (async completion)";
            var map = $(this);
            map_test.addTest(testName, function (ut) {
                var newDomCount;

                ut.assertCsvElementsEq(map.mapster('get'), opts_should_be, "Only initial selections present when simulating non-ready image");
                newDomCount = $('#test_elements *').length;
                ut.assertNotEq(newDomCount, domCount, "Dom size is unequal before unbinding at test end");
                map.mapster('unbind');
                newDomCount = $('#test_elements *').length;
                ut.assertEq(newDomCount, domCount, "Dom size is equal at test end");
            });
            map_test.run(testName);
        }

        complete = false;
        map = $("#usa_image");
        //map.removeProp('complete')
        map.mapster('test', 'u.old=u.isImageLoaded;u.isImageLoaded=function(){return false;};');

        // TODO: Test fails in IE because onLoad fires immediately: this code results in isImageLoaded never being called.
        //if ($file:///D:/VSProjects/jquery/imagemapster/tests/test.html < 0) {
        //    me.initialize();
        //}
        opts_should_be = "AK,TX";
        // in IE the onConfigured event may fire before we get a chace to try this (not sure how to fix right now) so just skip test of "opts_set" is false
        var queue_opts = $.extend({}, map_options, { onConfigured: continueTests });

        map.mapster(queue_opts);

        //map.mapster('test','map_data=get_map_data(this[0]); map_data.complete=false;');
        map.mapster('set', true, 'KS,KY');
        opts_should_be = "AK,KY,TX,KS";

        ut.assertEq(map.mapster('get'), "", "No options present when simulating non-ready image");
        // simulate the timer callback, should simply run command queue instead of recreating b/c we set complete=false
        map.mapster('test', 'u.isImageLoaded=u.old;');

    });


    return map_test;
};
