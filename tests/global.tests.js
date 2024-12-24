/*

Shared resources, setup & teardown. This must be included for all tests.

*/

/* global iqtest */
/* exported image areas map_options u */

/* eslint-disable no-unused-vars */
var image,
  areas,
  map_options,
  map_copy,
  u = iqtest.impl.utility;
/* eslint-enable no-unused-vars */

$(document).ready(function () {
  'use strict';

  map_copy = $('#usa_image').clone();
});

var group_reset = function () {
    'use strict';

    // start with a clean mapster slate
    $('img').mapster('unbind');

    // always start with a clean map for each group
    $('#usa_image').replaceWith(map_copy.clone());
  },
  group_teardown = function () {
    'use strict';

    group_reset();
  },
  group_setup = function () {
    'use strict';

    group_reset();

    image = $('#usa_image');
    areas = $('#usa_image_map');

    map_options = {
      isSelectable: true,
      singleSelect: false,
      mapKey: 'state',
      mapValue: 'full',
      listKey: 'name',
      listSelectedAttribute: 'checked',
      sortList: 'asc',
      showToolTip: true,
      toolTipClose: ['area-mouseout'],
      areas: [
        {
          key: 'TX',
          selected: true
        },
        {
          key: 'AK',
          isSelectable: false,
          selected: true
        },
        {
          key: 'WA',
          staticState: true
        },
        {
          key: 'OR',
          staticState: false
        },
        {
          key: 'CA',
          toolTip: $(
            '<div>Don\'t mess with Louisiana. Why ? <a href = "http://dontmesswithtexas.org/" target="_blank" > Click here </a> for more info. </div> '
          )
        }
      ]
    };
  };

// create a default setup

iqtest.configure({
  setup: group_setup,
  teardown: group_teardown
});
