/*
A dead simple javascript testing framework

V1.0 James Treworgy

This code is in the public domain
*/

function Test(options) {
    this.tests = [];
    this.title="Unit Tests for unnamed project";
    $.extend(this, options);
    if (!this.output) {
        this.output = $("div");
    }
    this._test_count= 0;
    this._fail_count = 0;
}

Test.prototype.startTest = function() {
    this._test_count++;
};
Test.prototype.addTest = function (name, test) {
    var testData = {
        name: name,
        test: test
    };
    this.tests.push(testData);
};
Test.prototype.assertEq = function (testCase, expected, description) {
    var err = '';
    this.startTest();
    if (typeof testCase != typeof expected) {
        err = 'Test case type "' + typeof testCase + '" != expected type "' + typeof expected + '"';
    }
    
    if (!err && testCase != expected) {
        err = '"' + testCase + '" != "' + expected + '"';
    }
    if (err) {
        this.addError(err,description);
    }
};
Test.prototype.assertArrayEq = function(testcase, expected, description) {
    var err;
    this.startTest();

    if (!(testcase.length && (testcase.length>-1))) {
        err='Test case has no length property';
    }
    if (!(expected.length && (expected.length>-1))) {
        err='Expected value has no length property';
    }
    if (!err && testcase.length != expected.length) {
        err='Arrays different length (test: ' + testcase.length + ', expected: ' + expected.length;
    }
    if (!err) {
        for (var e=0;e<testcase.length;e++) {
            if (testcase[e]!==expected[e]) {
                err="Arrays not equal starting at element " + count +".";
                break;
            }
        }
    }
    if (err)  {
        this.addError(err,description);
    }
};
Test.prototype.assertInstanceOf = function(testcase, expected, description) {
    var err,
        test = eval("testcase instanceof " + expected);
    this.startTest();
    if (!test) {
        err='testcase is not an instance of "' + expected+ '"';
    }
    if (err)  {
        this.addError(err,description);
    }  
};
Test.prototype.addError = function (err,test) {
    this.output.append('<span>Failed test ' + this._test_count + ': ' + err + ' in test "' + test + '"</span><br>');
    this._fail_count++;
};
// run all tests if no name provided
Test.prototype.run = function (test) {
    var i, started = false;
    function startTest(test) {
        if (!started) {
            this.output.append('<h1>"' + this.title + '"</h1><br /><hr /><br />');
        }
        this._test_count = 0;
        this._fail_count = 0;
        this.output.append('<h2>Test Group "' + test.name + '"</h2><br />==============================<br />');
    }
    function finishTest() {
        var result = "Completed " + this._test_count + " tests. ";
        if (this._fail_count > 0) {
            result += " " + this._test_count - this._fail_count + " passed, " + this._fail_count + " failed.";
        } else {
            result += " PASSED.";
        }
        this.output.append(result + "<br />");
        this.output.append('==============================<br />');
    }
    for (i = 0; i < this.tests.length; i++) {
        if (!test || this.tests[i].name == test) {
            startTest.call(this, this.tests[i]);
            this.tests[i].test(this);
            finishTest.call(this);
        }
    }

    this.output.append('<hr /');

};
