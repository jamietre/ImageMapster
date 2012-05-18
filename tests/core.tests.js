/*global Test: true, iqtest */
/*jslint onevar: false */

this.tests = this.tests || [];

this.tests.push(
    iqtest.create("utility","tests for core/common functionality")
    .add("Utility Functions", function (a, r) {
        var result,
            mu = $.mapster.utils;

        a.isTrue(mu.isBool(true), "isBool returns true=true");
        a.isTrue(mu.isBool(false), "isBool returns false=true");

        a.isFalse(mu.isBool(null), "isBool returns null=false");

        a.equals(mu.boolOrDefault(true), true, "boolOrDefault(true) returns true");
        a.equals(mu.boolOrDefault(false), false, "boolOrDefault(false) returns false");
        a.equals(mu.boolOrDefault("something"), false, "boolOrDefault('something') (a truthy value) returns false");
        a.equals(mu.boolOrDefault(null), false, "boolOrDefault(null) (a falsy value)  returns false");
        a.equals(mu.boolOrDefault(true, "foo"), true, "boolOrDefault(true) with default value returns true");
        a.equals(mu.boolOrDefault(false, "foo"), false, "boolOrDefault(false) with default value returns false");
        a.equals(mu.boolOrDefault("something", "foo"), "foo", "boolOrDefault('something') (a falsy value) with default value returns default");
        a.equals(mu.boolOrDefault(undefined, "foo"), "foo", "boolOrDefault(undefined) (a falsy value) with default value returns default");

        // test the extend-like function

        var obj = { a: "a", b: "b" };
        var otherObj = { a: "a2", b: "b2", c: "c" };
        var arrObj = { a: [1, 2], b: { a: "a2", b: "b2"} };

        result = mu.updateProps({}, arrObj);
        a.equals([1, 2], result.a, "Array copied as array");

        result = mu.updateProps(obj, otherObj);

        a.equals(result, { a: "a2", b: "b2" }, "Merge with extra properties - no add");
        
        // input object should be affected
        a.equals(obj, { a: "a2", b: "b2" }, "Test input object following merge matches output");

        result = mu.updateProps(otherObj, obj, otherObj);
        a.equals(result, { a: "a2", b: "b2", c: "c" }, "Merge with extra properties - add");

        otherObj = { a: "a3" };
        result = mu.updateProps(obj, otherObj);

        // ut.assertPropsEq(function () { return u.updateProps(result, otherObj); }, { a: "a3", b: "b2", c: "c" }, "Merge with missing properties");

        // test several at once
        obj = { a: "unchanged-a", b: "unchanged-b" };
        otherObj = { b: "b4" };
        var otherObj2 = { a: "a4" };

        a.equals(mu.updateProps(obj, otherObj, otherObj2), { a: "a4", b: "b4" }, "Merge with mutiple inputs");

        var templateObj = { p1: "prop1", p2: "prop2" };
        otherObj = { p1: "newProp1", p3: "prop3", p4: "prop4" };

        a.equals(mu.updateProps({}, templateObj, otherObj), { p1: "newProp1", p2: "prop2" }, "Template works.");

        var expectedResult = { p1: "newProp1", p2: "prop2", p4: "prop4" };
        //ut.assertPropsEq(u.updateProps({},templateObj, otherObj, ), expectedResult, "Ignore works.");

        templateObj.p3 = { subp1: "subprop1", subp2: "subprop2" };
        templateObj.p4 = null;

        result = { };
        expectedResult.p3 = otherObj.p3;

        mu.updateProps(result, templateObj, otherObj);
        a.equals(result, expectedResult, "Copying a sub-object - start");

        delete otherObj.p3;
        result.p3 = { existing: "bar" };

        expectedResult.p3 = templateObj.p3;
        expectedResult.p3.existing = "bar";

        mu.updateProps(result, templateObj, otherObj);
        a.equals(result, expectedResult, "Deep works");

        // test indexOfProp

        obj = { test: "test" };
        var arr = [{ name: "test1", value: "value1" }, { name: "test2", value: "value2" }, { name: "test3", value: obj}];

        var index = mu.indexOfProp(arr, "name", "test2");
        a.equals(index, 1, "arrayIndexOfProp returns correct value for string");

        index = mu.indexOfProp(arr, "value", obj);
        a.equals(index, 2, "arrayIndexOfProp returns correct value for object & last element");
        
        index = mu.indexOfProp(arr, "name", "test1");
        a.equals(index, 0, "arrayIndexOfProp returns correct value for first element");
        
        index = mu.indexOfProp(arr, "foo", "bar");
        a.equals(index, -1, "Missing property handled correctly");
        
        index = mu.indexOfProp(arr, "name", "bar");
        a.equals(index, -1, "Missing property value handled correctly");



    }));



   
       
