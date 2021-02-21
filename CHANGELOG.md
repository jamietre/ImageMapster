# Changelog

## Roadmap

- Return promises from asynchronous events rather than requiring callbacks like "onConfigured"
- Return a non-jQuery object exposing the imagemapster API to simplify coding against it
- Detect input device actively to determine when highlight effect should be enabled
- Rewrite in ES6/Typescript
- Update to modern build system (e.g. rollup/weback/etc.)
- Create React component
- Migrate to modern testframework
- Update website and host on Github
- Zoom to Area
- Make callback data structures consistent
- Improve docs

## Version 1.5.4 - 2021.02.20
- [Issue 83](https://github.com/jamietre/ImageMapster/issues/83) Fix boundlist sync with selected state
- [Issue 377](https://github.com/jamietre/ImageMapster/issues/377) onConfigured not called after rebind
- [Issue 378](https://github.com/jamietre/ImageMapster/issues/378) drawn areas do not match selected state after rebind
- [Issue 380](https://github.com/jamietre/ImageMapster/issues/380) onGetList not called when isSelectable !== true
- [Issue 381](https://github.com/jamietre/ImageMapster/issues/381) tests not waiting for onConfigured before continuing

## Version 1.5.3 - 2021.02.14
- [Issue 374](https://github.com/jamietre/ImageMapster/issues/374) Uncaught RangeError: Maximum call stack size exceeded when includeKeys has circular reference

## Version 1.5.2 - 2021.02.14
- [Issue 137](https://github.com/jamietre/ImageMapster/issues/137) area href empty or not specified
- [Issue 170](https://github.com/jamietre/ImageMapster/issues/170) Tooltips/Highlight/Select incorrect when AREA `shape` attribute is missing or its value is non-conforming/empty
- [Issue 364](https://github.com/jamietre/ImageMapster/issues/364) `Uncaught (in promise) undefined` when mouseoutDelay -1
- [Issue 365](https://github.com/jamietre/ImageMapster/issues/365) Visual 'selection' cannot be removed via API when `staticState === true`
- [Issue 366](https://github.com/jamietre/ImageMapster/issues/366) area w/ `staticState === false` that has been selected via API becomes unselected when clicking another area
- [Issue 367](https://github.com/jamietre/ImageMapster/issues/367) `select`/`set` options not applied or not applied correctly

## Version 1.5.1 - 2021.01.30

- [Issue 362](https://github.com/jamietre/ImageMapster/issues/362) Apply width/height to hidden elements on `resize` when `duration` specified

## Version 1.5.0 - 2021.01.29

- [Issue 357](https://github.com/jamietre/ImageMapster/issues/357) AltImages become visible after `resize` when duration is specified
- [Issue 359](https://github.com/jamietre/ImageMapster/issues/359) Add autoresize feature

## Version 1.5.0-beta.1 - 2021.01.26

- Applied `next` tag to NPM v1.5.0-beta.1 and re-applied `latest` tag to NPM v1.4.0

## Version 1.5.0-beta.0 - 2021.01.26

- [Issue 352](https://github.com/jamietre/ImageMapster/issues/352) Fix inconsistency of navigation href via onClick vs. clickNavigate
- [Issue 353](https://github.com/jamietre/ImageMapster/issues/353) Add `navigationMode` configuration option to improve AREA element href & target support
- [Issue 356](https://github.com/jamietre/ImageMapster/issues/356) Add tooltip close support for `image-click` event

## Version 1.4.0 - 2021.01.24

- [Issue 344](https://github.com/jamietre/ImageMapster/issues/344) Fix exception on tooltip api when options is jQuery object
- [Issue 345](https://github.com/jamietre/ImageMapster/issues/345) Fix tooltip options not applied via api call
- [Issue 347](https://github.com/jamietre/ImageMapster/issues/347) Add default tooltip options and tooltip function support
- [Issue 348](https://github.com/jamietre/ImageMapster/issues/348) Fix generic tooltips to respect tooltip options
- [Issue 349](https://github.com/jamietre/ImageMapster/issues/349) Fix tooltips do not close on unbind

## Version 1.3.2 - 2021.01.21

- [Issue 324](https://github.com/jamietre/ImageMapster/issues/324) Improve project health
- [Issue 325](https://github.com/jamietre/ImageMapster/issues/325) Add badges & CDN info to readme
- [Issue 327](https://github.com/jamietre/ImageMapster/issues/327) Add linter & format files
- [Issue 328](https://github.com/jamietre/ImageMapster/issues/328) Fix tracking internal map_cache on unbind
- [Issue 330](https://github.com/jamietre/ImageMapster/issues/330) Fix shapes example rectangle responds to mouseevents
- [Issue 332](https://github.com/jamietre/ImageMapster/issues/332) Fix programmatic area highlight to single area at a time
- [Issue 333](https://github.com/jamietre/ImageMapster/issues/333) Fix USA example area highlight & select
- [Issue 336](https://github.com/jamietre/ImageMapster/issues/336) Fix undefined handler for AREA mousedown event
- [Issue 338](https://github.com/jamietre/ImageMapster/issues/338) Fix event listener issues
- [Issue 339](https://github.com/jamietre/ImageMapster/issues/339) Fix Zepto support
- [Issue 341](https://github.com/jamietre/ImageMapster/issues/341) Update readme regarding Promise polyfill requirement for ES5 browsers

## Version 1.3.1 - 2021.01.10

- Publish to NPM

## Version 1.3.0 - 2021.01.10

- [Issue 273](https://github.com/jamietre/ImageMapster/issues/273) Add NPM support
- [Issue 318](https://github.com/jamietre/ImageMapster/issues/318) Update to conform with jQuery 3.5.1 (latest release)
- [Issue 319](https://github.com/jamietre/ImageMapster/issues/319) Fix Passive Event Listeners for touchstart/touchend
- [Issue 320](https://github.com/jamietre/ImageMapster/issues/320) Support UMD and improve build system

## Version 1.2.14 - 2021.01.06

- [Issue 148](https://github.com/jamietre/ImageMapster/issues/148) Enable mouseover events when touchscreen found
- [PR 248](https://github.com/jamietre/ImageMapster/pull/248) Add touchstart/touchend support
- [Issue 284](https://github.com/jamietre/ImageMapster/issues/284) Fix size not a function as of jQuery 3.0
- [PR 263](https://github.com/jamietre/ImageMapster/pull/263) Fix EDGE issue when no map data found
- [Issue 311](https://github.com/jamietre/ImageMapster/issues/311) Update /dist with latest code
- [Issue 312](https://github.com/jamietre/ImageMapster/issues/312) Fix tests
- [Issue 313](https://github.com/jamietre/ImageMapster/issues/313) Fix events not be cleared
- [Issue 314](https://github.com/jamietre/ImageMapster/issues/314) Eliminate when.js dependency from distribution
- [Issue 316](https://github.com/jamietre/ImageMapster/issues/316) Fix AltImage
- [Issue 317](https://github.com/jamietre/ImageMapster/issues/317) Fix USA Example

## Version 1.2.13

- Fix problem with mouseoutdelay=01

## Version 1.2.12

- Fix issue with $.inArray on IE8
- Fix problem with boundList when using "set" to toggle a multiple areas at once (from 1.2.11 issue - not quite fixed)

## Version 1.2.11

- Fix problem de-selecting boundlist when using "set" to toggle

## Version 1.2.10

- [Issue 120](https://github.com/jamietre/ImageMapster/issues/114) 1.2.9 broke IE9

## Version 1.2.9

- [Issue 114](https://github.com/jamietre/ImageMapster/issues/114) Fix jQuery 1.9 compatibility problem

## Version 1.2.8

- [Issue 108](https://github.com/jamietre/ImageMapster/issues/108) Opacity of tooltip container not preserved
- [Issue 107](https://github.com/jamietre/ImageMapster/issues/107) mouseoutDelay broken

## Version 1.2.7

- [Issue 95](https://github.com/jamietre/ImageMapster/issues/95) SingleSelect broken in 1.2.6.099
- [Issue 87](https://github.com/jamietre/ImageMapster/issues/87) Resize callback not working
- [Issue 84](https://github.com/jamietre/ImageMapster/issues/84) Mouseover events not completely suppressed on mobile
- Tooltip enhancements: tooltips can be called against arbitrary elements.
- AltImage enhancements: see below

_tooltip-enhancements branch_

- [Issue 72](https://github.com/jamietre/ImageMapster/issues/72): `scaleMap` not working propery when using bootstrap (css on `body` causing incorrect evaluation of native image size)
- Enhanced tooltip API to allow creating arbitrary tool tips bound to any area, or at an arbitrary position.

_altimage-enhancements branch_

- Add `altImages` option that accepts an option defining aliases to alternate images. The name of each property is an alias that can be specified as a valid `altImage` option value elsewhere

Example use of this option:

```js
altImages: {
  roadmap: 'images/usamap-roads.png',
  elevation: 'images/uasmap-elevation.png'
}
```

then:

```js
$('img').mapster('set', true, 'AZ', {
  altImage: 'roadmap'
});
```

The aliases can also be used in the initial configuration options, both globally and for specific areas.

## Version 1.2.6 - 2012.07.13

Bug Fixes:

- [Issue #69](https://github.com/jamietre/ImageMapster/issues/69) `fill` setting not being honored sometimes in IE6-8
- [Issue #68](https://github.com/jamietre/ImageMapster/issues/68) Accept `areas` array with dangling commas

## Version 1.2.5 - 2012.06.19

Bug fixes:

- [Issue #59](https://github.com/jamietre/ImageMapster/issues/59), [Issue #55](https://github.com/jamietre/ImageMapster/issues/55) Opacity/fade effects not working right in IE8
- [Issue #58](https://github.com/jamietre/ImageMapster/issues/58) Resize not changing CSS for the `div` contiainer around the image elements
- [Issue #53](https://github.com/jamietre/ImageMapster/issues/53) Not working in Google Chrome with Adblock plugin
- [Issue #44](https://github.com/jamietre/ImageMapster/issues/44) Incorrect opacity with altImage
- [Issue #36](https://github.com/jamietre/ImageMapster/issues/36) Resize firing callback before resize is finished
- Rebind not cleaning up resources properly
- Offset 1 pixel strokes by 0.5 px to prevent the fuzzies
- Ignore UI events during resize - can cause problems if highlights are activated during an effect

Features:

- [Issue #52](https://github.com/jamietre/ImageMapster/issues/52) Add "clickNavigate" feature to allow basic imagemap functionality
- Add "highlight" option to programatically set/unset the highlight effect (as if a user just moused over an area vs. clicked)
- Detect touchscreen devices and disable "mouseover"
- [Issue #11](https://github.com/jamietre/ImageMapster/issues/11) Detect excanvas automatically and force into IE mode if present

Notes

- refactor into modular architecture
- tighten up tooltip code a little
- Removed "attrmatches" jQuery selector exetnsion, recoded as a function, removed from tests
- Queue all methods (highlight, data, tooltip) so configuration delays don't cause problems
- Unbind "load" event explicitly from images added.
- Add dynamic images to DOM instead of loading through Javascript
- Ignore missing keys on some operations to increase stability with bad data
- Trim results of string splits so spaces don't cause problems
- Yet more tweaking of image loading detection
- Refactor "graphics" into an object and instantiate for each instance. "load" callbacks were changing event order, resulting in the single instance getting wires crossed. Isolated
  each map instance completely, problem solved.
- Fix canvases re-ordered after first selection making effect sometimes inconsistent
- Fix resize bug when area groups are used

## Version 1.2.4 - 2011.09.27

- [Issue #14](https://github.com/jamietre/ImageMapster/issues/14) Resize bug in IE <9 fixed

## Version 1.2.3

- Resize with multiple images affecting other images - fixed

## Version 1.2.2 - 2011.09.22

- masks not working in Firefox 6.0 only. behavior of context.globalCompositeOperation='source-out' and
  save/restore somehow changed in ff6. updated code to not depend (possibly) on idiosyncracies of chrome
  and ie9. honestly not sure why it worked before as it appears I may have been doing something wrong,
  but the code is more explicit now and it works across all browsers.

## Version 1.2.1

- Click callback "this" is not set - fixed
- Replace u.isFunction with $.isFunction to save a few bytes

## Version 1.2

- fixed fader problem for old IE (again, really this time)
- allow selecting includeKeys areas from staticState areas
- test browser features for filter vs. opacity
- "resize" option
- improve startup speed by eliminating need for setTimeout callback
- address startup bug when images aren't loaded and there are lots of images
- fixed exception when "set" with no data for key
- bug when multiple images bound on same page \* another IE tweak: blur() on mouseover/click to remove browser-rendered border around area
- force "border=0" on image to ensure consistent display across bind/unbind in IE
- Fixed broken "onMouseover" option, added tests for onMouseover/onMouseout.
- many performance improvements, tests, refactoring some old inefficient code.
- fix css flickering when debinding/rebinding in HTML5 browsers
- add "scaleMap" option to automatically resize image maps when a bound image is resized dynamically. Enabled by default if an image is displayed at a size other than its native size.

## Version 1.1.3

- revised "highlight" method API (previously undocumented). Added tests & documented.
- added a generic prototype for parsing method data to improve consistency & stability
- added tests for tooltip external & event bound invocation
- added invoking tooltip from area, e.g. $('some-area').mapster('tooltip')
- added invoking tooltip from key, e.g. .mapster('tooltip',key);
- Bug fix for get_options, showToolTip (related)
- Bug fix - area id 0 on VML rendereding deselection causes all selections to disappear (introduced in beta 2)
- Changed "get" to return true "selected" state and not "isSelected()" which includes staticState items in selected.
- Bug fix - stroke sometimes rendered improperly when using render-specific options
- change onClick handler to BEFORE action, permit canceling of action by returning false
- refactor into mostly OO design - functional design was getting unwieldy.
- fix bugs related to cascading of "staticState" options
- add "snapshot" option
- check for existing wrapper, skip if it already exists
- remove map data when unbinding+preserveState -- it should act as if not there
- IE performance improvements (optimizing rendering code a little bit)

## Version 1.1.2 - 2011.06-15

- minor bugfix release

## Version 1.1.1 - 2011.06.03

- Performance improvement: cache area groups on map binding to eliminate need for attribute selector
- Significant enhancement to permit complex area grouping and area exclusions (masks):
  - added: mapKey can contain multiple keys, allowing an area to be a member of multiple groups
  - added: "noHrefIsMask" option to determine "nohref" attribute treatment
  - added: "isMask" option (area-specific)
  - added: "includeKeys" option (area-specific)
- added: 'highlight' method to enable highlighting of areas from code
- bufgix: fading didn't work in IE6-7, some Operas. Should work in all browsers except IE8 now.
- bugfix: ignore areas with no mapkey when it is provided
- bugfix: not binding properly when no mapkey provided

## Version 1.1

- added: per-action options (highlight, select)
- fixed some memory leaks
- minor performance improvements
- cleanup in VML mode
- fix IE9 canvas support (fader problem)
- fix flickering on fades when moving quickly
- add altImage options
- added onConfigured callback
- fixed problems with cleanup (not removing wrap)
- added failure timeout for configure

## Version 1.0.10 - 2011.05.12

- ignore errors when binding mapster to invalid elements
- minor performance improvements
- fixed command queue problem (broke in 1.0.9) for commands issued after bind, but before image is ready
- enhanced tests

## Version 1.0.9 - 2011.05.10

- added "unbind" option to remove mapster from an image
- add 'options' option
- add 'rebind' option
- add isDeselectable option
- handle exceptions better (when acting on unbound images)
- add 'get' method to retrieve selections
- add unbind options
- clear command queue after processing

## Version 1.0.8 - 2011.05.05

- Handle problem when "img.complete" is not true at config time and "set" commands are issued after initial config call but before config is complete. Queue any "set" commands and process them after the timer callback.
- Pass listTarget to onClick callback even when !isSelectable (previously passed null)
- Pass ref to toolTip element on callback
- Don't show tooltip again if the one for an area is already displayed
- Add singleSelect option - clears any other selected item when a new item is selected

## Version 1.0.6 - 2011.04.27

- Problem when not using mapKey
- staticState=false not working

## Version 1.0.5 - 2011.04.26

- Corrected jquery attribute selector (not using quote marks)
- added area persistence behavior options
- tooltips not working in Firefox - bug in area data management. Deprecated use of jquery.data for passing area-specific options, added "areas" option to replace
- fixed "showToolTip" default property name (was showToolTips) - should have had no effect

## Version 1.0.4 - 2011.04.20

- allow using jQuery object for toolTip text
- happy earth day

## Version 1.0.3

- missing preventDefault on click (post refactor issue)

## Version 1.0.2

- fixed tooltip in IE6

## Version 1.0.0 - 2011.04.19 - **first official release**

- refactored from remaining old to use a clean namespace
- added simple mouseover dialog
