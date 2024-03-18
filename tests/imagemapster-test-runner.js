/* global tests imscripts */

// the "tests" variable is created or populated by each included test.

var allSel = 'input[type="checkbox"]',
  checkedSel = 'input[type="checkbox"]:checked',
  libChooserSel = '#libchooser',
  runCount = 0,
  activeGroups = [];

// set up some global stuff for the tests to use

function enableTestLink() {
  'use strict';

  $('#startTest').toggle(!!$(checkedSel).length);
}
function runActiveGroups(nextIndex, lastIndex) {
  'use strict';

  var next = nextIndex || 0,
    last = lastIndex || activeGroups.length - 1,
    cur = activeGroups[next];

  cur.run().then(function () {
    if (next < last) {
      // use a timer to break the promise chain between test groups.
      window.setTimeout(function () {
        runActiveGroups(next + 1, last);
      }, 50);
    }
  });
}
function startTests() {
  'use strict';

  var testGroups,
    stopped = false;

  function error(message) {
    $('#wrap').text(message);
    stopped = true;
  }

  if (runCount > 0) {
    $('#oldRuns')
      .append($('<hr />Prior Test Run #' + runCount + '<hr />'))
      .append($('#wrap').children());

    $('#wrap').empty();
  }
  runCount++;
  activeGroups = [];

  testGroups = $('input[type="checkbox"]:checked');
  testGroups.each(function (_, e) {
    // invoke the test method, and when it returns itself from the promise,
    // add it to the group.
    var cur,
      testName = $(e).val();

    cur = tests.first(function () {
      return this.name === testName;
    });

    if (!cur) {
      error("Couldn't find a test named '" + testName + "'");
      return;
    }

    activeGroups.push(cur);
  });

  runActiveGroups();

  if (!stopped) {
    $('#rerunTest').show();
  }
}
function buildCheckboxList() {
  'use strict';

  var container = $('#test-checkboxes');
  $.each(tests, function (_, e) {
    container.append(
      '<li><input type="checkbox" value="{0}" />&nbsp;{1}</li>'.format(
        e.name,
        e.desc ? e.name + ': ' + e.desc : e.desc
      )
    );
  });
}

function bindUIEvents() {
  'use strict';

  $(allSel).on('change', function () {
    enableTestLink();
  });
  $('#testSelectAll').on('click', function () {
    var checked = $(checkedSel),
      all = $(allSel);
    if (checked.length && checked.length === all.length) {
      all.prop('checked', false);
    } else {
      all.prop('checked', true);
    }
    enableTestLink();
  });

  $(libChooserSel).on('change', function (e) {
    var search = new URLSearchParams(document.location.search);
    search.set('lib', e.target.value);
    document.location.search = search.toString();
  });

  // zepto returns 0 for element width/height when element is not visible
  // so if we are running with zepto, show the images and don't allow toggle
  if ($.zepto) {
    $('#testElements').show();
    $('#zeptoImageToggleInfo').show();
    $('#toggleTestImage').hide();
  } else {
    $('#toggleTestImage').on('click', function () {
      $('#testElements').toggle();
    });
  }

  enableTestLink();

  $('#rerunTest')
    .on('click', function () {
      runActiveGroups();
    })
    .hide();

  $('#startTest').on('click', startTests);
}

function configureTests() {
  'use strict';

  tests.forEach(function (e) {
    e.writer('html', $('#wrap'));
  });
}

function buildLibraryChooser() {
  'use strict';

  var createOption = function (label, value) {
      return $('<option/>', {
        value: value,
        text: label
      });
    },
    createOptionGroup = function (name, label, versions) {
      var group = $('<optgroup/>', {
        label: label
      });
      versions.forEach(function (version) {
        group.append(createOption(label + ' ' + version, name + '-' + version));
      });
      return group;
    },
    $chooser = $(libChooserSel);

  Object.entries(imscripts.lib).forEach(function (entry) {
    $chooser.append(
      createOptionGroup(entry[0], entry[1].label, entry[1].versions)
    );
  });
  $chooser.val(imscripts.current);
}

$(document).ready(function () {
  'use strict';

  buildLibraryChooser();
  buildCheckboxList();
  bindUIEvents();
  configureTests();
});
