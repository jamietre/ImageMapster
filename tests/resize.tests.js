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
    .create('autoresize', 'autoresize feature')
    .add('wrapper does not have width/height', function (a) {
      'use strict';

      var img = $('img');
      this.when(function (cb) {
        img.mapster({ enableAutoResizeSupport: true, onConfigured: cb });
      }).then(function () {
        var wrapper = img.closest('div');
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
      });
    })
);
