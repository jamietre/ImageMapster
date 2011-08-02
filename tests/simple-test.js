/*
A dead simple javascript testing framework

1.0.1 added assertIsTruthy, propsNotEqual
V1.0James Treworgy

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
    this.timerStart=function (){
        var d = new Date();
        this.time  = d.getTime();
    },
    this.timerEnd=function (){
        var d = new Date();
        return (d.getTime()-this.time);
    }
}

Test.prototype.addError = function (err,test,passed) {
    var msg = passed ? "Passed" : "<b>Failed</b>";
    this.output.append('<span>' + msg + ' test ' + this._test_count + ': ' + err + ' in test "' + test + '"</span><br>');
    if (!passed) {
        this._fail_count++;
    }
};
Test.prototype.startTest = function() {
    if (this.timer) {
        this.timerStart();
    }
    this._test_count++;
};
Test.prototype.runTest = function(test,compare) {
    var iterations = this.iterations || 1;
    for (var i=0;i<iterations;i++) {
        if (typeof test==='function') {
            test=test();
        }
        compare(test);
    }
};
Test.prototype.endTest = function(err,description) {
    var passed=false;
    if (this.timer) {
        var time = this.timerEnd();
        if (!err) {
           err="success";
           passed=true;
        }
        err = "(" + time + " ms) " + err;
    }
    if (err) {
        this.addError(err,description,passed);   
    }

};
Test.prototype.addTest = function (name, test) {
    var testData = {
        name: name,
        test: test
    };
    this.tests.push(testData);
};
Test.prototype._arrayEq = function(arr1,arr2) {
    var err;
        if (!(arr1.length && (arr1.length>-1))) {
        err='Test case has no length property';
    }
    if (!(arr2.length && (arr2.length>-1))) {
        err='Expected value has no length property';
    }
    if (!err && arr1.length != arr2.length) {
        err='Arrays different length (test: ' + arr1.length + ', expected: ' + arr2.length;
    }
    if (!err) {
        for (var e=0;e<arr1.length;e++) {
            if (arr1[e]!==arr2[e]) {
                err="Arrays not equal starting at element " + e +".";
                break;
            }
        }
    }
    
    return err;

};
Test.prototype.assertEq = function (testcase, expected, description) {
    var err ;
    this.startTest();
    this.runTest(testcase,function (testcase) {
        if (typeof testcase != typeof expected) {
            err = 'Test case type "' + typeof testcase + '" != expected type "' + typeof expected + '"';
        }
    
        if (!err && testcase != expected) {
            err = '"' + testcase + '" != "' + expected + '"';
        }
    });
    this.endTest(err,description);
};

Test.prototype.assertNotEq = function(testcase,expected,description,test) {
    var err;
    this.startTest();
    this.runTest(testcase,function (testcase) {
        if (typeof testcase == typeof expected &&
            testcase === expected) {
            err = '"' + testcase + '" == "' + expected + '"';
         }
    });
    this.endTest(err,description);
};
Test.prototype.assertIsTruthy = function(testcase,description,test) {
    var err;
    this.startTest();
    this.runTest(testcase,function(testcase) {
        if (!testcase) {
            err = 'Test case object of type "' + typeof testcase + '" is not truthy.';
        }
    });
    this.endTest(err,description);

};
// test that object properties (shallow) match. The last parameter is used by the overload.
Test.prototype.assertPropsEq = function(testcase,expected,description,test, notEqual) {
        var me=this,err;
        function compare(t1,t2, t1name, t2name) {
        if (t1 && t1!==t2) {
            for (var prop in t2) {
                if (t2.hasOwnProperty(prop)) {
                    if (t1[prop]===undefined) {
                       err='Property ' + prop + ' in ' + t2name + ' does not exist in ' + t1name;
                       break;
                    }
                    if (t1 instanceof Array && t2 instanceof Array) {
                        err=me._arrayEq(t1,t2);
                        break;
                    }
                    if (typeof t1[prop]==='object' && typeof t2[prop]==='object') {
                        err=compare(t1[prop],t2[prop],t1name+'.'+prop,t2name+'.'+prop);
                        break;
                    }
                    if (t1[prop]!==t2[prop]) {
                       err='Property ' + prop + ' in ' + t1name + ' does not match same property in ' + t2name;
                       break;           
                    }
                }
            } 
        }
        if (notEqual) {
            if (!err) {
            	err="The two objects had the same properties.";
            } else {
                err=null;
            }
        }
        return err;
    }
    var err;
    this.startTest();
   this.runTest(testcase,function (testcase) {
    if (typeof testcase != 'object' || typeof expected != 'object') {
        err='Test cases are not both objects';
    }
    if (!err) {
        err=compare(testcase,expected,"test","expected");
    }
    if (!err) {
        err=compare(expected,testcase,"expected","testcase");
    }
    });
    this.endTest(err,description);
};
Test.prototype.assertPropsNotEq = function(testcase,expected,description,test) {
    this.assertPropsEq(testcase,expected,description,test,true);

};
Test.prototype.assertArrayEq = function(testcase, expected, description,test) {
    var err,me;
    me=this;
    this.startTest();
    this.runTest(testcase,function (testcase) {
        err = me._arrayEq(testcase,expected);
    });
    this.endTest(err,description);

};
// sorts first
Test.prototype.assertArrayElementsEq = function(testcase, expected, description,test) {
    var err,arr1, arr2;
    this.startTest();
    this.runTest(testcase,function (testcase) {
       arr1=testcase;
       arr2=expected;
        arr1.sort();
        arr2.sort();
        err = this._arrayEq(arr1,arr2);
    });
    this.endTest(err,description);
};
Test.prototype.assertCsvElementsEq = function(testcase, expected, description,test) {
    var err,arr1, arr2,me;
    me=this;
    this.startTest();
    this.runTest(testcase,function (testcase) {
        arr1=testcase.split(',');
        arr2=expected.split(',');
        arr1.sort();
        arr2.sort();
        err = me._arrayEq(arr1,arr2);
    });
    this.endTest(err,description);
};
Test.prototype.assertInstanceOf = function(testcase, expected, description,test) {
    var err,
        test = eval("testcase instanceof " + expected);
    this.startTest();
    this.runTest(testcase,function (testcase) {
    if (!test) {
        err='testcase is not an instance of "' + expected+ '"';
    }
    });
    this.endTest(err,description);
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
    if (this.timer) {
        this.iterations=5;
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
