#### Tests for ImageMapster

5/15/2012

I am in the process of revising the test suite to use IQTest, a promise-aware testing framework I am developing. You can find the source on my github portal. This framework is designed around the assertions from [buster.js]
(http://busterjs.org/) and uses the [when.js](https://github.com/cujojs/) promise library. The goal is a framwork that permits using a terse syntax that can incorporate callbacks in a single statement without the need for excessively verbose syntax.

The dev code (1.2.4.067) is considered stable; it will become an official release when I'm finished updating the tests..

The old tests (loaded from `test.html`) are no longer supported. They are still here until I finish the update but should not be considered functional.

