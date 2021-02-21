/* global iqtest, map_options */

this.tests = this.tests || [];

function attrMatches(jq, attr, matches) {
  'use strict';

  var list = matches.split(','),
    result = $();
  jq.each(function () {
    for (var i = 0; i < list.length; i++) {
      if ($(this).is('[' + attr + "='" + list[i] + "']")) {
        result = result.add(this);
        i = list.length;
      }
    }
  });
  return result;
}

this.tests.push(
  iqtest
    .create(
      'basic',
      'manipulation tests - migrated from old test suite (not organized)'
    )
    .add('Migrated tests', function (a) {
      'use strict';

      var me = this,
        getPromise = function (name) {
          return me.promises(name);
        },
        mu = $.mapster.utils,
        // Save current state to see if we cleaned up properly later
        domCount = $('#test_elements *').length,
        map = $('img').mapster({
          onConfigured: getPromise('configured1').resolve
        });

      // // testing with no canvas on a browser that doesn't support it anyway doesn't make sense, regular test will cover it
      // var has_canvas = (document.namespaces && document.namespaces.g_vml_) ? false :
      //         $('<canvas></canvas>')[0].getContext ? true : false;

      // if (!has_canvas && disableCanvas) {
      //     map.mapster('unbind');
      //     a.pass("The browser does not support canvases: this test was skipped.")
      //     return;
      // }
      getPromise('configured1').then(function () {
        map.mapster('unbind');

        // var oldHasCanvas = $.mapster.hasCanvas;
        // if (disableCanvas) {
        //     $.mapster.hasCanvas=false;
        // }

        // test using only bound images
        var isObfuscated = map.mapster('test', "typeof m === 'undefined'");
        if (!isObfuscated) {
          map = $('img').mapster(
            $.extend({}, map_options, {
              onConfigured: getPromise('configured2').resolve
            })
          );
          getPromise('configured2').then(function () {
            a.equals(
              1,
              map.mapster(
                'test',
                "typeof m !== 'undefined' && m.map_cache && m.map_cache.length"
              ),
              'Only imagemap bound images were obtained on generic create'
            );

            var els = $('img,div'),
              els_count = els.find('img[usemap]').length,
              els_configured = 0;

            map = $('img,div').mapster(
              $.extend(
                { mapKey: 'state' },
                {
                  onConfigured: function () {
                    els_configured = els_configured + 1;
                    if (els_configured === els_count) {
                      getPromise('configured3').resolve();
                    }
                  }
                }
              )
            );

            getPromise('configured3').then(function () {
              a.equals(
                1,
                map.mapster(
                  'test',
                  "typeof m !== 'undefined' && m.map_cache && m.map_cache.length"
                ),
                'Only imagemap bound images were obtained on generic create with other elements'
              );

              getPromise('stage2').resolve();
            });
          });
        } else {
          getPromise('stage2').resolve();
        }

        getPromise('stage2').then(function () {
          var usaOpts = $.extend({}, map_options, {
            onConfigured: getPromise('configured4').resolve
          });

          map = $('#usa_image').mapster(usaOpts);
          getPromise('configured4').then(function () {
            var initialOpts = mu.updateProps({}, $.mapster.defaults, usaOpts),
              opts = map.mapster('get_options');
            a.propertyValueEquals(
              opts,
              initialOpts,
              'Options retrieved match initial options'
            );

            // todo - test new options options
            //opts = map.mapster('get_options',null,true);
            //initialOpts.render_select = u.mergeObjects({template:$.mapster.render_defaults });

            var newOpts = {
              isSelectable: false,
              areas: [{ key: 'MT', isDeselectable: false }]
            };
            map.mapster('set_options', newOpts);
            opts = map.mapster('get_options');

            // to compare this we have to ignore areas, since they won't be the same object

            var expectedNewOpts = $.extend({}, initialOpts);
            expectedNewOpts.isSelectable = false;

            a.propertyValueEquals(
              opts,
              expectedNewOpts,
              'Options retrieved match updated value'
            );
            a.equals(opts.areas.length, 6, 'Area option was added');

            // restore original options before continuing
            opts = map.mapster('set_options', {
              isSelectable: true,
              areas: [{ key: 'MT', isDeselectable: true }]
            });

            a.equals(!!map.mapster, true, 'Plugin returns jQuery object');
            a.equals(
              map,
              $('#usa_image'),
              'Plugin returns jquery same object as invocation'
            );

            // order is not guaranteed - this is the order the areas are created.
            var selected = map.mapster('get');

            // This test should NOT show "WA" because StaticState items are not considered "selected"

            a.collectionEquals(
              selected,
              'AK,TX',
              "Initially selected items returned with 'get'"
            );

            selected = map.mapster('get', 'TX');
            a.equals(
              selected,
              true,
              "Initially selected single item returned true with 'get'"
            );
            selected = map.mapster('get', 'ME');
            a.equals(
              selected,
              false,
              "Initially deselected single item returned false with 'get'"
            );

            // Test setting/getting via area

            // AK was already selected, should be ignored

            attrMatches($('area'), 'state', 'AK,HI,LA').mapster('set', true);
            var area_sel = map.mapster('get');
            a.collectionEquals(area_sel, 'HI,AK,LA,TX', 'Set using area works');

            map.mapster('set', false, 'LA,TX');
            a.collectionEquals(
              'HI,AK',
              map.mapster('get'),
              'unset using keys works'
            );

            map.mapster('set', true, 'ME,OH,TX');
            a.collectionEquals(
              'HI,AK,ME,OH,TX',
              map.mapster('get'),
              'set using keys works'
            );

            // test toggling: AK should go off, MT should go on
            var areas = $('area[state=AK]').first();
            areas = areas.add($('area[state=MT]').first());
            areas.mapster('set');
            a.collectionEquals(
              'HI,ME,OH,TX,MT',
              map.mapster('get'),
              'toggling keys works'
            );

            // test clicking
            $('area[state="AZ"]').first().trigger('click');
            selected = map.mapster('get', 'AZ');
            a.equals(true, selected, "Click-selected area returned 'get'");
            a.collectionEquals(
              'HI,ME,OH,TX,MT,AZ',
              map.mapster('get'),
              "Complete list returned with 'get'"
            );

            /// try to click select "staticstate areas

            $('area[state="OR"]').first().trigger('click');
            selected = map.mapster('get', 'OR');
            a.equals(
              selected,
              false,
              "Cannot select 'staticState=false' area with click"
            );

            selected = map.mapster('get', 'WA');
            a.equals(
              selected,
              false,
              'staticState=true area is considered not selected'
            );

            opts = map.mapster('get_options', 'WA');
            a.equals(
              opts.staticState,
              true,
              'get effective options returned correct static state for WA'
            );

            opts = map.mapster('get_options', 'OR');
            a.equals(
              opts.staticState,
              false,
              'get effective options returned correct static state for OR'
            );

            $('area[state="WA"]').first().trigger('click');
            selected = map.mapster('get', 'WA');
            a.equals(
              selected,
              false,
              "Cannot change selection state of 'staticState=true' area with click"
            );

            // do it programatically

            map.mapster('set', true, 'OR');
            selected = map.mapster('get', 'OR');
            a.equals(
              selected,
              true,
              "Can select 'staticState=false' area with 'set'"
            );

            map.mapster('set', false, 'WA');
            a.equals(
              map.mapster('get', 'WA'),
              false,
              "Can deselect staticState=true' area with 'set'"
            );

            // test rebind
            newOpts = $.extend({}, map.mapster('get_options'), {
              onConfigured: getPromise('configured5').resolve
            });
            map.mapster('rebind', newOpts);
            getPromise('configured5').then(function () {
              a.collectionEquals(
                'TX,AK',
                map.mapster('get'),
                'Rebind reverted to configured state'
              );

              map.mapster('set', true, 'OR');
              selected = map.mapster('get', 'OR');
              a.equals(
                selected,
                true,
                "Can select 'staticState=false' area with 'set'"
              );

              newOpts = $.extend({}, map.mapster('get_options'), {
                singleSelect: true,
                onConfigured: getPromise('configured6').resolve
              });
              map.mapster('rebind', newOpts);
              getPromise('configured6').then(function () {
                // Note - selected keys revert to original state due to
                //        options being passed and not having anything to
                //        due specifically with singleSelect.  Rebind
                //        does not persist previously selected state
                //        as of commit https://github.com/jamietre/ImageMapster/commit/3de37f3
                //        so this test is asserting that areas selected
                //        by configuration are selected even when
                //        singleSelect === true
                a.collectionEquals(
                  'TX,AK',
                  map.mapster('get'),
                  'Rebind with singleSelect reverted to configured state'
                );

                map.mapster('set', true, 'MI');
                a.equals(map.mapster('get'), 'MI', 'Single select worked.');

                map.mapster('set_options', { isDeselectable: false });
                $('area[state="MI"]').first().trigger('click');
                a.equals(
                  map.mapster('get', 'MI'),
                  true,
                  'Cannot deselect single selected item with isDeselectable=false'
                );

                $('area[state="UT"]').first().trigger('click');

                a.equals(map.mapster('get'), 'UT', 'New single state selected');

                map.mapster('set_options', {
                  singleSelect: false,
                  isDeselectable: true,
                  areas: [{ key: 'ME', isDeselectable: false }]
                });

                $('area[state="UT"]').first().trigger('click');
                a.equals(
                  map.mapster('get', 'UT'),
                  false,
                  'Was able to deselect item after removing singleSelect'
                );

                map.mapster('set', true, 'CA,HI,ME');

                $('area[state="ME"]').first().trigger('click');
                a.equals(
                  map.mapster('get', 'ME'),
                  true,
                  'Could not deselect one item marked as !isDeselectable'
                );
                $('area[state="CA"]').first().trigger('click');
                a.equals(
                  map.mapster('get', 'CA'),
                  false,
                  'Could deselect other items '
                );

                // Test manual highlighting

                a.equals(
                  map.mapster('highlight'),
                  null,
                  'nothing is highlighted'
                );

                $('area[state="CA"]').first().mapster('highlight');

                a.equals(
                  map.mapster('highlight'),
                  'CA',
                  'highlighted manually'
                );

                map.mapster('highlight', 'LA');

                a.equals(
                  map.mapster('highlight'),
                  'LA',
                  'highlighted manually using other technique'
                );

                map.mapster('highlight', false);

                a.equals(
                  map.mapster('highlight'),
                  null,
                  'everything unhighlighted'
                );

                // restore internal canvas setting or these tests won't work
                // if (disableCanvas) {
                //     map.mapster('test', 'has_canvas=true');
                // } else {

                //     // cleanup tests - skip to play with map afterwards
                //     // return;

                //     if (has_canvas) {
                //         a.equals($('canvas').length, 2, 'There are 2 canvases.');
                //         map.mapster(map_options);
                //         a.equals($('canvas').length, 2, 'There are 2 canvases (recreate was clean)');
                //     }
                // }
                map.mapster('unbind');
                a.equals(
                  $('canvas').length,
                  0,
                  'No canvases remain after an unbind.'
                );

                a.equals(
                  $('#test_elements *').length,
                  domCount,
                  '# elements in DOM is the same.'
                );

                getPromise('finished').resolve();

                // if (disableCanvas) {
                //     $.mapster.hasCanvas=oldHasCanvas;
                // }
              });
            });
          });
        });
      });
      a.resolves(getPromise('finished'), 'The last test resolved');
    })
);
