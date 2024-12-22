/* global iqtest */

this.tests = this.tests || [];

this.tests.push(
  iqtest
    .create('resize', 'resize feature')
    .add('Initial binding', function (a) {
      'use strict';

      var img = $('img'),
        me = this,
        altImages = {
          img1: 'images/usa_map_720_alt_1.jpg',
          img2: 'images/usa_map_720_alt_2.jpg',
          img3: 'images/usa_map_720_alt_3.jpg',
          img4: 'images/usa_map_720_alt_4.jpg',
          img5: 'images/usa_map_720_alt_5.jpg'
        },
        map,
        x,
        y,
        newWidth;

      me.when(function (cb) {
        map = img.mapster({
          altImages: altImages,
          onConfigured: cb
        });
      }).then(function () {
        x = parseInt(img.css('width').replace('px', ''), 10);
        y = parseInt(img.css('height').replace('px', ''), 10);
        newWidth = x + 200;
        me.when(function (cb) {
          map.mapster('resize', newWidth, 0, cb);
        }).then(function () {
          var expectedWidth = newWidth + 'px',
            expectedHeight = Math.round((newWidth / x) * y) + 'px';
          a.equals(
            img.css('width'),
            expectedWidth,
            'image width is correct after resize'
          );
          a.equals(
            img.css('height'),
            expectedHeight,
            'image height is correct after resize'
          );

          var wrapper = img.closest('div');

          a.equals(
            wrapper.attr('id').substring(0, 12),
            'mapster_wrap',
            'sanity check - we have the wrapper element'
          );
          a.equals(
            wrapper.css('width'),
            expectedWidth,
            'wrapper width matches image width'
          );
          a.equals(
            wrapper.css('height'),
            expectedHeight,
            'wrapper height matches image height'
          );
          Object.values(altImages).map(function (ai) {
            var selector = 'img[src="' + ai + '"]',
              altImg = $(wrapper).children(selector);
            a.equals(
              altImg.css('width'),
              expectedWidth,
              'altimage ' + ai + ' width matches image width'
            );
            a.equals(
              altImg.css('height'),
              expectedHeight,
              'altimage ' + ai + ' height matches image height'
            );
            a.equals(
              altImg.css('display'),
              'none',
              'altimage ' + ai + ' has display of none'
            );
          });
        });
      });
    })
);

this.tests.push(
  iqtest
    .create('getScaleInfo', 'getScaleInfo scaleMapBounds')
    .add('respects scale boundaries', function (a) {
      'use strict';

      var result,
        mu = $.mapster.utils,
        bounds = { below: 0.95, above: 1.05 },
        actual = { width: 100, height: 100 };

      // scale up
      result = mu.getScaleInfo(
        { width: 104.998, height: 104.998 },
        actual,
        bounds
      );
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: false, scalePct: 1 },
        'should not have scaled up when less than above bound'
      );

      result = mu.getScaleInfo({ width: 105, height: 105 }, actual, bounds);
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: true, scalePct: 105 / 100 },
        'should have scaled up when equal to above bound'
      );

      result = mu.getScaleInfo(
        { width: 105.00000000001, height: 105.00000000001 },
        actual,
        0.04999
      );
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: true, scalePct: 105.00000000001 / 100 },
        'should have scaled up when greater than above bound'
      );

      result = mu.getScaleInfo(
        { width: 104.998, height: 104.998 },
        actual,
        false
      );
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: true, scalePct: 104.998 / 100 },
        'should have scaled up when no boundary'
      );

      // scale down
      result = mu.getScaleInfo(
        { width: 95.0000001, height: 95.0000001 },
        actual,
        bounds
      );
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: false, scalePct: 1 },
        'should not have scaled down when greater than below bound'
      );

      result = mu.getScaleInfo({ width: 95, height: 95 }, actual, bounds);
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: true, scalePct: 95 / 100 },
        'should have scaled down when equal to below bound'
      );

      result = mu.getScaleInfo(
        { width: 94.999999, height: 94.999999 },
        actual,
        bounds
      );
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: true, scalePct: 94.999999 / 100 },
        'should have scaled down when less than below bound'
      );

      result = mu.getScaleInfo(
        { width: 95.0000001, height: 95.0000001 },
        actual,
        false
      );
      a.equals(
        { scale: result.scale, scalePct: result.scalePct },
        { scale: true, scalePct: 95.0000001 / 100 },
        'should have scaled down when no boundary'
      );
    })
);

this.tests.push(
  iqtest
    .create('autoresize', 'autoresize feature')
    .add('Ensure expected behavior', function (a) {
      'use strict';

      var me = this,
        $img = $('img'),
        $testElements = $('#testElements'),
        testElementsInfo = {},
        getPromise = function (name) {
          return me.promises(name);
        },
        setCallback = function (opt, cb) {
          var obj = {};
          obj[opt] = function (e) {
            // clear the callback
            var objClear = {};
            objClear[opt] = null;
            $img.mapster('set_options', objClear);
            var resolveWith = ((e || {}).this_context = this);
            cb(resolveWith);
          };
          $img.mapster('set_options', obj);
        },
        getElementWidth = function ($el) {
          // zepto returns outerWidth (content + padding + border) using width function
          // while jQuery returns content width.  Use css('width') for consistency
          // across both libraries
          return parseInt($el.css('width').replace('px', ''), 10);
        };
      this.when(function (cb) {
        testElementsInfo = {
          orig: {
            isVisible: $testElements.is(':visible'),
            cssWidth: $testElements.css('width')
          },
          underTest: {
            initial: 100,
            delta: 10
          }
        };
        $testElements.css('width', testElementsInfo.underTest.initial + 'px');
        $img.mapster({
          mapKey: 'state',
          enableAutoResizeSupport: true,
          autoResize: true,
          onConfigured: cb
        });
      }).then(function () {
        /*
          Test: wrapper should not have explicit width/height
        */
        var wrapper = $img.closest('div');
        a.equals(
          wrapper.attr('id').substring(0, 12),
          'mapster_wrap',
          'sanity check - we have the wrapper element'
        );
        a.equals(wrapper[0].style.width, '', 'wrapper width is not specified');
        a.equals(
          wrapper[0].style.height,
          '',
          'wrapper height is not specified'
        );

        /*
          Test: autoresize should complete successfully
          see https://github.com/jamietre/ImageMapster/issues/421
        */
        var imageWidth = getElementWidth($img);
        $testElements.css(
          'width',
          testElementsInfo.underTest.initial +
            testElementsInfo.underTest.delta +
            'px'
        );
        // make sure parent element is hidden
        $testElements.hide();
        a.equals(
          $testElements.is(':hidden'),
          true,
          'sanity check - ensure map container is hidden'
        );
        a.equals(
          $img.is(':hidden'),
          true,
          'sanity check - ensure map is hidden'
        );
        // make sure an area has 'state'
        $img.mapster('set', true, 'KS');
        setCallback('onAutoResize', function () {
          a.equals(
            getElementWidth($img),
            imageWidth + testElementsInfo.underTest.delta,
            'image width is correct after autoresize'
          );
          // restore back to initial state
          $testElements.css('width', testElementsInfo.orig.cssWidth);
          if (testElementsInfo.orig.isVisible) {
            $testElements.show();
          }
          getPromise('finished').resolve();
        });
        $(window).trigger('resize');

        a.resolves(getPromise('finished'), 'The last test was run');
      });
    })
);
